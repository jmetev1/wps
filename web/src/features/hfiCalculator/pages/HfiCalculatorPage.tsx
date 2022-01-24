import React, { useState, useEffect } from 'react'
import { Button, Container, ErrorBoundary, GeneralHeader, PageTitle } from 'components'
import { fetchHFIStations } from 'features/hfiCalculator/slices/stationsSlice'
import { fetchHFIDailies } from 'features/hfiCalculator/slices/hfiCalculatorSlice'
import { useDispatch, useSelector } from 'react-redux'
import { DateTime } from 'luxon'
import {
  selectHFIDailies,
  selectHFIStations,
  selectHFIStationsLoading,
  selectHFIPrepDays
} from 'app/rootReducer'
import { CircularProgress, FormControl, makeStyles, Tooltip } from '@material-ui/core'
import {
  FileCopyOutlined,
  CheckOutlined,
  InfoOutlined,
  HelpOutlineOutlined
} from '@material-ui/icons'
import { getDateRange, pstFormatter } from 'utils/date'
import ViewSwitcher from 'features/hfiCalculator/components/ViewSwitcher'
import ViewSwitcherToggles from 'features/hfiCalculator/components/ViewSwitcherToggles'
import { formControlStyles, theme } from 'app/theme'
import { AboutDataModal } from 'features/hfiCalculator/components/AboutDataModal'
import { FormatTableAsCSV } from 'features/hfiCalculator/FormatTableAsCSV'
import { PST_UTC_OFFSET } from 'utils/constants'
import PrepDaysDropdown from 'features/hfiCalculator/components/PrepDaysDropdown'
import { setPrepDays } from 'features/hfiCalculator/slices/hfiPrepSlice'
import { getDailiesForCSV } from 'features/hfiCalculator/util'
import DatePicker from 'components/DatePicker'
import { FireCentre } from 'api/hfiCalcAPI'
import { isUndefined } from 'lodash'
import FireCentreDropdown from 'features/hfiCalculator/components/FireCentreDropdown'

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
  }
}))

const clipboardCopySuccessDuration = 2000 // milliseconds

