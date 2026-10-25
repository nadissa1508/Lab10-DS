import { useMemo, useState } from 'react'
import Chart from './Chart.jsx'
import { C, FUENTE } from '../theme.js'

export default function Similitud({ datos, seleccion, onSeleccion }) {
  const [vista, setVista] = useState('pca')
  const puntos = datos.modelos?.similitud ?? []
  const distancias = datos.modelos?.distancias_catch22
  const nombre = clave => datos.series.find(s => s.clave === clave)?.nombre ?? clave
  const option = useMemo(() => {
    if (!puntos.length) return {}
    if (vista === 'distancias' && distancias) return {
      animation: false, textStyle: { fontFamily: FUENTE },
      grid: { left: 32, right: 32, top: 30, bottom: 100, containLabel: true },
      tooltip: { confine: true, formatter: p => `${nombre(distancias.series[p.value[0]])}<br/>${nombre(distancias.series[p.value[1]])}<br/>Distancia: ${p.value[2].toFixed(2)}` },
      xAxis: { type: 'category', data: distancias.series.map(nombre), axisLabel: { rotate: 40, fontSize: 12 } },
      yAxis: { type: 'category', data: distancias.series.map(nombre), axisLabel: { fontSize: 12 } },
      visualMap: { min: 0, max: Math.max(...distancias.valores.flat()), orient: 'horizontal', bottom: 0, left: 'center', inRange: { color: [C.celeste, C.azul, C.noche] }, text: ['Mayor distancia', 'Menor distancia'] },
      series: [{ type: 'heatmap', data: distancias.valores.flatMap((fila, y) => fila.map((d, x) => [x, y, d])), emphasis: { itemStyle: { borderColor: C.marino, borderWidth: 2 } } }] }
    return { animation: false, textStyle: { fontFamily: FUENTE },
      grid: { left: 50, right: 50, top: 30, bottom: 60, containLabel: true },
      tooltip: { confine: true, formatter: p => `${nombre(p.data.clave)}<br/>Grupo exploratorio ${p.data.grupo + 1}<br/>Clic para seleccionar la serie` },
      xAxis: { type: 'value', name: `PC1 (${(puntos[0].var_PC1 * 100).toFixed(1)} %)`, nameLocation: 'middle', nameGap: 32, axisLabel: { fontSize: 12 } },
      yAxis: { type: 'value', name: `PC2 (${(puntos[0].var_PC2 * 100).toFixed(1)} %)`, axisLabel: { fontSize: 12 } },
      series: [{ type: 'scatter', symbolSize: 22, data: puntos.map(p => ({ clave: p.serie, grupo: p.grupo, name: nombre(p.serie), value: [p.PC1, p.PC2], symbol: ['circle', 'diamond', 'triangle', 'rect'][((p.grupo ?? 0) % 4 + 4) % 4], itemStyle: { color: p.serie === seleccion ? C.marino : C.celeste, borderColor: C.azul, borderWidth: p.serie === seleccion ? 3 : 1.5 } })) }] }
  }, [datos, puntos, seleccion, vista, distancias])
  if (!puntos.length) return <p className="vacio">No hay coordenadas catch22 exportadas para comparar las series.</p>
  const explicada = 100 * (puntos[0].var_PC1 + puntos[0].var_PC2)
  return <>
    <div className="controles-vista"><label>Vista de similitud<select value={vista} onChange={e => setVista(e.target.value)}><option value="pca">Mapa PCA</option>{distancias && <option value="distancias">Distancias en 22 características</option>}</select></label>
      <label>Seleccionar serie en el mapa<select value={seleccion} onChange={e => onSeleccion(e.target.value)}>{puntos.map(p => <option key={p.serie} value={p.serie}>{nombre(p.serie)}</option>)}</select></label></div>
    <Chart option={option} height={470} label="V9. Similitud exploratoria entre las siete series" onEvents={{ click: p => {
      const clave = vista === 'distancias' ? distancias.series[p.value[0]] : p.data.clave
      if (clave) onSeleccion(clave)
    } }} />
    <p className="nota">En el mapa, puntos cercanos tienen perfiles temporales parecidos; las formas distinguen grupos exploratorios. Los ejes resumen {explicada.toFixed(1)} % de la variación de 22 características catch22 estandarizadas. Una proyección pierde información: compruebe también las distancias completas. Menor distancia implica mayor semejanza.</p>
    <p className="nota"><b>Alcance fijo:</b> este análisis resume las series completas de 2009 a junio de 2026, incluyendo la prueba. No cambia al filtrar fechas ni demuestra capacidad predictiva o causalidad. Seleccionar un punto, una celda o una opción modifica la serie compartida con V1, V4, V6 y V7; los filtros de fechas se conservan.</p>
  </>
}
