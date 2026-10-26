import { useMemo, useState } from 'react'
import SerieHistorica from './components/SerieHistorica.jsx'
import Participacion from './components/Participacion.jsx'
import Recuperacion from './components/Recuperacion.jsx'
import Glosario from './components/Glosario.jsx'
import ErrorModelos, { TablaModelos } from './components/ErrorModelos.jsx'
import Pronosticos from './components/Pronosticos.jsx'
import Similitud from './components/Similitud.jsx'
import MapaCalor from './components/MapaCalor.jsx'
import Composicion from './components/Composicion.jsx'
import CurvasLstm from './components/CurvasLstm.jsx'
import { useSeries, nf, fmtCorto, etiquetaMes, sumaRango } from './data.js'

const TITULOS = {
  resumen: 'Resumen: ¿cuántos viajeros llegan y de dónde?',
  demanda: 'Demanda y mercados: ¿por qué vía y quiénes ingresan?',
  temporal: 'Estacionalidad: ¿cuándo llegan y quién se recuperó?',
  modelos: 'Modelos y confianza: ¿qué pronóstico conviene usar?',
  pronostico: 'Pronósticos: ¿cómo se comparan las estimaciones con lo observado?',
}

const PAGINAS = [
  { id: 'resumen', nombre: 'Resumen', icono: '▦', activa: true },
  { id: 'demanda', nombre: 'Demanda y mercados', icono: '◔', activa: true },
  { id: 'temporal', nombre: 'Estacionalidad', icono: '∿', activa: true },
  { id: 'pronostico', nombre: 'Pronósticos', icono: '↗', activa: true },
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
  const [visible, setVisible] = useState({ historico: true, participacion: true })

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
    const n = serie.valores.slice(r[0], r[1] + 1).filter(Number.isFinite).length
    return { total, prom: n ? total / n : null, max, iMax, min, iMin, n }
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
            <label>Desde<select value={r[0]} onChange={e => setRango([+e.target.value, r[1]])}>{datos.meses.map((m, i) => <option key={m} value={i}>{etiquetaMes(m)}</option>)}</select></label>
            <label>Hasta<select value={r[1]} onChange={e => setRango([r[0], +e.target.value])}>{datos.meses.map((m, i) => <option key={m} value={i}>{etiquetaMes(m)}</option>)}</select></label>
            <button className="reset" onClick={() => { setClave('total'); setModelo('Prophet'); setNivel('mensual'); setRango(null); setVisible({ historico: true, participacion: true }) }}>Restablecer filtros</button>
            <button className="reset ayuda" onClick={() => setGlosario(true)}>? Glosario</button>
          </div>
        </header>

        <p className="aviso"><b>Interpretación:</b> cifras académicas, no oficiales. La metodología cambia en enero de 2023 y 2026 solo contiene enero-junio. Los períodos agregados suman únicamente los meses seleccionados.</p>
        <section className="kpis" aria-label="Indicadores del período seleccionado">
          <Kpi titulo="Viajeros en el período" valor={vacio ? '—' : nf.format(k.total)} nota={`${etiquetaMes(datos.meses[r[0]])} – ${etiquetaMes(datos.meses[r[1]])}`} />
          <Kpi titulo="Promedio mensual" valor={vacio || !k.n ? '—' : nf.format(k.prom)} nota={serie.nombre} />
          <Kpi titulo="Mes más alto" valor={vacio || !k.n ? '—' : fmtCorto(k.max)} nota={vacio || !k.n ? '' : etiquetaMes(datos.meses[k.iMax])} />
          <Kpi titulo="Mes más bajo" valor={vacio || !k.n ? '—' : fmtCorto(k.min)} nota={vacio || !k.n ? '' : etiquetaMes(datos.meses[k.iMin])} />
        </section>

        {vacio && <p className="vacio" role="alert">La fecha inicial debe ser anterior o igual a la final. Ajuste las fechas o restablezca los filtros.</p>}
        {!vacio && pagina === 'resumen' && <><div className="controles-vista" aria-label="Visualizaciones visibles">
          <label className="check"><input type="checkbox" checked={visible.historico} onChange={e => setVisible({ ...visible, historico: e.target.checked })} /> Ver serie histórica</label>
          <label className="check"><input type="checkbox" checked={visible.participacion} onChange={e => setVisible({ ...visible, participacion: e.target.checked })} /> Ver participación</label>
        </div><div className={'grid' + (!visible.historico || !visible.participacion ? ' grid-1' : '')}>
          {visible.historico && <section className="card">
            <h2>Evolución de los viajeros: {serie.nombre}</h2>
            <p className="sub">Arrastre la barra inferior para acercarse a un período; cambie el nivel de detalle arriba. La franja rosa marca la pandemia (mar 2020 – dic 2021).</p>
            {vacio ? <p className="vacio">No hay información para el período seleccionado.</p>
              : <SerieHistorica datos={datos} serie={serie} nivel={nivel} rango={r} onRango={setRango} />}
          </section>}

          {visible.participacion && <section className="card">
            <h2>¿Quién aporta más viajeros?</h2>
            <p className="sub">Porcentaje del total nacional en el período visible. Haga clic en una barra para ver su serie a la izquierda.</p>
            <Participacion datos={datos} seleccion={clave} rango={r} onSeleccion={(c) => setClave(c === clave ? 'total' : c)} />
            <p className="nota">Regiones y fronteras son cortes distintos del mismo total: no se suman entre sí.</p>
          </section>}
          {!visible.historico && !visible.participacion && <p className="vacio">Seleccione una visualización para explorar los datos.</p>}
        </div></>}

        {!vacio && pagina === 'demanda' && <section className="card">
          <h2>V5 · ¿Por qué vía y con qué tipo de viajero ingresa el país?</h2>
          <p className="sub">Cada barra reparte el total de un período entre vías (terrestre, aérea, marítima) o entre turistas y excursionistas. Cambie el nivel de detalle arriba y haga clic en una barra para acotar el período en todo el tablero.</p>
          <Composicion datos={datos} nivel={nivel} rango={r} onRango={setRango} />
          <p className="nota"><b>Observado:</b> vía y tipo son dos cortes distintos del mismo total; no se suman entre sí. La vía marítima pierde detalle desde 2017 y desde 2023 la fuente cambia, por lo que los cambios de composición en esos años pueden deberse al registro y no a los viajeros. La serie seleccionada arriba no filtra esta vista: siempre es el total nacional.</p>
        </section>}

        {!vacio && pagina === 'temporal' && <div className="grid grid-1">
          <section className="card">
            <h2>V3 · ¿En qué meses llegan más viajeros? {serie.nombre}</h2>
            <p className="sub">Cada fila es un año y cada columna un mes (o trimestre); el color más oscuro indica más viajeros. «Patrón del año» compara cada mes con el promedio de su propio año, para ver la temporada alta sin que pesen los años de pandemia. Haga clic en un año para ver solo ese año.</p>
            <MapaCalor datos={datos} serie={serie} rango={r} onRango={setRango} />
            <p className="nota"><b>Observado:</b> el color describe cuándo llegan los viajeros, no por qué. Los extremos de la escala se recortan (percentiles 5 y 95) para que los meses de la pandemia no oculten el patrón de los demás años; el valor exacto aparece al pasar el cursor. Los trimestres incompletos (por ejemplo, el segundo semestre de 2026) no se muestran para que no parezcan una caída. Desde 2023 la fuente es otra.</p>
          </section>
          <section className="card">
            <h2>¿Qué mercados ya volvieron al nivel de 2019?</h2>
            <p className="sub">Cada línea compara los viajeros de un período con los mismos meses de 2019 (100 = igual que en 2019; 80 = 20 % menos). Haga clic en una línea para seleccionar esa serie en todo el tablero.</p>
            <Recuperacion datos={datos} seleccion={clave} nivel={nivel} rango={r} onSeleccion={setClave} />
            <p className="nota"><b>Observado:</b> el índice describe cuánto se parece cada período a 2019; no explica por qué cambió. Desde 2023 la fuente es otra (sistema depurado del INGUAT), por lo que parte de la diferencia puede deberse al cambio de registro. 2026 incluye solo enero a junio.</p>
          </section>
        </div>}

        {!vacio && pagina === 'pronostico' && <><section className="card">
          <h2>V6 · Observado frente a pronóstico: {serie.nombre}</h2>
          <p className="sub">Compare modelos ya calculados sobre los mismos meses y aumente o reduzca el detalle. El modelo elegido en V7 se conserva cuando está disponible.</p>
          <Pronosticos datos={datos} serie={serie} modelo={modelo} onModelo={setModelo} nivel={nivel} rango={r} />
        </section>
        <section className="card">
          <h2>V8 · ¿La red neuronal aprendió bien o memorizó?</h2>
          <p className="sub">Línea continua: error en los datos con los que aprende. Línea punteada: error en datos que no ve. Si la punteada deja de bajar o sube mientras la continua sigue bajando, la red está memorizando (ver «Curva de aprendizaje» en el glosario). Arrastre la barra inferior para acercarse a ciertas épocas.</p>
          <CurvasLstm datos={datos} clave={clave} onSeleccion={setClave} />
          <p className="nota"><b>Limitación:</b> son las curvas del Laboratorio 2, solo para el total nacional y América del Centro. El marcador con número indica la «mejor época», la de menor error de validación. No se entrenó ninguna red nueva.</p>
        </section></>}
        {!vacio && pagina === 'modelos' && <><div className="grid">
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
        </div><section className="card similitud">
          <h2>V9 · ¿Qué series tienen un comportamiento parecido?</h2>
          <p className="sub">Compare los perfiles de catch22 del Laboratorio 2. Seleccionar una serie actualiza las demás secciones.</p>
          <Similitud datos={datos} seleccion={clave} onSeleccion={setClave} />
        </section></>}
      </main>
      <Glosario abierto={glosario} onCerrar={() => setGlosario(false)} />
    </div>
  )
}
