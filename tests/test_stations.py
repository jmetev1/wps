""" Functional testing for API - stations using wf1 """
from pytest_bdd import scenario, given, then
from fastapi.testclient import TestClient
from aiohttp import ClientSession
from main import APP
from tests.common import default_mock_client_get


@scenario('test_stations.feature', 'Get weather stations from WFWX',
          example_converters=dict(status=int, index=int, code=int, name=str, lat=float, long=float))
def test_stations_scenario():
    """ BDD Scenario. """


# pylint: disable=unused-argument
@given("I request a list of weather stations")
def response(monkeypatch, mock_env_with_use_wfwx):
    """ Mock external requests and make GET /stations/ request """
    monkeypatch.setattr(ClientSession, 'get', default_mock_client_get)

    client = TestClient(APP)
    return client.get('/stations/')


# pylint: disable=unused-argument, redefined-outer-name, too-many-arguments
@then("the response status code is <status>")
def status_code(response, status: int):
    """ Assert that we receive the expected status code """
    assert response.status_code == status


@then("there are active 16 weather stations")
def active_16_weather_stations(response):
    """ We expect there to be 16 weather stations. Even though we were given 50 stations from the
    API, some of those stations are inactive/invalid/disabled or don't have lat/long.
    """
    assert len(response.json()['weather_stations']) == 16


@then("there is a station in <index> has <code>, <name>, <lat>, and <long>")
def there_is_a_station(response, index, code, name, lat, long):
    """ We expect a station to have a code, name, lat and long. """
    assert response.json()['weather_stations'][index] == {
        "code": code,
        "name": name,
        "lat": lat,
        "long": long
    }
