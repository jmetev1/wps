import { TableCell, Tooltip } from '@material-ui/core'
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline'
import { createTheme, makeStyles, ThemeProvider } from '@material-ui/core/styles'
import React from 'react'
import { isUndefined } from 'lodash'
import { PlanningArea } from 'api/hfiCalcAPI'
import { isValidGrassCure } from 'features/hfiCalculator/validation'
import { StationDaily } from 'api/hfiCalculatorAPI'
import {
  calculateMeanIntensityGroup,
  intensityGroupColours
} from 'features/hfiCalculator/components/meanIntensity'

export interface MeanIntensityGroupRollupProps {
  area: PlanningArea
  dailiesMap: Map<number, StationDaily>
  selectedStations: number[]
}

const useStyles = makeStyles({
  intensityGroupSolid1: {
    background: intensityGroupColours.lightGreen,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  intensityGroupSolid2: {
    background: intensityGroupColours.cyan,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  intensityGroupSolid3: {
    background: intensityGroupColours.yellow,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  intensityGroupSolid4: {
    background: intensityGroupColours.orange,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  intensityGroupSolid5: {
    background: intensityGroupColours.red,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center'
  },
  alignErrorIcon: {
    marginTop: '6px',
    textAlign: 'center'
  }
})

const errorIconTheme = createTheme({
  overrides: {
    MuiSvgIcon: {
      root: {
        fill: '#D8292F'
      }
    }
  }
})

const grassCureToolTipFirstLine =
  'Grass Cure % not defined in WFWX for one or more stations.'
const genericErrorToolTipFirstLine =
  'Incomplete weather data in WFWX for one or more stations.'
const toolTipSecondLine = ' Cannot calculate Mean FIG.'

const grassCureErrorToolTipElement = (
  <div>
    {grassCureToolTipFirstLine}
    {toolTipSecondLine}
  </div>
)

const genericErrorToolTipElement = (
  <div>
    {genericErrorToolTipFirstLine}
    {toolTipSecondLine}
  </div>
)

const MeanIntensityGroupRollup = (props: MeanIntensityGroupRollupProps) => {
  const classes = useStyles()

  const stationsWithDaily = Object.entries(props.area.stations)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(([_, station]) => ({
      station,
      daily: props.dailiesMap.get(station.code)
    }))
    .filter(record => props.selectedStations.includes(record.station.code))
  const noDailyData = stationsWithDaily.every(stationDaily =>
    isUndefined(stationDaily.daily)
  )
  const grassCureError = stationsWithDaily.reduce((prev, stationDaily) => {
    return (
      prev || !isValidGrassCure(stationDaily.daily, stationDaily.station.station_props)
    )
  }, false)

  const genericError = stationsWithDaily.reduce((prev, stationDaily) => {
    return prev || stationDaily.daily?.observation_valid === false
  }, false)

  const meanIntensityGroup = calculateMeanIntensityGroup(
    props.area,
    props.dailiesMap,
    props.selectedStations
  )
  const formatAreaMeanIntensityGroupByValue = () => {
    if (meanIntensityGroup === undefined) {
      return undefined
    }
    if (meanIntensityGroup < 2) {
      return classes.intensityGroupSolid1
    }
    if (meanIntensityGroup < 3) {
      return classes.intensityGroupSolid2
    }
    if (meanIntensityGroup < 4) {
      return classes.intensityGroupSolid3
    }
    if (meanIntensityGroup < 5) {
      return classes.intensityGroupSolid4
    } else {
      return classes.intensityGroupSolid5
    }
  }

  if (grassCureError && !noDailyData) {
    return (
      <ThemeProvider theme={errorIconTheme}>
        <Tooltip
          title={grassCureErrorToolTipElement}
          aria-label={`${grassCureToolTipFirstLine} \n ${toolTipSecondLine}`}
        >
          <div className={classes.alignErrorIcon}>
            <ErrorOutlineIcon
              data-testid={`zone-${props.area.id}-mig-error`}
            ></ErrorOutlineIcon>
          </div>
        </Tooltip>
      </ThemeProvider>
    )
  }
  if (genericError && !noDailyData) {
    return (
      <ThemeProvider theme={errorIconTheme}>
        <Tooltip
          title={genericErrorToolTipElement}
          aria-label={`${genericErrorToolTipFirstLine} ${toolTipSecondLine}`}
        >
          <div className={classes.alignErrorIcon}>
            <ErrorOutlineIcon
              data-testid={`zone-${props.area.id}-mig-error`}
            ></ErrorOutlineIcon>
          </div>
        </Tooltip>
      </ThemeProvider>
    )
  } else {
    return (
      <TableCell
        className={formatAreaMeanIntensityGroupByValue()}
        data-testid={`zone-${props.area.id}-mean-intensity`}
      >
        {meanIntensityGroup}
      </TableCell>
    )
  }
}

export default React.memo(MeanIntensityGroupRollup)
