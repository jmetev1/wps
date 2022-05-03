import React from 'react'

import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import { FireCentre, FuelType } from 'api/hfiCalculatorAPI'
import FireTable from 'components/FireTable'
import DayHeaders from 'features/hfiCalculator/components/DayHeaders'
import DayIndexHeaders from 'features/hfiCalculator/components/DayIndexHeaders'
import CalculatedPlanningAreaCells from 'features/hfiCalculator/components/CalculatedPlanningAreaCells'
import { StaticCells } from 'features/hfiCalculator/components/StaticCells'
import BaseStationAttributeCells from 'features/hfiCalculator/components/BaseStationAttributeCells'
import { BACKGROUND_COLOR, fireTableStyles } from 'app/theme'
import { isEmpty, isUndefined, sortBy } from 'lodash'
import {
  calculateNumPrepDays,
  getDailiesByStationCode,
  stationCodeSelected,
  getSelectedFuelType
} from 'features/hfiCalculator/util'
import StickyCell from 'components/StickyCell'
import FireCentreCell from 'features/hfiCalculator/components/FireCentreCell'
import { selectAuthentication, selectHFICalculatorState } from 'app/rootReducer'
import { useSelector } from 'react-redux'
import {
  FireStartRange,
  PlanningAreaResult,
  PrepDateRange
} from 'features/hfiCalculator/slices/hfiCalculatorSlice'
import EmptyFireCentreRow from 'features/hfiCalculator/components/EmptyFireCentre'
import HeaderRowCell from 'features/hfiCalculator/components/HeaderRowCell'
import { StationDataHeaderCells } from 'features/hfiCalculator/components/StationDataHeaderCells'
import { ROLES } from 'features/auth/roles'

export interface Props {
  fireCentre: FireCentre | undefined
  testId?: string
  dateRange?: PrepDateRange
  setSelected: (planningAreaId: number, code: number, selected: boolean) => void
  setNewFireStarts: (
    areaId: number,
    dayOffset: number,
    newFireStarts: FireStartRange
  ) => void
  setFuelType: (planningAreaId: number, code: number, fuelTypeId: number) => void
  fuelTypes: FuelType[]
}

const useStyles = makeStyles({
  ...fireTableStyles
})

