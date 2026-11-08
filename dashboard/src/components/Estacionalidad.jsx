import { useMemo } from 'react'
import Chart from './Chart.jsx'
import { C, FUENTE } from '../theme.js'
import { MESES_ES, etiquetaMes, nf } from '../data.js'

export default function Estacionalidad({ datos, serie, rango, onRango }) {
  const { celdas, anios } = useMemo(() => {
    const visibles = datos.meses.slice(rango[0], rango[1] + 1)
    const anios = [...new Set(visibles.map((m) => m.slice(0, 4)))]
    const celdas = visibles.flatMap((mes, n) => {
      const indice = rango[0] + n
      const valor = serie.valores[indice]
      return valor == null ? [] : [{ value: [+mes.slice(5) - 1, anios.indexOf(mes.slice(0, 4)), valor], mes, indice }]
    })
    return { celdas, anios }
  }, [datos, serie, rango])
  const option = useMemo(() => ({
    animation: false,
    textStyle: { fontFamily: FUENTE },
    grid: { left: 58, right: 22, top: 16, bottom: 80 },
    tooltip: { formatter: (p) => `${etiquetaMes(p.data.mes)}<br/>${nf.format(p.value[2])} viajeros` },
    xAxis: { type: 'category', data: MESES_ES, splitArea: { show: true }, axisLabel: { color: C.texto } },
    yAxis: { type: 'category', data: anios, inverse: true, axisLabel: { color: C.texto } },
    visualMap: { min: 0, max: Math.max(1, ...celdas.map((c) => c.value[2])), calculable: true,
      orient: 'horizontal', left: 'center', bottom: 0, inRange: { color: ['#F3F6F9', C.celeste, C.azul, C.marino] },
      text: ['Más viajeros', 'Menos viajeros'], textStyle: { color: C.texto } },
    series: [{ type: 'heatmap', data: celdas, cursor: 'pointer', itemStyle: { borderColor: '#FFFFFF', borderWidth: 2 },
      emphasis: { itemStyle: { borderColor: C.noche, borderWidth: 3 } } }],
  }), [celdas, anios])
  if (!celdas.length) return <p className="vacio">No hay datos para el período seleccionado.</p>
  return <Chart option={option} onEvents={{ click: (p) => onRango([p.data.indice, p.data.indice]) }}
    height={Math.max(260, anios.length * 26 + 105)} label={`Temporada alta y baja de ${serie.nombre}, por año y mes`} />
}
