import { useMemo } from 'react'
import Chart from './Chart.jsx'
import { C, FUENTE } from '../theme.js'
import { nf, sumaRango } from '../data.js'

// Visualización 2. Participación en el total nacional; al hacer clic se
// cambia la serie que muestra la Visualización 1.
export default function Participacion({ datos, seleccion, rango, onSeleccion }) {
  const filas = useMemo(() => {
    const total = datos.series.find((s) => s.clave === 'total')
    const t = sumaRango(total.valores, rango[0], rango[1])
    return datos.series
      .filter((s) => s.clave !== 'total')
      .map((s) => { const v = sumaRango(s.valores, rango[0], rango[1]); return { ...s, v, pct: t ? (v / t) * 100 : 0 } })
      .sort((a, b) => (a.grupo === b.grupo ? b.pct - a.pct : a.grupo === 'Región' ? -1 : 1))
  }, [datos, rango])

  const option = useMemo(() => ({
    animation: false,
    textStyle: { fontFamily: FUENTE },
    grid: { left: 190, right: 56, top: 8, bottom: 28 },
    tooltip: {
      backgroundColor: '#fff', borderColor: C.borde, textStyle: { color: C.texto },
      formatter: (p) => { const f = filas[p.dataIndex]
        return `<b>${f.grupo} · ${f.nombre}</b><br/>${f.pct.toFixed(1)} % del total nacional<br/>${nf.format(f.v)} viajeros<br/><span style="color:${C.textoSuave}">Clic para ver su serie</span>` } },
    xAxis: { type: 'value', max: 100, splitNumber: 2, axisLabel: { formatter: '{value} %', color: C.textoSuave, fontSize: 12 }, splitLine: { lineStyle: { color: '#E6ECF1' } } },
    yAxis: { type: 'category', inverse: true, data: filas.map((f) => `${f.grupo} · ${f.nombre}`),
      axisLabel: { color: C.texto, fontSize: 12.5, fontWeight: 600 }, axisLine: { show: false }, axisTick: { show: false } },
    series: [{
      type: 'bar', barWidth: 20, cursor: 'pointer',
      data: filas.map((f) => ({ value: +f.pct.toFixed(2),
        itemStyle: f.clave === seleccion
          ? { color: C.marino, borderRadius: [0, 4, 4, 0] }
          : { color: C.celeste, borderColor: C.azul, borderWidth: 1.5, borderRadius: [0, 4, 4, 0] } })),
      label: { show: true, position: 'right', formatter: (p) => p.value.toFixed(1) + ' %', color: C.texto, fontSize: 12, fontWeight: 600 },
    }],
  }), [filas, seleccion])

  const onEvents = { click: (p) => onSeleccion(filas[p.dataIndex].clave) }
  return <Chart option={option} onEvents={onEvents} height={300} label="Participación de regiones y fronteras en el total nacional" />
}
