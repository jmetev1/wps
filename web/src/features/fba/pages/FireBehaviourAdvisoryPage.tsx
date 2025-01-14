import { FormControl, FormControlLabel, Grid } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import { GeneralHeader, Container, ErrorBoundary } from 'components'
import React, { useEffect, useState } from 'react'
import FBAMap from 'features/fba/components/map/FBAMap'
import FireCenterDropdown from 'components/FireCenterDropdown'
import { DateTime } from 'luxon'
import {
  selectFireZoneElevationInfo,
  selectFireCenters,
  selectHFIFuelTypes,
  selectRunDates,
  selectFireZoneAreas
} from 'app/rootReducer'
import { useDispatch, useSelector } from 'react-redux'
import { fetchFireCenters } from 'commonSlices/fireCentersSlice'
import { formControlStyles, theme } from 'app/theme'
import { fetchWxStations } from 'features/stations/slices/stationsSlice'
import { getStations, StationSource } from 'api/stationAPI'
import { FireCenter, FireZone } from 'api/fbaAPI'
import { ASA_DOC_TITLE, FIRE_BEHAVIOUR_ADVISORY_NAME, PST_UTC_OFFSET } from 'utils/constants'
import WPSDatePicker from 'components/WPSDatePicker'
import { AppDispatch } from 'app/store'
import AdvisoryThresholdSlider from 'features/fba/components/map/AdvisoryThresholdSlider'
import AdvisoryMetadata from 'features/fba/components/AdvisoryMetadata'
import { fetchSFMSRunDates } from 'features/fba/slices/runDatesSlice'
import { isNull, isUndefined } from 'lodash'
import { fetchHighHFIFuels } from 'features/fba/slices/hfiFuelTypesSlice'
import { fetchFireZoneAreas } from 'features/fba/slices/fireZoneAreasSlice'
import { fetchfireZoneElevationInfo } from 'features/fba/slices/fireZoneElevationInfoSlice'
import ZoneSummaryPanel from 'features/fba/components/ZoneSummaryPanel'

export enum RunType {
  FORECAST = 'FORECAST',
  ACTUAL = 'ACTUAL'
}

const useStyles = makeStyles(() => ({
  ...formControlStyles,
  listContainer: {
    width: 700,
    height: 700
  },
  fireCenter: {
    minWidth: 280,
    margin: theme.spacing(1)
  },
  flex: {
    display: 'flex',
    flex: 1
  },
  forecastActualDropdown: {
    minWidth: 280,
    margin: theme.spacing(1),
    marginLeft: 50
  },
  instructions: {
    textAlign: 'left'
  },
  root: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column'
  }
}))

