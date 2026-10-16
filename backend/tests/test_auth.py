import pytest
from httpx import AsyncClient
from core.config import settings

@pytest.mark.asyncio
async def test_login_success(async_client: AsyncClient, normal_user, monkeypatch):
    sent_codes = []

    async def capture_otp(recipient: str, otp: str):
        sent_codes.append((recipient, otp))

    monkeypatch.setattr("api.v1.endpoints.auth.send_login_otp", capture_otp)
    response = await async_client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": "testuser@example.com", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["mfa_required"] is True
    assert "access_token" not in data
    assert sent_codes[0][0] == normal_user.email
    assert len(sent_codes[0][1]) == 6


@pytest.mark.asyncio
async def test_login_otp_verifies_and_returns_token(async_client: AsyncClient, normal_user, monkeypatch):
    sent_codes = []

    async def capture_otp(recipient: str, otp: str):
        sent_codes.append(otp)

    monkeypatch.setattr("api.v1.endpoints.auth.send_login_otp", capture_otp)
    login_response = await async_client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": normal_user.email, "password": "password123"},
    )
    assert login_response.status_code == 200

    response = await async_client.post(
        f"{settings.API_V1_STR}/auth/verify-otp",
        json={"email": normal_user.email, "otp": sent_codes[0]},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["access_token"]
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == normal_user.email
    assert normal_user.mfa_otp_hash is None


@pytest.mark.asyncio
async def test_configured_initial_admin_logs_in_without_otp(
    async_client: AsyncClient,
    normal_user,
    monkeypatch,
):
    monkeypatch.setattr(settings, "FIRST_SUPERUSER_EMAIL", normal_user.email)

    async def fail_if_otp_sent(recipient: str, otp: str):
        pytest.fail("Configured admin login must not send an OTP.")

    monkeypatch.setattr("api.v1.endpoints.auth.send_login_otp", fail_if_otp_sent)
    response = await async_client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": normal_user.email, "password": "password123"},
    )

    assert response.status_code == 200
    assert response.json()["access_token"]
    assert response.json()["user"]["is_superuser"] is True
    assert normal_user.is_superuser is True


@pytest.mark.asyncio
async def test_existing_admin_logs_in_without_otp(async_client: AsyncClient, superuser, monkeypatch):
    async def fail_if_otp_sent(recipient: str, otp: str):
        pytest.fail("Admin login must not send an OTP.")

    monkeypatch.setattr("api.v1.endpoints.auth.send_login_otp", fail_if_otp_sent)
    response = await async_client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": superuser.email, "password": "password123"},
    )

    assert response.status_code == 200
    assert response.json()["access_token"]
    assert response.json()["user"]["is_superuser"] is True


@pytest.mark.asyncio
async def test_login_otp_locks_after_five_incorrect_codes(async_client: AsyncClient, normal_user, monkeypatch):
    sent_codes = []

    async def capture_otp(recipient: str, otp: str):
        sent_codes.append(otp)

    monkeypatch.setattr("api.v1.endpoints.auth.send_login_otp", capture_otp)
    await async_client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": normal_user.email, "password": "password123"},
    )
    wrong_otp = "000000" if sent_codes[0] != "000000" else "000001"

    for attempt in range(5):
        response = await async_client.post(
            f"{settings.API_V1_STR}/auth/verify-otp",
            json={"email": normal_user.email, "otp": wrong_otp},
        )
        assert response.status_code == 400
        if attempt == 4:
            assert response.json()["detail"] == "Too many incorrect codes. Please log in again."

    assert normal_user.mfa_otp_hash is None


@pytest.mark.asyncio
async def test_login_email_failure_clears_otp(async_client: AsyncClient, normal_user, monkeypatch):
    async def fail_to_send(recipient: str, otp: str):
        raise RuntimeError("SMTP unavailable")

    monkeypatch.setattr("api.v1.endpoints.auth.send_login_otp", fail_to_send)
    response = await async_client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": normal_user.email, "password": "password123"},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "Unable to send the verification code. Please try again later."
    assert normal_user.mfa_otp_hash is None


@pytest.mark.asyncio
async def test_login_incorrect_password(async_client: AsyncClient, normal_user):
    response = await async_client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": "testuser@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Incorrect email or password"

@pytest.mark.asyncio
async def test_login_nonexistent_user_does_not_send_otp(async_client: AsyncClient, monkeypatch):
    async def fail_if_otp_sent(recipient: str, otp: str):
        pytest.fail("OTP must not be sent for an unregistered email.")

    monkeypatch.setattr("api.v1.endpoints.auth.send_login_otp", fail_if_otp_sent)
    response = await async_client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": "nobody@example.com", "password": "somepassword"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "This email address is not registered. Please sign up first."
