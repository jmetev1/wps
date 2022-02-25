import React, { useState, useEffect } from 'react'
import { Container, ErrorBoundary, GeneralHeader } from 'components'
import { fetchHFIStations } from 'features/hfiCalculator/slices/stationsSlice'
import {
  FireStarts,
  setSelectedFireCentre,
  fetchHFIResult,
  setSelectedPrepDate,
  setSaved
} from 'features/hfiCalculator/slices/hfiCalculatorSlice'
import { useDispatch, useSelector } from 'react-redux'
import { DateTime } from 'luxon'
import {
  selectHFIStations,
  selectHFIStationsLoading,
  selectHFICalculatorState
} from 'app/rootReducer'
import { CircularProgress, FormControl, makeStyles } from '@material-ui/core'
import { getDateRange, pstFormatter } from 'utils/date'
import ViewSwitcher from 'features/hfiCalculator/components/ViewSwitcher'
import SaveButton from 'features/hfiCalculator/components/SaveButton'
import ViewSwitcherToggles from 'features/hfiCalculator/components/ViewSwitcherToggles'
import LastUpdatedHeader from 'features/hfiCalculator/components/LastUpdatedHeader'
import { formControlStyles, theme } from 'app/theme'
import { PST_UTC_OFFSET, PST_ISO_TIMEZONE } from 'utils/constants'
import PrepDaysDropdown from 'features/hfiCalculator/components/PrepDaysDropdown'
import { FireCentre } from 'api/hfiCalcAPI'
import { HFIPageSubHeader } from 'features/hfiCalculator/components/HFIPageSubHeader'
import { cloneDeep, isNull, isUndefined, union } from 'lodash'
import HFIErrorAlert from 'features/hfiCalculator/components/HFIErrorAlert'

const useStyles = makeStyles(() => ({
  ...formControlStyles,
  container: {
    display: 'flex',
    justifyContent: 'center'
  },
  helpIcon: {
    fill: theme.palette.primary.main
  },
  copyToClipboardInfoIcon: {
    marginLeft: '3px'
  },
  clipboardIcon: {
    marginRight: '3px'
  },
  aboutButtonText: {
    color: theme.palette.primary.main,
    textDecoration: 'underline',
    fontWeight: 'bold'
  },
  positionStyler: {
    position: 'absolute',
    right: '20px'
  },
  prepDays: {
    margin: theme.spacing(1),
    minWidth: 100
  },
  saveButton: {
    margin: theme.spacing(1),
    float: 'right'
    // TODO: figure out vertical alignment
  }
}))