export const FireBehaviourAdvisoryPage: React.FunctionComponent = () => {
  const classes = useStyles()
  const dispatch: AppDispatch = useDispatch()
  const { fireCenters } = useSelector(selectFireCenters)
  const { hfiThresholdsFuelTypes } = useSelector(selectHFIFuelTypes)
  const { fireZoneElevationInfo } = useSelector(selectFireZoneElevationInfo)

  const [fireCenter, setFireCenter] = useState<FireCenter | undefined>(undefined)

  const [advisoryThreshold, setAdvisoryThreshold] = useState(20)
  const [issueDate, setIssueDate] = useState<DateTime | null>(null)
  const [selectedFireZone, setSelectedFireZone] = useState<FireZone | undefined>(undefined)
  const [dateOfInterest, setDateOfInterest] = useState(
    DateTime.now().setZone(`UTC${PST_UTC_OFFSET}`).hour < 13
      ? DateTime.now().setZone(`UTC${PST_UTC_OFFSET}`)
      : DateTime.now().setZone(`UTC${PST_UTC_OFFSET}`).plus({ days: 1 })
  )
  const [runType, setRunType] = useState(RunType.FORECAST)
  const { mostRecentRunDate } = useSelector(selectRunDates)
  const { fireZoneAreas } = useSelector(selectFireZoneAreas)

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

  const updateDate = (newDate: DateTime) => {
    if (newDate !== dateOfInterest) {
      setDateOfInterest(newDate)
    }
  }

  useEffect(() => {
    dispatch(fetchSFMSRunDates(runType, dateOfInterest.toISODate()))
  }, [runType]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    dispatch(fetchFireCenters())
    dispatch(fetchSFMSRunDates(runType, dateOfInterest.toISODate()))
    dispatch(fetchWxStations(getStations, StationSource.wildfire_one))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    dispatch(fetchSFMSRunDates(runType, dateOfInterest.toISODate()))
  }, [dateOfInterest]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isNull(mostRecentRunDate) && !isUndefined(mostRecentRunDate) && !isUndefined(selectedFireZone)) {
      dispatch(
        fetchHighHFIFuels(
          runType,
          dateOfInterest.toISODate(),
          mostRecentRunDate.toString(),
          selectedFireZone.mof_fire_zone_id
        )
      )
      dispatch(
        fetchfireZoneElevationInfo(
          selectedFireZone.mof_fire_zone_id,
          runType,
          dateOfInterest.toISODate(),
          mostRecentRunDate.toString()
        )
      )
    }
  }, [mostRecentRunDate, selectedFireZone]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isNull(mostRecentRunDate) && !isUndefined(mostRecentRunDate)) {
      dispatch(fetchFireZoneAreas(runType, mostRecentRunDate.toString(), dateOfInterest.toISODate()))
      setIssueDate(DateTime.fromISO(mostRecentRunDate))
    } else {
      setIssueDate(null)
    }
  }, [mostRecentRunDate]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.title = ASA_DOC_TITLE
  }, [])

  return (
    <div className={classes.root}>
      <GeneralHeader
        isBeta={true}
        spacing={1}
        title={FIRE_BEHAVIOUR_ADVISORY_NAME}
        productName={FIRE_BEHAVIOUR_ADVISORY_NAME}
      />
      <Container sx={{ paddingTop: '0.5em' }} disableGutters maxWidth={'xl'}>
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
            <ErrorBoundary>
              <Grid item>
                <FormControl className={classes.forecastActualDropdown}>
                  <AdvisoryMetadata
                    forDate={dateOfInterest}
                    issueDate={issueDate}
                    runType={runType.toString()}
                    setRunType={setRunType}
                  />
                </FormControl>
              </Grid>
            </ErrorBoundary>
            <Grid item>
              <FormControl className={classes.formControl}>
                <FormControlLabel
                  label="
                Advisory HFI Threshold of combustible area"
                  labelPlacement="top"
                  control={
                    <AdvisoryThresholdSlider
                      advisoryThreshold={advisoryThreshold}
                      setAdvisoryThreshold={setAdvisoryThreshold}
                    />
                  }
                />
              </FormControl>
            </Grid>
          </Grid>
        </Grid>
      </Container>
      <Container className={classes.flex} disableGutters maxWidth={'xl'}>
        <Grid className={classes.flex} container direction={'row'}>
          <Grid item>
            <ZoneSummaryPanel
              selectedFireZone={selectedFireZone}
              fuelTypeInfo={hfiThresholdsFuelTypes}
              hfiElevationInfo={fireZoneElevationInfo}
              fireZoneAreas={fireZoneAreas}
            />
          </Grid>
          <Grid className={classes.flex} item>
            <FBAMap
              forDate={dateOfInterest}
              runDate={mostRecentRunDate !== null ? DateTime.fromISO(mostRecentRunDate) : dateOfInterest}
              runType={runType}
              selectedFireZone={selectedFireZone}
              selectedFireCenter={fireCenter}
              advisoryThreshold={advisoryThreshold}
              className={classes.flex}
              setIssueDate={setIssueDate}
              setSelectedFireZone={setSelectedFireZone}
              fireZoneAreas={fireZoneAreas}
            />
          </Grid>
        </Grid>
      </Container>
    </div>
  )
}

export default React.memo(FireBehaviourAdvisoryPage)
