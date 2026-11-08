import { useMemo } from 'react'
import Chart from './Chart.jsx'
import { C, FUENTE } from '../theme.js'

export default function Similitud({ datos, seleccion, onSeleccion }) {
  const puntos = datos.modelos?.similitud ?? []
  const grupos = [...new Set(puntos.map((p) => p.grupo))].sort()
  const option = useMemo(() => ({
    animation: false, textStyle: { fontFamily: FUENTE },
    grid: { left: 65, right: 55, top: 50, bottom: 55 },
    legend: { data: grupos.map((g) => `Grupo ${g}`), textStyle: { color: C.texto } },
    tooltip: { formatter: (p) => `${p.data.nombre}<br/>Grupo ${p.data.grupo}<br/>PC1: ${p.value[0].toFixed(3)}<br/>PC2: ${p.value[1].toFixed(3)}<br/>Clic para seleccionar la serie` },
    xAxis: { type: 'value', name: `PC1 (${((puntos[0]?.var_PC1 ?? 0) * 100).toFixed(1)} %)`, nameLocation: 'middle', nameGap: 30, axisLabel: { color: C.textoSuave } },
    yAxis: { type: 'value', name: `PC2 (${((puntos[0]?.var_PC2 ?? 0) * 100).toFixed(1)} %)`, axisLabel: { color: C.textoSuave } },
    series: grupos.map((g, i) => ({
      name: `Grupo ${g}`, type: 'scatter', symbol: ['circle', 'diamond', 'triangle'][i % 3],
      data: puntos.filter((p) => p.grupo === g).map((p) => ({ ...p, value: [p.PC1, p.PC2], nombre: datos.series.find((s) => s.clave === p.serie)?.nombre ?? p.serie,
        symbolSize: p.serie === seleccion ? 24 : 16, itemStyle: { color: [C.marino, C.azul, C.textoSuave][i % 3], borderColor: p.serie === seleccion ? C.noche : '#FFFFFF', borderWidth: 2 } })),
      cursor: 'pointer', emphasis: { scale: 1.3 },
    })),
  }), [datos, puntos, seleccion])
  if (!puntos.length) return <p className="vacio">No hay coordenadas de similitud disponibles.</p>
  return <>
    <Chart option={option} height={340} onEvents={{ click: (p) => onSeleccion(p.data.serie) }} label="Similitud de las siete series según catch22 y PCA" />
    <p className="nota">La cercanía resume semejanzas en la forma de las series. No muestra distancia geográfica ni demuestra causas. El plano resume las 22 características; los grupos y coordenadas corresponden al análisis original y no cambian con el período.</p>
  </>
}
