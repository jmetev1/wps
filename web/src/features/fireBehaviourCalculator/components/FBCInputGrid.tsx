import React, { useState } from 'react'
import { useTable } from 'react-table'
import { isNull, isUndefined } from 'lodash'
import {
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip
} from '@material-ui/core'
import InfoIcon from '@material-ui/icons/Info'
import { buildRowCell } from 'features/fireBehaviourCalculator/tableRowBuilder'
import { FuelTypes } from 'features/fireBehaviourCalculator/fuelTypes'

export interface FBCInputGridProps {
  testId?: string
  stationOptions: GridMenuOption[]
  fuelTypeOptions: GridMenuOption[]
  rows: FBCInputRow[]
  updateRow: (rowId: number, updatedRow: FBCInputRow) => void
  selected: number[]
  updateSelected: (selected: number[]) => void
}

export interface GridMenuOption {
  label: string
  value: string | number
}

export interface FBCInputRow {
  id: number
  weatherStation: string | undefined
  fuelType: string | undefined
  grassCure: number | undefined
  windSpeed: number | undefined
}

const FBCInputGrid = (props: FBCInputGridProps) => {
  const stationCodeMap = new Map(
    props.stationOptions.map(station => [station.value, station.label])
  )

  const [headerSelected, setHeaderSelect] = useState<boolean>(false)
  const buildStationOption = (value: string | undefined) => {
    if (isUndefined(value)) {
      return null
    }
    const label = stationCodeMap.get(parseInt(value))

    if (isUndefined(label)) {
      return null
    }
    const option: GridMenuOption = {
      label,
      value
    }
    return option
  }

  const buildFuelTypeMenuOption = (value: string | undefined) => {
    if (isUndefined(value)) {
      return null
    }
    const fuelType = FuelTypes.lookup(value)
    if (isUndefined(fuelType) || isNull(fuelType)) {
      return null
    }
    const option: GridMenuOption = {
      label: fuelType.friendlyName,
      value
    }
    return option
  }

  const data = props.rows.map(row => ({
    weatherStation: buildStationOption(row.weatherStation),
    fuelType: buildFuelTypeMenuOption(row.fuelType),
    grassCure: row.grassCure,
    windSpeed: row.windSpeed
  }))

  // eslint-disable-next-line
  const columns: any = React.useMemo(
    () => [
      {
        Header: 'Select',
        accessor: 'select'
      },
      {
        Header: 'Station',
        accessor: 'weatherStation'
      },
      {
        Header: 'Fuel Type',
        accessor: 'fuelType'
      },
      {
        Header: 'Grass Cure %',
        accessor: 'grassCure'
      },
      {
        Header: 'Wind Speed (km/hr) (Optional)',
        accessor: 'windSpeed'
      }
    ],
    []
  )

  const tableInstance = useTable({ columns, data })

  const { getTableProps, headerGroups, rows, prepareRow } = tableInstance

  // eslint-disable-next-line
  const renderHeader = (column: any) => {
    if (column.id === 'windSpeed') {
      return (
        <span>
          {'Wind Speed (km/h) (Optional)'}
          <Tooltip title="Leave this empty to calculate forecasted/observed wind speed. Add a custom wind speed to influence the calculations">
            <InfoIcon aria-label="info"></InfoIcon>
          </Tooltip>
        </span>
      )
    }
    if (column.id === 'select') {
      return (
        <Checkbox
          color="primary"
          checked={headerSelected}
          onClick={() => {
            if (headerSelected) {
              // Toggle off
              props.updateSelected([])
              setHeaderSelect(false)
            } else {
              props.updateSelected(rows.map(row => parseInt(row.id)))
              setHeaderSelect(true)
            }
          }}
        />
      )
    }
    return column.render('Header')
  }
  return (
    <Table {...getTableProps()}>
      <TableHead>
        {headerGroups.map((headerGroup, hi) => (
          <TableRow {...headerGroup.getHeaderGroupProps()} key={hi}>
            {headerGroup.headers.map((column, hci) => (
              <TableCell {...column.getHeaderProps()} key={hci}>
                {renderHeader(column)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableHead>
      <TableBody>
        {rows.map((row, ri) => {
          prepareRow(row)
          return (
            <TableRow {...row.getRowProps()} key={ri}>
              {row.cells.map((cell, ci) => {
                return (
                  <TableCell {...cell.getCellProps()} key={ci}>
                    {buildRowCell(props, cell, cell.column.id, parseInt(row.id))}
                  </TableCell>
                )
              })}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export default React.memo(FBCInputGrid)
