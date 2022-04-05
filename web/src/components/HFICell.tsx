import { makeStyles, TableCell } from '@material-ui/core'
import React from 'react'
import FixedDecimalNumberCell from 'features/fbaCalculator/components/FixedDecimalNumberCell'
import { isUndefined } from 'lodash'

interface HFICellProps {
  value: number | undefined
  testId?: string
  className?: string
}

const useStyles = makeStyles({
  dataRow: {
    height: '40px',
    paddingLeft: '8px',
    paddingRight: '8px'
  },
  orangeBorder: {
    border: 'solid 3px #FFC464',
    height: '40px',
    paddingLeft: '8px',
    paddingRight: '8px'
  },
  orangeFill: {
    backgroundColor: '#FFC464',
    height: '40px',
    paddingLeft: '8px',
    paddingRight: '8px'
  },
  redFill: {
    backgroundColor: '#FF6259',
    height: '40px',
    paddingLeft: '8px',
    paddingRight: '8px'
  }
})

const HFICell = (props: HFICellProps) => {
  const classes = useStyles()

  const getHFIStyle = (value: number | undefined): string => {
    if (value !== undefined) {
      if (value >= 3000 && value <= 3999) {
        return classes.orangeBorder
      } else if (value > 3999 && value <= 9999) {
        return classes.orangeFill
      } else if (value > 9999) {
        return classes.redFill
      }
    }
    return classes.dataRow
  }

  const hfiStyle = getHFIStyle(props.value)

  if (isUndefined(props.value) || isNaN(props.value)) {
    return (
      <TableCell
        data-testid={props.testId}
        className={props.className ? props.className : classes.dataRow}
      ></TableCell>
    )
  }

  return (
    <FixedDecimalNumberCell
      testId={props.testId}
      className={hfiStyle}
      value={props.value}
    />
  )
}

export default React.memo(HFICell)