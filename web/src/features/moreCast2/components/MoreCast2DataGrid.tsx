import React from 'react'
import makeStyles from '@mui/styles/makeStyles'
import { DataGrid, GridColDef, GridValueFormatterParams, GridValueGetterParams } from '@mui/x-data-grid'
import { isNumber } from 'lodash'
import { DateTime } from 'luxon'
import { MoreCast2ForecastRow } from 'features/moreCast2/interfaces'

interface MoreCast2DataGridProps {
  rows: MoreCast2ForecastRow[]
  setForecastRows: React.Dispatch<React.SetStateAction<MoreCast2ForecastRow[]>>
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexGrow: 1
  }
})

const MoreCast2DataGrid = (props: MoreCast2DataGridProps) => {
  const classes = useStyles()
  const predictionItemValueGetter = (params: GridValueGetterParams, precision: number) => {
    const value = params?.value?.value
    return isNumber(value) ? value.toFixed(precision) : 'Nan'
  }

  const columns: GridColDef[] = [
    { field: 'stationName', flex: 1, headerName: 'Station', maxWidth: 200 },
    {
      field: 'forDate',
      disableColumnMenu: true,
      disableReorder: true,
      flex: 1,
      headerName: 'Date',
      maxWidth: 250,
      sortable: false,
      valueFormatter: (params: GridValueFormatterParams<number>) => {
        return DateTime.fromSeconds(params.value / 1000).toLocaleString(DateTime.DATE_MED)
      }
    },
    {
      field: 'temp',
      disableColumnMenu: true,
      disableReorder: true,
      headerName: 'Temp',
      sortable: false,
      type: 'number',
      width: 120,
      valueGetter: params => predictionItemValueGetter(params, 1)
    },
    {
      field: 'rh',
      disableColumnMenu: true,
      disableReorder: true,
      headerName: 'RH',
      sortable: false,
      type: 'number',
      width: 120,
      valueGetter: params => predictionItemValueGetter(params, 0)
    },
    {
      field: 'windDirection',
      disableColumnMenu: true,
      disableReorder: true,
      headerName: 'Wind Dir',
      sortable: false,
      type: 'number',
      width: 120,
      valueGetter: params => predictionItemValueGetter(params, 0)
    },
    {
      field: 'windSpeed',
      disableColumnMenu: true,
      disableReorder: true,
      headerName: 'Wind Speed',
      sortable: false,
      type: 'number',
      width: 120,
      valueGetter: params => predictionItemValueGetter(params, 1)
    },
    {
      field: 'precip',
      disableColumnMenu: true,
      disableReorder: true,
      headerName: 'Precip',
      sortable: false,
      type: 'number',
      width: 120,
      valueGetter: params => predictionItemValueGetter(params, 1)
    }
  ]

  return (
    <div className={classes.root} data-testid={`morecast2-data-grid`}>
      <DataGrid
        columns={columns}
        rows={props.rows}
        initialState={{
          sorting: {
            sortModel: [{ field: 'stationName', sort: 'asc' }]
          }
        }}
      ></DataGrid>
    </div>
  )
}

export default MoreCast2DataGrid
