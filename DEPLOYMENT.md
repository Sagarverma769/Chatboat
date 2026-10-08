# Deployment

This repository needs two deployable services for a production portal: the Next.js frontend and the FastAPI API. The root `vercel.json` currently routes the whole repository to FastAPI, so do not deploy the repository root as the combined website.

## Frontend

Create a Vercel project with the repository root directory set to `frontend`. Configure the server-side environment variable `BACKEND_API_URL` to the FastAPI base URL, including `/api/v1`, for example `https://api.example.com/api/v1`.

## API and database

Deploy `backend` to a persistent Python ASGI host that can reach managed PostgreSQL. Configure:

- `DATABASE_URL` with the managed PostgreSQL connection URL
- `SECRET_KEY` with a generated, private signing secret
- `FIRST_SUPERUSER_EMAIL` and `FIRST_SUPERUSER_PASSWORD` for the first administrator

Run `alembic upgrade head` from the backend directory against that database, then run `python initial_data.py` once to create the first administrator. Do not commit `.env` files or use the repository's local SQLite database in production.

## Known feature limits

- User records, roles, tickets, and replies persist in PostgreSQL and the portal refreshes them every five seconds.
- Password-reset email delivery is not configured; the page reports that instead of claiming a reset link was sent.
- Vercel cannot scan private LAN addresses. Its scan API returns an explicit unavailable response rather than fabricated results. Live LAN scanning needs a separately deployed, authenticated scanner agent inside the target network; that agent integration is not implemented yet.
- Nmap OS fingerprints may be estimates. The UI labels guesses and does not claim an exact OS when Nmap cannot confirm one.