""" This module contains pydantic models related to Fire Behaviour Advisory Calculator. """

from typing import List, Optional
from datetime import date
from pydantic import BaseModel


class StationRequest(BaseModel):
    """ Request for one individual weather station. """
    station_code: int
    date: date
    fuel_type: str
    percentage_conifer: Optional[float]
    percentage_dead_balsam_fir: Optional[float]
    grass_cure: Optional[float]
    crown_base_height: Optional[float]


class StationListRequest(BaseModel):
    """ Request for a list of stations """
    stations: List[StationRequest]


class StationResponse(BaseModel):
    """ Response for one individual weather station. """
    station_code: int
    station_name: str
    date: date
    elevation: int
    fuel_type: str
    status: str
    temp: int
    rh: int
    wind_direction: Optional[int]
    wind_speed: float
    precipitation: float
    grass_cure: Optional[float]
    fine_fuel_moisture_code: float
    drought_code: float
    initial_spread_index: float
    build_up_index: float
    duff_moisture_code: float
    fire_weather_index: float
    head_fire_intensity: float
    rate_of_spread: float
    fire_type: str
    percentage_crown_fraction_burned: Optional[float]
    flame_length: float
    sixty_minute_fire_size: float
    thirty_minute_fire_size: float
    # FFMC corresponding to an HFI of approx. 4000
    ffmc_for_hfi_4000: float
    # HFI when FFMC is equal to value stored in ffmc_for_hfi_4000
    # (this is used bc max. FFMC is 101. In some cases, HFI will never reach 4000 even with FFMC=101)
    hfi_when_ffmc_equals_ffmc_for_hfi_4000: float
    # FFMC corresponding to an HFI of approx. 10,000
    ffmc_for_hfi_10000: float
    # HFI when FFMC is equal to value stored in ffmc_for_hfi_10000
    # (this is used bc max. FFMC is 101. In some cases, HFI will never reach 10,000 even with FFMC=101)
    hfi_when_ffmc_equals_ffmc_for_hfi_10000: float


class StationsListResponse(BaseModel):
    """ Response for all weather stations, in a list """
    stations: List[StationResponse]
