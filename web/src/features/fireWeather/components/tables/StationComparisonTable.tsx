import React from 'react'
import makeStyles from '@mui/styles/makeStyles'
import { ClassNameMap } from '@mui/styles/withStyles'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableRow from '@mui/material/TableRow'
import TableHead from '@mui/material/TableHead'
import { GeoJsonStation } from 'api/stationAPI'
import { ObservedValue } from 'api/observationAPI'
import { NoonForecastValue } from 'api/forecastAPI'
import { ModelValue } from 'api/modelAPI'
import { formatDateInUTC00Suffix, formatDatetimeInPST } from 'utils/date'
import { calculateAccumulatedPrecip } from 'utils/table'
import ComparisonTableRow, { DataSource, WeatherVariable } from './ComparisonTableRow'

const useStyles = makeStyles({
  paper: {
    padding: '5px',
    // There's a formating issues that causes the last cell in the table to be cut off
    // when in 100%, on a small screen. Setting the width to 95% is a workaround, as the
    // true source of the problem remains a mystery. (suspicion: it's something to do with using
    // flex boxes, and having a table that needs to scroll.)
    width: '95%'
  },
  typography: {},
  lightColumnHeader: {
    textAlign: 'center',
    padding: '2px',
    minWidth: '60px'
  },
  darkColumnHeader: {
    backgroundColor: 'rgb(240, 240, 240)',
    textAlign: 'center',
    padding: '2px',
    minWidth: '60px'
  }
})
interface Props {
  timeOfInterest: string
  stationCodes: number[]
  stationsByCode: Record<number, GeoJsonStation | undefined>
  allNoonForecastsByStation: Record<number, NoonForecastValue[] | undefined>
  observationsByStation: Record<number, ObservedValue[] | undefined>
  allHighResModelsByStation: Record<number, ModelValue[] | undefined>
  allRegionalModelsByStation: Record<number, ModelValue[] | undefined>
  allModelsByStation: Record<number, ModelValue[] | undefined>
}

const findNoonMatch = (noonDate: string, collection: ModelValue[] | undefined): ModelValue | undefined => {
  return collection?.find((item: ModelValue) => item.datetime === noonDate)
}

const SubHeadings = (value: string, index: number, classes: ClassNameMap<'darkColumnHeader' | 'lightColumnHeader'>) => {
  const className = index % 2 === 0 ? classes.darkColumnHeader : classes.lightColumnHeader
  return [
    <TableCell key={`${value}-observered-${index}`} className={className}>
      Observed
    </TableCell>,
    <TableCell key={`${value}-forecast-${index}`} className={className}>
      Forecast
    </TableCell>,
    <TableCell key={`${value}-HRDPS-${index}`} className={className}>
      HRDPS
    </TableCell>,
    <TableCell key={`${value}-RDPS-${index}`} className={className}>
      RDPS
    </TableCell>,
    <TableCell key={`${value}-GDPS-${index}`} className={className}>
      GDPS
    </TableCell>
  ]
}

const StationComparisonTable = (props: Props) => {
  const classes = useStyles()
  // format the date to match the ISO format in the API for easy comparison.
  const noonDate = formatDateInUTC00Suffix(props.timeOfInterest)
  return (
    <Paper className={classes.paper}>
      <Typography component="div" variant="subtitle2">
        Station comparison for {formatDatetimeInPST(noonDate)} PDT
      </Typography>
      <Paper>
        <TableContainer>
          <Table size="small" aria-label="sortable wx table" data-testid="station-comparison-table">
            <TableHead>
              <TableRow>
                <TableCell></TableCell>
                <TableCell className={classes.darkColumnHeader} colSpan={5}>
                  Temperature (&deg;C)
                </TableCell>
                <TableCell className={classes.lightColumnHeader} colSpan={5}>
                  Relative Humidity (%)
                </TableCell>
                <TableCell className={classes.darkColumnHeader} colSpan={5}>
                  Wind Speed (km/h)
                </TableCell>
                <TableCell className={classes.lightColumnHeader} colSpan={5}>
                  Wind Direction (&deg;)
                </TableCell>
                <TableCell className={classes.darkColumnHeader} colSpan={5}>
                  Precipitation (mm)
                </TableCell>
                <TableCell className={classes.lightColumnHeader}>Dew point (&deg;C)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Weather Stations</TableCell>
                {['temp', 'rh', 'wind speed', 'wind direction', 'precip'].map((value, index) => {
                  return SubHeadings(value, index, classes)
                })}
                {/* Dew Point */}
                <TableCell className={classes.lightColumnHeader}>Observed</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {props.stationCodes.map((stationCode: number, idx: number) => {
                const station = props.stationsByCode[stationCode]
                const noonForecasts = props.allNoonForecastsByStation[stationCode]
                const noonForecast = noonForecasts?.find(forecast => forecast.datetime === noonDate)
                const observations = props.observationsByStation[stationCode]
                const observation = observations?.find(item => item.datetime === noonDate)
                const accumulatedObservedPrecipitation = calculateAccumulatedPrecip(noonDate, observations)
                const hrdpsModelPrediction = findNoonMatch(noonDate, props.allHighResModelsByStation[stationCode])
                const accumulatedHRDPSPrecipitation = calculateAccumulatedPrecip(
                  noonDate,
                  props.allHighResModelsByStation[stationCode]
                )
                const rdpsModelPrediction = findNoonMatch(noonDate, props.allRegionalModelsByStation[stationCode])
                const accumulatedRDPSPrecipitation = calculateAccumulatedPrecip(
                  noonDate,
                  props.allRegionalModelsByStation[stationCode]
                )
                const gdpsModelPrediction = findNoonMatch(noonDate, props.allModelsByStation[stationCode])
                const accumulatedGDPSPrecipitation = calculateAccumulatedPrecip(
                  noonDate,
                  props.allModelsByStation[stationCode]
                )
                const indexCell = (
                  <TableCell>
                    {station?.properties.name} ({stationCode})
                  </TableCell>
                )

                const headers: WeatherVariable[] = [
                  'Temperature',
                  'Relative Humidity',
                  'Wind Speed',
                  'Wind Direction',
                  'Precipitation',
                  'Dew point'
                ]
                const subheaders: DataSource[][] = [
                  ['Observed', 'Forecast', 'HRDPS', 'RDPS', 'GDPS'],
                  ['Observed', 'Forecast', 'HRDPS', 'RDPS', 'GDPS'],
                  ['Observed', 'Forecast', 'HRDPS', 'RDPS', 'GDPS'],
                  ['Observed', 'Forecast', 'HRDPS', 'RDPS', 'GDPS'],
                  ['Observed', 'Forecast', 'HRDPS', 'RDPS', 'GDPS'],
                  ['Observed']
                ]

                return (
                  <ComparisonTableRow
                    index={indexCell}
                    headers={headers}
                    subheaders={subheaders}
                    observation={observation}
                    forecast={noonForecast}
                    highResModel={hrdpsModelPrediction}
                    regionalModel={rdpsModelPrediction}
                    globalModel={gdpsModelPrediction}
                    accumulatedHRDPSPrecip={accumulatedHRDPSPrecipitation}
                    accumulatedRDPSPrecip={accumulatedRDPSPrecipitation}
                    accumulatedGDPSPrecip={accumulatedGDPSPrecipitation}
                    accumulatedObsPrecip={accumulatedObservedPrecipitation}
                    testId={`comparison-table-row-${stationCode}`}
                    testIdRowNumber={stationCode}
                    key={idx}
                  />
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Paper>
  )
}

export default React.memo(StationComparisonTable)
