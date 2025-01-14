import { TextField, Autocomplete } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import { BasicWFWXStation, StationAdminRow } from 'features/hfiCalculator/components/stationAdmin/ManageStationsModal'
import { isEqual, isNull, isUndefined } from 'lodash'
import React from 'react'

const useStyles = makeStyles({
  autocomplete: {
    minWidth: 300
  }
})

export interface AdminStationDropdownProps {
  testId?: string
  adminRow: StationAdminRow
  planningAreaId: number
  stationOptions: BasicWFWXStation[]
  disabled: boolean
  handleEditStation?: (planningAreaId: number, rowId: number, station: StationAdminRow) => void
}

export const AdminStationDropdown = ({
  testId,
  adminRow,
  stationOptions,
  disabled,
  handleEditStation
}: AdminStationDropdownProps) => {
  const classes = useStyles()

  const label = disabled ? 'Station' : 'Select Station'
  return (
    <Autocomplete
      className={classes.autocomplete}
      data-testid={testId}
      disableClearable
      disabled={disabled}
      value={adminRow.station}
      options={stationOptions}
      getOptionLabel={option => option?.name}
      isOptionEqualToValue={(option, value) => isEqual(option, value)}
      renderInput={params => (
        <TextField {...params} label={label} variant="outlined" error={isUndefined(adminRow.station)} />
      )}
      onChange={(_, value) => {
        if (!isNull(value) && !isUndefined(handleEditStation)) {
          handleEditStation(adminRow.planningAreaId, adminRow.rowId, {
            ...adminRow,
            station: { ...value }
          })
        }
      }}
    />
  )
}
