/* eslint-disable @typescript-eslint/ban-ts-comment */
import React from 'react'
import Plot from 'react-plotly.js'

import { ObservedValue } from 'api/observationAPI'
import { ModelValue, ModelSummary } from 'api/modelAPI'
import { NoonForecastValue, ForecastSummary } from 'api/forecastAPI'
import { Station } from 'api/stationAPI'
import { ToggleValues } from 'features/fireWeather/components/graphs/useGraphToggles'
import {
  getLayoutConfig,
  populateGraphDataForTempAndRH,
  TempRHGraphProperties,
  populateTimeOfInterestLineData,
  rangeSliderConfig
} from 'features/fireWeather/components/graphs/plotlyHelper'

const observedTempColor = '#fb0058'
const observedRHColor = '#005f87'
const observedDewpointColor = '#02fa44'
const forecastTempColor = '#a50b41'
const forecastRHColor = '#17c4c4'
const hrdpsTempColor = '#a017c2'
const hrdpsRHColor = '#3ac417'
const hrdpsTempPlumeColor = 'rgba(203, 169, 214, 0.4)'
const hrdpsRHPlumeColor = 'rgba(181, 240, 165, 0.4)'
const rdpsTempColor = '#ea6d0e'
const rdpsRHColor = '#026200'
const rdpsTempPlumeColor = 'rgba(244, 143, 65, 0.4)'
const rdpsRHPlumeColor = 'rgba(42, 137, 137, 0.4)'
const gdpsTempColor = '#f56c9c'
const gdpsRHColor = '#32e7e7'
const gdpsTempPlumeColor = 'rgba(255, 150, 169, 0.4)'
const gdpsRHPlumeColor = 'rgba(148, 255, 235, 0.4)'
const biasGdpsTempColor = '#e604d0'
const biasGdpsRHColor = '#176bc4'

interface Props {
  station: Station
  timeOfInterest: string
  sliderRange: [string, string]
  toggleValues: ToggleValues
  observations: ObservedValue[]
  noonForecasts: NoonForecastValue[]
  NoonForecastSummaries: ForecastSummary[]
  hrdpsModels: ModelValue[]
  hrdpsSummaries: ModelSummary[]
  rdpsModels: ModelValue[]
  rdpsSummaries: ModelSummary[]
  gdpsModels: ModelValue[]
  gdpsSummaries: ModelSummary[]
}

