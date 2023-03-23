import { isNumber } from 'lodash'
import { DateTime, Interval } from 'luxon'
import { FireCenterStation } from 'api/fbaAPI'
import { ModelChoice, ModelType, MoreCast2ForecastRecord, StationPrediction } from 'api/moreCast2API'
import { MoreCast2ForecastRow } from 'features/moreCast2/interfaces'
import { ColPrediction } from 'features/moreCast2/slices/columnModelSlice'

export const parseForecastsHelper = (
  forecasts: MoreCast2ForecastRecord[],
  stations: FireCenterStation[]
): MoreCast2ForecastRow[] => {
  const rows: MoreCast2ForecastRow[] = []

  forecasts.forEach(forecast => {
    const row: MoreCast2ForecastRow = {
      id: rowIDHasher(forecast.station_code, DateTime.fromMillis(forecast.for_date)),
      forDate: DateTime.fromMillis(forecast.for_date),
      precip: {
        choice: ModelChoice.FORECAST,
        value: forecast.precip
      },
      rh: {
        choice: ModelChoice.FORECAST,
        value: forecast.rh
      },
      stationCode: forecast.station_code,
      stationName: stations.find(station => station.code === forecast.station_code)?.name || '',
      temp: {
        choice: ModelChoice.FORECAST,
        value: forecast.temp
      },
      windDirection: {
        choice: ModelChoice.FORECAST,
        value: forecast.wind_direction || NaN
      },
      windSpeed: {
        choice: ModelChoice.FORECAST,
        value: forecast.wind_speed
      }
    }
    rows.push(row)
  })
  return rows
}

// Convert the model predictions from the API to a format that can be used by a MoreCast2DataGrid data grid
export const parseModelsForStationsHelper = (predictions: StationPrediction[]): MoreCast2ForecastRow[] => {
  const rows: MoreCast2ForecastRow[] = []

  predictions.forEach(prediction => {
    const station_code = prediction.station.code
    const station_name = prediction.station.name
    const model = prediction.abbreviation
    const row: MoreCast2ForecastRow = {
      id: rowIDHasher(prediction.station.code, DateTime.fromISO(prediction.datetime)),
      forDate: DateTime.fromISO(prediction.datetime),
      precip: {
        choice: model,
        value: isNumber(prediction.precip_24hours) ? prediction.precip_24hours : NaN
      },
      rh: {
        choice: model,
        value: isNumber(prediction.relative_humidity) ? prediction.relative_humidity : NaN
      },
      stationCode: station_code,
      stationName: station_name,
      temp: {
        choice: model,
        value: isNumber(prediction.temperature) ? prediction.temperature : NaN
      },
      windDirection: {
        choice: model,
        value: isNumber(prediction.wind_direction) ? prediction.wind_direction : NaN
      },
      windSpeed: {
        choice: model,
        value: isNumber(prediction.wind_speed) ? prediction.wind_speed : NaN
      }
    }
    rows.push(row)
  })
  return rows.sort((a, b) => a.stationName.localeCompare(b.stationName))
}

export const fillInTheModelBlanks = (
  stations: FireCenterStation[],
  stationPredictions: StationPrediction[],
  dateInterval: string[],
  modelType: ModelType
) => {
  const missingPredictions: StationPrediction[] = []
  // Iterate through all the station codes and the expected date strings to ensure there is an
  // item in the array for each unique combination
  stations.forEach(station => {
    dateInterval.forEach(date => {
      const filteredPrediction = stationPredictions.filter(p => p.station.code === station.code && p.datetime === date)
      if (!filteredPrediction.length) {
        missingPredictions.push(createEmptyStationPrediction(station.code, date, station.name, modelType))
      }
    })
  })
  // Use .slice() to create a shallow copy of the predictions from the API and add the missing predictions
  const completeStationPredictions: StationPrediction[] = [...missingPredictions, ...stationPredictions.slice()]
  return completeStationPredictions
}

export const replaceColumnValuesFromPrediction = (
  existingRows: MoreCast2ForecastRow[],
  fireCentreStations: FireCenterStation[],
  dateInterval: string[],
  colPrediction: ColPrediction
) => {
  const filledIn = fillInTheModelBlanks(
    fireCentreStations,
    colPrediction.stationPredictions,
    dateInterval,
    colPrediction.modelType
  )
  const morecast2ForecastRows = parseModelsForStationsHelper(filledIn)
  return existingRows.map(row => {
    const newPred = morecast2ForecastRows.find(pred => pred.id === row.id)
    if (newPred) {
      return {
        ...row,
        [colPrediction.colField]: newPred[colPrediction.colField]
      }
    } else {
      return {
        ...row,
        [colPrediction.colField]: { value: NaN, choice: colPrediction.modelType }
      }
    }
  })
}

const createEmptyStationPrediction = (
  code: number,
  datetime: string,
  name: string,
  modelType: ModelType
): StationPrediction => {
  const prediction = {
    abbreviation: modelType,
    bias_adjusted_relative_humidity: NaN,
    bias_adjusted_temperature: NaN,
    datetime: datetime,
    precip_24hours: NaN,
    id: rowIDHasher(code, DateTime.fromISO(datetime)),
    relative_humidity: NaN,
    station: {
      code,
      name,
      lat: NaN,
      long: NaN,
      ecodivision_name: null,
      core_season: {
        start_month: NaN,
        start_day: NaN,
        end_month: NaN,
        end_day: NaN
      }
    },
    temperature: NaN,
    wind_direction: NaN,
    wind_speed: NaN
  }

  return prediction
}

/**
 * Returns a unique ID by simply concatenating stationCode and timestamp
 * @param stationCode
 * @param timestamp
 * @returns String concatenation of stationCode and timestamp as an ID
 */
export const rowIDHasher = (stationCode: number, timestamp: DateTime) =>
  `${stationCode}${timestamp.startOf('day').toISODate()}`

export const createDateInterval = (fromDate: DateTime, toDate: DateTime) => {
  // Create an array of UTC datetime strings inclusive of the user selected from/to dates
  // This range of UTC datetimes is needed to help determine when a station is missing a
  // row of predictions
  const interval = Interval.fromDateTimes(fromDate, toDate.plus({ days: 1 }))
  const dateTimeArray = interval.splitBy({ day: 1 }).map(d => d.start)
  const dates = dateTimeArray.map(date => {
    return `${date.toISODate()}T20:00:00+00:00`
  })
  return dates
}

/**
 * Filters an array of MoreCast2ForecastRows to the subset of elements that contains a property
 * with a model choice that matches the specified model type. Example use, can be used to check
 * if a row has been manually edited by searching for precip, rh, temp, wind direction or wind speed
 * that has a choice === ModelChoice.MANUAL.
 * @param rows The array of MoreCast2ForecastRows to filter
 * @param choice The ModelType to filter by
 * @returns A filtered array of MoreCast2ForecastRows
 */
export const filterRowsByModelType = (rows: MoreCast2ForecastRow[], choice: ModelType) => {
  const filteredRows = rows.filter(
    row =>
      row.precip.choice === choice ||
      row.rh.choice === choice ||
      row.temp.choice === choice ||
      row.windDirection.choice === choice ||
      row.windSpeed.choice === choice
  )
  return filteredRows
}
