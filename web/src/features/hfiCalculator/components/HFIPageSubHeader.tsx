import React, { useState } from 'react'
import makeStyles from '@mui/styles/makeStyles'

import { Button, FormControl } from '@mui/material'
import FireCentreDropdown from 'features/hfiCalculator/components/FireCentreDropdown'
import { isUndefined } from 'lodash'
import { FireCentre } from 'api/hfiCalculatorAPI'
import AboutDataModal from 'features/hfiCalculator/components/AboutDataModal'
import { HelpOutlineOutlined } from '@mui/icons-material'
import { formControlStyles, theme } from 'app/theme'
import LastUpdatedHeader from 'features/hfiCalculator/components/LastUpdatedHeader'
import { HFIResultResponse } from 'features/hfiCalculator/slices/hfiCalculatorSlice'
import { DateRange } from 'components/dateRangePicker/types'
import PrepDateRangeSelector from 'features/hfiCalculator/components/PrepDateRangeSelector'

const useStyles = makeStyles(() => ({
  ...formControlStyles,
  root: {
    background: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
    minHeight: 60,
    display: 'flex',
    flexWrap: 'nowrap',
    alignItems: 'center',
    paddingLeft: 25,
    paddingRight: 25,
    gap: 10
  },
  helpIcon: {
    fill: 'white'
  },
  aboutButtonText: {
    color: 'white',
    textDecoration: 'underline',
    fontWeight: 'bold',
    justifyContent: 'flex-end'
  },
  aboutButtonGridItem: {
    marginLeft: 'auto',
    maxHeight: 56
  },
  minWidth210: {
    minWidth: 210
  }
}))

interface Props {
  padding?: string
  fireCentres: FireCentre[]
  setDateRange: (newDateRange: DateRange) => void
  selectedFireCentre: FireCentre | undefined
  result: HFIResultResponse | undefined
  selectNewFireCentre: (newSelection: FireCentre | undefined) => void
}

export const HFIPageSubHeader: React.FunctionComponent<Props> = (props: Props) => {
  const classes = useStyles(props)

  const [modalOpen, setModalOpen] = useState<boolean>(false)

  const openAboutModal = () => {
    setModalOpen(true)
  }

  return (
    <div className={classes.root}>
      <FireCentreDropdown
        fireCentres={props.fireCentres}
        selectedValue={isUndefined(props.selectedFireCentre) ? null : { name: props.selectedFireCentre?.name }}
        onChange={props.selectNewFireCentre}
      />
      <PrepDateRangeSelector
        dateRange={props.result ? props.result.date_range : undefined}
        setDateRange={props.setDateRange}
      />
      <LastUpdatedHeader
        dailies={props.result?.planning_area_hfi_results.flatMap(areaResult =>
          areaResult.daily_results.flatMap(dailyResult =>
            dailyResult.dailies.map(validatedDaily => validatedDaily.daily)
          )
        )}
      />
      <div className={classes.aboutButtonGridItem}>
        <FormControl className={classes.minWidth210}>
          <Button onClick={openAboutModal} size="small">
            <HelpOutlineOutlined className={classes.helpIcon}></HelpOutlineOutlined>
            <p className={classes.aboutButtonText}>About this data</p>
          </Button>
        </FormControl>
        <AboutDataModal modalOpen={modalOpen} setModalOpen={setModalOpen} />
      </div>
    </div>
  )
}
