import React, { useState, useContext, useEffect } from 'react'
import OLVectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { StyleLike } from 'ol/style/Style'

import { MapContext } from 'features/map/Map'
import Geometry from 'ol/geom/Geometry'

interface Props {
  source: VectorSource<Geometry>
  style: StyleLike
  opacity?: number
  zIndex?: number
}

const VectorLayer = ({ source, style, opacity, zIndex = 0 }: Props) => {
  const map = useContext(MapContext)

  const [layer, setLayer] = useState<OLVectorLayer<VectorSource<Geometry>> | null>(null)

  useEffect(() => {
    if (!map) return

    const vectorLayer = new OLVectorLayer({
      source,
      style,
      opacity,
      zIndex
    })

    map.addLayer(vectorLayer)
    vectorLayer.setZIndex(zIndex)
    setLayer(vectorLayer)

    return () => {
      if (map) {
        map.removeLayer(vectorLayer)
      }
    }
  }, [map]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!layer) return

    layer.setSource(source)
  }, [source]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!layer) return

    layer.setStyle(style)
  }, [style]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

export default React.memo(VectorLayer)
