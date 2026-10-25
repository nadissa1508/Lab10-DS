import { useEffect, useState } from 'react'

export const MESES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
export const nf = new Intl.NumberFormat('es-GT', { maximumFractionDigits: 0 })
export const fmtCorto = (v) =>
  v >= 1e6 ? (v / 1e6).toFixed(2) + ' M' : v >= 1e3 ? Math.round(v / 1e3) + ' mil' : String(Math.round(v))

export function useSeries() {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState(null)
  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'data/series.json')
      .then((r) => { if (!r.ok) throw new Error('No se pudo leer el archivo de datos'); return r.json() })
      .then(setDatos)
      .catch((e) => setError(e.message))
  }, [])
  return { datos, error }
}

export const etiquetaMes = (ym) => {
  const [y, m] = ym.split('-')
  return `${MESES_ES[+m - 1]} ${y}`
}

// Agrupa los meses [desde, hasta] (índices) en cubetas mensual / trimestral / anual.
export function agrupar(meses, valores, nivel, desde = 0, hasta = meses.length - 1) {
  const mapa = new Map()
  for (let i = desde; i <= hasta; i++) {
    const [y, m] = meses[i].split('-').map(Number)
    const clave = nivel === 'anual' ? `${y}` : nivel === 'trimestral' ? `${y} T${Math.ceil(m / 3)}` : meses[i]
    if (!mapa.has(clave)) mapa.set(clave, { clave, valor: 0, n: 0, primero: i, ultimo: i, nulos: 0 })
    const c = mapa.get(clave)
    if (valores[i] == null) c.nulos++
    else { c.valor += valores[i]; c.n++ }
    c.ultimo = i
  }
  const esperado = nivel === 'anual' ? 12 : nivel === 'trimestral' ? 3 : 1
  return [...mapa.values()].map((c) => ({ ...c, valor: c.n ? c.valor : null, parcial: c.n < esperado }))
}

// Índice de recuperación (2019 = 100) por cubeta, desde 2019 en adelante. Cada cubeta se
// compara con los mismos meses de 2019, de modo que un año o trimestre parcial no
// aparece como una caída.
export function indiceRecuperacion(meses, valores, nivel, desde = 0, hasta = meses.length - 1) {
  const base = {}
  meses.forEach((ym, i) => { if (ym.startsWith('2019-')) base[ym.slice(5)] = valores[i] })
  const inicio = Math.max(desde, meses.indexOf('2019-01'))
  if (inicio > hasta) return []
  return agrupar(meses, valores, nivel, inicio, hasta).map((c) => {
    let num = 0, den = 0
    for (let i = c.primero; i <= c.ultimo; i++) {
      const b = base[meses[i].slice(5)]
      if (valores[i] == null || b == null) continue
      num += valores[i]; den += b
    }
    return { ...c, indice: den ? (num / den) * 100 : null }
  })
}

export const sumaRango = (valores, desde, hasta) => {
  let s = 0
  for (let i = desde; i <= hasta; i++) s += valores[i] ?? 0
  return s
}
