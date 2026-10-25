import { useMemo, useState } from 'react'
import Chart from './Chart.jsx'
import { C, FUENTE } from '../theme.js'
import { etiquetaMes, fmtCorto, nf } from '../data.js'
import { prepararPronostico } from '../analisis.js'

export default function Pronosticos({ datos, serie, modelo, onModelo, nivel, rango }) {
  const [intervalos, setIntervalos] = useState(true)
  const disponibles = (datos.modelos?.pronosticos ?? []).filter(p => p.serie === serie.clave)
  const elegido = disponibles.find(p => p.modelo === modelo) ?? disponibles[0]
  const vista = useMemo(() => elegido ? prepararPronostico(datos, elegido, nivel, rango) : null, [datos, elegido, nivel, rango])
  const option = useMemo(() => {
    if (!vista) return {}
    const lineas = [
      { name: 'Observado en prueba', type: 'line', showSymbol: false, data: vista.real.map(c => c.valor), itemStyle: { color: C.marino }, lineStyle: { width: 2.5 } },
      { name: `Estimación · ${elegido.modelo}`, type: 'line', showSymbol: false, data: vista.estimado.map(c => c.valor), itemStyle: { color: C.acento }, lineStyle: { width: 2.5, type: 'dashed' } },
    ]
    if (intervalos && nivel === 'mensual' && elegido.li.some(Number.isFinite)) {
      for (const [campo, nombre] of [['li', 'Límite inferior 80 %'], ['ls', 'Límite superior 80 %']]) {
        lineas.push({ name: nombre, type: 'line', showSymbol: false, data: vista.real.map(c => elegido[campo][c.primero - elegido.desde] ?? null), itemStyle: { color: C.acento }, lineStyle: { type: 'dotted', width: 1 } })
      }
    }
    return { animation: false, textStyle: { fontFamily: FUENTE },
      grid: { left: 68, right: 26, top: 90, bottom: 60 }, legend: { top: 0, textStyle: { fontSize: 12, color: C.texto } },
      tooltip: { trigger: 'axis', confine: true, valueFormatter: v => v == null ? 'Sin dato' : nf.format(v) },
      xAxis: { type: 'category', data: vista.real.map(c => c.clave), axisLabel: { hideOverlap: true, color: C.textoSuave, fontSize: 12, formatter: v => nivel === 'mensual' ? etiquetaMes(v) : v } },
      yAxis: { type: 'value', name: nivel === 'mensual' ? 'Viajeros / mes' : 'Viajeros / período', axisLabel: { formatter: fmtCorto, fontSize: 12 }, splitLine: { lineStyle: { color: '#E6ECF1' } } },
      series: lineas }
  }, [vista, elegido, nivel, intervalos])

  if (!elegido) return <p className="vacio">No hay pronósticos guardados para esta serie.</p>
  const conIntervalo = elegido.li.some(Number.isFinite)
  const negativos = elegido.predicho.some(v => v < 0)
  return <>
    <div className="controles-vista">
      <label>Modelo predictivo<select value={elegido.modelo} onChange={e => onModelo(e.target.value)}>{disponibles.map(p => <option key={p.detalle} value={p.modelo}>{p.modelo}</option>)}</select></label>
      <label className="check"><input type="checkbox" checked={intervalos} disabled={!conIntervalo || nivel !== 'mensual'} onChange={e => setIntervalos(e.target.checked)} /> Ver límites mensuales del 80 %</label>
    </div>
    <p className="nota">Modelo seleccionado: {elegido.detalle}. {elegido.modelo !== modelo && `No hay ${modelo} para esta serie; se muestra ${elegido.modelo}.`}</p>
    {vista.errores ? <><Chart option={option} height={440} label={`V6. Observado frente a estimación de ${elegido.modelo} para ${serie.nombre}`} />
      <p className="nota"><b>Error en los meses de prueba visibles:</b> MAE {nf.format(vista.errores.MAE)} y RMSE {nf.format(vista.errores.RMSE)} viajeros/mes · {vista.errores.n} meses. Las métricas siempre usan frecuencia mensual.</p>
    </> : <p className="vacio">El período seleccionado no contiene meses de prueba. Seleccione fechas desde abril de 2021.</p>}
    <p className="nota">Evaluación histórica de abril de 2021 a junio de 2026; no es una proyección futura. {conIntervalo ? 'Los límites del 80 % provienen de la exportación existente y no garantizan que el dato real quede dentro.' : 'Este modelo no dispone de intervalos exportados; no se inventa una banda de confianza.'} {nivel !== 'mensual' && 'Los límites se ocultan al agregar: sumar límites mensuales no produce un intervalo válido para un trimestre o un año.'}</p>
    {negativos && <p className="aviso"><b>Estimaciones negativas:</b> el modelo genera valores imposibles como conteos de visitantes. Se conservan para mostrar sus fallas y mantener la evaluación original; no usarlo como cifra operativa sin revisión.</p>}
    <p className="nota">Las LSTM disponibles son recursivas: no utilizan los valores reales de prueba como rezagos. El repositorio documenta una nueva ejecución de las especificaciones anteriores para exportar resultados; sus errores pueden diferir de los informes originales. El tablero no entrena modelos.</p>
  </>
}
