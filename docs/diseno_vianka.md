# Preguntas de gestión y alcance del observatorio

Parte asignada a Vianka Vanessa Castro Ordoñez, 23201. Actualizada el 25 de octubre de 2026 a la aplicación compartida en `dashboard/`. Este material sirve para integrar el documento final de diseño del equipo.

## Público y propósito

El tablero está dirigido a directivos del sector turístico que necesitan explorar el flujo de visitantes a Guatemala, identificar patrones y comparar estimaciones sin dominar estadística. Las vistas apoyan decisiones de seguimiento, capacidad y selección de referencias de demanda; describen relaciones observadas y no atribuyen causas.

| Pregunta de gestión | Decisión que apoya | Vista prevista |
|---|---|---|
| ¿Cuántos visitantes ingresan y cómo evolucionan? | Establecer metas y revisar tendencias | V1 |
| ¿Qué regiones y fronteras concentran mayor participación? | Revisar prioridades de mercados y puntos de ingreso | V2 |
| ¿Qué meses concentran la actividad? | Programar personal y campañas estacionales | V3 |
| ¿Qué segmentos alcanzaron el nivel de 2019? | Detectar segmentos que ameritan seguimiento | V4 |
| ¿Cómo se distribuyen los visitantes por vía y tipo? | Revisar capacidad y servicios de ingreso | V5 |
| ¿Qué tan cerca estuvieron las estimaciones de lo observado? | Evaluar referencias para anticipar demanda sin sobreconfiar | V6 |
| ¿Qué modelo tuvo menor error para la misma serie? | Elegir una referencia con evidencia de prueba | V7 |
| ¿Cómo evolucionó el aprendizaje del LSTM? | Revisar estabilidad y posible sobreajuste con validación | V8 |
| ¿Qué series tienen perfiles temporales parecidos? | Explorar estrategias comunes y contrastarlas con otros datos | V9 |

## Alcance y datos

El histórico contiene 210 meses entre enero de 2009 y junio de 2026. Se conservan las siete series del repositorio: total nacional, América del Centro, América del Norte, Europa y fronteras La Aurora, Valle Nuevo y San Cristóbal. El universo utilizado por el equipo es Turista + Excursionista, incluyendo la etiqueta País = Guatemala. No se modifica esa definición al integrar las vistas de Vianka.

El agregado por vía incluye aérea, marítima y terrestre; el agregado por tipo distingue turista (pernocta) y excursionista (sin pernoctación). Cada dimensión suma por separado el total nacional. No se suman las regiones con las fronteras ni las vías con los tipos. Los archivos públicos contienen agregados, nunca microdatos ni la base Excel original.

Los modelos reutilizados se entrenaron hasta marzo de 2021 y se evalúan en abril de 2021-junio de 2026, 63 meses. Lab1 aporta al menos cinco métodos por serie. Lab2 se utiliza para LSTM recursiva en las series disponibles y para catch22/PCA. No es necesario entrenar modelos nuevos; las curvas y evaluaciones se leen de los archivos ya guardados por el equipo.

No se incluyen ocupación hotelera, gasto, satisfacción, destinos internos ni efectos causales porque estas fuentes no respaldan esas preguntas. No se pronostican meses posteriores a junio de 2026.

## Limitaciones de interpretación

Las cifras son académicas y no oficiales. La fuente tiene un quiebre de metodología en enero de 2023; los niveles anteriores y posteriores no son perfectamente comparables. La vía marítima pierde detalle desde 2017. El año 2026 contiene seis meses y no se presenta como un año completo. Los conteos originales pueden tener decimales por estimaciones expandidas.

Se conservan los valores negativos que algunos modelos regionales generan para que sus fallas no desaparezcan de la evaluación. La interfaz los advierte como estimaciones físicamente imposibles. Una menor métrica de error no garantiza exactitud futura. El equipo documenta que algunas salidas se exportaron desde una nueva ejecución de las especificaciones anteriores; las métricas de esos CSV pueden diferir de los informes y se identifican como evaluación de las curvas efectivamente mostradas.

## V1 serie histórica

