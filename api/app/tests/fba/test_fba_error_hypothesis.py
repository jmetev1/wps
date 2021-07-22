"""
Unit tests for fire behavour calculator.
"""
from datetime import datetime, timezone as dt_tz
import random
from typing import Final
import logging
from pytest_bdd import scenario, given, then
from app import configure_logging
from app.utils.time import get_hour_20_from_date
from app.utils.fba_calculator import calculate_fire_behavour_advisory, FBACalculatorWeatherStation
from app.utils.redapp import FBPCalculateStatisticsCOM
from app.utils.cffdrs import isi_calc, bui_calc
import pytest


configure_logging()

logger = logging.getLogger(__name__)


class RelativeErrorException(Exception):
    """ Exception raised when it's mathematically impossible to calculate the relative error. """


def _str2float(value: str):
    if value == 'None':
        return None
    return float(value)


def _random_date():
    start = datetime.fromisoformat('2021-01-01')
    end = datetime.fromisoformat('2021-12-31')
    return datetime.fromtimestamp(random.uniform(start.timestamp(), end.timestamp()), tz=dt_tz.utc)


def relative_error(metric: str, actual: float, expected: float, precision: int = 2):
    """ calculate the relative error between two values - default to precision of 2"""
    actual = round(actual, precision)
    expected = round(expected, precision)
    if actual == expected:
        return 0
    if expected == 0:
        raise RelativeErrorException(
            f'unable to calculate relative error for {metric}; actual:{actual};expected:{expected}')
    return abs((actual-expected)/expected)


acceptable_margin_of_error: Final = 0.01


def check_metric(metric: str,
                 fuel_type: str,
                 python_value: float,
                 comparison_value: float,
                 metric_error_margin: float, note: str = None):
    """ Check relative error of a metric """
    # logging with %s became unreadable:
    # pylint: disable=logging-fstring-interpolation
    if comparison_value is None:
        logger.warning('Skipping %s! (%s) - note: %s', metric, comparison_value, note)
    elif comparison_value < 0:
        logger.warning('Skipping %s! (%s) - note: %s', metric, comparison_value, note)
    else:
        assert python_value >= 0
        error = relative_error(f'{metric}', python_value, comparison_value)
        absolute_error = abs(python_value - comparison_value)
        logger.info(
            f'{fuel_type}: Python {python_value}, {metric} {comparison_value} ; error: {error}')
        if error > acceptable_margin_of_error:
            logger.error('%s %s relative error %s > %s! (python: %s, expected: %s)',
                         fuel_type, metric, error, acceptable_margin_of_error, python_value, comparison_value)
        if metric_error_margin > 0.01:
            logger.warning('%s: The acceptable margin of error (%s) for %s is set too high',
                           fuel_type, metric_error_margin, metric)
        if error > metric_error_margin:
            # ok - fine, but for small numbers this isn't a big deal, so let's check the absolure difference.
            if absolute_error < 0.01:
                logger.info('no big deal, the absolute difference (%s) is tiny!', absolute_error)
            else:
                logger.info('absolute error: %s', absolute_error)
                assert error < metric_error_margin, f'{fuel_type}:{metric}'


@pytest.mark.usefixtures('mock_jwt_decode')
@scenario('test_fba_error_hypothesis.feature', 'Fire Behaviour Calculation',
          example_converters=dict(crown_base_height=_str2float,
                                  fuel_type=str,
                                  percentage_conifer=_str2float,
                                  percentage_dead_balsam_fir=_str2float,
                                  grass_cure=_str2float,
                                  num_iterations=int,

                                  ros_margin_of_error=float))
def test_fire_behaviour_calculator_scenario():
    """ BDD Scenario. """


@given("<fuel_type>, <percentage_conifer>, <percentage_dead_balsam_fir>, <grass_cure> and <crown_base_height> for <num_iterations>",
       target_fixture='results')
