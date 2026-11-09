import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

const datos = JSON.parse(readFileSync(new URL('../public/data/series.json', import.meta.url), 'utf8'))
const nf = new Intl.NumberFormat('es-GT', { maximumFractionDigits: 0 })
const indice = (mes) => String(datos.meses.indexOf(mes))
const serie = (clave) => datos.series.find((s) => s.clave === clave)
const sumar = (clave, desde, hasta) => serie(clave).valores.slice(+indice(desde), +indice(hasta) + 1).reduce((s, v) => s + (v ?? 0), 0)
const navegar = (page, nombre) => page.getByRole('navigation').getByRole('button', { name: new RegExp(nombre) }).click()

async function periodo(page, desde, hasta) {
  await page.getByRole('combobox', { name: 'Desde', exact: true }).selectOption(indice(desde))
  await page.getByRole('combobox', { name: 'Hasta', exact: true }).selectOption(indice(hasta))
}

async function registrar(page, info, tarea, inicio, acciones, resultado) {
  await info.attach('medicion', {
    body: JSON.stringify({ tarea, segundos: (performance.now() - inicio) / 1000, acciones, resultado, modalidad: 'automatizada' }),
    contentType: 'application/json',
  })
  await page.screenshot({ path: info.outputPath(`prueba-${tarea}.png`), fullPage: true })
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('pregunta de gestión: La Aurora en 2019', async ({ page }, info) => {
  const inicio = performance.now()
  await page.getByRole('combobox', { name: 'Serie', exact: true }).selectOption('frontera_aurora')
  await periodo(page, '2019-01', '2019-12')
  const viajeros = sumar('frontera_aurora', '2019-01', '2019-12')
  const participacion = viajeros / sumar('total', '2019-01', '2019-12') * 100
  await expect(page.locator('.kpi').first()).toContainText(nf.format(viajeros))
  await expect(page.locator('.kpi').nth(2)).toContainText('dic 2019')
  await expect(page.getByRole('heading', { name: 'Evolución de los viajeros: 01 La Aurora' })).toBeVisible()
  const barras = page.getByRole('img', { name: 'Participación de regiones y fronteras en el total nacional' })
  await barras.hover({ position: { x: 230, y: 162 } })
  await expect(barras).toContainText('35.9 % del total nacional')
  await expect(barras).toContainText(`${nf.format(viajeros)} viajeros`)
  await registrar(page, info, 1, inicio, 3, { viajeros, participacion, mesMayor: '2019-12' })
})

test('detalle anual, trimestral, mensual y regreso', async ({ page }, info) => {
  const inicio = performance.now()
  await periodo(page, '2019-01', '2019-12')
  for (const nivel of ['anual', 'trimestral', 'mensual']) {
    await page.getByRole('button', { name: nivel, exact: true }).click()
    await expect(page.getByRole('button', { name: nivel, exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('img', { name: 'Serie histórica de Total nacional' }).locator('canvas')).toHaveCount(1)
    const grafica = page.getByRole('img', { name: 'Serie histórica de Total nacional' })
    await page.getByRole('heading', { level: 1 }).hover()
    const box = await grafica.boundingBox()
    await grafica.hover({ position: { x: box.width - 25, y: 120 } })
    const valor = nivel === 'anual' ? sumar('total', '2019-01', '2019-12') : nivel === 'trimestral' ? sumar('total', '2019-10', '2019-12') : sumar('total', '2019-12', '2019-12')
    await expect(grafica).toContainText(`${nf.format(valor)} viajeros`)
  }
  await page.getByRole('button', { name: 'Restablecer filtros' }).click()
  await expect(page.getByRole('combobox', { name: 'Desde', exact: true })).toHaveValue('0')
  await expect(page.getByRole('combobox', { name: 'Hasta', exact: true })).toHaveValue(String(datos.meses.length - 1))
  await expect(page.getByRole('button', { name: 'mensual', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await registrar(page, info, 2, inicio, 6, {
    anio2019: sumar('total', '2019-01', '2019-12'),
    trimestreMayor: sumar('total', '2019-10', '2019-12'),
    diciembre: sumar('total', '2019-12', '2019-12'),
    regreso: 'Total nacional; ene 2009 a jun 2026; mensual',
  })
})

test('predicciones de tres modelos y comparación del RMSE', async ({ page }, info) => {
  const inicio = performance.now()
  await page.getByRole('combobox', { name: 'Serie', exact: true }).selectOption('region_america_central')
  await periodo(page, '2023-12', '2023-12')
  await navegar(page, 'Pronósticos')
  const resultados = {}
  for (const modelo of ['Prophet', 'Holt-Winters', 'LSTM']) {
    await page.getByRole('combobox', { name: 'Modelo', exact: true }).selectOption(modelo)
    const grafica = page.getByRole('img', { name: `Valores observados y estimados por ${modelo} para América del Centro` })
    await expect(grafica.locator('canvas')).toHaveCount(1)
    const pron = datos.modelos.pronosticos.find((p) => p.serie === 'region_america_central' && p.modelo === modelo)
    resultados[modelo] = pron.predicho[+indice('2023-12') - pron.desde]
    await page.getByRole('heading', { level: 1 }).hover()
    const box = await grafica.boundingBox()
    await grafica.hover({ position: { x: box.width / 2, y: 180 } })
    await expect(grafica).toContainText(`Estimación · ${modelo}: ${nf.format(resultados[modelo])} viajeros`)
  }
  await page.screenshot({ path: info.outputPath('pronosticos.png'), fullPage: true })
  await navegar(page, 'Modelos y confianza')
  const filas = page.locator('.tabla tbody tr')
  await expect(filas.first()).toContainText('Prophet')
  await expect(filas.first()).toContainText('67,838')
  await registrar(page, info, 3, inicio, 8, { ...resultados, menorRMSE: 'Prophet', RMSE: 67838 })
})

test('nueve gráficas disponibles sin errores de ejecución', async ({ page }, info) => {
  const errores = []
  page.on('pageerror', (error) => errores.push(error.message))
  let cantidad = 0
  for (const [nombre, graficas] of [['Resumen', 2], ['Demanda y mercados', 1], ['Estacionalidad', 2], ['Pronósticos', 2], ['Modelos y confianza', 2]]) {
    await navegar(page, nombre)
    await expect(page.locator('canvas')).toHaveCount(graficas)
    cantidad += await page.locator('canvas').count()
    await page.screenshot({ path: info.outputPath(`${nombre}.png`), fullPage: true })
  }
  expect(cantidad).toBe(9)
  expect(errores).toEqual([])
})

test('selección de una barra cambia la serie histórica', async ({ page }) => {
  const participacion = page.getByRole('img', { name: 'Participación de regiones y fronteras en el total nacional' })
  await participacion.click({ position: { x: 230, y: 32 } })
  await expect(page.getByRole('combobox', { name: 'Serie', exact: true })).toHaveValue('region_america_central')
  await expect(page.getByRole('heading', { name: 'Evolución de los viajeros: América del Centro' })).toBeVisible()
})

test('LSTM ausente muestra mensajes claros', async ({ page }) => {
  await page.getByRole('combobox', { name: 'Serie', exact: true }).selectOption('region_europa')
  await page.getByRole('combobox', { name: 'Modelo', exact: true }).selectOption('LSTM')
  await navegar(page, 'Pronósticos')
  await expect(page.getByText('No hay pronóstico LSTM para Europa.', { exact: false })).toBeVisible()
  await expect(page.getByText('No hay entrenamiento LSTM para esta serie.', { exact: false })).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(0)
})

test('período sin pronósticos conserva las curvas de entrenamiento', async ({ page }) => {
  await periodo(page, '2019-01', '2019-12')
  await navegar(page, 'Pronósticos')
  await expect(page.getByText('No hay predicciones en este período.', { exact: false })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Pérdida de ajuste y validación de la LSTM por época' }).locator('canvas')).toHaveCount(1)
})
