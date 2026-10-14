# Deployment

Deploy the Next.js frontend and FastAPI API as separate services in your VMware-hosted environment. The application server must be able to reach the configured database and any networks you want to scan.

## Frontend

Build and run the Next.js application from the `frontend` directory. Configure the server-side environment variable `BACKEND_API_URL` to the FastAPI base URL, including `/api/v1`, for example `https://api.example.com/api/v1`.

## API and database

Run `backend` with a persistent Python ASGI server that can reach PostgreSQL. Configure:

- `DATABASE_URL` with the managed PostgreSQL connection URL
- `SECRET_KEY` with a generated, private signing secret
- `FIRST_SUPERUSER_EMAIL` and `FIRST_SUPERUSER_PASSWORD` for the first administrator

Run `alembic upgrade head` from the backend directory against that database, then run `python initial_data.py` once to create the first administrator. Do not commit `.env` files or use the repository's local SQLite database in production.

## Known feature limits

- User records, roles, tickets, and replies persist in PostgreSQL and the portal refreshes them every five seconds.
- Password-reset email delivery is not configured; the page reports that instead of claiming a reset link was sent.
- Live LAN scanning requires the application server or an authenticated scanner agent to be inside the target network, with an authorized Nmap scanner configured.
- Nmap OS fingerprints may be estimates. The UI labels guesses and does not claim an exact OS when Nmap cannot confirm one.