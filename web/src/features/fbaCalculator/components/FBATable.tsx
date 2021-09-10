import React, { useEffect, useState } from 'react'
import { difference, filter, findIndex, isEmpty, isUndefined } from 'lodash'
import {
  FormControl,
  makeStyles,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow
} from '@material-ui/core'
import GetAppIcon from '@material-ui/icons/GetApp'
import { CsvBuilder } from 'filefy'
import { Button, ErrorBoundary } from 'components'
import { FBAStation } from 'api/fbaCalcAPI'
import WeatherStationCell from 'features/fbaCalculator/components/WeatherStationCell'
import FuelTypeCell from 'features/fbaCalculator/components/FuelTypeCell'
import GrassCureCell from 'features/fbaCalculator/components/GrassCureCell'
import WindSpeedCell from 'features/fbaCalculator/components/WindSpeedCell'
import { Order } from 'utils/table'
import { FBATableRow, RowManager, SortByColumn } from 'features/fbaCalculator/RowManager'
import { GeoJsonStation, getStations, StationSource } from 'api/stationAPI'
import { selectFireWeatherStations, selectFireBehaviourCalcResult } from 'app/rootReducer'
import { FuelTypes } from 'features/fbaCalculator/fuelTypes'
import { fetchFireBehaviourStations } from 'features/fbaCalculator/slices/fbaCalculatorSlice'
import {
  getRowsFromUrlParams,
  getNextRowIdFromRows,
  getUrlParamsFromRows
} from 'features/fbaCalculator/utils'
import { fetchWxStations } from 'features/stations/slices/stationsSlice'
import { DateTime } from 'luxon'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useHistory } from 'react-router-dom'
import DatePicker from 'features/fbaCalculator/components/DatePicker'
import assert from 'assert'
import { rowShouldUpdate, isWindSpeedInvalid } from 'features/fbaCalculator/validation'
import TextDisplayCell from 'features/fbaCalculator/components/TextDisplayCell'
import FixedDecimalNumberCell from 'features/fbaCalculator/components/FixedDecimalNumberCell'
import HFICell from 'features/fbaCalculator/components/HFICell'
import CrownFractionBurnedCell from 'features/fbaCalculator/components/CrownFractionBurnedCell'
import CriticalHoursCell from 'features/fbaCalculator/components/CriticalHoursCell'
import StatusCell from 'features/fbaCalculator/components/StatusCell'
import ErrorAlert from 'features/fbaCalculator/components/ErrorAlert'
import LoadingIndicatorCell from 'features/fbaCalculator/components/LoadingIndicatorCell'
import SelectionCell from 'features/fbaCalculator/components/SelectionCell'
import StickyCell from 'features/fbaCalculator/components/StickyCell'
import FBATableHead from 'features/fbaCalculator/components/FBATableHead'

export interface FBAInputGridProps {
  testId?: string
}

export interface GridMenuOption {
  label: string
  value: string
}

export interface FBAInputRow {
  id: number
  weatherStation: string | undefined
  fuelType: string | undefined
  grassCure: number | undefined
  windSpeed: number | undefined
}

const useStyles = makeStyles(theme => ({
  display: {
    paddingBottom: 12,

    '& .MuiTableCell-sizeSmall': {
      padding: '6px 6px 6px 6px',
      height: '40px'
    },

    '& .MuiTableCell-stickyHeader': {
      padding: '8px'
    },

    '& .MuiInputBase-root': {
      fontSize: '1em'
    },

    '& .MuiOutlinedInput-root': {
      padding: '0'
    }
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 210
  },
  weatherStation: {
    minWidth: 220
  },
  fuelType: {
    minWidth: 220
  },
  grassCure: {
    width: 80
  },
  paper: {
    width: '100%'
  },
  tableContainer: {
    maxHeight: 600,
    maxWidth: 1900
  },
  adjustedValueCell: {
    fontWeight: 'bold',
    color: '#460270'
  },
  dataRow: {
    height: '40px',
    paddingLeft: '8px',
    paddingRight: '8px'
  },
  stickyProgress: {
    left: 0,
    position: 'sticky',
    zIndex: theme.zIndex.appBar + 2
  }
}))

