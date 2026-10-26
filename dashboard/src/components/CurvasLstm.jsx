import { useMemo, useState } from 'react'
import Chart from './Chart.jsx'
import { C, FUENTE } from '../theme.js'

// Visualización 8. Curvas de aprendizaje de la red neuronal LSTM (Laboratorio 2): error
// de ajuste (datos que ve al aprender) y de validación (datos que no ve) por época, para
// dos configuraciones. Solo existen para el total nacional y América del Centro.
const COLOR = [C.marino, C.azul]

export default function CurvasLstm({ datos, clave, onSeleccion }) {
  const todas = datos.modelos?.perdidas ?? []
  const disponibles = [...new Set(todas.map((p) => p.serie))]
  const nombre = (k) => datos.series.find((s) => s.clave === k)?.nombre ?? k
  const [mostrar, setMostrar] = useState('ambas')
  const usada = disponibles.includes(clave) ? clave : disponibles[0]
  const curvas = useMemo(() => todas.filter((p) => p.serie === usada), [todas, usada])
  const sinDatoPropio = !disponibles.includes(clave)

  const option = useMemo(() => {
    const visibles = curvas.filter((c) => mostrar === 'ambas' || c.config.startsWith(`Modelo ${mostrar}`))
    const epocas = Math.max(...curvas.map((c) => c.ajuste.length))
    return {
      animation: false,
      textStyle: { fontFamily: FUENTE },
      legend: { top: 0, left: 0, type: 'scroll', textStyle: { color: C.texto, fontSize: 12 } },
      grid: { left: 60, right: 24, top: 64, bottom: 78 },
      tooltip: {
        trigger: 'axis', confine: true, backgroundColor: '#fff', borderColor: C.borde, textStyle: { color: C.texto },
        formatter: (ps) => `<b>Época ${ps[0].axisValue}</b><br/>${ps.filter((p) => p.value != null).map((p) => `${p.marker}${p.seriesName}: <b>${p.value.toFixed(3)}</b>`).join('<br/>')}`,
      },
      dataZoom: [{ type: 'slider', bottom: 8, height: 22, borderColor: C.borde, fillerColor: 'rgba(38,101,140,.15)', handleStyle: { color: C.azul } }, { type: 'inside' }],
      xAxis: { type: 'category', name: 'Época (vuelta de entrenamiento)', nameLocation: 'middle', nameGap: 28, nameTextStyle: { color: C.textoSuave, fontSize: 12 }, data: Array.from({ length: epocas }, (_, i) => i + 1), boundaryGap: false, axisLabel: { color: C.textoSuave, fontSize: 12 }, axisLine: { lineStyle: { color: C.borde } } },
      yAxis: { type: 'value', name: 'Error (menor es mejor)', nameTextStyle: { color: C.textoSuave, align: 'left', fontSize: 12 }, axisLabel: { color: C.textoSuave, fontSize: 12 }, splitLine: { lineStyle: { color: '#E6ECF1' } } },
      series: visibles.flatMap((c) => {
        const k = curvas.indexOf(c)
        const corto = c.config.split(' (')[0]
        return [
          { name: `${corto}: ajuste`, type: 'line', showSymbol: false, data: c.ajuste, lineStyle: { color: COLOR[k % 2], width: 2 }, itemStyle: { color: COLOR[k % 2] } },
          { name: `${corto}: validación`, type: 'line', showSymbol: false, data: c.validacion, lineStyle: { color: COLOR[k % 2], width: 2.5, type: 'dashed' }, itemStyle: { color: COLOR[k % 2] },
            markPoint: { symbol: 'pin', symbolSize: 46, itemStyle: { color: C.azul }, label: { color: '#fff', fontSize: 10, formatter: () => `mejor ${c.mejor_epoca}` },
              data: [{ coord: [c.mejor_epoca - 1, c.validacion[c.mejor_epoca - 1]] }] } },
        ]
      }),
    }
  }, [curvas, mostrar])

  if (!disponibles.length) return <p className="vacio">No hay curvas de aprendizaje exportadas del Laboratorio 2.</p>
  return (
    <>
      <div className="controles-vista">
        <label>Serie con red neuronal
          <select value={usada} onChange={(e) => onSeleccion(e.target.value)}>
            {disponibles.map((k) => <option key={k} value={k}>{nombre(k)}</option>)}
          </select>
        </label>
        <div className="seg seg-3" role="group" aria-label="Configuraciones visibles">
          {[['ambas', 'Ambas'], ['A', 'Modelo A'], ['B', 'Modelo B']].map(([k, t]) => (
            <button key={k} className={mostrar === k ? 'on' : ''} aria-pressed={mostrar === k} onClick={() => setMostrar(k)}>{t}</button>
          ))}
        </div>
      </div>
      {sinDatoPropio && <p className="vacio" role="status">La red neuronal solo se entrenó para el total nacional y América del Centro. Se muestra «{nombre(usada)}» porque la serie elegida ({nombre(clave)}) no tiene curvas.</p>}
      <Chart option={option} height={380} label={`Curvas de aprendizaje de la red neuronal para ${nombre(usada)}`} />
    </>
  )
}
