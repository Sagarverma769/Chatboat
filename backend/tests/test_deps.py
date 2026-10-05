import pytest
from httpx import AsyncClient
from fastapi import status
from core.config import settings
from core.security import create_access_token
from models.user import User

@pytest.mark.asyncio
async def test_get_current_user_inactive(async_client: AsyncClient, db_session):
    inactive_user = User(
        email="inactive@example.com",
        hashed_password="hashed_password_123",
        full_name="Inactive User",
        is_active=False,
        is_superuser=False
    )
    db_session.add(inactive_user)
    await db_session.commit()
    await db_session.refresh(inactive_user)

    token = create_access_token(subject=str(inactive_user.id))
    headers = {"Authorization": f"Bearer {token}"}
    response = await async_client.get(
        f"{settings.API_V1_STR}/users/me",
        headers=headers
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST

@pytest.mark.asyncio
async def test_get_current_active_superuser_non_super(async_client: AsyncClient, normal_user):
    token = create_access_token(subject=str(normal_user.id))
    headers = {"Authorization": f"Bearer {token}"}
    response = await async_client.get(
        f"{settings.API_V1_STR}/users/",
        headers=headers
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
