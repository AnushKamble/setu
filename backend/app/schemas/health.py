from typing import Dict, Any
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., example="healthy")
    app_name: str = Field(..., example="SETU — Automatic Block Planning System")
    version: str = Field(..., example="1.0.0")
    environment: str = Field(..., example="development")
    database_connected: bool = Field(..., example=True)
    solver_ready: bool = Field(..., example=True)
    details: Dict[str, Any] = Field(default_factory=dict)
