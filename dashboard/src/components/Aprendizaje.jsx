import { useMemo, useState } from 'react'
import Chart from './Chart.jsx'
import { C, FUENTE } from '../theme.js'

export default function Aprendizaje({ datos, clave }) {
  const [configuracion, setConfiguracion] = useState('')
  const curvas = (datos.modelos?.perdidas ?? []).filter((p) => p.serie === clave)
  const curva = curvas.find((p) => p.config === configuracion) ?? curvas[0]
  const option = useMemo(() => ({
    animation: false, textStyle: { fontFamily: FUENTE },
    grid: { left: 65, right: 20, top: 50, bottom: 45 },
    legend: { data: ['Ajuste', 'Validación'], textStyle: { color: C.texto } },
    tooltip: { trigger: 'axis', valueFormatter: (v) => Number(v).toFixed(4) },
    xAxis: { type: 'category', name: 'Época', nameLocation: 'middle', nameGap: 25, data: curva?.ajuste.map((_, i) => i + 1) ?? [], axisLabel: { color: C.textoSuave } },
    yAxis: { type: 'value', name: 'MSE estandarizado', axisLabel: { color: C.textoSuave } },
    series: [
      { name: 'Ajuste', type: 'line', showSymbol: false, data: curva?.ajuste ?? [], itemStyle: { color: C.marino } },
      { name: 'Validación', type: 'line', showSymbol: false, data: curva?.validacion ?? [], itemStyle: { color: C.azul }, lineStyle: { type: 'dashed' },
        markLine: { silent: true, symbol: 'none', data: curva ? [{ xAxis: curva.mejor_epoca - 1, label: { formatter: `Mejor época: ${curva.mejor_epoca}`, fontSize: 11 }, lineStyle: { color: C.acento } }] : [] } },
    ],
  }), [curva])
  if (!curvas.length) return <p className="vacio">No hay entrenamiento LSTM para esta serie. Seleccione el total nacional o América del Centro.</p>
  return <>
    <label className="control">Configuración LSTM<select value={curva.config} onChange={(e) => setConfiguracion(e.target.value)}>{curvas.map((p) => <option key={p.config}>{p.config}</option>)}</select></label>
    <Chart option={option} height={330} label="Pérdida de ajuste y validación de la LSTM por época" />
    <p className="nota">La pérdida está en la escala estandarizada del entrenamiento y no en viajeros. Estas curvas corresponden al entrenamiento completo y no cambian con el filtro de fechas. Una curva de validación que sube mientras baja la de ajuste puede indicar sobreajuste.</p>
  </>
}
