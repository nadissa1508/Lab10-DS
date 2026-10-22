import { useMemo, useState } from 'react'
import SerieHistorica from './components/SerieHistorica.jsx'
import Participacion from './components/Participacion.jsx'
import { useSeries, nf, fmtCorto, etiquetaMes, sumaRango } from './data.js'

const PAGINAS = [
  { id: 'resumen', nombre: 'Resumen', icono: '▦', activa: true },
  { id: 'demanda', nombre: 'Demanda y mercados', icono: '◔' },
  { id: 'temporal', nombre: 'Estacionalidad', icono: '∿' },
  { id: 'pronostico', nombre: 'Pronósticos', icono: '↗' },
  { id: 'modelos', nombre: 'Modelos y confianza', icono: '✓' },
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
  const [clave, setClave] = useState('total')
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
            <button key={p.id} className={'nav' + (p.activa ? ' on' : '')} disabled={!p.activa} title={p.activa ? '' : 'Disponible en la entrega final'}>
              <span aria-hidden>{p.icono}</span>{p.nombre}{!p.activa && <em>pronto</em>}
            </button>
          ))}
        </nav>
        <p className="rail-pie">Datos académicos: no corresponden a cifras oficiales del INGUAT ni del IGM.</p>
      </aside>

      <main>
        <header className="top">
          <div>
            <h1>Resumen: ¿cuántos viajeros llegan y de dónde?</h1>
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
            <button className="reset" onClick={() => { setClave('total'); setNivel('mensual'); setRango(null) }}>Restablecer filtros</button>
          </div>
        </header>

        <section className="kpis" aria-label="Indicadores del período seleccionado">
          <Kpi titulo="Viajeros en el período" valor={vacio ? '—' : nf.format(k.total)} nota={`${etiquetaMes(datos.meses[r[0]])} – ${etiquetaMes(datos.meses[r[1]])}`} />
          <Kpi titulo="Promedio mensual" valor={vacio ? '—' : nf.format(k.prom)} nota={serie.nombre} />
          <Kpi titulo="Mes más alto" valor={vacio ? '—' : fmtCorto(k.max)} nota={vacio ? '' : etiquetaMes(datos.meses[k.iMax])} />
          <Kpi titulo="Mes más bajo" valor={vacio ? '—' : fmtCorto(k.min)} nota={vacio ? '' : etiquetaMes(datos.meses[k.iMin])} />
        </section>

        <div className="grid">
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
        </div>
      </main>
    </div>
  )
}