const HfiCalculatorPage: React.FunctionComponent = () => {
  const classes = useStyles()

  const dispatch = useDispatch()
  const { dailies, loading } = useSelector(selectHFIDailies)
  const { fireCentres } = useSelector(selectHFIStations)
  const stationDataLoading = useSelector(selectHFIStationsLoading)
  const [selectedPrepDay, setSelectedPrepDay] = useState<DateTime | null>(null)
  const [isWeeklyView, setIsWeeklyView] = useState<boolean>(selectedPrepDay == null)
  const numPrepDays = useSelector(selectHFIPrepDays)
  const setNumPrepDays = (numDays: number) => {
    // if the number of prep days change, we need to unset the selected prep day - it
    // could be that the selected prep day no longer falls into the prep period.
    setSelectedPrepDay(null)
    dispatch(setPrepDays(numDays))
  }
  const [modalOpen, setModalOpen] = useState<boolean>(false)

  // the DatePicker component requires dateOfInterest to be in string format
  const [dateOfInterest, setDateOfInterest] = useState(
    pstFormatter(DateTime.now().setZone(`UTC${PST_UTC_OFFSET}`))
  )
  const [isCopied, setIsCopied] = useState(false)

  const [selectedFireCentre, setSelectedFireCentre] = useState<FireCentre | undefined>(
    undefined
  )

  const callDispatchHFIDailies = (start: DateTime, end: DateTime) => {
    if (!isUndefined(selectedFireCentre)) {
      dispatch(
        fetchHFIDailies(
          start.toUTC().valueOf(),
          end.toUTC().valueOf(),
          getAllPlanningWeatherStationCodesFromFireCentre(selectedFireCentre)
        )
      )
    }
  }

  const refreshView = () => {
    const { start, end } = getDateRange(isWeeklyView, dateOfInterest)
    callDispatchHFIDailies(start, end)
  }

  const updateDate = (newDate: string) => {
    if (newDate !== dateOfInterest) {
      setDateOfInterest(newDate)
      const { start, end } = getDateRange(true, newDate)
      setSelectedPrepDay(null)
      callDispatchHFIDailies(start, end)
    }
  }

  const openAboutModal = () => {
    setModalOpen(true)
  }

  const getAllPlanningWeatherStationCodesFromFireCentre = (
    centre: FireCentre | undefined
  ): number[] => {
    const stationCodes: number[] = []
    if (isUndefined(centre)) {
      return stationCodes
    }
    for (const area of Object.values(centre.planning_areas)) {
      for (const station of Object.values(area.stations)) {
        stationCodes.push(station.code)
      }
    }
    return stationCodes
  }

  const copyTable = () => {
    if (isWeeklyView) {
      const weeklyViewAsString = FormatTableAsCSV.exportWeeklyRowsAsStrings(
        numPrepDays,
        fireCentres,
        getDailiesForCSV(numPrepDays, dailies)
      )
      navigator.clipboard.writeText(weeklyViewAsString)
    } else {
      const dailyViewAsString = FormatTableAsCSV.exportDailyRowsAsStrings(
        numPrepDays,
        fireCentres,
        dailies
      )
      navigator.clipboard.writeText(dailyViewAsString)
    }
    setIsCopied(true)
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
      setSelectedFireCentre(storedFireCentre)
    }
  }

  useEffect(() => {
    /**  this logic is copied from
     https://github.com/danoc/react-use-clipboard/blob/master/src/index.tsx 
     (the react-use-clipboard package was too restrictive for our needs, but the logic for
      having a timeout on the copy success message is helpful for us)
    */
    if (isCopied) {
      const id = setTimeout(() => {
        setIsCopied(false)
      }, clipboardCopySuccessDuration)

      return () => {
        clearTimeout(id)
      }
    }
  }, [isCopied])

  useEffect(() => {
    dispatch(fetchHFIStations())
    refreshView()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setIsWeeklyView(selectedPrepDay == null)
  }, [selectedPrepDay])

  useEffect(() => {
    if (
      selectedFireCentre &&
      selectedFireCentre?.name !== localStorage.getItem('hfiCalcPreferredFireCentre')
    ) {
      localStorage.setItem('hfiCalcPreferredFireCentre', selectedFireCentre?.name)
    }
    const { start, end } = getDateRange(isWeeklyView, dateOfInterest)
    if (!isUndefined(selectedFireCentre)) {
      dispatch(
        fetchHFIDailies(
          start.toUTC().valueOf(),
          end.toUTC().valueOf(),
          getAllPlanningWeatherStationCodesFromFireCentre(selectedFireCentre)
        )
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

  return (
    <main data-testid="hfi-calculator-page">
      <GeneralHeader
        padding="3em"
        spacing={0.985}
        title="Predictive Services Unit"
        productName="HFI Calculator"
      />
      <PageTitle maxWidth={false} padding="1rem" title="HFI Calculator" />
      {loading || stationDataLoading ? (
        <Container className={classes.container}>
          <CircularProgress />
        </Container>
      ) : (
        <Container maxWidth={'xl'}>
          <FormControl className={classes.prepDays}>
            <PrepDaysDropdown days={numPrepDays} setNumPrepDays={setNumPrepDays} />
          </FormControl>
          <FormControl className={classes.formControl}>
            <FireCentreDropdown
              fireCentres={fireCentres}
              selectedValue={
                isUndefined(selectedFireCentre)
                  ? null
                  : { name: selectedFireCentre?.name }
              }
              onChange={setSelectedFireCentre}
            />
          </FormControl>

          <FormControl className={classes.formControl}>
            <DatePicker date={dateOfInterest} updateDate={updateDate} />
          </FormControl>
          <FormControl className={classes.formControl}>
            <ViewSwitcherToggles
              setSelectedPrepDay={setSelectedPrepDay}
              selectedPrepDay={selectedPrepDay}
              dateOfInterest={dateOfInterest}
            />
          </FormControl>
          <FormControl className={classes.formControl}>
            {isCopied ? (
              <Button>
                <CheckOutlined />
                Copied!
              </Button>
            ) : (
              <Button onClick={copyTable}>
                <FileCopyOutlined className={classes.clipboardIcon} />
                Copy Data to Clipboard
                <Tooltip
                  title={
                    'You can paste all table data in Excel. To format: go to the Data tab, use Text to Columns > Delimited > Comma.'
                  }
                >
                  <InfoOutlined className={classes.copyToClipboardInfoIcon} />
                </Tooltip>
              </Button>
            )}
          </FormControl>

          <FormControl className={classes.positionStyler}>
            <Button onClick={openAboutModal}>
              <HelpOutlineOutlined className={classes.helpIcon}></HelpOutlineOutlined>
              <p className={classes.aboutButtonText}>About this data</p>
            </Button>
          </FormControl>
          <AboutDataModal
            modalOpen={modalOpen}
            setModalOpen={setModalOpen}
          ></AboutDataModal>

          <ErrorBoundary>
            <ViewSwitcher
              selectedFireCentre={selectedFireCentre}
              dailies={dailies}
              dateOfInterest={dateOfInterest}
              selectedPrepDay={selectedPrepDay}
            />
          </ErrorBoundary>
        </Container>
      )}
    </main>
  )
}

export default React.memo(HfiCalculatorPage)
