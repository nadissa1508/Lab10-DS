import { useMemo, useState } from 'react'
import Chart from './Chart.jsx'
import { C, FUENTE } from '../theme.js'
import { MESES_ES, nf } from '../data.js'

const TRIMESTRES = ['T1 (ene-mar)', 'T2 (abr-jun)', 'T3 (jul-sep)', 'T4 (oct-dic)']

// Visualización 3. Mapa de calor año × mes de la serie seleccionada. Muestra cuándo
// llegan más viajeros cada año (estacionalidad). Al hacer clic en un año se acota el
// período de todo el tablero a ese año; el detalle va de mes a trimestre.
export default function MapaCalor({ datos, serie, rango, onRango }) {
  const [medida, setMedida] = useState('indice')
  const [detalle, setDetalle] = useState('mes')
  const { meses } = datos

  const modelo = useMemo(() => {
    // años[y] = { valores: [12 meses o null], primero, ultimo } dentro del período visible
    const años = new Map()
    for (let i = rango[0]; i <= rango[1]; i++) {
      const [y, m] = meses[i].split('-').map(Number)
      if (!años.has(y)) años.set(y, { y, v: Array(12).fill(null), primero: i, ultimo: i })
      const a = años.get(y)
      a.v[m - 1] = serie.valores[i]
      a.ultimo = i
    }
    const filas = [...años.values()].map((a) => {
      const presentes = a.v.filter(Number.isFinite)
      const promedio = presentes.length ? presentes.reduce((s, v) => s + v, 0) / presentes.length : null
      let celdas
      if (detalle === 'mes') {
        celdas = a.v.map((v) => (v == null ? null : medida === 'indice' ? (promedio ? (v / promedio) * 100 : null) : v))
      } else {
        // Un trimestre solo se muestra si tiene sus tres meses: así no parece una caída.
        celdas = [0, 1, 2, 3].map((q) => {
          const t = a.v.slice(q * 3, q * 3 + 3)
          if (t.some((v) => v == null)) return null
          const suma = t.reduce((s, v) => s + v, 0)
          return medida === 'indice' ? (promedio ? (suma / 3 / promedio) * 100 : null) : suma
        })
      }
      return { ...a, celdas, promedio, parcial: presentes.length < 12 }
    })
    return filas
  }, [meses, serie, rango, medida, detalle])

  const columnas = detalle === 'mes' ? MESES_ES : TRIMESTRES
  const todos = modelo.flatMap((f) => f.celdas).filter(Number.isFinite)
  const sinDato = todos.length === 0

  const option = useMemo(() => {
    // La escala de color se recorta entre los percentiles 5 y 95 para que los meses
    // extremos de la pandemia no aplasten el contraste del resto; el valor real se conserva.
    const orden = [...todos].sort((a, b) => a - b)
    const q = (p) => orden[Math.min(orden.length - 1, Math.max(0, Math.round(p * (orden.length - 1))))]
    const min = q(0.05), max = q(0.95)
    const datosCeldas = modelo.flatMap((f, y) => f.celdas.flatMap((v, x) => (v == null ? [] : [[x, y, Math.min(max, Math.max(min, v)), +v.toFixed(medida === 'indice' ? 1 : 0)]])))
    const fmt = (v) => (medida === 'indice' ? `${Math.round(v)}` : nf.format(v))
    return {
      animation: false,
      textStyle: { fontFamily: FUENTE },
      grid: { left: 64, right: 24, top: 16, bottom: 74 },
      tooltip: {
        confine: true, backgroundColor: '#fff', borderColor: C.borde, textStyle: { color: C.texto },
        formatter: (p) => {
          const f = modelo[p.value[1]]
          const nota = f.parcial ? `<br/><span style="color:${C.textoSuave}">Año con meses sin dato (p. ej. 2026 llega a junio)</span>` : ''
          const valor = medida === 'indice'
            ? `Índice <b>${fmt(p.value[3])}</b> (100 = promedio de ese año)`
            : `<b>${nf.format(p.value[3])}</b> viajeros`
          return `${columnas[p.value[0]]} de ${f.y}<br/>${valor}${nota}<br/><span style="color:${C.textoSuave}">Clic: ver solo ${f.y}</span>`
        },
      },
      xAxis: { type: 'category', data: columnas, splitArea: { show: false }, axisLabel: { color: C.textoSuave, fontSize: 12 }, axisLine: { lineStyle: { color: C.borde } }, axisTick: { show: false } },
      yAxis: { type: 'category', data: modelo.map((f) => f.y), inverse: true, axisLabel: { color: C.textoSuave, fontSize: 12, interval: modelo.length > 20 ? 1 : 0 }, axisLine: { show: false }, axisTick: { show: false } },
      visualMap: {
        min, max, calculable: false, orient: 'horizontal', left: 'center', bottom: 6, itemWidth: 14, itemHeight: 180,
        dimension: 2, text: [medida === 'indice' ? 'Más que el promedio del año' : 'Más viajeros', medida === 'indice' ? 'Menos que el promedio' : 'Menos viajeros'],
        textStyle: { color: C.textoSuave, fontSize: 12 },
        inRange: { color: ['#E3F7FA', C.celeste, C.turquesa, C.azul, C.noche] },
      },
      series: [{
        type: 'heatmap', data: datosCeldas, cursor: 'pointer',
        label: { show: detalle === 'trimestre' || modelo.length <= 8, color: C.noche, fontSize: 11, formatter: (p) => fmt(p.value[3]) },
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        emphasis: { itemStyle: { borderColor: C.acento, borderWidth: 2 } },
      }],
    }
  }, [modelo, columnas, medida, detalle, todos])

  const onEvents = { click: (p) => { const f = modelo[p.value?.[1]]; if (f) onRango([f.primero, f.ultimo]) } }

  return (
    <>
      <div className="controles-vista">
        <div className="seg seg-2" role="group" aria-label="Medida del mapa">
          {[['indice', 'Patrón del año'], ['viajeros', 'Viajeros']].map(([k, t]) => (
            <button key={k} className={medida === k ? 'on' : ''} aria-pressed={medida === k} onClick={() => setMedida(k)}>{t}</button>
          ))}
        </div>
        <div className="seg seg-2" role="group" aria-label="Detalle del mapa">
          {[['mes', 'Por mes'], ['trimestre', 'Por trimestre']].map(([k, t]) => (
            <button key={k} className={detalle === k ? 'on' : ''} aria-pressed={detalle === k} onClick={() => setDetalle(k)}>{t}</button>
          ))}
        </div>
      </div>
      {sinDato
        ? <p className="vacio">No hay datos completos para mostrar en este período con este detalle. Amplíe el período o cambie a «Por mes».</p>
        : <Chart option={option} onEvents={onEvents} height={Math.max(300, 76 + modelo.length * 26)} label={`Mapa de calor año por ${detalle} de ${serie.nombre}`} />}
    </>
  )
}
