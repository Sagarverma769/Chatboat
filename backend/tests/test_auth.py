import pytest
from httpx import AsyncClient
from core.config import settings

@pytest.mark.asyncio
async def test_login_success(async_client: AsyncClient, normal_user):
    response = await async_client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": "testuser@example.com", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_incorrect_password(async_client: AsyncClient, normal_user):
    response = await async_client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": "testuser@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Incorrect email or password"

@pytest.mark.asyncio
async def test_login_nonexistent_user(async_client: AsyncClient):
    response = await async_client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": "nobody@example.com", "password": "somepassword"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Incorrect email or password"
