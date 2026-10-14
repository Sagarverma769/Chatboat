const path = require("node:path");

const rootDir = __dirname;
const backendDir = path.join(rootDir, "backend");
const frontendDir = path.join(rootDir, "frontend");
const pythonExecutable =
  process.platform === "win32"
    ? path.join(backendDir, ".venv", "Scripts", "python.exe")
    : path.join(backendDir, ".venv", "bin", "python");

module.exports = {
  apps: [
    {
      name: "chatboat-backend",
      cwd: backendDir,
      script: pythonExecutable,
      args: "-m uvicorn main:app --host 0.0.0.0 --port 8000",
      interpreter: "none",
      env: {
        ENVIRONMENT: "production",
        PYTHONUNBUFFERED: "1",
      },
    },
    {
      name: "chatboat-frontend",
      cwd: frontendDir,
      script: path.join(frontendDir, "node_modules", "next", "dist", "bin", "next"),
      args: "start -H 0.0.0.0",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        BACKEND_API_URL:
          process.env.BACKEND_API_URL || "http://127.0.0.1:8000/api/v1",
      },
    },
  ],
};
