import { useMemo, useState } from 'react'
import Chart from './Chart.jsx'
import { C, FUENTE } from '../theme.js'
import { agrupar, etiquetaMes, nf, fmtCorto, useComposicion } from '../data.js'

const DIMENSIONES = { via: 'Vía de ingreso', tipo: 'Tipo de viajero' }
// Relleno y borde por categoría: nunca se usa el rosa (reservado a pandemia y estimaciones).
const ESTILO = {
  'Terrestre': { fill: C.marino, borde: C.marino },
  'Aérea': { fill: C.azul, borde: C.azul },
  'Marítima': { fill: C.celeste, borde: C.azul },
  'Turista': { fill: C.marino, borde: C.marino },
  'Excursionista': { fill: C.celeste, borde: C.azul },
}

// Visualización 5. Composición del ingreso por vía o por tipo de viajero. Las barras
// se apilan por período; el detalle sigue el nivel (mensual, trimestral, anual) del
// tablero. Al hacer clic en una barra se acota el período a ese mes, trimestre o año.
export default function Composicion({ datos, nivel, rango, onRango }) {
  const { comp, error } = useComposicion()
  const [dimension, setDimension] = useState('via')
  const [modo, setModo] = useState('participacion')
  const { meses } = datos

  const modelo = useMemo(() => {
    if (!comp) return null
    const idx = new Map(meses.map((m, i) => [m, i]))
    const porCategoria = new Map()
    for (const r of comp.registros) {
      if (r.dimension !== dimension || !idx.has(r.fecha)) continue
      if (!porCategoria.has(r.categoria)) porCategoria.set(r.categoria, Array(meses.length).fill(null))
      porCategoria.get(r.categoria)[idx.get(r.fecha)] = r.viajeros
    }
    const categorias = [...porCategoria.entries()].map(([nombre, valores]) => ({
      nombre, cubetas: agrupar(meses, valores, nivel, rango[0], rango[1]),
    })).sort((a, b) => b.cubetas.reduce((s, c) => s + (c.valor ?? 0), 0) - a.cubetas.reduce((s, c) => s + (c.valor ?? 0), 0))
    const cubetas = categorias[0]?.cubetas ?? []
    const totales = cubetas.map((_, i) => categorias.reduce((s, c) => s + (c.cubetas[i].valor ?? 0), 0))
    return { categorias, cubetas, totales }
  }, [comp, dimension, meses, nivel, rango])

  const option = useMemo(() => {
    if (!modelo) return {}
    const { categorias, cubetas, totales } = modelo
    const pct = modo === 'participacion'
    const fmtEje = (v) => (nivel === 'mensual' ? etiquetaMes(v) : v)
    return {
      animation: false,
      textStyle: { fontFamily: FUENTE },
      legend: { top: 0, left: 0, textStyle: { color: C.texto, fontSize: 12 }, itemWidth: 14, itemHeight: 12 },
      grid: { left: 64, right: 24, top: 44, bottom: 40 },
      tooltip: {
        trigger: 'axis', axisPointer: { type: 'shadow' }, confine: true, backgroundColor: '#fff', borderColor: C.borde, textStyle: { color: C.texto },
        formatter: (ps) => {
          const i = ps[0].dataIndex, c = cubetas[i]
          const filas = categorias.map((cat) => {
            const v = cat.cubetas[i].valor
            return `${ps.find((p) => p.seriesName === cat.nombre)?.marker ?? ''}${cat.nombre}: <b>${v == null ? 'Sin dato' : nf.format(v)}</b>${v != null && totales[i] ? ` (${((v / totales[i]) * 100).toFixed(1)} %)` : ''}`
          })
          const parcial = c.parcial && nivel !== 'mensual' ? `<br/><i style="color:${C.textoSuave}">Período parcial: suma solo los meses disponibles</i>` : ''
          return `<b>${fmtEje(c.clave)}</b><br/>${filas.join('<br/>')}<br/><span style="color:${C.textoSuave}">Total: ${nf.format(totales[i])}</span>${parcial}<br/><span style="color:${C.textoSuave}">Clic: ver solo este período</span>`
        },
      },
      xAxis: {
        type: 'category', data: cubetas.map((c) => c.clave),
        axisLabel: { interval: 0, hideOverlap: true, color: C.textoSuave, fontSize: 12, formatter: (v) => (nivel === 'mensual' ? (v.endsWith('-01') ? v.slice(0, 4) : '') : v) },
        axisLine: { lineStyle: { color: C.borde } }, axisTick: { show: false },
      },
      yAxis: {
        type: 'value', max: pct ? 100 : undefined, axisLabel: { color: C.textoSuave, fontSize: 12, formatter: (v) => (pct ? `${v} %` : fmtCorto(v)) }, splitLine: { lineStyle: { color: '#E6ECF1' } },
      },
      series: [...categorias].reverse().map((cat) => ({
        name: cat.nombre, type: 'bar', stack: 'total', barCategoryGap: nivel === 'mensual' ? '10%' : '30%', cursor: 'pointer',
        itemStyle: { color: ESTILO[cat.nombre]?.fill ?? C.turquesa, borderColor: ESTILO[cat.nombre]?.borde ?? C.azul, borderWidth: 1 },
        emphasis: { focus: 'series' },
        data: cat.cubetas.map((c, i) => (c.valor == null ? null : pct ? (totales[i] ? +((c.valor / totales[i]) * 100).toFixed(2) : 0) : Math.round(c.valor))),
      })),
    }
  }, [modelo, modo, nivel])

  if (error) return <p className="vacio">No se pudo cargar la composición: {error}</p>
  if (!modelo) return <p className="vacio">Cargando composición…</p>
  const onEvents = { click: (p) => { const c = modelo.cubetas[p.dataIndex]; if (c) onRango([c.primero, c.ultimo]) } }

  return (
    <>
      <div className="controles-vista">
        <div className="seg seg-2" role="group" aria-label="Dimensión de la composición">
          {Object.entries(DIMENSIONES).map(([k, t]) => (
            <button key={k} className={dimension === k ? 'on' : ''} aria-pressed={dimension === k} onClick={() => setDimension(k)}>{t}</button>
          ))}
        </div>
        <div className="seg seg-2" role="group" aria-label="Medida de la composición">
          {[['participacion', 'Porcentaje'], ['viajeros', 'Viajeros']].map(([k, t]) => (
            <button key={k} className={modo === k ? 'on' : ''} aria-pressed={modo === k} onClick={() => setModo(k)}>{t}</button>
          ))}
        </div>
      </div>
      {modelo.cubetas.length === 0
        ? <p className="vacio">No hay información para el período seleccionado.</p>
        : <Chart option={option} onEvents={onEvents} height={360} label={`Composición del ingreso por ${DIMENSIONES[dimension].toLowerCase()}`} />}
    </>
  )
}
