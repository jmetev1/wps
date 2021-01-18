from datetime import datetime
from fastapi import APIRouter
from app.weather_models.fetch import c_haines


router = APIRouter(
    prefix="/c-haines",
)


@router.get('/')
async def get_c_haines(model_run_timestamp: datetime, prediction_timestamp: datetime):
    """ Return geojson polygons for c-haines """
    return await c_haines.fetch(model_run_timestamp, prediction_timestamp)
    # return await c_haines.fetch(None, None)


@router.get('/model-runs')
async def get_model_runs():
    return await c_haines.fetch_model_runs()