const FBATable = (props: FBAInputGridProps) => {
  const classes = useStyles()
  const history = useHistory()
  const location = useLocation()
  const dispatch = useDispatch()

  const [headerSelected, setHeaderSelect] = useState<boolean>(false)
  const [dateOfInterest, setDateOfInterest] = useState(DateTime.now().toISODate())
  const [rowIdsToUpdate, setRowIdsToUpdate] = useState<Set<number>>(new Set())
  const [sortByColumn, setSortByColumn] = useState<SortByColumn>(SortByColumn.Station)
  const [initialLoad, setInitialLoad] = useState<boolean>(true)
  const [selected, setSelected] = useState<number[]>([])
  const [order, setOrder] = useState<Order>('desc')
  const [rows, setRows] = useState<FBATableRow[]>([])
  const { stations, error: stationsError } = useSelector(selectFireWeatherStations)
  const { fireBehaviourResultStations, loading, error: fbaResultsError } = useSelector(
    selectFireBehaviourCalcResult
  )
  const [calculatedResults, setCalculatedResults] = useState<FBAStation[]>(
    fireBehaviourResultStations
  )

  const rowsFromQuery = getRowsFromUrlParams(location.search)

  const stationMenuOptions: GridMenuOption[] = (stations as GeoJsonStation[]).map(
    station => ({
      value: String(station.properties.code),
      label: `${station.properties.name} (${station.properties.code})`
    })
  )

  const fuelTypeMenuOptions: GridMenuOption[] = Object.entries(FuelTypes.get()).map(
    ([key, value]) => ({
      value: key,
      label: value.friendlyName
    })
  )

  useEffect(() => {
    dispatch(fetchWxStations(getStations, StationSource.wildfire_one))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (stations.length > 0) {
      const stationCodeMap = new Map(
        stationMenuOptions.map(station => [station.value, station.label])
      )

      const sortedRows = RowManager.sortRows(
        sortByColumn,
        order,
        rowsFromQuery.map(inputRow => ({
          ...RowManager.buildFBATableRow(inputRow, stationCodeMap)
        }))
      )
      setRows(sortedRows)
      dispatch(fetchFireBehaviourStations(dateOfInterest, sortedRows))
    }
  }, [stations]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (stations.length > 0) {
      const rowsToUpdate = rows.filter(row => rowIdsToUpdate.has(row.id))
      if (!isEmpty(rowsToUpdate)) {
        dispatch(fetchFireBehaviourStations(dateOfInterest, rowsToUpdate))
      }
    }
  }, [location]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Row updates
    if (!isEmpty(rowIdsToUpdate) && fireBehaviourResultStations.length > 0) {
      const updatedRows = RowManager.updateRows(
        rows.filter(row => !isUndefined(row)),
        fireBehaviourResultStations
      )
      setRows(updatedRows)

      const updatedRowIds = difference(
        Array.from(rowIdsToUpdate),
        fireBehaviourResultStations.map(result => result.id)
      )
      setRowIdsToUpdate(new Set(updatedRowIds))
    }
    // Initial row list page load
    if (initialLoad && fireBehaviourResultStations.length > 0) {
      const sortedRows = RowManager.sortRows(
        sortByColumn,
        order,
        RowManager.updateRows(
          rows.filter(row => !isUndefined(row)),
          fireBehaviourResultStations
        )
      )
      setRows(sortedRows)
      setInitialLoad(false)
    }
    const updatedCalculatedResults = RowManager.updateRows(
      calculatedResults,
      fireBehaviourResultStations
    )
    setCalculatedResults(updatedCalculatedResults)
  }, [fireBehaviourResultStations, stations]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const sortedRows = RowManager.sortRows(
      sortByColumn,
      order,
      RowManager.updateRows(
        rows.filter(row => !isUndefined(row)),
        fireBehaviourResultStations
      )
    )
    const updatedCalculatedResults = RowManager.updateRows(
      calculatedResults,
      fireBehaviourResultStations
    )
    setCalculatedResults(updatedCalculatedResults)
    setRows(sortedRows)
  }, [dateOfInterest, fireBehaviourResultStations]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const sortedRows = RowManager.sortRows(
      sortByColumn,
      order,
      rows.filter(row => !isUndefined(row))
    )
    setRows(sortedRows)
  }, [order]) // eslint-disable-line react-hooks/exhaustive-deps

  const addStation = () => {
    const newRowId = getNextRowIdFromRows(rows.filter(row => !isUndefined(row)))
    const newRow = {
      id: newRowId,
      weatherStation: null,
      fuelType: null,
      grassCure: undefined,
      windSpeed: undefined
    }
    assert(!new Set(rows.map(row => row.id)).has(newRowId))
    const newRows = rows.concat(newRow)
    setRows(newRows)
  }

  const deleteSelectedStations = () => {
    const selectedSet = new Set<number>(selected)
    const unselectedRows = rows.filter(row => !selectedSet.has(row.id))
    const updatedCalculateRows = filter(calculatedResults, (_, i) => !selectedSet.has(i))
    setRows(unselectedRows)
    setCalculatedResults(updatedCalculateRows)
    updateQueryParams(getUrlParamsFromRows(unselectedRows))
    setSelected([])
  }

  const exportSelectedRows = () => {
    const selectedSet = new Set<number>(selected)
    const selectedRows = rows.filter(row => selectedSet.has(row.id))
    const selectedRowsAsStrings = RowManager.exportRowsAsStrings(selectedRows)
    const csvBuilder = new CsvBuilder(`FireBAT_${dateOfInterest}.csv`)
      .setColumns([
        'Zone',
        'Weather Station',
        'Elevation',
        'FBP Fuel Type',
        'Grass Cure',
        'Status',
        'Temp',
        'RH',
        'Wind Dir',
        'Wind Speed (km/h)',
        'Precip (mm)',
        'FFMC',
        'DMC',
        'DC',
        'ISI',
        'BUI',
        'FWI',
        'HFI',
        'Critical Hours (4000 kW/m)',
        'Critical Hours (10000 kW/m)',
        'ROS (m/min)',
        'Fire Type',
        'CFB (%)',
        'Flame Length (m)',
        '30 min fire size (ha)',
        '60 min fire size (ha)'
      ])
      .addRows(selectedRowsAsStrings)
    csvBuilder.exportFile()
  }

  const updateRow = (id: number, updatedRow: FBATableRow, dispatchUpdate = true) => {
    const newRows = [...rows].filter(row => !isUndefined(row))
    const index = findIndex(newRows, row => row.id === id)

    newRows[index] = updatedRow
    setRows(newRows)

    if (!rowIdsToUpdate.has(id)) {
      rowIdsToUpdate.add(id)
      const toUpdate = new Set(rowIdsToUpdate)
      setRowIdsToUpdate(toUpdate)
    }
    if (dispatchUpdate) {
      updateQueryParams(getUrlParamsFromRows(newRows))
    }
  }

  const updateQueryParams = (queryParams: string) => {
    history.push({
      search: queryParams
    })
  }

  const updateDate = () => {
    dispatch(fetchFireBehaviourStations(dateOfInterest, rows))
  }

  const toggleSorting = (selectedColumn: SortByColumn) => {
    if (sortByColumn !== selectedColumn) {
      setSortByColumn(selectedColumn)
    } else {
      setOrder(order === 'asc' ? 'desc' : 'asc')
    }
  }

  return (
    <React.Fragment>
      {stationsError ||
        (fbaResultsError && (
          <ErrorAlert stationsError={stationsError} fbaResultsError={fbaResultsError} />
        ))}
      <ErrorBoundary>
        <FormControl className={classes.formControl}>
          <DatePicker
            date={dateOfInterest}
            onChange={setDateOfInterest}
            updateDate={updateDate}
          />
        </FormControl>
        <FormControl className={classes.formControl}>
          <Button
            data-testid="add-row"
            variant="contained"
            color="primary"
            spinnercolor="white"
            onClick={addStation}
          >
            Add Row
          </Button>
        </FormControl>
        <FormControl className={classes.formControl}>
          <Button
            data-testid="remove-rows"
            disabled={rows.length === 0}
            variant="contained"
            color="primary"
            spinnercolor="white"
            onClick={deleteSelectedStations}
          >
            Remove Row(s)
          </Button>
        </FormControl>
        <FormControl className={classes.formControl}>
          <Button
            data-testid="export"
            color="default"
            disabled={selected.length === 0}
            onClick={exportSelectedRows}
          >
            <GetAppIcon />
            Export Selection
          </Button>
        </FormControl>
        <div className={classes.display} data-testid={props.testId}>
          <Paper className={classes.paper} elevation={1}>
            <TableContainer className={classes.tableContainer}>
              <Table size="small" stickyHeader aria-label="Fire Behaviour Analysis table">
                <FBATableHead
                  toggleSorting={toggleSorting}
                  order={order}
                  rows={rows}
                  headerSelected={headerSelected}
                  setHeaderSelect={setHeaderSelect}
                  setSelected={setSelected}
                  loading={loading}
                />
                <TableBody data-testid="fba-table-body">
                  {rows.map(row => {
                    return (
                      !isUndefined(row) && (
                        <TableRow key={row.id}>
                          <StickyCell left={0} zIndexOffset={1} backgroundColor="#FFFFFF">
                            <SelectionCell
                              selected={selected}
                              updateSelected={(newSelected: number[]) =>
                                setSelected(newSelected)
                              }
                              disabled={
                                rowIdsToUpdate.has(row.id) && !rowShouldUpdate(row)
                              }
                              rowId={row.id}
                            />
                          </StickyCell>
                          <LoadingIndicatorCell
                            loading={loading}
                            rowUpdating={rowIdsToUpdate.has(row.id)}
                            initialLoad={initialLoad}
                          >
                            <TableCell className={classes.dataRow}>
                              {row.zone_code}
                            </TableCell>
                          </LoadingIndicatorCell>
                          <StickyCell
                            left={50}
                            zIndexOffset={1}
                            backgroundColor="#FFFFFF"
                          >
                            <WeatherStationCell
                              stationOptions={stationMenuOptions}
                              inputRows={rows}
                              updateRow={updateRow}
                              classNameMap={classes}
                              value={row.weatherStation}
                              disabled={
                                rowIdsToUpdate.has(row.id) && !rowShouldUpdate(row)
                              }
                              rowId={row.id}
                            />
                          </StickyCell>
                          <LoadingIndicatorCell
                            loading={loading}
                            rowUpdating={rowIdsToUpdate.has(row.id)}
                            initialLoad={initialLoad}
                          >
                            <TextDisplayCell value={row.elevation}></TextDisplayCell>
                          </LoadingIndicatorCell>
                          <StickyCell
                            left={280}
                            zIndexOffset={1}
                            backgroundColor="#FFFFFF"
                          >
                            <FuelTypeCell
                              fuelTypeOptions={fuelTypeMenuOptions}
                              inputRows={rows}
                              updateRow={updateRow}
                              classNameMap={classes}
                              value={row.fuelType}
                              disabled={
                                rowIdsToUpdate.has(row.id) && !rowShouldUpdate(row)
                              }
                              rowId={row.id}
                            />
                          </StickyCell>
                          <TableCell className={classes.dataRow}>
                            <GrassCureCell
                              inputRows={rows}
                              updateRow={updateRow}
                              classNameMap={classes}
                              value={row.grassCure}
                              disabled={
                                rowIdsToUpdate.has(row.id) && !rowShouldUpdate(row)
                              }
                              rowId={row.id}
                            />
                          </TableCell>
                          <LoadingIndicatorCell
                            loading={loading}
                            rowUpdating={rowIdsToUpdate.has(row.id)}
                            initialLoad={initialLoad}
                          >
                            <StatusCell value={row.status}></StatusCell>
                          </LoadingIndicatorCell>
                          <LoadingIndicatorCell
                            loading={loading}
                            rowUpdating={rowIdsToUpdate.has(row.id)}
                            initialLoad={initialLoad}
                          >
                            <TextDisplayCell value={row.temp}></TextDisplayCell>
                          </LoadingIndicatorCell>
                          <LoadingIndicatorCell
                            loading={loading}
                            rowUpdating={rowIdsToUpdate.has(row.id)}
                            initialLoad={initialLoad}
                          >
                            <TextDisplayCell value={row.rh}></TextDisplayCell>
                          </LoadingIndicatorCell>
                          <LoadingIndicatorCell
                            loading={loading}
                            rowUpdating={rowIdsToUpdate.has(row.id)}
                            initialLoad={initialLoad}
                          >
                            <TextDisplayCell value={row.wind_direction}></TextDisplayCell>
                          </LoadingIndicatorCell>
                          <TableCell className={classes.dataRow}>
                            <WindSpeedCell
                              inputRows={rows}
                              updateRow={updateRow}
                              inputValue={row.windSpeed}
                              calculatedValue={row.wind_speed}
                              disabled={
                                rowIdsToUpdate.has(row.id) &&
                                !rowShouldUpdate(row) &&
                                !isWindSpeedInvalid(row.windSpeed)
                              }
                              rowId={row.id}
                            />
                          </TableCell>
                          <LoadingIndicatorCell
                            loading={loading}
                            rowUpdating={rowIdsToUpdate.has(row.id)}
                            initialLoad={initialLoad}
                          >
                            <TextDisplayCell value={row.precipitation}></TextDisplayCell>
                          </LoadingIndicatorCell>
                          <LoadingIndicatorCell
                            loading={loading}
                            rowUpdating={rowIdsToUpdate.has(row.id)}
                            initialLoad={initialLoad}
                          >
                            <FixedDecimalNumberCell
                              value={row.fine_fuel_moisture_code}
                            ></FixedDecimalNumberCell>
                          </LoadingIndicatorCell>
                          <LoadingIndicatorCell
                            loading={loading}
                            rowUpdating={rowIdsToUpdate.has(row.id)}
                            initialLoad={initialLoad}
                          >
                            <FixedDecimalNumberCell
                              value={row.duff_moisture_code}
                            ></FixedDecimalNumberCell>
                          </LoadingIndicatorCell>
                          <LoadingIndicatorCell
                            loading={loading}
                            rowUpdating={rowIdsToUpdate.has(row.id)}
                            initialLoad={initialLoad}
                          >
                            <FixedDecimalNumberCell
                              value={row.drought_code}
                            ></FixedDecimalNumberCell>
                          </LoadingIndicatorCell>
                          <LoadingIndicatorCell
                            loading={loading}
                            rowUpdating={rowIdsToUpdate.has(row.id)}
                            initialLoad={initialLoad}
                          >
                            <FixedDecimalNumberCell
                              value={row.initial_spread_index}
                            ></FixedDecimalNumberCell>
                          </LoadingIndicatorCell>
                          <LoadingIndicatorCell
                            loading={loading}
                            rowUpdating={rowIdsToUpdate.has(row.id)}
                            initialLoad={initialLoad}
                          >
                            <FixedDecimalNumberCell
                              value={row.build_up_index}
                            ></FixedDecimalNumberCell>
                          </LoadingIndicatorCell>
                          <LoadingIndicatorCell
                            loading={loading}
                            rowUpdating={rowIdsToUpdate.has(row.id)}
                            initialLoad={initialLoad}
                          >
                            <FixedDecimalNumberCell
                              value={row.fire_weather_index}
                            ></FixedDecimalNumberCell>
                          </LoadingIndicatorCell>
                          <LoadingIndicatorCell
                            loading={loading}
                            rowUpdating={rowIdsToUpdate.has(row.id)}
                            initialLoad={initialLoad}
                          >
                            <HFICell value={row.head_fire_intensity}></HFICell>
                          </LoadingIndicatorCell>
                          <LoadingIndicatorCell
                            loading={loading}
                            rowUpdating={rowIdsToUpdate.has(row.id)}
                            initialLoad={initialLoad}
                          >
                            <CriticalHoursCell
                              value={row.critical_hours_hfi_4000}
                            ></CriticalHoursCell>
                          </LoadingIndicatorCell>
                          <LoadingIndicatorCell
                            loading={loading}
                            rowUpdating={rowIdsToUpdate.has(row.id)}
                            initialLoad={initialLoad}
                          >
                            <CriticalHoursCell
                              value={row.critical_hours_hfi_10000}
                            ></CriticalHoursCell>
                          </LoadingIndicatorCell>
                          <LoadingIndicatorCell
                            loading={loading}
                            rowUpdating={rowIdsToUpdate.has(row.id)}
                            initialLoad={initialLoad}
                          >
                            <FixedDecimalNumberCell
                              value={row.rate_of_spread}
                            ></FixedDecimalNumberCell>
                          </LoadingIndicatorCell>
                          <LoadingIndicatorCell
                            loading={loading}
                            rowUpdating={rowIdsToUpdate.has(row.id)}
                            initialLoad={initialLoad}
                          >
                            <TextDisplayCell value={row?.fire_type}></TextDisplayCell>
                          </LoadingIndicatorCell>
                          <LoadingIndicatorCell
                            loading={loading}
                            rowUpdating={rowIdsToUpdate.has(row.id)}
                            initialLoad={initialLoad}
                          >
                            <CrownFractionBurnedCell
                              value={row.percentage_crown_fraction_burned}
                            ></CrownFractionBurnedCell>
                          </LoadingIndicatorCell>
                          <LoadingIndicatorCell
                            loading={loading}
                            rowUpdating={rowIdsToUpdate.has(row.id)}
                            initialLoad={initialLoad}
                          >
                            <FixedDecimalNumberCell
                              value={row.flame_length}
                            ></FixedDecimalNumberCell>
                          </LoadingIndicatorCell>
                          <LoadingIndicatorCell
                            loading={loading}
                            rowUpdating={rowIdsToUpdate.has(row.id)}
                            initialLoad={initialLoad}
                          >
                            <FixedDecimalNumberCell
                              value={row.thirty_minute_fire_size}
                            ></FixedDecimalNumberCell>
                          </LoadingIndicatorCell>
                          <LoadingIndicatorCell
                            loading={loading}
                            rowUpdating={rowIdsToUpdate.has(row.id)}
                            initialLoad={initialLoad}
                          >
                            <FixedDecimalNumberCell
                              value={row.sixty_minute_fire_size}
                            ></FixedDecimalNumberCell>
                          </LoadingIndicatorCell>
                        </TableRow>
                      )
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </div>
      </ErrorBoundary>
    </React.Fragment>
  )
}

export default React.memo(FBATable)
