import { useMemo } from 'react'
import Chart from './Chart.jsx'
import { C, FUENTE } from '../theme.js'
import { agrupar, etiquetaMes, nf, fmtCorto } from '../data.js'
import { rangoZoom } from '../analisis.js'

const NIVELES = { mensual: 'mes', trimestral: 'trimestre', anual: 'año' }

// Visualización 1. Serie histórica con nivel de detalle y zoom enlazado.
export default function SerieHistorica({ datos, serie, nivel, rango, onRango }) {
  const { meses, conjunto } = datos
  const cubetas = useMemo(() => agrupar(meses, serie.valores, nivel), [meses, serie, nivel])
  const visibles = useMemo(() => new Map(agrupar(meses, serie.valores, nivel, ...rango).map(c => [c.clave, c])), [meses, serie, nivel, rango])

  const indiceCubeta = (mesIdx) => cubetas.findIndex((c) => c.primero <= mesIdx && mesIdx <= c.ultimo)

  const option = useMemo(() => {
    const esTrain = (c) => conjunto[(visibles.get(c.clave) ?? c).ultimo] === 'train'
    const train = cubetas.map((c) => (esTrain(c) ? visibles.get(c.clave)?.valor ?? null : null))
    const test = cubetas.map((c, i) => (!esTrain(c) || (i + 1 < cubetas.length && !esTrain(cubetas[i + 1])) ? visibles.get(c.clave)?.valor ?? null : null))
    const ini = indiceCubeta(meses.indexOf('2020-03'))
    const fin = indiceCubeta(meses.indexOf('2021-12'))
    const corte = cubetas.findIndex((c) => !esTrain(c))
    const fmtEje = (v) => (nivel === 'mensual' ? etiquetaMes(v) : v)
    return {
      animation: false,
      textStyle: { fontFamily: FUENTE },
      grid: { left: 64, right: 24, top: 64, bottom: 74 },
      legend: { top: 0, left: 0, itemWidth: 22, textStyle: { color: C.texto, fontSize: 12 } },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#fff', borderColor: C.borde, textStyle: { color: C.texto },
        formatter: (ps) => {
          const completa = cubetas[ps[0].dataIndex]
          const c = visibles.get(completa.clave) ?? completa
          const v = c.valor
          const periodo = conjunto[c.primero] !== conjunto[c.ultimo] ? 'Período mixto: entrenamiento y prueba' : conjunto[c.ultimo] === 'train' ? 'Entrenamiento de modelos' : 'Prueba de modelos'
          const nota = c.parcial && nivel !== 'mensual'
            ? `<br/><i style="color:${C.acento}">Período parcial: ${c.n} de ${nivel === 'anual' ? 12 : 3} meses con dato</i>` : ''
          return `<b>${fmtEje(c.clave)}</b><br/>${v == null ? 'Sin dato' : nf.format(v) + ' viajeros'}<br/><span style="color:${C.textoSuave}">${periodo}</span>${nota}`
        },
      },
      xAxis: {
        type: 'category', data: cubetas.map((c) => c.clave), boundaryGap: false,
        axisLabel: { interval: 0, formatter: (v) => (nivel === 'mensual' ? (v.endsWith('-01') ? v.slice(0, 4) : '') : v), color: C.textoSuave, fontSize: 12, hideOverlap: true },
        axisLine: { lineStyle: { color: C.borde } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value', name: `Viajeros por ${NIVELES[nivel]}`, nameTextStyle: { color: C.textoSuave, align: 'left', fontSize: 12 },
        axisLabel: { color: C.textoSuave, fontSize: 12, formatter: fmtCorto },
        splitLine: { lineStyle: { color: '#E6ECF1' } },
      },
      dataZoom: [
        { type: 'slider', height: 22, bottom: 10, startValue: indiceCubeta(rango[0]), endValue: indiceCubeta(rango[1]),
          borderColor: C.borde, fillerColor: 'rgba(84,172,191,.25)', handleStyle: { color: C.azul }, labelFormatter: (_, s) => fmtEje(s ?? '') },
        { type: 'inside', startValue: indiceCubeta(rango[0]), endValue: indiceCubeta(rango[1]) },
      ],
      series: [
        {
          name: 'Entrenamiento (2009–mar 2021)', type: 'line', data: train, showSymbol: false, connectNulls: false,
          lineStyle: { width: 2.5, color: C.marino }, itemStyle: { color: C.marino },
          areaStyle: { color: C.celeste, opacity: 0.35 },
          markArea: { silent: true, itemStyle: { color: 'rgba(214,51,108,.10)' },
            label: { color: '#9E1F4B', fontWeight: 700, fontSize: 12, position: 'insideTop' },
            data: [[{ name: 'Pandemia', xAxis: cubetas[ini]?.clave }, { xAxis: cubetas[fin]?.clave }]] },
        },
        {
          name: 'Prueba / período mixto', type: 'line', data: test, showSymbol: false,
          lineStyle: { width: 2.5, color: C.azul }, itemStyle: { color: C.azul },
          markLine: { silent: true, symbol: 'none', lineStyle: { color: C.textoSuave, type: 'dashed' },
            label: { formatter: 'Inicio de prueba', color: C.textoSuave, fontSize: 11 },
            data: corte > 0 ? [{ xAxis: cubetas[corte].clave }] : [] },
        },
      ],
    }
  }, [cubetas, visibles, conjunto, meses, nivel, rango])

  const onEvents = {
    datazoom: (evento) => {
      const nuevo = rangoZoom(evento, cubetas)
      if (nuevo) onRango(nuevo)
    },
  }

  return <Chart option={option} onEvents={onEvents} height={380} label={`Serie histórica de ${serie.nombre}`} />
}
