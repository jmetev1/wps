import axios from 'api/axios'
import { DateTime } from 'luxon'
import { HistoricStationResponse, StationDaily } from './hfiCalculatorAPI'

export interface CriticalHoursHFI {
  start: number
  end: number
}

export interface Identifiable {
  id: number
}
export interface FBAStation extends Identifiable {
  station_code: number
  station_name: string
  zone_code: string
  elevation: number
  fuel_type: string
  status: string
  temp: number
  rh: number
  wind_direction: number
  wind_speed: number
  precipitation: number
  grass_cure: number
  fine_fuel_moisture_code: number
  drought_code: number
  initial_spread_index: number
  build_up_index: number
  duff_moisture_code: number
  fire_weather_index: number
  head_fire_intensity: number
  critical_hours_hfi_4000: CriticalHoursHFI | undefined
  critical_hours_hfi_10000: CriticalHoursHFI | undefined
  rate_of_spread: number
  fire_type: string
  percentage_crown_fraction_burned: number
  flame_length: number
  thirty_minute_fire_size: number
  sixty_minute_fire_size: number
}

export interface FBAWeatherStationsResponse {
  date: string
  stations: FBAStation[]
}

export interface FetchableFBAStation extends Identifiable {
  stationCode: number
  fuelType: string
  percentageConifer: number | undefined
  grassCurePercentage: number | undefined
  percentageDeadBalsamFir: number | undefined
  crownBaseHeight: number | undefined
  windSpeed: number | undefined
}

export interface WeatherWarningStation extends Identifiable {
  station_code: number
  dailies: StationDaily[]
  duff_moisture_code: number
  build_up_index: number
  fuelType: string | undefined
}

export async function postFBAStations(
  date: string,
  fireBehaviorStations: FetchableFBAStation[]
): Promise<FBAWeatherStationsResponse> {
  const url = '/fba-calc/stations'

  const { data } = await axios.post(url, {
    date: date.slice(0, 10),
    stations: fireBehaviorStations.map(fireBehaviorStation => ({
      id: fireBehaviorStation.id,
      station_code: fireBehaviorStation.stationCode,
      fuel_type: fireBehaviorStation.fuelType,
      percentage_conifer: fireBehaviorStation.percentageConifer,
      grass_cure: fireBehaviorStation.grassCurePercentage,
      percentage_dead_balsam_fir: fireBehaviorStation.percentageDeadBalsamFir,
      crown_base_height: fireBehaviorStation.crownBaseHeight,
      wind_speed: fireBehaviorStation.windSpeed
    }))
  })
  return data
}

export async function postHistoricFBAStations(
  date: string,
  stations: WeatherWarningStation[]
): Promise<WeatherWarningStation> {
  const url = '/hfi-calc/customdaily'
  const { data } = await axios.get<HistoricStationResponse>(url, {
    params: {
      station_codes: stations[0].station_code,
      start_time_stamp: DateTime.fromISO(date).startOf('day').toMillis(),
      end_time_stamp: DateTime.fromISO(date).endOf('day').toMillis(),
      fuel_type: stations[0].fuelType
    }
  })
  return data
}
