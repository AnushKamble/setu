import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "SETU — Automatic Block Planning System"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = (
        "Integrated AI Block Planning for Railway Engineering, Traction Distribution, "
        "and Signal & Telecommunication Maintenance"
    )
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"
    DATABASE_URL: str = "sqlite:///./setu.db"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    SOLVER_TIME_LIMIT_SECONDS: float = 10.0
    LOG_LEVEL: str = "INFO"

    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "ignore",
    }


settings = Settings()
