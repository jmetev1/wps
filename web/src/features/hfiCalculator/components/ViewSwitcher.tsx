import { FireCentre } from 'api/hfiCalcAPI'
import { StationDaily } from 'api/hfiCalculatorAPI'
import DailyViewTable from 'features/hfiCalculator/components/DailyViewTable'
import WeeklyViewTable from 'features/hfiCalculator/components/WeeklyViewTable'
import React from 'react'

export interface ViewSwitcherProps {
  testId?: string
  isWeeklyView: boolean
  fireCentres: Record<string, FireCentre>
  dailiesMap: Map<number, StationDaily>
  weekliesMap: Map<number, StationDaily[]>
  dateOfInterest: string
}

const ViewSwitcher = (props: ViewSwitcherProps) => {
  return (
    <React.Fragment>
      {props.isWeeklyView ? (
        <WeeklyViewTable
          testId="hfi-calc-weekly-table"
          fireCentres={props.fireCentres}
          stationCodes={Array.from(props.dailiesMap.values()).map(daily => daily.code)}
          weekliesByStationCode={props.weekliesMap}
          currentDay={props.dateOfInterest}
        />
      ) : (
        <DailyViewTable
          testId="hfi-calc-daily-table"
          fireCentres={props.fireCentres}
          dailiesMap={props.dailiesMap}
        ></DailyViewTable>
      )}
    </React.Fragment>
  )
}

export default React.memo(ViewSwitcher)
