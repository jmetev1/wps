import React from 'react'
import makeStyles from '@mui/styles/makeStyles'
import { useSelector } from 'react-redux'

import { selectPercentiles } from 'app/rootReducer'
import { PercentileMeanResultTable } from 'features/percentileCalculator/components/PercentileMeanResultTable'
import { PercentileStationResultTable } from 'features/percentileCalculator/components/PercentileStationResultTable'
import { ErrorMessage } from 'components/ErrorMessage'
import { GridItem, GridContainer } from 'components/Grid'
import { PercentileCalcDocumentation } from 'features/percentileCalculator/components/PercentileCalcDocumentation'
import { PercentilesResponse } from 'api/percentileAPI'

const useStyles = makeStyles({
  root: {
    marginTop: 15
  },
  gridContainer: {
    marginBottom: 15
  }
})

interface PercentileResultsProps {
  result: PercentilesResponse
}

export const PercentileResults = React.memo(function _(props: PercentileResultsProps) {
  const classes = useStyles()

  // Object.entries(result.stations) is an array of station code & station response key value pairs
  const stationResults = Object.entries(props.result.stations).map(([stationCode, stationResponse]) => {
    return (
      <GridItem key={stationCode} md lg>
        <PercentileStationResultTable stationResponse={stationResponse} />
      </GridItem>
    )
  })
  const isMoreThanOneResult = stationResults.length > 1

  return (
    <div data-testid="percentile-result-tables" className={classes.root}>
      <GridContainer className={classes.gridContainer}>
        {isMoreThanOneResult && (
          <GridItem lg={12} md={12}>
            <PercentileMeanResultTable meanValues={props.result.mean_values} />
          </GridItem>
        )}
        {stationResults}
      </GridContainer>
      <GridContainer className={classes.gridContainer}>
        <GridItem lg={12} md={12}>
          <PercentileCalcDocumentation />
        </GridItem>
      </GridContainer>
    </div>
  )
})

const PercentileResultsWrapper: React.FC = () => {
  const { result, error } = useSelector(selectPercentiles)

  if (error) {
    return <ErrorMessage error={error} context="while getting the calculation result" marginTop={5} />
  }

  if (!result) return null

  return <PercentileResults result={result} />
}

export default PercentileResultsWrapper