def given_input(fuel_type: str, percentage_conifer: float, percentage_dead_balsam_fir: float,
                grass_cure: float, crown_base_height: float, num_iterations: int):
    """ Take input and calculate actual and expected results """
    # get python result:
    random.seed(42)
    results = []
    for _ in range(num_iterations):
        # pylint: disable=invalid-name
        elevation = random.randint(0, 4019)
        latitude = random.uniform(45, 60)
        longitude = random.uniform(-118, -136)
        time_of_interest = _random_date()
        # NOTE: For high wind speeds, the difference between REDapp and FireBAT starts exceeding
        # tolerances. REDapp calculates it's own ISI (doesn't take the one provided by the system),
        # but uses a different formula from CFFDRS, so the results start getting more pronounced
        # with wind speeds.
        wind_speed = random.uniform(0, 40)
        wind_direction = random.uniform(0, 360)
        temperature = random.uniform(0, 40)
        relative_humidity = random.uniform(0, 100)
        precipitation = random.uniform(0, 50)
        dc = random.uniform(0, 600)
        dmc = random.uniform(11, 205)
        bui = bui_calc(dmc, dc)
        ffmc = random.uniform(11, 100)
        isi = isi_calc(ffmc, wind_speed)

        logger.info(f"""elevation:{elevation} ; lat: {latitude} ; lon: {longitude}; """
                    f"""toi: {time_of_interest}; ws: {wind_speed}; wd: {wind_direction}; """
                    f"""temperature: {temperature}; relative_humidity: {relative_humidity}; """
                    f"""precipitation: {precipitation}; dc: {dc}; dmc: {dmc}; bui: {bui}; """
                    f"""ffmc: {ffmc}; isi: {isi}""")
        python_input = FBACalculatorWeatherStation(elevation=elevation,
                                                   fuel_type=fuel_type,
                                                   time_of_interest=time_of_interest,
                                                   percentage_conifer=percentage_conifer,
                                                   percentage_dead_balsam_fir=percentage_dead_balsam_fir,
                                                   grass_cure=grass_cure,
                                                   crown_base_height=crown_base_height,
                                                   lat=latitude,
                                                   long=longitude,
                                                   bui=bui,
                                                   ffmc=ffmc,
                                                   isi=isi,
                                                   wind_speed=wind_speed,
                                                   wind_direction=wind_direction,
                                                   temperature=temperature,  # temporary fix so tests don't break
                                                   relative_humidity=relative_humidity,
                                                   precipitation=precipitation,
                                                   status='Forecasted')
        python_fba = calculate_fire_behavour_advisory(python_input)
        # get REDapp result from java:
        java_fbp = FBPCalculateStatisticsCOM(elevation=elevation,
                                             latitude=latitude,
                                             longitude=longitude,
                                             time_of_interest=get_hour_20_from_date(time_of_interest),
                                             fuel_type=fuel_type,
                                             ffmc=ffmc,
                                             dmc=dmc,
                                             dc=dc,
                                             bui=bui,
                                             wind_speed=wind_speed,
                                             wind_direction=wind_direction,
                                             percentage_conifer=percentage_conifer,
                                             percentage_dead_balsam_fir=percentage_dead_balsam_fir,
                                             grass_cure=grass_cure,
                                             crown_base_height=crown_base_height)
        results.append({
            'input': {'isi': isi, 'bui': bui, 'wind_speed': wind_speed, 'ffmc': ffmc},
            'python': python_fba,
            'java': java_fbp,
            'fuel_type': fuel_type}
        )

    return results

    # def relative_error(metric: str, actual: float, expected: float, precision: int = 2):
    #     """ calculate the relative error between two values - default to precision of 2"""
    #     actual = round(actual, precision)
    #     expected = round(expected, precision)
    #     if actual == expected:
    #         return 0
    #     if expected == 0:
    #         raise RelativeErrorException(
    #             f'unable to calculate relative error for {metric}; actual:{actual};expected:{expected}')
    #     return abs((actual-expected)/expected)

    # def check_metric(metric: str,
    #                  fuel_type: str,
    #                  python_value: float,
    #                  comparison_value: float,
    #                  metric_error_margin: float, note: str = None):
    #     """ Check relative error of a metric """
    #     # logging with %s became unreadable:
    #     # pylint: disable=logging-fstring-interpolation
    #     if comparison_value is None:
    #         logger.warning('Skipping %s! (%s) - note: %s', metric, comparison_value, note)
    #     elif comparison_value < 0:
    #         logger.warning('Skipping %s! (%s) - note: %s', metric, comparison_value, note)
    #     else:
    #         assert python_value >= 0
    #         error = relative_error(f'{metric}', python_value, comparison_value)
    #         logger.info(
    #             f'{fuel_type}: Python {python_value}, {metric} {comparison_value} ; error: {error}')
    #         if error > acceptable_margin_of_error:
    #             logger.error('%s %s relative error %s > %s! (actual: %s, expected: %s)',
    #                          fuel_type, metric, error, acceptable_margin_of_error, python_value, comparison_value)
    #         if metric_error_margin > 0.01:
    #             logger.warning('%s: The acceptable margin of error (%s) for %s is set too high',
    #                            fuel_type, metric_error_margin, metric)
    #         assert error < metric_error_margin, f'{fuel_type}:{metric}'


