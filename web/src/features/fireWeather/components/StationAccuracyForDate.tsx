import React from 'react'
import makeStyles from '@mui/styles/makeStyles'
import { CircularProgress } from '@mui/material'
import { useSelector } from 'react-redux'
import { selectFireWeatherStationsLoading } from 'app/rootReducer'

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    height: '70px',
    flexDirection: 'column',
    padding: '5px'
  },
  title: {
    fontSize: '0.875rem',
    height: '20px',
    width: '205px',
    color: 'white'
  },
  time: {
    fontSize: '0.875rem',
    height: '20px',
    width: '205px',
    color: 'white',
    textAlign: 'center'
  },
  rowContainer: {
    display: 'flex',
    flexDirection: 'row',
    width: '300px',
    justifyContent: 'flex-start'
  },
  spinner: {
    color: theme.palette.primary.light
  }
}))

interface Props {
  toiFromQuery: string
}

const StationAccuracyForDate = (props: Props) => {
  const classes = useStyles()
  const isLoading = useSelector(selectFireWeatherStationsLoading)

  return (
    <div className={classes.root}>
      {isLoading ? (
        <CircularProgress />
      ) : (
        <div>
          <div className={classes.rowContainer}>
            <div className={classes.title}>Stations forecast accuracy for:</div>
          </div>
          <div className={classes.rowContainer} data-testid="station-forecast-accuracy-for-date">
            <div className={classes.time}>{props.toiFromQuery.slice(0, 10)}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(StationAccuracyForDate)