export const WeeklyViewTable = (props: Props): JSX.Element => {
  const classes = useStyles()

  const { result } = useSelector(selectHFICalculatorState)
  const { roles, isAuthenticated } = useSelector(selectAuthentication)

  const stationCodeInSelected = (planningAreaId: number, code: number): boolean => {
    if (isUndefined(result) || isUndefined(result?.planning_area_station_info)) {
      return false
    }
    return stationCodeSelected(result.planning_area_station_info, planningAreaId, code)
  }
  const toggleSelectedStation = (planningAreaId: number, code: number) => {
    const selected = stationCodeInSelected(planningAreaId, code)
    props.setSelected(planningAreaId, code, !selected)
  }

  const numPrepDays = calculateNumPrepDays(props.dateRange)

  if (isUndefined(result)) {
    return <React.Fragment></React.Fragment>
  }

  return (
    <FireTable
      maxHeight={700}
      ariaLabel="weekly table view of HFI by planning area"
      testId="hfi-calc-weekly-table"
    >
      <TableHead>
        <TableRow>
          <DayHeaders dateRange={props.dateRange} />
          <TableCell colSpan={2} className={classes.spaceHeader}></TableCell>
        </TableRow>
        <TableRow>
          <StickyCell left={0} zIndexOffset={12} className={classes.noBottomBorder}>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className={classes.noBottomBorder}>
                    {/* empty cell inserted for spacing purposes (aligns with checkboxes column) */}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </StickyCell>
          <StationDataHeaderCells />
          <DayIndexHeaders numPrepDays={numPrepDays} />
          <TableCell className={classes.sectionSeparatorBorder}>
            Highest
            <br />
            Daily
            <br />
            FIG
          </TableCell>
          <TableCell>
            Calc.
            <br />
            Prep
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {isUndefined(props.fireCentre) ? (
          <EmptyFireCentreRow colSpan={15} />
        ) : (
          <React.Fragment key={`fire-centre-${props.fireCentre.name}`}>
            <TableRow key={`fire-centre-${props.fireCentre.name}`}>
              <FireCentreCell centre={props.fireCentre}></FireCentreCell>
              <HeaderRowCell className={classes.fireCentre} />
            </TableRow>
            {sortBy(
              props.fireCentre.planning_areas,
              planningArea => planningArea.order_of_appearance_in_list
            ).map(area => {
              const areaHFIResult: PlanningAreaResult | undefined =
                result.planning_area_hfi_results.find(
                  planningAreaResult => planningAreaResult.planning_area_id === area.id
                )

              return (
                areaHFIResult && (
                  <React.Fragment key={`zone-${area.name}`}>
                    <TableRow>
                      <HeaderRowCell className={classes.planningAreaBorder} />
                    </TableRow>
                    <TableRow
                      className={classes.planningArea}
                      key={`zone-${area.name}`}
                      data-testid={`zone-${area.name}`}
                    >
                      <StickyCell
                        left={0}
                        zIndexOffset={10}
                        backgroundColor={BACKGROUND_COLOR.backgroundColor}
                        colSpan={2}
                      >
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell className={classes.noBottomBorder}>
                                {area.name}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </StickyCell>
                      <TableCell
                        className={`${classes.planningArea} ${classes.nonstickyHeaderCell}`}
                      ></TableCell>
                      <StickyCell
                        left={227}
                        zIndexOffset={10}
                        className={`${classes.rightBorder} ${classes.defaultBackground}`}
                        colSpan={2}
                      >
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell
                                className={`${classes.planningArea} ${classes.noBottomBorder}`}
                              ></TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </StickyCell>
                      <CalculatedPlanningAreaCells
                        area={area}
                        areaName={area.name}
                        planningAreaResult={areaHFIResult}
                        fireStartsEnabled={
                          roles.includes(ROLES.HFI.SET_FIRE_STARTS) && isAuthenticated
                        }
                        setNewFireStarts={props.setNewFireStarts}
                        planningAreaClass={classes.planningArea}
                        numPrepDays={numPrepDays}
                        fireStartRanges={result.fire_start_ranges}
                        fuelTypes={props.fuelTypes}
                        planningAreaStationInfo={result.planning_area_station_info}
                      />
                    </TableRow>
                    {sortBy(
                      area.stations,
                      station => station.order_of_appearance_in_planning_area_list
                    ).map(station => {
                      const dailiesForStation = getDailiesByStationCode(
                        result,
                        station.code
                      )
                      const isRowSelected = stationCodeInSelected(area.id, station.code)
                      const classNameForRow = !isRowSelected
                        ? classes.unselectedStation
                        : classes.stationCellPlainStyling
                      const stationCode = station.code
                      const selectedFuelType = getSelectedFuelType(
                        result.planning_area_station_info,
                        area.id,
                        stationCode,
                        props.fuelTypes
                      )
                      if (isUndefined(selectedFuelType)) {
                        return <React.Fragment></React.Fragment>
                      }
                      return (
                        <TableRow
                          className={classNameForRow}
                          key={`station-${stationCode}`}
                        >
                          <BaseStationAttributeCells
                            station={station}
                            planningAreaId={area.id}
                            className={classNameForRow}
                            selectStationEnabled={
                              roles.includes(ROLES.HFI.SELECT_STATION) && isAuthenticated
                            }
                            stationCodeInSelected={stationCodeInSelected}
                            toggleSelectedStation={toggleSelectedStation}
                            grassCurePercentage={
                              !isEmpty(dailiesForStation)
                                ? dailiesForStation[0].grass_cure_percentage
                                : undefined
                            }
                            setFuelType={props.setFuelType}
                            fuelTypes={props.fuelTypes}
                            selectedFuelType={selectedFuelType}
                            isRowSelected={isRowSelected}
                          />
                          <StaticCells
                            numPrepDays={numPrepDays}
                            dailies={dailiesForStation}
                            station={station}
                            classNameForRow={classNameForRow}
                            isRowSelected={isRowSelected}
                            selectedFuelType={selectedFuelType}
                          />
                        </TableRow>
                      )
                    })}
                  </React.Fragment>
                )
              )
            })}
          </React.Fragment>
        )}
      </TableBody>
    </FireTable>
  )
}

export default React.memo(WeeklyViewTable)
