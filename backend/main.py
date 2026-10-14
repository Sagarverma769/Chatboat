from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from core.config import settings, validate_production_settings
from db.session import engine
from db.base import Base
from api.v1.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    validate_production_settings()
    is_production = settings.ENVIRONMENT.lower() in {"production", "prod"}
    if not is_production:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# CORS configuration allowing frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Primary API Router (includes auth, users, and tickets)
app.include_router(api_router, prefix=settings.API_V1_STR)

# Direct root-level /auth router for backward compatibility
from api.v1.endpoints.auth import router as auth_router
app.include_router(auth_router, prefix="/auth", tags=["authentication"])



@app.get("/")
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "docs": "/docs"
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
