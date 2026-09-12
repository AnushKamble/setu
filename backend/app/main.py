from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import settings
from backend.app.logging_config import setup_logging
from backend.app.database import init_db
from backend.app.api.router import api_router

logger = setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing SETU Application Services...")
    init_db()
    logger.info("Database schema validated.")
    yield
    logger.info("Shutting down SETU Application Services.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router integration
app.include_router(api_router, prefix=settings.API_V1_STR)
# Direct root health endpoint for standard container health probes
app.include_router(api_router, prefix="")


@app.get("/")
def root_info():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health",
        "api_v1": settings.API_V1_STR,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
