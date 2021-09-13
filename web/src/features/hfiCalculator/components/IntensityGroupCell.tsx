import { makeStyles, TableCell } from '@material-ui/core'
import { intensityGroupColours } from 'features/hfiCalculator/components/meanIntensity'
import React from 'react'

export interface IntensityGroupCellProps {
  testid: string | undefined
  value: number | undefined
  error: boolean
}

const useStyles = makeStyles({
  intensityGroupOutline1: {
    border: '2px solid',
    borderColor: intensityGroupColours.lightGreen,
    borderRadius: '4px',
    textAlign: 'center'
  },
  intensityGroupOutline2: {
    border: '2px solid',
    borderColor: intensityGroupColours.cyan,
    borderRadius: '4px',
    textAlign: 'center'
  },
  intensityGroupOutline3: {
    border: '2px solid',
    borderColor: intensityGroupColours.yellow,
    borderRadius: '4px',
    textAlign: 'center'
  },
  intensityGroupOutline4: {
    border: '2px solid',
    borderColor: intensityGroupColours.orange,
    borderRadius: '4px',
    textAlign: 'center'
  },
  intensityGroupOutline5: {
    border: '2px solid',
    borderColor: intensityGroupColours.red,
    borderRadius: '4px',
    textAlign: 'center'
  }
})

const IntensityGroupCell = (props: IntensityGroupCellProps) => {
  const classes = useStyles()
  const formatStationIntensityGroupByValue = () => {
    if (props.error) {
      return
    }
    switch (props.value) {
      case 1:
        return classes.intensityGroupOutline1
      case 2:
        return classes.intensityGroupOutline2
      case 3:
        return classes.intensityGroupOutline3
      case 4:
        return classes.intensityGroupOutline4
      case 5:
        return classes.intensityGroupOutline5
      default:
        return
    }
  }

  return (
    <TableCell
      className={formatStationIntensityGroupByValue()}
      data-testid={props.testid}
    >
      {props.error ? '' : props.value}
    </TableCell>
  )
}

export default React.memo(IntensityGroupCell)