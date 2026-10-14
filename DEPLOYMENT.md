# Deployment

Deploy the Next.js frontend and FastAPI API as separate services in your VMware-hosted Windows Server 2016 environment. VS Code is only needed to edit the project; closing it or disconnecting Remote Desktop/SSH will not stop services managed by PM2. The VM must remain powered on and have network connectivity.

## Run both services with PM2

Install Node.js 20.9 or newer and Python on the VM. Run these commands in PowerShell from the repository root. Do not run the development server (`next dev`) in production.

```powershell
npm install --global pm2

Set-Location .\backend
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
# Edit .env and set real production values before continuing.
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe initial_data.py

Set-Location ..\frontend
npm ci
npm run build

Set-Location ..
pm2 start ecosystem.config.cjs
pm2 status
pm2 logs
```

`python initial_data.py` is a one-time setup step for a new database; do not repeat it for every deployment. If the administrator already exists, skip it.

The PM2 config uses the Windows virtual-environment Python executable, runs Uvicorn without `--reload`, serves Next.js in production mode, and points the frontend to the backend on the same VM. If the frontend is accessed through a separate API host, set `BACKEND_API_URL` to that server-side API base URL, including `/api/v1`, before starting PM2.

PM2 keeps apps running after VS Code and terminal windows close. To restore them automatically after a Windows Server reboot, configure Task Scheduler once:

1. From the same Windows account that started PM2, save the process list:
   ```powershell
   pm2 save
   ```
2. Open **Task Scheduler** and choose **Create Task** (not Basic Task).
3. On **General**, select the same account used for PM2 and **Run whether user is logged on or not**.
4. On **Triggers**, add **At startup**. A short delay (for example, 30 seconds) lets Windows networking start.
5. On **Actions**, choose **Start a program**:
   - Program: `C:\Windows\System32\cmd.exe`
   - Arguments: `/c ""C:\Users\<VM_USER>\AppData\Roaming\npm\pm2.cmd" resurrect"`
   - Start in: the repository root folder on the VM (the folder containing `ecosystem.config.cjs`)
6. Save the task and provide that Windows account's password if requested.

Replace `<VM_USER>` and the repository path with the actual values on the VM. If global npm packages use a different location, find `pm2.cmd` with `where.exe pm2` in that account's Command Prompt and use its full path. PM2's saved process list belongs to that account; Task Scheduler must run as the same account.

Useful operations:

```powershell
pm2 status
pm2 logs chatboat-backend
pm2 logs chatboat-frontend
pm2 restart chatboat-backend
pm2 restart chatboat-frontend
pm2 stop chatboat-backend
pm2 stop chatboat-frontend
```

After deploying code changes, rebuild the frontend (`Set-Location .\frontend; npm run build`) and restart the services with `pm2 restart chatboat-backend` and `pm2 restart chatboat-frontend`. `pm2 logs` only displays logs; press Ctrl+C to leave the log viewer, not to stop the apps.

## About `nohup`

`nohup` is a Linux/Unix utility and does not apply to native Windows Server 2016. On this VM, use PM2 to keep the services detached from VS Code and Task Scheduler to restore them after a reboot. Do not run a second copy of either service outside PM2 on the same port.

## API and database

The backend must be able to reach PostgreSQL. Configure `backend\.env` with:

- `DATABASE_URL` with the managed PostgreSQL connection URL
- `SECRET_KEY` with a generated, private signing secret
- `FIRST_SUPERUSER_EMAIL` and `FIRST_SUPERUSER_PASSWORD` for the first administrator

Do not commit `.env` files or use the repository's local SQLite database in production. Ensure the Windows Firewall allows browser traffic to the frontend port (default `3000`); keep backend port `8000` private when the frontend's Next.js server proxies API requests.

## Known feature limits

- User records, roles, tickets, and replies persist in PostgreSQL. Ticket and user lists load when their page opens and can be refreshed manually.
- Password-reset email delivery is not configured; the page reports that instead of claiming a reset link was sent.
- Live LAN scanning requires the application server or an authenticated scanner agent to be inside the target network, with an authorized Nmap scanner configured.
- Nmap OS fingerprints may be estimates. The UI labels guesses and does not claim an exact OS when Nmap cannot confirm one.