from fastapi import APIRouter
from api.v1.endpoints import auth, users
from api.v1.endpoints.tickets import router as tickets_router

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(tickets_router, tags=["Support Tickets"])