La línea temporal permite reconocer tendencia, magnitud y cambios en el flujo. El nivel de detalle suma viajeros por mes, trimestre o año; conserva los ceros y distingue los períodos parciales. La línea azul marino identifica entrenamiento y la azul media prueba; si una agrupación cruza el corte se rotula como período mixto. La pandemia tiene franja rosa y texto.

El zoom modifica el intervalo compartido y recalcula V2 y los indicadores. Las fechas Desde/Hasta ofrecen una alternativa de teclado. Un clic en V2 selecciona la serie histórica; repetirlo vuelve al total. Al agrupar un período parcial se suman únicamente sus meses seleccionados, sin incorporar meses externos al filtro. El usuario puede ocultar y volver a mostrar V1 y V2.

## V6 observado frente a pronóstico

Las líneas comparten fechas y unidades para comparar observación y estimación. El observado es azul marino; la estimación rosa y discontinua, para diferenciarla también sin depender del color. El selector ofrece los modelos existentes de esa serie y conserva la selección de V7 cuando está disponible. Si falta LSTM en una serie, se informa y se utiliza una opción disponible.

MAE expresa el tamaño medio de los errores y RMSE penaliza errores grandes. Se calculan con los pares mensuales visibles del conjunto de prueba, aunque la curva se agrupe por trimestre o año. No se comparan errores absolutos entre series de escalas diferentes. En un período anterior a abril de 2021 se muestra un estado sin evaluación, no una predicción ficticia.

Los límites de predicción del 80 % se muestran solo en frecuencia mensual para modelos que los exportaron, conforme al contrato de los CSV. Se omiten cuando no existen. No se suman límites mensuales para inventar intervalos trimestrales o anuales. Son estimaciones del modelo y no garantías de cobertura real. La LSTM incorporada es recursiva; se excluyen las predicciones a un paso que utilizan valores reales previos del conjunto de prueba.

## V9 similitud entre series

El plano PCA reutiliza las coordenadas exportadas por Lab2, sin ajustar un nuevo modelo ni recalcular catch22. Los dos ejes muestran aproximadamente 65.8 % de la variación. Las formas distinguen los grupos exploratorios y el contorno marca la selección. El mapa de calor alternativo representa distancias euclidianas en las 22 características estandarizadas y permite contrastar las cercanías que aparecen en el plano.

Las firmas resumen las series completas, incluyendo la prueba. Son evidencia exploratoria y no validación predictiva. Los filtros de fechas no recalculan los perfiles y la interfaz lo indica. Seleccionar un punto o una celda cambia la serie global, con una alternativa equivalente por selector de teclado. V9 cuenta como una visualización aunque tenga dos modos.

## Navegación y diseño

Se mantiene React + Vite + Apache ECharts y la paleta acordada en el avance: celeste #A7EBF2 para rellenos con borde azul; azul medio #26658C para elementos interactivos; marino #023859 para observado y selección; noche #011C40 para texto y navegación; rosa #D6336C para pandemia, estimación y avisos rotulados. Montserrat y Open Sans están incluidas como fuentes locales mediante las dependencias existentes.

La navegación separa Resumen, Estacionalidad, Pronósticos y Modelos y confianza, conservando serie, fechas, detalle y modelo. Demanda y mercados se habilitará con la vista de Nadissa. El orden va de hechos observados a estimaciones y limitaciones. Indicadores y tablas son complementarios y no cuentan como visualizaciones.

## Entregas y fechas del plan

| Tarea de Vianka | Fecha original | Evidencia actual |
|---|---|---|
| Preguntas y alcance | 22 oct, 17:20 | Este documento |
| V1 con zoom y detalle | 22 oct, 17:20 | Componente existente conservado y revisado |
| Agregados vía y tipo | 23 oct | Exportador, CSV y JSON conciliados |
| V6 con tres modelos | 24 oct | Vista implementada sobre pronósticos existentes |
| V9 catch22/PCA | 24 oct | Mapa y distancias con selección enlazada |

Las fechas son las del plan del avance; este estado se verifica el 25 de octubre, fecha de entrega final. La integración del PDF completo y las tareas de los demás integrantes permanecen en el plan del equipo. Ver `aportes_y_pendientes.md` y `validacion_vianka.md`.
