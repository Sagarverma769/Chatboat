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
async def test_registration_cannot_grant_admin_access(async_client: AsyncClient):
    response = await async_client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "email": "self-promoting@example.com",
            "password": "password123",
            "is_superuser": True,
        },
    )
    assert response.status_code == 201
    assert response.json()["is_superuser"] is False

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
