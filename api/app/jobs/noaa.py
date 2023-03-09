""" A script that downloads weather models from NCEI NOAA HTTPS data server
"""
import os
import sys
import datetime
from typing import Generator
import logging
import tempfile
import requests
from sqlalchemy.orm import Session
from app.db.crud.weather_models import (get_processed_file_record,
                                        get_prediction_model,
                                        get_prediction_run,
                                        update_prediction_run)
from app.jobs.common_model_fetchers import (CompletedWithSomeExceptions, ModelValueProcessor,
                                            apply_data_retention_policy, check_if_model_run_complete,
                                            download, flag_file_as_processed)
from app import configure_logging
import app.utils.time as time_utils
from app.weather_models import ModelEnum, ProjectionEnum
from app.weather_models.process_grib import GribFileProcessor, ModelRunInfo
import app.db.database
from app.rocketchat_notifications import send_rocketchat_notification

# If running as its own process, configure logging appropriately.
if __name__ == "__main__":
    configure_logging()

logger = logging.getLogger(__name__)

GFS_BASE_URL = "https://www.ncei.noaa.gov/data/global-forecast-system/access/grid-004-0.5-degree/forecast/"


def get_gfs_model_run_hours():
    """ Yield GFS model run hours ("0000", "0600", "1200", "1800") """
    for hour in range(0, 19, 6):
        hour_str = format(hour, '02d') + "00"
        yield hour_str


def get_date_strings_from_datetime(datetime: datetime.datetime) -> tuple[str, str]:
    """ Returns strings for year_mo and year_mo_date to be used when requesting
    grib files from NOAA"""
    year_mo = f"{datetime.year}" + format(datetime.month, '02d')
    year_mo_date = year_mo + format(datetime.day, '02d')
    return (year_mo, year_mo_date)


def get_date_for_download(now: datetime.datetime) -> tuple[str, str]:
    """ Returns tuple of formatted strings for year_month and year_month_date.
    NOAA publishes GFS model data several days behind schedule, so we need to 
    determine the most recent date for which GFS data is available to download.
    """
    year_mo, year_mo_date = get_date_strings_from_datetime(now)
    days_backward = 0
    while assert_gfs_folder_exists(year_mo, year_mo_date) is False:
        logger.warning('GFS data folder for %s not found on NOAA server', year_mo_date)
        days_backward += 1
        previous_day = now - datetime.timedelta(days=days_backward)
        year_mo, year_mo_date = get_date_strings_from_datetime(previous_day)

    return previous_day


def assert_gfs_folder_exists(year_mo: str, year_mo_date: str) -> bool:
    """ Returns boolean value indicating whether the GFS data folder exists on the NOAA HTTPS server
    for the given year_month_date string """
    url = GFS_BASE_URL + f'{year_mo}/{year_mo_date}'
    response = requests.get(url, timeout=60)
    return response.status_code == 200


def get_gfs_model_run_download_urls(download_date: datetime.datetime, model_cycle: str) -> Generator[str, None, None]:
    """ Yield urls to download GFS model runs """
    # GFS model makes predictions at 3-hour intervals up to 384 hours (16 days) in advance.
    # Morecast 2.0 only needs predictions 10 days in advance (264 hours) and only for noon PST
    # but GFS model run timestamps are in UTC. 12:00 PST = 20:00 UTC, so we need to pull
    # data for the 18:00 and 21:00 UTC model runs, then perform linear interpolation to
    # calculate noon values.
    if model_cycle == '0000':
        before_noon = list(range(18, 265, 24))
        after_noon = list(range(21, 265, 24))
    elif model_cycle == '0600':
        before_noon = list(range(12, 253, 24))
        after_noon = list(range(15, 256, 24))
    elif model_cycle == '1200':
        before_noon = list(range(6, 247, 24))
        after_noon = list(range(9, 250, 24))
    elif model_cycle == '1800':
        before_noon = list(range(0, 241, 24))
        after_noon = list(range(3, 244, 24))

    all_hours = before_noon + after_noon
    # sort list purely for human convenience when debugging. Functionally it doesn't matter
    all_hours.sort()

    year_mo, year_mo_date = get_date_strings_from_datetime(download_date)

    for fcst_hour in all_hours:
        hhh = format(fcst_hour, '03d')
        filename = f'{year_mo}/{year_mo_date}/gfs_4_{year_mo_date}_{model_cycle}_{hhh}.grb2'
        yield GFS_BASE_URL + filename


def parse_url_for_timestamps(url: str):
    """ Interpret the model_run_timestamp and prediction_timestamp from a model's URL """
    # only need the substring after the final '/'
    timestamp_info = url.split('/')[-1]
    # timestamp_info has format 'gfs_4_{model run date yyyymmdd}_{model run hour xxxx}_{forecast hour xxx}.grb2'
    forecast_hour = timestamp_info[-8:-5]
    model_run_hour = timestamp_info[-13:-9]
    model_run_date = timestamp_info[6:14]
    model_run_datetime_str = model_run_date + ' ' + model_run_hour
    model_run_timestamp = datetime.datetime.strptime(model_run_datetime_str, '%Y%m%d %H%M')
    model_run_timestamp = model_run_timestamp.replace(tzinfo=datetime.timezone.utc)
    prediction_timestamp = model_run_timestamp + datetime.timedelta(hours=int(forecast_hour))

    return (model_run_timestamp, prediction_timestamp)


