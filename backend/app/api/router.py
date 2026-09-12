from fastapi import APIRouter
from backend.app.api.health import router as health_router
from backend.app.api.scenarios import router as scenarios_router
from backend.app.api.plans import router as plans_router
from backend.app.api.ml import router as ml_router
from backend.app.api.simulation import router as simulation_router
from backend.app.api.marey import router as marey_router
from backend.app.api.dispatch import router as dispatch_router
from backend.app.api.roi import router as roi_router
from backend.app.api.kavach import router as kavach_router
from backend.app.api.copilot import router as copilot_router
from backend.app.api.custom_data import router as custom_data_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(scenarios_router)
api_router.include_router(plans_router)
api_router.include_router(ml_router)
api_router.include_router(simulation_router)
api_router.include_router(marey_router)
api_router.include_router(dispatch_router)
api_router.include_router(roi_router)
api_router.include_router(kavach_router)
api_router.include_router(copilot_router)
api_router.include_router(custom_data_router)