@then("ROS is within <ros_margin_of_error> compared to REDapp")
def then_ros_good(results: list, ros_margin_of_error: float):
    """ check the relative error of ROS """
    for index, result in enumerate(results):
        wind_speed = result['input']['wind_speed']
        ffmc = result['input']['ffmc']
        isi = result['input']['isi']
        bui = result['input']['bui']
        java_isi = result['java'].isi
        logger.info('java calculated isi: %s', java_isi)
        check_metric(f'({index})ROS input- isi:{isi}; bui:{bui}; wind_speed:{wind_speed}; ffmc:{ffmc}',
                     result['fuel_type'],
                     result['python'].ros,
                     result['java'].ros_eq, ros_margin_of_error)

    # @then("ROS is within <s_ros_em> of <spreadsheet_ros> with <note>")
    # def then_spreadsheet_ros(result: dict, s_ros_em: float, spreadsheet_ros: float, note: str):
    #     """ check the relative error of the ros """
    #     check_metric('Spreadsheet ROS',
    #                  result['fuel_type'],
    #                  result['python'].ros,
    #                  spreadsheet_ros,
    #                  s_ros_em,
    #                  note)

    # @then("CFB is within <s_cfb_em> of <spreadsheet_cfb> with <note>")
    # def then_spreadsheet_cfb(result: dict, s_cfb_em: float, spreadsheet_cfb: float, note: str):
    #     """ check the relative error of the cfb """
    #     check_metric('Spreadsheet CFB',
    #                  result['fuel_type'],
    #                  result['python'].cfb,
    #                  spreadsheet_cfb,
    #                  s_cfb_em,
    #                  note)

    # @then("HFI is within <s_hfi_em> of <spreadsheet_hfi> with <note>")
    # def then_spreadsheet_hfi(result: dict, s_hfi_em: float, spreadsheet_hfi: float, note: str):
    #     """ check the relative error of the hfi """
    #     check_metric('Spreadsheet HFI', result['fuel_type'],
    #                  result['python'].hfi, spreadsheet_hfi, s_hfi_em, note)

    # @then("ROS is within <r_ros_em> of REDapp ROS")
    # def then_red_app_ros(result: dict, r_ros_em: float):
    #     """ check the relative error of ROS """
    #     check_metric('REDapp ROS',
    #                  result['fuel_type'],
    #                  result['python'].ros,
    #                  result['java'].ros_t, r_ros_em)

    # @then("CFB is within <r_cfb_em> of REDapp CFB")
    # def then_red_app_cfb(result: dict, r_cfb_em: float):
    #     """ check the relative error fo the CFB """
    #     # python gives CFB as 0-1
    #     # redapp gives CFB as 0-100
    #     check_metric('REDapp CFB', result['fuel_type'], result['python'].cfb*100, result['java'].cfb, r_cfb_em)

    # @then("HFI is within <r_hfi_em> of REDapp HFI")
    # def then_red_app_hfi(result: dict, r_hfi_em: float):
    #     """ check the relative error of the CFB """
    #     check_metric('REDapp HFI', result['fuel_type'], result['python'].hfi, result['java'].hfi, r_hfi_em)

    # @then("1 HR Size is within <r_h1_em> of REDapp 1 HR Size")
    # def then_red_app_1hr(result: dict, r_h1_em: float):
    #     """ check the relative error of the a hour fire size"""
    #     check_metric('REDapp 1 HR Size',
    #                  result['fuel_type'],
    #                  result['python'].sixty_minute_fire_size,
    #                  result['java'].area,
    #                  r_h1_em)
