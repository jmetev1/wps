import { FormControl, Grid } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import { GeneralHeader, Container } from 'components'
import React, { useEffect, useState } from 'react'
import FBAMap from 'features/fba/components/FBAMap'
import FireCenterDropdown from 'features/fbaCalculator/components/FireCenterDropdown'
import { DateTime } from 'luxon'
import { selectFireCenters } from 'app/rootReducer'
import { useDispatch, useSelector } from 'react-redux'
import { fetchFireCenters } from 'features/fbaCalculator/slices/fireCentersSlice'
import { formControlStyles, theme } from 'app/theme'
import { fetchWxStations } from 'features/stations/slices/stationsSlice'
import { getStations, StationSource } from 'api/stationAPI'
import { FireCenter } from 'api/fbaAPI'
import { PST_UTC_OFFSET } from 'utils/constants'
import WPSDatePicker from 'components/WPSDatePicker'
import { AppDispatch } from 'app/store'
import { fetchFireZoneAreas } from 'features/fba/slices/fireZoneAreasSlice'

const useStyles = makeStyles(() => ({
  ...formControlStyles,
  listContainer: {
    width: 700,
    height: 700
  },
  mapContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute'
  },
  fireCenter: {
    minWidth: 280,
    margin: theme.spacing(1)
  },
  instructions: {
    textAlign: 'left'
  }
}))

export const FireBehaviourAdvisoryPage: React.FunctionComponent = () => {
  const classes = useStyles()
  const dispatch: AppDispatch = useDispatch()
  const { fireCenters } = useSelector(selectFireCenters)

  const [fireCenter, setFireCenter] = useState<FireCenter | undefined>(undefined)

  useEffect(() => {
    const findCenter = (id: string | null): FireCenter | undefined => {
      return fireCenters.find(center => center.id.toString() == id)
    }
    setFireCenter(findCenter(localStorage.getItem('preferredFireCenter')))
  }, [fireCenters])

  useEffect(() => {
    if (fireCenter?.id) {
      localStorage.setItem('preferredFireCenter', fireCenter?.id.toString())
    }
  }, [fireCenter])

  const [dateOfInterest, setDateOfInterest] = useState(DateTime.now().setZone(`UTC${PST_UTC_OFFSET}`))

  const updateDate = (newDate: DateTime) => {
    if (newDate !== dateOfInterest) {
      setDateOfInterest(newDate)
    }
  }

  useEffect(() => {
    dispatch(fetchFireCenters())
    dispatch(fetchFireZoneAreas(dateOfInterest.toISODate()))
    dispatch(fetchWxStations(getStations, StationSource.wildfire_one))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    dispatch(fetchFireZoneAreas(dateOfInterest.toISODate()))
  }, [dateOfInterest]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <React.Fragment>
      <GeneralHeader spacing={1} title="Predictive Services Unit" productName="Fire Behaviour Advisory Tool" />
      <Container maxWidth={'xl'}>
        <Grid container direction={'row'}>
          <Grid container spacing={1}>
            <Grid item>
              <FormControl className={classes.formControl}>
                <WPSDatePicker date={dateOfInterest} updateDate={updateDate} />
              </FormControl>
            </Grid>
            <Grid item xs={2}>
              <FormControl className={classes.fireCenter}>
                <FireCenterDropdown
                  fireCenterOptions={fireCenters}
                  selectedFireCenter={fireCenter}
                  setSelectedFireCenter={setFireCenter}
                />
              </FormControl>
            </Grid>
          </Grid>
        </Grid>
      </Container>
      <FBAMap date={dateOfInterest} selectedFireCenter={fireCenter} className={classes.mapContainer} />
    </React.Fragment>
  )
}

export default React.memo(FireBehaviourAdvisoryPage)
