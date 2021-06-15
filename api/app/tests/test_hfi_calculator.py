""" BDD tests for API /hfi-calc/ """
import logging
from pytest_bdd import scenario, given, then
import pytest
from starlette.testclient import TestClient
from aiohttp import ClientSession
from app.tests.common import default_mock_client_get
import app.main
from sqlalchemy.orm import Session
from app.db.models.hfi_calc import PlanningWeatherStation, FireCentre, FuelType, PlanningArea
import app.routers.hfi_calc

logger = logging.getLogger(__name__)


@pytest.mark.usefixtures("mock_jwt_decode")
@scenario('test_hfi_calculator.feature', 'Get metrics for stations',
          example_converters=dict(
              code=int,
              status=str,
              temperatire=float,
              relative_humidity=float,
              wind_speed=float,
              wind_direction=float,
              grass_cure_percentage=float,
              precipitation=float,
              ffmc=float,
              dmc=float,
              dc=float,
              isi=float,
              bui=float,
              fwi=float,
              danger_cl=float,
              fbp_fuel_type=str))
def test_hfi_daily_metrics():
    """ BDD Scenario. """

# pylint: disable=line-too-long


@given('I request metrics for all stations beginning at time <start_time_stamp> and ending at time <end_time_stamp>.', target_fixture='response')
def given_time_range_metrics_request(monkeypatch):
    """ Make /hfi-calc/daily request using mocked out ClientSession.
    """

    monkeypatch.setattr(ClientSession, 'get', default_mock_client_get)
    # Create API client and get the response.
    client = TestClient(app.main.app)
    headers = {'Content-Type': 'application/json',
               'Authorization': 'Bearer token'}

    return client.get('/api/hfi-calc/daily', headers=headers)


@then('the response status code is <status_code>')
def assert_status_code_200(response, status_code: int):
    """ Assert that we receive the expected status code """
    assert response.status_code == int(status_code)

# pylint: disable=invalid-name, too-many-arguments, line-too-long, too-many-locals


@then('the status <status>, with temperature <temperature> and relative humidity <relative_humidity>, and wind_direction <wind_direction> and wind_speed <wind_speed> and precipitation <precipitation> and grass_cure_percentage <grass_cure_percentage> and ffmc <ffmc> and dc <dc> and <dmc> and isi <isi> and <bui> and fwi <fwi> and danger_cl <danger_cl> and fbp_fuel_type <fbp_fuel_type>')
def assert_individual_station_data(
        response,
        temperature,
        relative_humidity,
        wind_direction,
        wind_speed,
        precipitation,
        grass_cure_percentage,
        ffmc,
        dc,
        dmc,
        isi,
        bui,
        fwi,
        danger_cl,
        fbp_fuel_type):
    """ Assert that the response includes specific data for an individual weather station """
    daily = response.json()['dailies'][0]
    assert daily['temperature'] == float(temperature)
    assert daily['relative_humidity'] == float(relative_humidity)
    assert daily['wind_direction'] == float(wind_direction)
    assert daily['wind_speed'] == float(wind_speed)
    assert daily['precipitation'] == float(precipitation)
    assert daily['grass_cure_percentage'] == float(grass_cure_percentage)
    assert daily['ffmc'] == float(ffmc)
    assert daily['dmc'] == float(dmc)
    assert daily['dc'] == float(dc)
    assert daily['isi'] == float(isi)
    assert daily['bui'] == float(bui)
    assert daily['fwi'] == float(fwi)
    assert daily['danger_cl'] == float(danger_cl)
    assert daily['fbp_fuel_type'] == fbp_fuel_type


@scenario('test_hfi_calculator.feature', 'Get fire centres, planning areas, and weather stations',
          example_converters=dict(
              status=int,
              num_fire_centres=int))
def test_hfi_planning_areas():
    """ BDD Scenario. """


@given('I request all fire centres, planning areas, etc.', target_fixture='response')
def given_hfi_planning_areas_request(monkeypatch):
    """ Make /hfi-calc/ request using mocked out ClientSession.
    """

    def mock_get_fire_weather_stations(_: Session):
        fire_centre = FireCentre(name='Kamloops Fire Centre')
        planning_area_1 = PlanningArea(name='Kamloops (K2)', fire_centre_id=1)
        planning_area_2 = PlanningArea(name='Vernon (K4)', fire_centre_id=1)
        fuel_type_1 = FuelType(abbrev='O1B', description='neigh')
        fuel_type_2 = FuelType(abbrev='C7', description='moo')
        return (
            (PlanningWeatherStation(station_code=322, fuel_type_id=1,
             planning_area_id=1), fuel_type_1, planning_area_1, fire_centre),
            (PlanningWeatherStation(station_code=346, fuel_type_id=2,
             planning_area_id=2), fuel_type_2, planning_area_2, fire_centre),
            (PlanningWeatherStation(station_code=334, fuel_type_id=2,
             planning_area_id=2), fuel_type_2, planning_area_2, fire_centre)
        )

    monkeypatch.setattr(ClientSession, 'get', default_mock_client_get)
    monkeypatch.setattr(app.routers.hfi_calc, 'get_fire_weather_stations', mock_get_fire_weather_stations)

    # Create API client and get the response.
    client = TestClient(app.main.app)
    headers = {'Content-Type': 'application/json',
               'Authorization': 'Bearer token'}

    return client.get('/api/hfi-calc/fire-centres/', headers=headers)


@then('the response status code is <status>')
def assert_status_code(response, status):
    """ Assert that we receive the expected status code """
    assert response.status_code == status


@then('there are at least <num_fire_centres> fire centres')
def assert_number_of_fire_centres(response, num_fire_centres):
    """ Assert that we receive the minimum expected number of fire centres """
    assert len(response.json()['fire_centres']) >= num_fire_centres


@then('each fire centre has at least 1 planning area')
def assert_min_num_planning_areas_in_fire_centre(response):
    """ Assert that each fire centre returned has at least 1 planning area assigned to it """
    for fire_centre in response.json()['fire_centres']:
        assert len(fire_centre['planning_areas']) >= 1


@then('each planning area has at least 1 weather station')
def assert_min_num_stations_in_planning_area(response):
    """ Assert that each planning area returned has at least 1 weather station assigned to it """
    for fire_centre in response.json()['fire_centres']:
        for planning_area in fire_centre['planning_areas']:
            assert len(planning_area['stations']) >= 1


@then('each weather station has a fuel_type assigned to it')
def assert_station_has_fuel_type(response):
    """ Assert that each weather station has one assigned fuel type """
    for fire_centre in response.json()['fire_centres']:
        for planning_area in fire_centre['planning_areas']:
            for wx_station in planning_area['stations']:
                assert wx_station['station_props']['fuel_type'] is not None
