import { useEffect, useRef } from 'react'

// Términos especializados explicados en lenguaje de gestión. Los textos de las
// tarjetas remiten aquí en lugar de repetir las definiciones.
export const TERMINOS = [
  ['Viajero', 'Persona que ingresa al país: turista (pernocta al menos una noche) o excursionista (entra y sale el mismo día). El tablero suma ambos.'],
  ['Índice de recuperación (2019 = 100)', 'Compara los viajeros de un período con los mismos meses de 2019, el último año completo antes de la pandemia. 100 significa igual que en 2019; 80, un 20 % menos; 120, un 20 % más.'],
  ['Estacionalidad', 'Patrón que se repite cada año, como la temporada alta de diciembre o de Semana Santa.'],
  ['Cambio de fuente (2023)', 'Desde 2023 los datos provienen del sistema depurado del INGUAT. Los niveles antes y después no son del todo comparables, por lo que un salto en 2023 puede deberse al registro y no a un cambio real.'],
  ['Período de entrenamiento y de prueba', 'Los modelos aprendieron con los datos de 2009 a marzo de 2021 (entrenamiento) y se evaluaron con abril de 2021 a junio de 2026 (prueba), meses que no vieron al aprender.'],
  ['Pronóstico (estimación)', 'Valor que calcula un modelo para un mes. En el tablero siempre aparece en rosa y rotulado como estimación, para distinguirlo de lo observado.'],
  ['Intervalo de predicción', 'Rango dentro del cual el modelo espera el valor real con un 80 % de probabilidad. Una banda más ancha indica más incertidumbre.'],
  ['Error medio (MAE)', 'En promedio, cuántos viajeros por mes se equivoca el modelo, hacia arriba o hacia abajo. Menor es mejor.'],
  ['Error con castigo a fallas grandes (RMSE)', 'Parecido al MAE, pero pesa más los meses en que el modelo se equivoca mucho. Si es mucho mayor que el MAE, el modelo tiene algunos errores muy grandes.'],
  ['Prophet', 'Modelo de pronóstico que separa la tendencia y la estacionalidad anual de la serie.'],
  ['Holt-Winters', 'Modelo clásico que proyecta el nivel, la tendencia y la estacionalidad, dando más peso a los meses recientes.'],
  ['LSTM', 'Red neuronal que aprende patrones a partir de los últimos 12 meses. Solo se entrenó para el total nacional y América del Centro.'],
  ['Seasonal naive', 'Referencia mínima: supone que cada mes repite el mismo mes del año anterior. Un modelo útil debe equivocarse menos que esta referencia.'],
  ['Curva de aprendizaje', 'Muestra cómo baja el error de la red neuronal mientras entrena. Si el error de validación deja de bajar o sube, la red empieza a memorizar en lugar de aprender.'],
  ['Similitud entre series (catch22)', 'Resume cada serie con 22 medidas de forma (tendencia, regularidad, picos) y ubica cerca las que se comportan parecido.'],
]

export default function Glosario({ abierto, onCerrar }) {
  const ref = useRef(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (abierto && !d.open) d.showModal()
    if (!abierto && d.open) d.close()
  }, [abierto])

  return (
    <dialog ref={ref} className="glosario" onClose={onCerrar} onClick={(e) => { if (e.target === ref.current) onCerrar() }} aria-labelledby="glosario-titulo">
      <header>
        <h2 id="glosario-titulo">Glosario</h2>
        <button className="cerrar" onClick={onCerrar} aria-label="Cerrar glosario">×</button>
      </header>
      <p className="sub">Términos que aparecen en el tablero, sin tecnicismos.</p>
      <dl>
        {TERMINOS.map(([t, d]) => <div key={t}><dt>{t}</dt><dd>{d}</dd></div>)}
      </dl>
    </dialog>
  )
}
