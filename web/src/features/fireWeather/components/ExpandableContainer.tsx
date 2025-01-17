import React from 'react'
import makeStyles from '@mui/styles/makeStyles'

import IconButton from '@mui/material/IconButton'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import CloseIcon from '@mui/icons-material/Close'
import { PARTIAL_WIDTH } from 'utils/constants'

const getRootWidth = (props: Props) => {
  if (props.open) {
    return props.currentWidth > PARTIAL_WIDTH ? '100%' : props.currentWidth
  }
  return 0
}

const useStyles = makeStyles({
  root: (props: Props) => ({
    order: 2,
    width: getRootWidth(props),
    overflowX: 'hidden',
    boxShadow: '0px 3px 3px -2px rgb(0 0 0 / 20%), 0px 3px 4px 0px rgb(0 0 0 / 14%), 0px 1px 8px 0px rgb(0 0 0 / 12%)'
  }),
  ordering: {
    display: 'flex',
    flexDirection: 'row'
  },
  expandCollapse: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  content: (props: Props) => ({
    width: getRootWidth(props),
    position: 'relative'
  })
})

interface Props {
  expand: () => void
  collapse: () => void
  close: () => void
  currentWidth: number
  open: boolean
  children: React.ReactNode
}

const ExpandableContainer = (props: Props) => {
  const classes = useStyles(props)
  const collapsed = props.currentWidth === PARTIAL_WIDTH
  return (
    <div className={classes.root}>
      <IconButton value="close" color="primary" aria-label="Close side view" onClick={props.close} size="large">
        <CloseIcon />
      </IconButton>
      <div className={classes.ordering}>
        <div className={classes.expandCollapse} onClick={collapsed ? props.expand : props.collapse}>
          <IconButton
            value="expand-collapse"
            data-testid="expand-collapse-button"
            color="primary"
            aria-label="Expand side view"
            onClick={collapsed ? props.expand : props.collapse}
            size="large"
          >
            {collapsed ? <ArrowBackIosIcon /> : <ArrowForwardIosIcon />}
          </IconButton>
        </div>
        <div className={classes.content} data-testid="expandable-container-content">
          {props.children}
        </div>
      </div>
    </div>
  )
}

export default React.memo(ExpandableContainer)
