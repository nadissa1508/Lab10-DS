import { useEffect, useMemo, useState } from 'react'
import Chart from './Chart.jsx'
import { C, FUENTE } from '../theme.js'
import { indiceRecuperacion, etiquetaMes } from '../data.js'

const GRUPOS = { 'Región': 'Regiones', Frontera: 'Fronteras' }

// Visualización 4. Índice de recuperación (2019 = 100) de cada región o frontera,
// con el total nacional como referencia. Al hacer clic en una línea se cambia la
// serie seleccionada en todo el tablero.
export default function Recuperacion({ datos, seleccion, nivel, rango, onSeleccion }) {
  const { meses } = datos
  const elegida = datos.series.find((s) => s.clave === seleccion)
  const [grupo, setGrupo] = useState(elegida.grupo === 'General' ? 'Región' : elegida.grupo)
  useEffect(() => { if (elegida.grupo !== 'General') setGrupo(elegida.grupo) }, [elegida.grupo])

  const lineas = useMemo(() => datos.series
    .filter((s) => s.clave === 'total' || s.grupo === grupo)
    .map((s) => ({ ...s, cubetas: indiceRecuperacion(meses, s.valores, nivel, rango[0], rango[1]) })),
  [datos, meses, grupo, nivel, rango])

  const cubetas = lineas[0]?.cubetas ?? []
  const fmtEje = (v) => (nivel === 'mensual' ? etiquetaMes(v) : v)

  const option = useMemo(() => {
    const posicion = (ym) => cubetas.findIndex((c) => meses[c.primero] <= ym && ym <= meses[c.ultimo])
    const pandemia = [posicion('2020-03'), posicion('2021-12')]
    const quiebre = posicion('2023-01')
    return {
      animation: false,
      textStyle: { fontFamily: FUENTE },
      grid: { left: 56, right: 150, top: 36, bottom: 40 },
      tooltip: {
        trigger: 'axis', backgroundColor: '#fff', borderColor: C.borde, textStyle: { color: C.texto },
        formatter: (ps) => {
          const c = cubetas[ps[0].dataIndex]
          const filas = ps.filter((p) => p.value != null).sort((a, b) => b.value - a.value)
            .map((p) => `${p.marker}${p.seriesName}: <b>${Math.round(p.value)}</b> <span style="color:${C.textoSuave}">(${p.value >= 100 ? '+' : ''}${Math.round(p.value - 100)} % vs. 2019)</span>`)
          const parcial = c.parcial && nivel !== 'mensual'
            ? `<br/><i style="color:${C.acento}">Período parcial: se compara con los mismos meses de 2019</i>` : ''
          return `<b>${fmtEje(c.clave)}</b><br/>${filas.length ? filas.join('<br/>') : 'Sin dato'}${parcial}`
        },
      },
      xAxis: {
        type: 'category', data: cubetas.map((c) => c.clave), boundaryGap: false,
        axisLabel: { interval: 0, hideOverlap: true, color: C.textoSuave, fontSize: 12,
          formatter: (v) => (nivel === 'mensual' ? (v.endsWith('-01') ? v.slice(0, 4) : '') : v) },
        axisLine: { lineStyle: { color: C.borde } }, axisTick: { show: false },
      },
      yAxis: {
        type: 'value', name: 'Índice (2019 = 100)', nameTextStyle: { color: C.textoSuave, align: 'left', fontSize: 12 },
        axisLabel: { color: C.textoSuave, fontSize: 12 }, splitLine: { lineStyle: { color: '#E6ECF1' } },
      },
      series: lineas.map((s, i) => {
        const sel = s.clave === seleccion
        const total = s.clave === 'total'
        const color = sel ? C.marino : total ? C.noche : C.azul
        return {
          name: s.nombre, type: 'line', cursor: 'pointer', triggerLineEvent: true, showSymbol: nivel === 'anual', symbolSize: sel ? 7 : 5,
          data: s.cubetas.map((c) => (c.indice == null ? null : +c.indice.toFixed(1))),
          z: sel ? 5 : 2,
          lineStyle: { color, width: sel ? 3.5 : 1.8, type: total && !sel ? 'dashed' : 'solid', opacity: sel || total ? 1 : 0.6 },
          itemStyle: { color },
          emphasis: { focus: 'series', lineStyle: { width: 3.5, opacity: 1 } },
          endLabel: { show: true, formatter: '{a}', color: sel ? C.marino : C.textoSuave, fontSize: 12, fontWeight: sel ? 700 : 400 },
          labelLayout: { moveOverlap: 'shiftY' },
          ...(i === 0 ? {
            markLine: { silent: true, symbol: 'none', data: [
              { yAxis: 100, lineStyle: { color: C.textoSuave, type: 'dashed' }, label: { formatter: 'Nivel 2019', position: 'insideStartTop', color: C.textoSuave, fontSize: 11 } },
              ...(quiebre > 0 ? [{ xAxis: cubetas[quiebre].clave, lineStyle: { color: C.textoSuave, type: 'dotted' }, label: { formatter: 'Cambio de fuente', color: C.textoSuave, fontSize: 11 } }] : []),
            ] },
            markArea: pandemia[0] >= 0 ? { silent: true, itemStyle: { color: 'rgba(214,51,108,.10)' },
              label: { color: '#9E1F4B', fontWeight: 700, fontSize: 12, position: 'insideTop' },
              data: [[{ name: 'Pandemia', xAxis: cubetas[pandemia[0]].clave }, { xAxis: cubetas[pandemia[1] >= 0 ? pandemia[1] : cubetas.length - 1].clave }]] } : undefined,
          } : {}),
        }
      }),
    }
  }, [lineas, cubetas, meses, nivel, seleccion])

  const onEvents = { click: (p) => { const s = lineas[p.seriesIndex]; if (s) onSeleccion(s.clave) } }

  return (
    <>
      <div className="seg seg-2" role="group" aria-label="Grupo de series">
        {Object.entries(GRUPOS).map(([g, etiqueta]) => (
          <button key={g} className={grupo === g ? 'on' : ''} aria-pressed={grupo === g} onClick={() => setGrupo(g)}>{etiqueta}</button>
        ))}
      </div>
      {cubetas.length === 0
        ? <p className="vacio">El índice compara contra 2019: el período seleccionado termina antes de 2019. Amplíe el período en la sección Resumen o pulse «Restablecer filtros».</p>
        : <Chart option={option} onEvents={onEvents} height={360} label={`Índice de recuperación de ${GRUPOS[grupo].toLowerCase()} frente a 2019`} />}
    </>
  )
}
