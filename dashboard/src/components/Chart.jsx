import { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, MarkAreaComponent, MarkLineComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, MarkAreaComponent, MarkLineComponent, CanvasRenderer])

// Envoltura mínima de ECharts: crea la instancia una vez, aplica la opción y
// reenvía los eventos que el padre necesite.
export default function Chart({ option, onEvents = {}, height = 340, label }) {
  const ref = useRef(null)
  const chart = useRef(null)
  const handlers = useRef(onEvents)
  handlers.current = onEvents

  useEffect(() => {
    chart.current = echarts.init(ref.current, null, { renderer: 'canvas' })
    const ro = new ResizeObserver(() => chart.current?.resize())
    ro.observe(ref.current)
    // Los eventos se delegan siempre al último manejador recibido.
    ;['click', 'datazoom'].forEach((ev) =>
      chart.current.on(ev, (p) => handlers.current[ev]?.(p, chart.current)))
    return () => { ro.disconnect(); chart.current.dispose() }
  }, [])

  useEffect(() => { chart.current?.setOption(option, true) }, [option])

  return <div ref={ref} role="img" aria-label={label} style={{ width: '100%', height }} />
}
