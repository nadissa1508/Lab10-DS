import { useMemo, useState } from 'react'
import SerieHistorica from './components/SerieHistorica.jsx'
import Participacion from './components/Participacion.jsx'
import Recuperacion from './components/Recuperacion.jsx'
import Glosario from './components/Glosario.jsx'
import ErrorModelos, { TablaModelos } from './components/ErrorModelos.jsx'
import { useSeries, nf, fmtCorto, etiquetaMes, sumaRango } from './data.js'

const TITULOS = {
  resumen: 'Resumen: ¿cuántos viajeros llegan y de dónde?',
  temporal: 'Estacionalidad: ¿cuándo llegan y quién se recuperó?',
  modelos: 'Modelos y confianza: ¿qué pronóstico conviene usar?',
}

const PAGINAS = [
  { id: 'resumen', nombre: 'Resumen', icono: '▦', activa: true },
  { id: 'demanda', nombre: 'Demanda y mercados', icono: '◔' },
  { id: 'temporal', nombre: 'Estacionalidad', icono: '∿', activa: true },
  { id: 'pronostico', nombre: 'Pronósticos', icono: '↗' },
  { id: 'modelos', nombre: 'Modelos y confianza', icono: '✓', activa: true },
]

function Kpi({ titulo, valor, nota }) {
  return (
    <div className="kpi">
      <span className="kpi-titulo">{titulo}</span>
      <span className="kpi-valor">{valor}</span>
      <span className="kpi-nota">{nota}</span>
    </div>
  )
}

