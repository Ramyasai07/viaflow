from fastapi import FastAPI
from app.api.v1.health import router as health_router

app = FastAPI(
    title="ViaFlow API",
    version="0.1.0",
)

# Register health check router under /api/v1/health
app.include_router(health_router, prefix="/api/v1/health", tags=["health"])
