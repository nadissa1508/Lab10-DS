import { useMemo, useState } from 'react'
import Chart from './Chart.jsx'
import { C, FUENTE } from '../theme.js'
import { nf, fmtCorto } from '../data.js'

const METRICAS = {
  MAE: 'Error medio (MAE)',
  RMSE: 'Error con castigo a fallas grandes (RMSE)',
}

// Nivel medio de la serie en el conjunto de prueba, para expresar el error como
// porcentaje de lo que normalmente llega en un mes.
function nivelPrueba(datos, serie) {
  let s = 0, n = 0
  datos.conjunto.forEach((c, i) => { const v = serie.valores[i]; if (c === 'test' && v != null) { s += v; n++ } })
  return n ? s / n : null
}

export function useMetricas(datos, clave) {
  return useMemo(() => {
    const serie = datos.series.find((s) => s.clave === clave)
    const nivel = nivelPrueba(datos, serie)
    const filas = (datos.modelos?.metricas ?? []).filter((m) => m.serie === clave)
      .map((m) => ({ ...m, pctMAE: nivel ? (m.MAE / nivel) * 100 : null, pctRMSE: nivel ? (m.RMSE / nivel) * 100 : null }))
    return { serie, nivel, filas }
  }, [datos, clave])
}

// Visualización 7. Error de cada modelo en el conjunto de prueba para la serie
// seleccionada. Al hacer clic en una barra se elige ese modelo en todo el tablero.
export default function ErrorModelos({ datos, clave, modelo, onModelo }) {
  const [metrica, setMetrica] = useState('MAE')
  const { serie, filas } = useMetricas(datos, clave)
  const orden = useMemo(() => [...filas].sort((a, b) => a[metrica] - b[metrica]), [filas, metrica])
  const naive = filas.find((f) => f.modelo === 'Seasonal naive')
  const sinLSTM = filas.length > 0 && !filas.some((f) => f.modelo === 'LSTM')

  const option = useMemo(() => ({
    animation: false,
    textStyle: { fontFamily: FUENTE },
    grid: { left: 170, right: 120, top: 30, bottom: 36 },
    tooltip: {
      backgroundColor: '#fff', borderColor: C.borde, textStyle: { color: C.texto },
      formatter: (p) => {
        const f = orden[p.dataIndex]
        const pct = metrica === 'MAE' ? f.pctMAE : f.pctRMSE
        return `<b>${f.detalle}</b><br/>${METRICAS[metrica]}: ${nf.format(f[metrica])} viajeros por mes` +
          (pct != null ? `<br/>≈ ${pct.toFixed(0)} % de lo que llega en un mes promedio` : '') +
          `<br/><span style="color:${C.textoSuave}">Clic para elegir este modelo</span>`
      },
    },
    xAxis: {
      type: 'value', name: 'Viajeros por mes', nameLocation: 'middle', nameGap: 22,
      nameTextStyle: { color: C.textoSuave, fontSize: 12 },
      axisLabel: { color: C.textoSuave, fontSize: 12, formatter: fmtCorto }, splitLine: { lineStyle: { color: '#E6ECF1' } },
    },
    yAxis: {
      type: 'category', inverse: true, data: orden.map((f) => f.modelo),
      axisLabel: { color: C.texto, fontSize: 12.5, fontWeight: 600 }, axisLine: { show: false }, axisTick: { show: false },
    },
    series: [{
      type: 'bar', barWidth: 20, cursor: 'pointer',
      data: orden.map((f) => ({
        value: f[metrica],
        itemStyle: f.modelo === modelo
          ? { color: C.marino, borderRadius: [0, 4, 4, 0] }
          : { color: C.celeste, borderColor: C.azul, borderWidth: 1.5, borderRadius: [0, 4, 4, 0] },
      })),
      label: {
        show: true, position: 'right', color: C.texto, fontSize: 12, fontWeight: 600,
        formatter: (p) => { const f = orden[p.dataIndex]; const pct = metrica === 'MAE' ? f.pctMAE : f.pctRMSE
          return `${fmtCorto(p.value)}${pct != null ? `  (${pct.toFixed(0)} %)` : ''}` },
      },
      markLine: naive ? {
        silent: true, symbol: 'none', lineStyle: { color: C.textoSuave, type: 'dashed' },
        label: { formatter: 'Referencia mínima', color: C.textoSuave, fontSize: 11, position: 'start' },
        data: [{ xAxis: naive[metrica] }],
      } : undefined,
    }],
  }), [orden, metrica, modelo, naive])

  if (!filas.length) {
    return <p className="vacio">No hay resultados de modelos para {serie.nombre}. Ejecute la exportación de los Laboratorios 1 y 2 (notebooks/exportar_labs_1_y_2.md).</p>
  }

  return (
    <>
      <div className="seg seg-2" role="group" aria-label="Medida de error">
        {Object.keys(METRICAS).map((m) => (
          <button key={m} className={metrica === m ? 'on' : ''} aria-pressed={metrica === m} onClick={() => setMetrica(m)}>{m}</button>
        ))}
      </div>
      <Chart option={option} onEvents={{ click: (p) => onModelo(orden[p.dataIndex].modelo) }} height={46 * orden.length + 60}
        label={`${METRICAS[metrica]} de cada modelo para ${serie.nombre}`} />
      {sinLSTM && <p className="nota">La red neuronal (LSTM) solo se entrenó para el total nacional y América del Centro; para esta serie no hay pronóstico LSTM.</p>}
    </>
  )
}

// Tabla comparativa (elemento complementario, no cuenta como visualización).
export function TablaModelos({ datos, clave, modelo, onModelo }) {
  const { filas } = useMetricas(datos, clave)
  if (!filas.length) return <p className="vacio">Sin resultados de modelos para esta serie.</p>
  const orden = [...filas].sort((a, b) => a.RMSE - b.RMSE)
  return (
    <div className="tabla-scroll">
      <table className="tabla">
        <caption className="sr-only">Comparación de modelos en el conjunto de prueba</caption>
        <thead>
          <tr><th scope="col">Modelo</th><th scope="col">Error medio (MAE)</th><th scope="col">% del nivel</th><th scope="col">RMSE</th></tr>
        </thead>
        <tbody>
          {orden.map((f, i) => (
            <tr key={f.detalle} className={f.modelo === modelo ? 'on' : ''} onClick={() => onModelo(f.modelo)}>
              <th scope="row">{f.detalle}{i === 0 && <span className="pill">menor RMSE</span>}</th>
              <td>{nf.format(f.MAE)}</td>
              <td>{f.pctMAE == null ? '—' : f.pctMAE.toFixed(0) + ' %'}</td>
              <td>{nf.format(f.RMSE)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
