import pytest
from httpx import AsyncClient
from core.config import settings
from core.security import create_access_token

@pytest.mark.asyncio
async def test_get_users_as_superuser(async_client: AsyncClient, superuser):
    token = create_access_token(superuser.id)
    headers = {"Authorization": f"Bearer {token}"}
    response = await async_client.get(f"{settings.API_V1_STR}/users/", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_get_users_as_normal_user(async_client: AsyncClient, normal_user):
    token = create_access_token(normal_user.id)
    headers = {"Authorization": f"Bearer {token}"}
    response = await async_client.get(f"{settings.API_V1_STR}/users/", headers=headers)
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_create_user_as_superuser(async_client: AsyncClient, superuser):
    token = create_access_token(superuser.id)
    headers = {"Authorization": f"Bearer {token}"}
    user_data = {
        "email": "newuser@example.com",
        "password": "newpassword123",
        "full_name": "New User"
    }
    response = await async_client.post(
        f"{settings.API_V1_STR}/users/",
        json=user_data,
        headers=headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"

@pytest.mark.asyncio
async def test_create_duplicate_user(async_client: AsyncClient, superuser, normal_user):
    token = create_access_token(superuser.id)
    headers = {"Authorization": f"Bearer {token}"}
    user_data = {
        "email": normal_user.email,
        "password": "password123",
        "full_name": "Duplicate User"
    }
    response = await async_client.post(
        f"{settings.API_V1_STR}/users/",
        json=user_data,
        headers=headers
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "The user with this email already exists in the system."

@pytest.mark.asyncio
async def test_registration_creates_user_only_after_email_otp(
    async_client: AsyncClient,
    db_session,
    monkeypatch,
):
    from sqlalchemy.future import select
    from models.pending_registration import PendingRegistration
    from models.user import User

    monkeypatch.setattr(settings, "FIRST_SUPERUSER_EMAIL", "sagarverma47097@gmail.com")
    sent_codes = []

    async def capture_registration_otp(recipient: str, otp: str):
        sent_codes.append((recipient, otp))

    monkeypatch.setattr(
        "api.v1.endpoints.auth.send_registration_otp",
        capture_registration_otp,
    )
    response = await async_client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "email": "self-promoting@example.com",
            "password": "password123",
            "is_superuser": True,
        },
    )
    assert response.status_code == 200
    assert response.json()["mfa_required"] is True
    assert sent_codes[0][0] == "self-promoting@example.com"
    assert len(sent_codes[0][1]) == 6

    user_result = await db_session.execute(
        select(User).where(User.email == "self-promoting@example.com")
    )
    assert user_result.scalars().first() is None
    pending_result = await db_session.execute(
        select(PendingRegistration).where(
            PendingRegistration.email == "self-promoting@example.com"
        )
    )
    assert pending_result.scalars().first() is not None

    verify_response = await async_client.post(
        f"{settings.API_V1_STR}/auth/verify-registration-otp",
        json={"email": "self-promoting@example.com", "otp": sent_codes[0][1]},
    )
    assert verify_response.status_code == 200
    assert verify_response.json()["access_token"]
    assert verify_response.json()["user"]["is_superuser"] is False

    user_result = await db_session.execute(
        select(User).where(User.email == "self-promoting@example.com")
    )
    created_user = user_result.scalars().first()
    assert created_user is not None
    assert created_user.is_verified is True
    assert created_user.is_superuser is False

    pending_result = await db_session.execute(
        select(PendingRegistration).where(
            PendingRegistration.email == "self-promoting@example.com"
        )
    )
    assert pending_result.scalars().first() is None


@pytest.mark.asyncio
async def test_registration_with_wrong_otp_does_not_create_user(
    async_client: AsyncClient,
    db_session,
    monkeypatch,
):
    from sqlalchemy.future import select
    from models.user import User

    sent_codes = []

    async def capture_registration_otp(recipient: str, otp: str):
        sent_codes.append(otp)

    monkeypatch.setattr(
        "api.v1.endpoints.auth.send_registration_otp",
        capture_registration_otp,
    )
    await async_client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "email": "unverified@example.com",
            "password": "password123",
            "full_name": "Unverified User",
        },
    )
    response = await async_client.post(
        f"{settings.API_V1_STR}/auth/verify-registration-otp",
        json={
            "email": "unverified@example.com",
            "otp": "000000" if sent_codes[0] != "000000" else "000001",
        },
    )
    assert response.status_code == 400

    result = await db_session.execute(
        select(User).where(User.email == "unverified@example.com")
    )
    assert result.scalars().first() is None


