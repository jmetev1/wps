import React from 'react'
import { InputLabel, Slider } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'

const useStyles = makeStyles({
  root: {
    marginTop: 20
  },
  inputLabel: {
    marginBottom: 5
  },
  slider: {
    width: 300
  }
})

interface Props {
  timeRange: number
  onYearRangeChange: (yearRangeNumber: number) => void
}

export const earliestYearAvailableForCalculation = 1970
export const yearWhenTheCalculationIsDone = 2020

const MIN_YEARS = 0
const MAX_YEARS = yearWhenTheCalculationIsDone - earliestYearAvailableForCalculation

const TIME_RANGE_OPTIONS = [
  {
    value: MIN_YEARS,
    label: '0'
  },
  {
    value: 10,
    label: '10'
  },
  {
    value: 20,
    label: '20'
  },
  {
    value: MAX_YEARS,
    label: 'Full'
  }
]

export const TimeRangeSlider: React.FunctionComponent<Props> = (props: Props) => {
  const classes = useStyles()

  return (
    <div className={classes.root} data-testid="time-range-slider">
      <InputLabel className={classes.inputLabel}>Time Range (years)</InputLabel>
      <Slider
        className={classes.slider}
        aria-label="Time Range"
        marks={TIME_RANGE_OPTIONS}
        max={MAX_YEARS}
        min={MIN_YEARS}
        onChange={(_, timeRange) => {
          if (typeof timeRange === 'number') {
            if (timeRange === 0) return
            props.onYearRangeChange(timeRange)
          }
        }}
        step={null}
        value={props.timeRange}
      />
    </div>
  )
}
