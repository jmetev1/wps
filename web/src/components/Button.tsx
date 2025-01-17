import React, { forwardRef } from 'react'
import clsx from 'clsx'
import { Button as B, ButtonProps, CircularProgress } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import { theme } from 'app/theme'

interface CustomProps {
  loading?: boolean
  hasSpinner?: boolean
  spinnercolor?: string
}

type Props = CustomProps & ButtonProps

const useStyles = makeStyles(() => ({
  root: {
    position: 'relative'
  },
  spinner: (props: Props) => ({
    color: props.spinnercolor || theme.palette.primary.light,
    position: 'absolute',
    left: '50%',
    marginLeft: -10,
    top: '50%',
    marginTop: -10
  })
}))

/* eslint-disable react/prop-types, react/display-name */
// Use forwardRef to obtain the ref passed to it, and then forward it to the DOM button that it renders.
// https://medium.com/@martin_hotell/react-refs-with-typescript-a32d56c4d315
export const Button = forwardRef<HTMLButtonElement, Props>((props, ref) => {
  const { loading, className, disabled, hasSpinner = true, ...buttonProps } = props
  const classes = useStyles(props)
  const buttonClassName = clsx(classes.root, className)

  return (
    <B {...buttonProps} className={buttonClassName} disabled={disabled || loading} ref={ref}>
      {buttonProps.children}
      {loading && hasSpinner && <CircularProgress size={20} className={classes.spinner} />}
    </B>
  )
})
