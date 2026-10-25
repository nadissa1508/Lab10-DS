import { agrupar } from './data.js'

// Las métricas se calculan en viajeros/mes, también cuando las líneas se agrupan.
export function errores(real, predicho) {
  const pares = real.flatMap((v, i) => Number.isFinite(v) && Number.isFinite(predicho[i]) ? [[v, predicho[i]]] : [])
  if (!pares.length) return null
  return { n: pares.length,
    MAE: pares.reduce((s, [a, b]) => s + Math.abs(a - b), 0) / pares.length,
    RMSE: Math.sqrt(pares.reduce((s, [a, b]) => s + (a - b) ** 2, 0) / pares.length) }
}

export function prepararPronostico(datos, pronostico, nivel, rango) {
  const real = Array(datos.meses.length).fill(null), estimado = [...real]
  for (let j = 0; j < pronostico.predicho.length; j++) {
    const i = pronostico.desde + j
    real[i] = pronostico.real[j]
    estimado[i] = pronostico.predicho[j]
  }
  return {
    real: agrupar(datos.meses, real, nivel, ...rango),
    estimado: agrupar(datos.meses, estimado, nivel, ...rango),
    errores: errores(real.slice(rango[0], rango[1] + 1), estimado.slice(rango[0], rango[1] + 1)),
  }
}

export function rangoZoom(evento, cubetas) {
  const z = evento.batch?.[0] ?? evento
  const indice = (v, pct, defecto) => typeof v === 'string' ? cubetas.findIndex(c => c.clave === v)
    : Number.isFinite(v) ? Math.round(v) : Math.round((pct ?? defecto) / 100 * (cubetas.length - 1))
  const a = cubetas[Math.max(0, indice(z.startValue, z.start, 0))]
  const b = cubetas[Math.min(cubetas.length - 1, indice(z.endValue, z.end, 100))]
  return a && b ? [a.primero, b.ultimo] : null
}