def mark_prediction_model_run_processed(session: Session,
                                        model: ModelEnum,
                                        projection: ProjectionEnum,
                                        prediction_run_timestamp: datetime.datetime):
    """ Mark a prediction model run as processed (complete) """
    prediction_model = get_prediction_model(session, model, projection)
    logger.info('prediction_model:%s, prediction_run_timestamp:%s',
                prediction_model, prediction_run_timestamp)
    prediction_run = get_prediction_run(session,
                                        prediction_model.id,
                                        prediction_run_timestamp)
    logger.info('prediction run: %s', prediction_run)
    prediction_run.complete = True
    update_prediction_run(session, prediction_run)


class GFS():
    """ Class that orchestrates downloading and processing of GFS weather model grib files from NOAA.
    """

    def __init__(self):
        """ Prep variables """
        self.files_downloaded = 0
        self.files_processed = 0
        self.exception_count = 0
        # We always work in UTC:
        self.now = time_utils.get_utc_now()
        self.grib_processor = GribFileProcessor()
        self.model_type: ModelEnum = ModelEnum.GFS
        self.projection = ProjectionEnum.GFS_LONLAT

    def process_model_run_urls(self, urls):
        """ Process the urls for a model run.
        """
        for url in urls:
            try:
                with app.db.database.get_write_session_scope() as session:
                    # check the database for a record of this file:
                    processed_file_record = get_processed_file_record(session, url)
                    if processed_file_record:
                        # This file has already been processed - so we skip it.
                        # NOTE: changing this to logger.debug causes too much noise in unit tests.
                        logger.debug('file already processed %s', url)
                    else:
                        model_run_timestamp, prediction_timestamp = parse_url_for_timestamps(url)
                        model_info = ModelRunInfo(ModelEnum.GFS, ProjectionEnum.GFS_LONLAT,
                                                  model_run_timestamp, prediction_timestamp)
                        # download the file:
                        with tempfile.TemporaryDirectory() as temporary_path:
                            downloaded = download(url, temporary_path, 'REDIS_CACHE_NOAA', 'REDIS_NOAA_CACHE_EXPIRY')
                            if downloaded:
                                self.files_downloaded += 1
                                # If we've downloaded the file ok, we can now process it.
                                try:
                                    self.grib_processor.process_grib_file(
                                        downloaded, model_info, session)
                                    # Flag the file as processed
                                    flag_file_as_processed(url, session)
                                    self.files_processed += 1
                                finally:
                                    # delete the file when done.
                                    os.remove(downloaded)
            except Exception as exception:
                self.exception_count += 1
                # We catch and log exceptions, but keep trying to download.
                # We intentionally catch a broad exception, as we want to try and download as much
                # as we can.
                logger.error('unexpected exception processing %s',
                             url, exc_info=exception)

    def process_model_run(self, model_cycle: str):
        """ Process a particular model run """
        logger.info('Processing {} model run cycle {}'.format(
            self.model_type, model_cycle))

        download_date = get_date_for_download(self.now)
        # Get the urls for the current model run.
        urls = list(get_gfs_model_run_download_urls(download_date, model_cycle))

        # Process all the urls.
        self.process_model_run_urls(urls)

        # Having completed processing, check if we're all done.
        with app.db.database.get_write_session_scope() as session:
            if check_if_model_run_complete(session, urls):
                logger.info(
                    '{} model run {} completed with SUCCESS'.format(self.model_type, model_cycle))
                prediction_run_timestamp, _ = parse_url_for_timestamps(url=urls[0])
                mark_prediction_model_run_processed(
                    session, self.model_type, self.projection, prediction_run_timestamp)

    def process(self):
        """ Entry point for downloading and processing weather model grib files """
        for hour in get_gfs_model_run_hours():
            try:
                self.process_model_run(hour)
            except Exception as exception:
                # We catch and log exceptions, but keep trying to process.
                # We intentionally catch a broad exception, as we want to try to process as much as we can.
                self.exception_count += 1
                logger.error(
                    'unexpected exception processing %s model run %d',
                    self.model_type, hour, exc_info=exception)


def process_models():
    """ downloading and processing models """

    # grab the start time.
    start_time = datetime.datetime.now()

    gfs = GFS()
    gfs.process()

    with app.db.database.get_write_session_scope() as session:
        # interpolate and machine learn everything that needs interpolating.
        model_value_processor = ModelValueProcessor(session)
        model_value_processor.process(ModelEnum.GFS)

    # calculate the execution time.
    execution_time = datetime.datetime.now() - start_time
    hours, remainder = divmod(execution_time.seconds, 3600)
    minutes, seconds = divmod(remainder, 60)

    # log some info.
    logger.info('%d downloaded, %d processed in total, time taken %d hours, %d minutes, %d seconds (%s)',
                gfs.files_downloaded, gfs.files_processed, hours, minutes, seconds,
                execution_time)
    # check if we encountered any exceptions.
    if gfs.exception_count > 0:
        # if there were any exceptions, return a non-zero status.
        raise CompletedWithSomeExceptions()
    return gfs.files_processed


def main():
    """ main script - process and download models, then do exception handling """
    try:
        process_models()
        apply_data_retention_policy()
    except CompletedWithSomeExceptions:
        logger.warning('completed processing with some exceptions')
        sys.exit(os.EX_SOFTWARE)
    except Exception as exception:
        # We catch and log any exceptions we may have missed.
        logger.error('unexpected exception processing', exc_info=exception)
        rc_message = ':poop: Encountered error retrieving GFS model data from NOAA'
        send_rocketchat_notification(rc_message, exception)
        # Exit with a failure code.
        sys.exit(os.EX_SOFTWARE)
    # We assume success if we get to this point.
    sys.exit(os.EX_OK)


if __name__ == "__main__":
    main()
