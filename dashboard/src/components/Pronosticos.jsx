import { useMemo, useState } from 'react'
import Chart from './Chart.jsx'
import { C, FUENTE } from '../theme.js'
import { agrupar, etiquetaMes, nf, fmtCorto } from '../data.js'

export const MODELOS = ['Prophet', 'Holt-Winters', 'LSTM', 'Seasonal naive', 'ARIMA', 'Suavizamiento exp. simple']

export default function Pronosticos({ datos, serie, modelo, nivel, rango }) {
  const [intervalo, setIntervalo] = useState(true)
  const pron = datos.modelos?.pronosticos.find((p) => p.serie === serie.clave && p.modelo === modelo)
  const { cubetas, predichos, inferiores, superiores } = useMemo(() => {
    const alinear = (campo) => datos.meses.map((_, i) => pron?.[campo]?.[i - pron.desde] ?? null)
    const agrupa = (valores) => agrupar(datos.meses, valores, nivel, rango[0], rango[1])
    return { cubetas: agrupa(serie.valores), predichos: agrupa(alinear('predicho')),
      inferiores: agrupa(alinear('li')), superiores: agrupa(alinear('ls')) }
  }, [datos, serie, pron, nivel, rango])
  const hayPred = predichos.some((c) => c.valor != null)
  const hayIntervalo = nivel === 'mensual' && inferiores.some((c) => c.valor != null)
  const fmtMes = (m) => nivel === 'mensual' ? etiquetaMes(m) : m
  const option = useMemo(() => ({
    animation: false, textStyle: { fontFamily: FUENTE },
    grid: { left: 65, right: 22, top: 55, bottom: 55 },
    legend: { data: ['Observado', `Estimación · ${modelo}`], textStyle: { color: C.texto } },
    tooltip: { trigger: 'axis', formatter: (ps) => {
      const i = ps[0].dataIndex
      const filas = [`${fmtMes(cubetas[i].clave)}`, `Observado: ${cubetas[i].valor == null ? 'Sin dato' : nf.format(cubetas[i].valor)} viajeros`,
        `Estimación · ${modelo}: ${predichos[i].valor == null ? 'Sin pronóstico' : nf.format(predichos[i].valor) + ' viajeros'}`]
      if (intervalo && hayIntervalo && inferiores[i].valor != null) filas.push(`Intervalo 80 %: ${nf.format(inferiores[i].valor)} a ${nf.format(superiores[i].valor)}`)
      if (cubetas[i].parcial && nivel !== 'mensual') filas.push('Período parcial')
      if (predichos[i].n > 0 && predichos[i].n < cubetas[i].n) filas.push('La estimación cubre solo los meses de prueba de este período')
      return filas.join('<br/>')
    } },
    xAxis: { type: 'category', data: cubetas.map((c) => c.clave), boundaryGap: false,
      axisLabel: { hideOverlap: true, formatter: fmtMes, color: C.textoSuave } },
    yAxis: { type: 'value', name: 'Viajeros', axisLabel: { formatter: fmtCorto, color: C.textoSuave } },
    series: [
      ...(intervalo && hayIntervalo ? [
        { name: 'Límite inferior', type: 'line', data: inferiores.map((c) => c.valor), stack: 'intervalo', stackStrategy: 'all', symbol: 'none', lineStyle: { opacity: 0 }, silent: true },
        { name: 'Intervalo 80 %', type: 'line', data: superiores.map((c, i) => c.valor == null ? null : c.valor - inferiores[i].valor), stack: 'intervalo', stackStrategy: 'all', symbol: 'none', lineStyle: { opacity: 0 }, areaStyle: { color: C.acento, opacity: 0.15 }, silent: true },
      ] : []),
      { name: 'Observado', type: 'line', data: cubetas.map((c) => c.valor), showSymbol: false, itemStyle: { color: C.marino }, lineStyle: { width: 2.5 } },
      { name: `Estimación · ${modelo}`, type: 'line', data: predichos.map((c) => c.valor), showSymbol: false, itemStyle: { color: C.acento }, lineStyle: { width: 2.5, type: 'dashed' },
        markLine: { silent: true, symbol: 'none', label: { formatter: 'Inicio de prueba', fontSize: 11 },
          data: cubetas.some((c) => c.primero <= 147 && c.ultimo >= 147) ? [{ xAxis: cubetas.find((c) => c.primero <= 147 && c.ultimo >= 147).clave }] : [] } },
    ],
  }), [cubetas, predichos, inferiores, superiores, intervalo, hayIntervalo, modelo, nivel])
  if (!pron) return <p className="vacio">No hay pronóstico {modelo} para {serie.nombre}. LSTM está disponible para el total nacional y América del Centro.</p>
  if (!hayPred) return <p className="vacio">No hay predicciones en este período. Seleccione meses entre abril de 2021 y junio de 2026.</p>
  return <>
    <label className="check"><input type="checkbox" checked={intervalo} onChange={(e) => setIntervalo(e.target.checked)} /> Mostrar intervalo de predicción del 80 %</label>
    <Chart option={option} height={370} label={`Valores observados y estimados por ${modelo} para ${serie.nombre}`} />
    <p className="nota">{hayIntervalo ? 'La banda representa el intervalo mensual disponible.' : nivel !== 'mensual' ? 'Los intervalos se muestran en el nivel mensual; sumar límites mensuales no produce un intervalo válido para un año o trimestre.' : 'Este modelo no incluye intervalos de predicción.'}</p>
    <p className="nota">Se conservan los pronósticos originales, incluidos los negativos. Un valor negativo no representa viajeros posibles; indica una limitación del modelo. Las métricas se calculan sobre los 63 meses de prueba.</p>
  </>
}
