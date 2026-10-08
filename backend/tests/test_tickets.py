import pytest
from httpx import AsyncClient

from core.security import create_access_token


@pytest.mark.asyncio
async def test_submit_ticket_persists_full_request_details(
    async_client: AsyncClient,
    normal_user,
):
    token = create_access_token(normal_user.id)
    response = await async_client.post(
        "/api/v1/tickets/submit",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "unit": "Unit A",
            "location": "Plant 1 - Room 104",
            "assigned_member": "Sagar Verma",
            "category": "Network",
            "priority": "High",
            "title": "Wi-Fi keeps disconnecting",
            "description": "The workstation drops off the network every few minutes.",
            "device_ip": "192.168.10.45",
        },
    )

    assert response.status_code == 201
    ticket = response.json()
    assert ticket["user_email"] == normal_user.email
    assert ticket["user_name"] == normal_user.full_name
    assert ticket["unit"] == "Unit A"
    assert ticket["category"] == "Network"
    assert ticket["priority"] == "High"
    assert ticket["title"] == "Wi-Fi keeps disconnecting"
    assert ticket["description"] == "The workstation drops off the network every few minutes."
    assert ticket["device_ip"] == "192.168.10.45"
    assert ticket["status"] == "Pending"


@pytest.mark.asyncio
async def test_admin_reply_is_visible_to_owner_and_admin_can_delete(
    async_client: AsyncClient,
    normal_user,
    superuser,
):
    user_headers = {"Authorization": f"Bearer {create_access_token(normal_user.id)}"}
    admin_headers = {"Authorization": f"Bearer {create_access_token(superuser.id)}"}
    response = await async_client.post(
        "/api/v1/tickets/submit",
        headers=user_headers,
        json={
            "unit": "Unit B",
            "location": "Plant 2 - Room 12",
            "category": "Printer",
            "priority": "Medium",
            "title": "Label printer offline",
            "description": "The printer is not responding.",
        },
    )
    assert response.status_code == 201
    ticket_id = response.json()["id"]

    owner_tickets = await async_client.get("/api/v1/tickets/me", headers=user_headers)
    assert owner_tickets.status_code == 200
    assert len(owner_tickets.json()) == 1

    denied_admin_list = await async_client.get("/api/v1/tickets/admin/all", headers=user_headers)
    assert denied_admin_list.status_code == 403

    reply = "Reconnected the printer to the Unit B network."
    update = await async_client.patch(
        f"/api/v1/tickets/admin/{ticket_id}/status",
        headers=admin_headers,
        json={
            "status": "Resolved",
            "resolution_notes": reply,
            "assigned_member": "Virender Sharma",
        },
    )
    assert update.status_code == 200

    refreshed_owner_tickets = await async_client.get("/api/v1/tickets/me", headers=user_headers)
    assert refreshed_owner_tickets.json()[0]["resolution_notes"] == reply
    assert refreshed_owner_tickets.json()[0]["status"] == "Resolved"

    delete = await async_client.delete(
        f"/api/v1/tickets/admin/{ticket_id}",
        headers=admin_headers,
    )
    assert delete.status_code == 204
    assert (await async_client.get("/api/v1/tickets/me", headers=user_headers)).json() == []


@pytest.mark.asyncio
async def test_user_can_only_delete_their_own_ticket(async_client: AsyncClient, normal_user, superuser):
    user_headers = {"Authorization": f"Bearer {create_access_token(normal_user.id)}"}
    admin_headers = {"Authorization": f"Bearer {create_access_token(superuser.id)}"}
    response = await async_client.post(
        "/api/v1/tickets/submit",
        headers=user_headers,
        json={
            "unit": "Unit A",
            "location": "Room 5",
            "category": "Access",
            "priority": "Low",
            "title": "Account access",
            "description": "Cannot access the portal.",
        },
    )
    ticket_id = response.json()["id"]

    denied = await async_client.delete(f"/api/v1/tickets/{ticket_id}", headers=admin_headers)
    assert denied.status_code == 404

    deleted = await async_client.delete(f"/api/v1/tickets/{ticket_id}", headers=user_headers)
    assert deleted.status_code == 204