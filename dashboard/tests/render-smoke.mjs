// Comprueba que las vistas React aceptan todos los artefactos reales sin excepciones.
// No sustituye una revisión visual ni las pruebas de usabilidad del equipo.
import React from 'react'
import { renderToString } from 'react-dom/server'
import { createServer } from 'vite'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const datos = JSON.parse(readFileSync(new URL('../public/data/series.json', import.meta.url), 'utf8'))
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { default: Pronosticos } = await server.ssrLoadModule('/src/components/Pronosticos.jsx')
  const { default: Similitud } = await server.ssrLoadModule('/src/components/Similitud.jsx')
  const { default: SerieHistorica } = await server.ssrLoadModule('/src/components/SerieHistorica.jsx')
  let curvas = 0
  for (const serie of datos.series) {
    for (const nivel of ['mensual', 'trimestral', 'anual']) {
      const html = renderToString(React.createElement(SerieHistorica, { datos, serie, nivel, rango: [205, 209], onRango() {} }))
      assert.ok(html.includes('Serie histórica'))
    }
    for (const p of datos.modelos.pronosticos.filter(p => p.serie === serie.clave)) {
      for (const nivel of ['mensual', 'anual']) {
        const html = renderToString(React.createElement(Pronosticos, { datos, serie, modelo: p.modelo, onModelo() {}, nivel, rango: [147, 209] }))
        assert.ok(html.replace(/<!--.*?-->/g, '').includes('63 meses'))
        assert.ok(html.includes('Estimación') || html.includes('estimación'))
        curvas++
      }
    }
    const mapa = renderToString(React.createElement(Similitud, { datos, seleccion: serie.clave, onSeleccion() {} }))
    assert.ok(mapa.includes('65.8'))
  }
  console.log(`Render correcto: ${curvas} combinaciones de pronóstico, 21 históricos y 7 selecciones de similitud`)
} finally {
  await server.close()
}
