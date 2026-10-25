import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { agrupar } from '../src/data.js'
import { errores, prepararPronostico, rangoZoom } from '../src/analisis.js'

const datos = JSON.parse(readFileSync(new URL('../public/data/series.json', import.meta.url), 'utf8'))
const composicion = JSON.parse(readFileSync(new URL('../public/data/composicion.json', import.meta.url), 'utf8'))

test('V1 agrupa flujos sin perder ceros ni convertir faltantes en datos', () => {
  const meses = ['2026-01', '2026-02', '2026-03', '2026-04']
  assert.deepEqual(agrupar(meses, [10, 0, 20, 5], 'trimestral').map(c => c.valor), [30, 5])
  assert.equal(agrupar(meses, [10, 0, 20, 5], 'anual', 1, 3)[0].valor, 25)
  assert.equal(agrupar(meses, [null, null, null, null], 'anual')[0].valor, null)
  assert.equal(agrupar(meses, [10, null, 20, 5], 'anual')[0].parcial, true)
})
test('Zoom devuelve el intervalo mensual de cubetas y soporta eventos batch', () => {
  const c = [{ clave: '2026 T1', primero: 0, ultimo: 2 }, { clave: '2026 T2', primero: 3, ultimo: 5 }]
  assert.deepEqual(rangoZoom({ batch: [{ start: 50, end: 100 }] }, c), [3, 5])
  assert.deepEqual(rangoZoom({ startValue: '2026 T1', endValue: '2026 T2' }, c), [0, 5])
  assert.equal(rangoZoom({}, []), null)
})
test('Errores excluyen faltantes, conservan negativos y aceptan reales cero', () => {
  assert.deepEqual(errores([0, 10, null], [2, 8, 7]), { n: 2, MAE: 2, RMSE: 2 })
  assert.equal(errores([0], [-5]).MAE, 5)
  assert.equal(errores([null], [1]), null)
})
test('V6 tiene al menos tres modelos por serie y conserva los 63 meses de prueba', () => {
  for (const s of datos.series) {
    const modelos = datos.modelos.pronosticos.filter(p => p.serie === s.clave)
    assert.ok(new Set(modelos.map(p => p.modelo)).size >= 3)
    for (const p of modelos) {
      assert.equal(p.desde, 147); assert.equal(p.real.length, 63); assert.equal(p.predicho.length, 63)
      p.real.forEach((v, j) => assert.ok(Math.abs(v - s.valores[p.desde + j]) <= 0.51))
      assert.notEqual(p.detalle, 'LSTM un paso')
      const metrica = datos.modelos.metricas.find(m => m.serie === p.serie && m.detalle === p.detalle)
      const calculada = errores(p.real, p.predicho)
      assert.ok(Math.abs(calculada.MAE - metrica.MAE) <= 1)
      assert.ok(Math.abs(calculada.RMSE - metrica.RMSE) <= 1)
    }
  }
})
test('V6 no inventa predicciones en entrenamiento y agrega solo meses seleccionados', () => {
  const p = datos.modelos.pronosticos[0]
  const entrenamiento = prepararPronostico(datos, p, 'mensual', [0, 146])
  assert.equal(entrenamiento.errores, null)
  assert.ok(entrenamiento.estimado.every(c => c.valor === null))
  const parcial = prepararPronostico(datos, p, 'anual', [205, 209])
  assert.equal(parcial.errores.n, 5)
  const esperado = p.predicho.slice(205 - p.desde).reduce((s, v) => s + v, 0)
  assert.equal(parcial.estimado[0].valor, esperado)
  assert.equal(parcial.estimado[0].parcial, true)
})
test('Los límites originales existen solo para modelos que los exportaron', () => {
  for (const p of datos.modelos.pronosticos) {
    assert.equal(p.li.length, 63); assert.equal(p.ls.length, 63)
    p.li.forEach((v, i) => { assert.equal(v == null, p.ls[i] == null); if (v != null) assert.ok(v <= p.ls[i]) })
    if (p.modelo === 'LSTM') assert.ok(p.li.every(v => v === null))
  }
})
test('V9 conserva siete coordenadas y distancias simétricas en las 22 dimensiones', () => {
  const puntos = datos.modelos.similitud, d = datos.modelos.distancias_catch22
  assert.equal(puntos.length, 7); assert.equal(d.series.length, 7)
  assert.ok(Math.abs(puntos[0].var_PC1 + puntos[0].var_PC2 - 0.6578554508830274) < 1e-8)
  d.valores.forEach((fila, i) => fila.forEach((v, j) => { assert.ok(Number.isFinite(v) && v >= 0); assert.ok(Math.abs(v - d.valores[j][i]) < 1e-10); if (i === j) assert.equal(v, 0) }))
})
test('Composición vía/tipo concilia por separado en cada uno de los 210 meses', () => {
  const total = datos.series.find(s => s.clave === 'total')
  assert.equal(composicion.registros.length, 1050)
  datos.meses.forEach((mes, i) => {
    for (const dimension of ['via', 'tipo']) {
      const suma = composicion.registros.filter(r => r.fecha === mes && r.dimension === dimension).reduce((s, r) => s + r.viajeros, 0)
      assert.ok(Math.abs(suma - total.valores[i]) <= 0.51, `${mes}: ${dimension}`)
    }
  })
  assert.equal(composicion.metadatos.fuente.commit.length, 40)
  assert.equal(composicion.metadatos.fuente.sha256.length, 64)
})