const HfiCalculatorPage: React.FunctionComponent = () => {
  const classes = useStyles()

  const dispatch = useDispatch()
  const { fireCentres, error: fireCentresError } = useSelector(selectHFIStations)
  const stationDataLoading = useSelector(selectHFIStationsLoading)
  const { numPrepDays, selectedPrepDate, result, selectedFireCentre, loading, saved } =
    useSelector(selectHFICalculatorState)

  const prepareSelectedPrepDate = (selectedPrepDate: string): Date | undefined => {
    if (selectedPrepDate == '' || isNull(selectedPrepDate)) {
      return undefined
    }
    return DateTime.fromISO(selectedPrepDate).toJSDate()
  }

  const setNumPrepDays = (numDays: number) => {
    // if the number of prep days change, we need to unset the selected prep day - it
    // could be that the selected prep day no longer falls into the prep period.
    if (!isUndefined(result)) {
      dispatch(setSelectedPrepDate(''))
      dispatch(setSaved(false))
      const newEndDate = DateTime.fromISO(result.start_date + PST_ISO_TIMEZONE)
        .plus({ days: numDays })
        .toJSDate()
      console.log('dispatch fetchHFIResult, due to setNumPrepDays.')
      dispatch(
        fetchHFIResult({
          selected_station_code_ids: result.selected_station_code_ids,
          selected_fire_center_id: result.selected_fire_center_id,
          planning_area_fire_starts: result.planning_area_fire_starts,
          selected_prep_date: prepareSelectedPrepDate(selectedPrepDate),
          start_date: result.start_date,
          end_date: newEndDate.toISOString().split('T')[0]
        })
      )
    }
  }

  const setSelected = (newSelected: number[]) => {
    if (!isUndefined(result)) {
      dispatch(setSaved(false))
      console.log('dispatch fetchHFIResult, due to setSelected.')
      dispatch(
        fetchHFIResult({
          selected_station_code_ids: newSelected,
          selected_fire_center_id: result.selected_fire_center_id,
          planning_area_fire_starts: result.planning_area_fire_starts,
          selected_prep_date: prepareSelectedPrepDate(selectedPrepDate),
          start_date: result.start_date,
          end_date: result.end_date
        })
      )
    }
  }

  const setNewFireStarts = (
    areaId: number,
    dayOffset: number,
    newFireStarts: FireStarts
  ) => {
    if (!isUndefined(result)) {
      const newPlanningAreaFireStarts = cloneDeep(result.planning_area_fire_starts)
      newPlanningAreaFireStarts[areaId][dayOffset] = { ...newFireStarts }
      dispatch(setSaved(false))
      console.log('dispatch fetchHFIResult, due to setNewFireStarts.')
      dispatch(
        fetchHFIResult({
          selected_station_code_ids: result.selected_station_code_ids,
          selected_fire_center_id: result.selected_fire_center_id,
          planning_area_fire_starts: newPlanningAreaFireStarts,
          selected_prep_date: prepareSelectedPrepDate(selectedPrepDate),
          start_date: result.start_date,
          end_date: result.end_date
        })
      )
    }
  }

  const getBrowserCurrentDate = () => {
    return pstFormatter(DateTime.now().setZone(`UTC${PST_UTC_OFFSET}`))
  }

  const getTheDate = () => {
    if (isUndefined(result)) {
      // No result! Grab the current date.
      return getBrowserCurrentDate()
    }
    if (isUndefined(result.selected_prep_date)) {
      // Result didn't come with prep date.
      return ''
    }
    // Convert string to date object.
    return pstFormatter(result.selected_prep_date)
  }

  // the DatePicker component requires dateOfInterest to be in string format
  const [dateOfInterest, setDateOfInterest] = useState(getTheDate())

  const updateDate = (newDate: string) => {
    if (
      newDate !== dateOfInterest &&
      !isUndefined(selectedFireCentre) &&
      !isUndefined(result)
    ) {
      setDateOfInterest(newDate)
      const { start, end } = getDateRange(true, newDate)
      dispatch(setSaved(false))
      dispatch(
        fetchHFIResult({
          selected_station_code_ids: result.selected_station_code_ids,
          selected_fire_center_id: result.selected_fire_center_id,
          planning_area_fire_starts: result.planning_area_fire_starts,
          selected_prep_date: prepareSelectedPrepDate(selectedPrepDate),
          start_date: start.toISODate(),
          end_date: end.toISODate()
        })
      )
    }
  }

  const setSelectedFireCentreFromLocalStorage = () => {
    const findCentre = (name: string | null): FireCentre | undefined => {
      const fireCentresArray = Object.values(fireCentres)
      return fireCentresArray.find(centre => centre.name == name)
    }
    const storedFireCentre = findCentre(
      localStorage.getItem('hfiCalcPreferredFireCentre')
    )
    if (!isUndefined(storedFireCentre) && storedFireCentre !== selectedFireCentre) {
      dispatch(setSelectedFireCentre(storedFireCentre))
    }
  }

  useEffect(() => {
    dispatch(fetchHFIStations())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (
      selectedFireCentre &&
      selectedFireCentre?.name !== localStorage.getItem('hfiCalcPreferredFireCentre')
    ) {
      localStorage.setItem('hfiCalcPreferredFireCentre', selectedFireCentre?.name)
    }
    if (!isUndefined(selectedFireCentre)) {
      const stationCodes = selectedFireCentre.planning_areas.flatMap(area =>
        area.stations.map(station => station.code)
      )
      console.log('dispatch fetchHFIResult, due to selectedFireCentre change.')
      dispatch(
        fetchHFIResult({
          start_date: undefined,
          end_date: undefined,
          selected_station_code_ids: stationCodes,
          selected_fire_center_id: selectedFireCentre.id,
          planning_area_fire_starts: {}
        })
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFireCentre])

  useEffect(() => {
    if (Object.keys(fireCentres).length > 0) {
      setSelectedFireCentreFromLocalStorage()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fireCentres])

  useEffect(() => {
    if (!isUndefined(result)) {
      setDateOfInterest(result.start_date + 'T00:00-08:00')
    }
  }, [result, result?.start_date])

  const selectNewFireCentre = (newSelection: FireCentre | undefined) => {
    dispatch(setSelectedFireCentre(newSelection))
  }

  const handleSaveClicked = () => {
    dispatch(setSaved(true)) // TODO: remove this, we'll set state based on the response.
    if (!isUndefined(result)) {
      console.log('dispatch fetchHFIResult, due to handleSaveClicked change.')
      dispatch(
        fetchHFIResult({
          selected_station_code_ids: result.selected_station_code_ids,
          selected_fire_center_id: result.selected_fire_center_id,
          planning_area_fire_starts: result.planning_area_fire_starts,
          selected_prep_date: prepareSelectedPrepDate(selectedPrepDate),
          start_date: result.start_date,
          end_date: result.end_date,
          save: true
        })
      )
    }
  }

  return (
    <main data-testid="hfi-calculator-page">
      <GeneralHeader
        padding="3em"
        spacing={0.985}
        title="HFI Calculator"
        productName="HFI Calculator"
      />
      <HFIPageSubHeader
        fireCentres={fireCentres}
        dateOfInterest={dateOfInterest}
        updateDate={updateDate}
        selectedFireCentre={selectedFireCentre}
        selectNewFireCentre={selectNewFireCentre}
        padding="1rem"
      />
      {loading || stationDataLoading || isUndefined(result) ? (
        <Container className={classes.container}>
          <CircularProgress />
        </Container>
      ) : (
        <React.Fragment>
          <Container maxWidth={'xl'}>
            {!isNull(fireCentresError) && (
              <HFIErrorAlert hfiDailiesError={null} fireCentresError={fireCentresError} />
            )}
            <LastUpdatedHeader
              dailies={result?.planning_area_hfi_results.flatMap(areaResult =>
                areaResult.daily_results.flatMap(dailyResult =>
                  dailyResult.dailies.map(validatedDaily => validatedDaily.daily)
                )
              )}
            />
            <FormControl className={classes.prepDays}>
              <PrepDaysDropdown days={numPrepDays} setNumPrepDays={setNumPrepDays} />
            </FormControl>

            <FormControl className={classes.formControl}>
              <ViewSwitcherToggles dateOfInterest={dateOfInterest} />
            </FormControl>

            <FormControl className={classes.saveButton}>
              <SaveButton saved={saved} onClick={handleSaveClicked} />
            </FormControl>

            <ErrorBoundary>
              <ViewSwitcher
                selectedFireCentre={selectedFireCentre}
                dateOfInterest={dateOfInterest}
                result={result}
                setSelected={setSelected}
                setNewFireStarts={setNewFireStarts}
                selectedPrepDay={selectedPrepDate}
              />
            </ErrorBoundary>
          </Container>
        </React.Fragment>
      )}
    </main>
  )
}

export default React.memo(HfiCalculatorPage)