@pytest.mark.asyncio
async def test_configured_initial_admin_is_granted_admin_after_email_verification(
    async_client: AsyncClient,
    db_session,
    monkeypatch,
):
    from sqlalchemy.future import select
    from models.user import User

    monkeypatch.setattr(settings, "FIRST_SUPERUSER_EMAIL", "owner@example.com")
    sent_codes = []

    async def capture_registration_otp(recipient: str, otp: str):
        sent_codes.append(otp)

    monkeypatch.setattr(
        "api.v1.endpoints.auth.send_registration_otp",
        capture_registration_otp,
    )
    await async_client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "email": "owner@example.com",
            "password": "password123",
            "full_name": "Initial Admin",
        },
    )
    response = await async_client.post(
        f"{settings.API_V1_STR}/auth/verify-registration-otp",
        json={"email": "owner@example.com", "otp": sent_codes[0]},
    )

    assert response.status_code == 200
    assert response.json()["user"]["is_superuser"] is True
    result = await db_session.execute(
        select(User).where(User.email == "owner@example.com")
    )
    assert result.scalars().first().is_superuser is True

@pytest.mark.asyncio
async def test_allowlisted_email_without_database_role_is_not_admin(
    async_client: AsyncClient,
    normal_user,
    db_session,
):
    normal_user.email = "user@gmail.com"
    await db_session.commit()
    token = create_access_token(normal_user.id)
    headers = {"Authorization": f"Bearer {token}"}

    response = await async_client.get(f"{settings.API_V1_STR}/users/", headers=headers)
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_update_user_admin_access(async_client: AsyncClient, superuser, normal_user):
    token = create_access_token(superuser.id)
    headers = {"Authorization": f"Bearer {token}"}
    endpoint = f"{settings.API_V1_STR}/users/{normal_user.id}"

    grant_response = await async_client.patch(endpoint, json={"is_superuser": True}, headers=headers)
    assert grant_response.status_code == 200
    assert grant_response.json()["is_superuser"] is True

    revoke_response = await async_client.patch(endpoint, json={"is_superuser": False}, headers=headers)
    assert revoke_response.status_code == 200
    assert revoke_response.json()["is_superuser"] is False

@pytest.mark.asyncio
async def test_update_user_admin_access_requires_admin(async_client: AsyncClient, normal_user):
    token = create_access_token(normal_user.id)
    headers = {"Authorization": f"Bearer {token}"}
    response = await async_client.patch(
        f"{settings.API_V1_STR}/users/{normal_user.id}",
        json={"is_superuser": True},
        headers=headers,
    )
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_delete_user_requires_admin_and_prevents_self_delete(async_client: AsyncClient, normal_user, superuser):
    user_token = create_access_token(normal_user.id)
    admin_token = create_access_token(superuser.id)
    user_headers = {"Authorization": f"Bearer {user_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    denied = await async_client.delete(f"{settings.API_V1_STR}/users/{normal_user.id}", headers=user_headers)
    assert denied.status_code == 403

    self_delete = await async_client.delete(f"{settings.API_V1_STR}/users/{superuser.id}", headers=admin_headers)
    assert self_delete.status_code == 400

    deleted = await async_client.delete(f"{settings.API_V1_STR}/users/{normal_user.id}", headers=admin_headers)
    assert deleted.status_code == 204