export default function App() {
  const { datos, error } = useSeries()
  const [pagina, setPagina] = useState('resumen')
  const [glosario, setGlosario] = useState(false)
  const [clave, setClave] = useState('total')
  const [modelo, setModelo] = useState('Prophet')
  const [nivel, setNivel] = useState('mensual')
  const [rango, setRango] = useState(null)

  const r = rango ?? [0, datos ? datos.meses.length - 1 : 0]
  const serie = datos?.series.find((s) => s.clave === clave)
  const vacio = r[1] < r[0]

  // Indicadores de la serie y el período visibles.
  const k = useMemo(() => {
    if (!serie) return null
    let max = -1, min = Infinity, iMax = r[0], iMin = r[0]
    for (let i = r[0]; i <= r[1]; i++) {
      const v = serie.valores[i]
      if (v == null) continue
      if (v > max) { max = v; iMax = i }
      if (v < min) { min = v; iMin = i }
    }
    const total = sumaRango(serie.valores, r[0], r[1])
    return { total, prom: total / (r[1] - r[0] + 1), max, iMax, min, iMin }
  }, [serie, r[0], r[1]])

  if (error) return <p className="estado">No se pudieron cargar los datos: {error}</p>
  if (!datos) return <p className="estado">Cargando datos…</p>

  return (
    <div className="app">
      <aside className="rail">
        <div className="marca"><span className="logo">GT</span><div><b>Observatorio</b><small>Turismo · Guatemala</small></div></div>
        <nav aria-label="Secciones del observatorio">
          {PAGINAS.map((p) => (
            <button key={p.id} className={'nav' + (p.id === pagina ? ' on' : '')} disabled={!p.activa} aria-current={p.id === pagina ? 'page' : undefined}
              title={p.activa ? '' : 'Disponible en la entrega final'} onClick={() => setPagina(p.id)}>
              <span aria-hidden>{p.icono}</span>{p.nombre}{!p.activa && <em>pronto</em>}
            </button>
          ))}
        </nav>
        <p className="rail-pie">Datos académicos: no corresponden a cifras oficiales del INGUAT ni del IGM.</p>
      </aside>

      <main>
        <header className="top">
          <div>
            <h1>{TITULOS[pagina]}</h1>
            <p>Ingreso mensual de viajeros internacionales (turistas + excursionistas), ene 2009 – jun 2026.</p>
          </div>
          <div className="slicers">
            <label>Serie
              <select value={clave} onChange={(e) => setClave(e.target.value)}>
                {datos.series.map((s) => <option key={s.clave} value={s.clave}>{s.grupo === 'General' ? s.nombre : `${s.grupo} · ${s.nombre}`}</option>)}
              </select>
            </label>
            <div className="seg" role="group" aria-label="Nivel de detalle">
              <span>Nivel de detalle</span>
              {['mensual', 'trimestral', 'anual'].map((n) => (
                <button key={n} className={nivel === n ? 'on' : ''} aria-pressed={nivel === n} onClick={() => setNivel(n)}>{n}</button>
              ))}
            </div>
            <button className="reset" onClick={() => { setClave('total'); setModelo('Prophet'); setNivel('mensual'); setRango(null) }}>Restablecer filtros</button>
            <button className="reset ayuda" onClick={() => setGlosario(true)}>? Glosario</button>
          </div>
        </header>

        <section className="kpis" aria-label="Indicadores del período seleccionado">
          <Kpi titulo="Viajeros en el período" valor={vacio ? '—' : nf.format(k.total)} nota={`${etiquetaMes(datos.meses[r[0]])} – ${etiquetaMes(datos.meses[r[1]])}`} />
          <Kpi titulo="Promedio mensual" valor={vacio ? '—' : nf.format(k.prom)} nota={serie.nombre} />
          <Kpi titulo="Mes más alto" valor={vacio ? '—' : fmtCorto(k.max)} nota={vacio ? '' : etiquetaMes(datos.meses[k.iMax])} />
          <Kpi titulo="Mes más bajo" valor={vacio ? '—' : fmtCorto(k.min)} nota={vacio ? '' : etiquetaMes(datos.meses[k.iMin])} />
        </section>

        {pagina === 'resumen' && <div className="grid">
          <section className="card">
            <h2>Evolución de los viajeros: {serie.nombre}</h2>
            <p className="sub">Arrastre la barra inferior para acercarse a un período; cambie el nivel de detalle arriba. La franja rosa marca la pandemia (mar 2020 – dic 2021).</p>
            {vacio ? <p className="vacio">No hay información para el período seleccionado.</p>
              : <SerieHistorica datos={datos} serie={serie} nivel={nivel} rango={r} onRango={setRango} />}
          </section>

          <section className="card">
            <h2>¿Quién aporta más viajeros?</h2>
            <p className="sub">Porcentaje del total nacional en el período visible. Haga clic en una barra para ver su serie a la izquierda.</p>
            <Participacion datos={datos} seleccion={clave} rango={r} onSeleccion={(c) => setClave(c === clave ? 'total' : c)} />
            <p className="nota">Regiones y fronteras son cortes distintos del mismo total: no se suman entre sí.</p>
          </section>
        </div>}

        {pagina === 'temporal' && <div className="grid grid-1">
          <section className="card">
            <h2>¿Qué mercados ya volvieron al nivel de 2019?</h2>
            <p className="sub">Cada línea compara los viajeros de un período con los mismos meses de 2019 (100 = igual que en 2019; 80 = 20 % menos). Haga clic en una línea para seleccionar esa serie en todo el tablero.</p>
            <Recuperacion datos={datos} seleccion={clave} nivel={nivel} rango={r} onSeleccion={setClave} />
            <p className="nota"><b>Observado:</b> el índice describe cuánto se parece cada período a 2019; no explica por qué cambió. Desde 2023 la fuente es otra (sistema depurado del INGUAT), por lo que parte de la diferencia puede deberse al cambio de registro. 2026 incluye solo enero a junio.</p>
          </section>
        </div>}

        {pagina === 'modelos' && <div className="grid">
          <section className="card">
            <h2>¿Qué modelo se equivoca menos con {serie.nombre}?</h2>
            <p className="sub">Error de cada modelo al pronosticar abril 2021 – junio 2026, meses que no vio al aprender. Barra más corta = más confiable. Entre paréntesis, el error como porcentaje de lo que llega en un mes promedio. Haga clic en un modelo para elegirlo en el tablero.</p>
            <ErrorModelos datos={datos} clave={clave} modelo={modelo} onModelo={setModelo} />
            <p className="nota">Los modelos que quedan a la derecha de la línea «Referencia mínima» se equivocan más que suponer que cada mes repite el del año anterior.</p>
          </section>
          <section className="card">
            <h2>Comparación de modelos</h2>
            <p className="sub">Ordenada de menor a mayor RMSE. Cambie la serie en el selector superior.</p>
            <TablaModelos datos={datos} clave={clave} modelo={modelo} onModelo={setModelo} />
            <p className="nota"><b>Limitación:</b> todos los modelos aprendieron con datos que terminan en plena pandemia (mar 2021) y se evalúan a 63 meses de distancia, por eso sus errores son altos. Sirven para comparar modelos entre sí y como orden de magnitud, no como cifra exacta para planificar.</p>
          </section>
        </div>}
      </main>
      <Glosario abierto={glosario} onCerrar={() => setGlosario(false)} />
    </div>
  )
}