const TempRHGraph = (props: Props) => {
  const {
    station,
    timeOfInterest,
    sliderRange,
    toggleValues,
    observations,
    noonForecasts,
    NoonForecastSummaries,
    hrdpsModels,
    hrdpsSummaries,
    gdpsModels,
    gdpsSummaries,
    rdpsModels,
    rdpsSummaries
  } = props

  const obsGraphProperties: TempRHGraphProperties = {
    values: observations,
    tempName: 'Observed Temp',
    rhName: 'Observed RH',
    show: toggleValues.showObservations,
    symbol: 'circle', // https://plotly.com/javascript/reference/scatter/#scatter-marker-symbol
    dash: 'solid',
    tempColor: observedTempColor,
    rhColor: observedRHColor,
    dewpointName: 'Observed Dew Point',
    dewpointColor: observedDewpointColor
  }
  const observationData = populateGraphDataForTempAndRH(obsGraphProperties)

  const forecastGraphProperties: TempRHGraphProperties = {
    values: [...noonForecasts, ...NoonForecastSummaries],
    tempName: 'Forecast Temp',
    rhName: 'Forecash RH',
    show: toggleValues.showForecasts,
    symbol: 'pentagon',
    dash: 'solid',
    tempColor: forecastTempColor,
    rhColor: forecastRHColor
  }
  const forecastData = populateGraphDataForTempAndRH(forecastGraphProperties)

  const hrdpsGraphProperties: TempRHGraphProperties = {
    values: [...hrdpsModels, ...hrdpsSummaries],
    tempName: 'HRDPS Temp',
    rhName: 'HRDPS RH',
    show: toggleValues.showHrdps,
    symbol: 'square',
    dash: 'dash',
    tempColor: hrdpsTempColor,
    rhColor: hrdpsRHColor,
    tempPlumeColor: hrdpsTempPlumeColor,
    rhPlumeColor: hrdpsRHPlumeColor
  }
  const hrdpsData = populateGraphDataForTempAndRH(hrdpsGraphProperties)

  const gdpsGraphProperties: TempRHGraphProperties = {
    values: [...gdpsModels, ...gdpsSummaries],
    tempName: 'GDPS Temp',
    rhName: 'GDPS RH',
    show: toggleValues.showGdps,
    symbol: 'triangle-up',
    dash: 'dashdot',
    tempColor: gdpsTempColor,
    rhColor: gdpsRHColor,
    tempPlumeColor: gdpsTempPlumeColor,
    rhPlumeColor: gdpsRHPlumeColor
  }
  const gdpsData = populateGraphDataForTempAndRH(gdpsGraphProperties)

  const rdpsGraphProperties: TempRHGraphProperties = {
    values: [...rdpsModels, ...rdpsSummaries],
    tempName: 'RDPS Temp',
    rhName: 'RDPS RH',
    show: toggleValues.showRdps,
    symbol: 'diamond',
    dash: 'longdash',
    tempColor: rdpsTempColor,
    rhColor: rdpsRHColor,
    tempPlumeColor: rdpsTempPlumeColor,
    rhPlumeColor: rdpsRHPlumeColor
  }
  const rdpsData = populateGraphDataForTempAndRH(rdpsGraphProperties)

  const biasAdjGDPSGraphProperties: TempRHGraphProperties = {
    values: gdpsModels,
    tempName: 'Bias Adjusted GDPS Temp',
    rhName: 'Bias Adjusted GDPS RH',
    show: toggleValues.showBiasAdjGdps,
    symbol: 'star',
    dash: 'longdashdot',
    tempColor: biasGdpsTempColor,
    rhColor: biasGdpsRHColor
  }
  const biasAdjGdpsData = populateGraphDataForTempAndRH(biasAdjGDPSGraphProperties)

  const y2Range = [0, 102]
  const timeOfInterestLine = populateTimeOfInterestLineData(
    timeOfInterest,
    y2Range[0],
    y2Range[1],
    'y2'
  )

  return (
    <div data-testid="temp-rh-graph">
      <Plot
        style={{ width: '100%', height: '100%' }}
        config={{ responsive: true }}
        data={[
          timeOfInterestLine,

          // Plumes
          gdpsData.rh5thLine,
          gdpsData.rh90thLine,
          gdpsData.temp5thLine,
          gdpsData.temp90thLine,
          rdpsData.rh5thLine,
          rdpsData.rh90thLine,
          rdpsData.temp5thLine,
          rdpsData.temp90thLine,
          hrdpsData.rh5thLine,
          hrdpsData.rh90thLine,
          hrdpsData.temp5thLine,
          hrdpsData.temp90thLine,

          // Lines & dots
          biasAdjGdpsData.biasAdjRHLine,
          biasAdjGdpsData.biasAdjTempLine,
          gdpsData.rhLine,
          gdpsData.tempLine,
          rdpsData.rhLine,
          rdpsData.tempLine,
          hrdpsData.rhLine,
          hrdpsData.tempLine,
          ...forecastData.tempVerticalLines,
          ...forecastData.rhVerticalLines,
          forecastData.rhDots,
          forecastData.tempDots,
          observationData.rhLine,
          observationData.tempLine,
          observationData.dewpointLine
        ]}
        layout={{
          ...getLayoutConfig(
            `Temperature, Dew Point & Relative Humidity - ${station.name} (${station.code})`
          ),
          xaxis: {
            range: sliderRange,
            rangeslider: rangeSliderConfig,
            hoverformat: '%I:00%p, %a, %b %e (PST)', // https://github.com/d3/d3-3.x-api-reference/blob/master/Time-Formatting.md#format
            tickfont: { size: 14 },
            type: 'date',
            dtick: 86400000.0 // Set the interval between ticks to one day: https://plotly.com/javascript/reference/#scatter-marker-colorbar-dtick
          },
          yaxis: {
            title: 'Temperature (°C)',
            tickfont: { size: 14 }
          },
          yaxis2: {
            title: 'Relative Humidity (%)',
            tickfont: { size: 14 },
            overlaying: 'y',
            side: 'right',
            gridcolor: 'transparent',
            range: y2Range
          }
        }}
      />
    </div>
  )
}

export default React.memo(TempRHGraph)
