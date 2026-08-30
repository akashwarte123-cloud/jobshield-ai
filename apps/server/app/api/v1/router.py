from fastapi import APIRouter
from pydantic import BaseModel
from app.api.v1.endpoints.auth import router as auth_router

api_router = APIRouter()

class HealthCheckResponse(BaseModel):
    status: str
    service: str
    environment: str

@api_router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    return HealthCheckResponse(
        status="ok",
        service="JobShield AI FastAPI Backend Service",
        environment="development"
    )

# Register Authentication Endpoints
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
