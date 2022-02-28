""" CRUD operations relating to HFI Calculator
"""
from typing import List
from datetime import date
from sqlalchemy.engine.cursor import CursorResult
from sqlalchemy.orm import Session
from app.schemas.hfi_calc import HFIResultRequest
from app.db.models.hfi_calc import FireCentre, FuelType, PlanningArea, PlanningWeatherStation, HFIRequest
from app.utils.time import get_utc_now


def get_fire_weather_stations(session: Session) -> CursorResult:
    """ Get all PlanningWeatherStation with joined FuelType, PlanningArea and FireCentre
    for the provided list of station_codes. """
    return session.query(PlanningWeatherStation, FuelType, PlanningArea, FireCentre)\
        .join(FuelType, FuelType.id == PlanningWeatherStation.fuel_type_id)\
        .join(PlanningArea, PlanningArea.id == PlanningWeatherStation.planning_area_id)\
        .join(FireCentre, FireCentre.id == PlanningArea.fire_centre_id)\
        .order_by(FireCentre.name, PlanningArea.name)


def get_all_stations(session: Session) -> CursorResult:
    """ Get all known planning weather stations """
    return session.query(PlanningWeatherStation.station_code).all()


def get_fire_centre_stations(session, fire_centre_id: int) -> CursorResult:
    """ Get all the stations, along with fuel type for a fire centre. """
    return session.query(PlanningWeatherStation, FuelType)\
        .join(PlanningArea, PlanningArea.id == PlanningWeatherStation.planning_area_id)\
        .join(FuelType, FuelType.id == PlanningWeatherStation.fuel_type_id)\
        .filter(PlanningArea.fire_centre_id == fire_centre_id)


def get_most_recent_updated_hfi_request(session: Session,
                                        fire_centre_id: int,
                                        prep_start_day: date = None,
                                        prep_end_day: date = None) -> HFIRequest:
    """ Get the most recently updated hfi request for a fire centre """
    query = session.query(HFIRequest)\
        .filter(HFIRequest.fire_centre_id == fire_centre_id)
    if prep_start_day is not None:
        query = query.filter(HFIRequest.prep_start_day == prep_start_day)
    if prep_end_day is not None:
        query = query.filter(HFIRequest.prep_end_day == prep_end_day)
    return query.order_by(HFIRequest.create_timestamp.desc()).first()


def store_hfi_request(session: Session, hfi_result_request: HFIResultRequest, username: str):
    """ Store the supplied hfi request """
    hfi_request = HFIRequest(
        fire_centre_id=hfi_result_request.selected_fire_center_id,
        prep_start_day=hfi_result_request.start_date,
        prep_end_day=hfi_result_request.end_date,
        create_timestamp=get_utc_now(),
        create_user=username,
        request=hfi_result_request.json())
    session.add(hfi_request)
