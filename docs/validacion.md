# Verificación técnica

Fecha: 8 de noviembre de 2026.

## Alcance

Se verificaron los datos, las ocho visualizaciones web y las cinco páginas de Power BI Desktop. Se guardó `powerbi/observatorio_v1.0.pbix` con los datos cargados y la vista inicial. Se conservaron las definiciones editables en `powerbi/proyecto/`.

Las pruebas web son automatizadas. Las consultas DAX comprueban los cálculos del modelo local de Desktop. La inspección de la interfaz comprueba la presentación y las interacciones indicadas abajo. Estas comprobaciones no permiten comparar la facilidad de aprendizaje ni la velocidad de uso de una persona.

## Datos

Se reprodujeron las ocho tablas en memoria y se compararon con los CSV existentes. Se comprobaron 1,470 observaciones, 2,331 predicciones y 37 combinaciones de serie y modelo. No se encontraron diferencias fuera de la precisión de almacenamiento. Las claves, fechas y referencias a dimensiones pasaron las validaciones.

Los archivos `data/processed/series.json` y `dashboard/public/data/series.json` son iguales y se reproducen con `src/limpieza.py`. Las 37 métricas coinciden con la preparación de Power BI con una diferencia máxima de 0.49 viajeros por redondeo. También se comprobaron los 35 registros de `powerbi/valores_control.csv`.

## Navegador

Se ejecutó `npm test` con Microsoft Edge 157.0.4341.42 sin interfaz visible, en Windows x64 y con una ventana de 1600 × 1200. Se utilizó Node.js 22.14.0, npm 10.9.2 y Playwright 1.65.0. Se ejecutó Vite local con los datos del repositorio. Las capturas completas utilizan una ventana de 1600 × 1800.

| Comprobación | Resultado |
|---|---|
| La Aurora en 2019 y participación | Tarjetas y tooltip correctos |
| Nivel anual, trimestral, mensual y regreso | Valores y filtros iniciales correctos |
| Predicciones de tres modelos y menor RMSE | Tooltips y tabla correctos |
| Ocho gráficas entre cuatro páginas | Dos por página, sin errores de ejecución |
| Selección de una barra de V2 | Cambian la serie seleccionada y V1 |
| LSTM para Europa | Aparecen mensajes sin pronóstico y sin entrenamiento |
| Período anterior a la prueba | No hay predicciones y se conserva el entrenamiento |

Los siete casos pasaron. Las mediciones automatizadas están en [pruebas_web.json](evidencias/pruebas_web.json). Se incluyen capturas de [Resumen](evidencias/web/resumen.png), [Estacionalidad](evidencias/web/estacionalidad.png), [Pronósticos](evidencias/web/pronosticos.png) y [Modelos y confianza](evidencias/web/modelos.png). La compilación con `npm run build` terminó correctamente.

## Power BI Desktop

Se utilizó Power BI Desktop `2.159.1231.0` de 64 bits en Windows, sin publicar el archivo en el servicio. Power Query cargó las ocho tablas. El modelo contiene nueve tablas, incluida Medidas, 24 medidas DAX y nueve relaciones. Las 24 expresiones coinciden con `powerbi/medidas.dax`.

La validación inicial de 67 archivos mediante esquemas y la deserialización con TOM 19.84.1 se conservan como comprobaciones previas. Después se abrió y guardó el proyecto en Desktop, que actualizó las definiciones a su formato nativo.

| Comprobación en Desktop | Resultado |
|---|---|
| Cinco páginas y ocho visualizaciones analíticas | Cargan sin mensajes de error |
| Tarjetas de Resumen | Valores completos, sin recortes |
| Participación de V2 | Porcentajes con un decimal |
| La Aurora, ene a dic 2019 | 1,481,702 viajeros, 35.9 % y máximo en dic 2019 |
| Selección de La Aurora desde una barra de V2 | Cambian V1, las tarjetas y la selección activa |
| Jerarquía de V1 | Se expandió de año a trimestre y luego a mes |
| Restablecer desde el detalle mensual | Regresa al total nacional, período completo y nivel anual; V2 conserva sus seis cortes |
| Tabla de modelos | Se muestran las seis filas y sus métricas |
| Archivo final | Guardado con datos; estructura ZIP íntegra y definiciones iguales al proyecto editable |

El restablecimiento se ejecutó desde el panel Marcadores de Desktop. Los cinco botones del informe apuntan al mismo marcador. En modo de edición requieren Ctrl + clic.

Las diez consultas registradas en [pruebas_powerbi.json](evidencias/pruebas_powerbi.json) evaluaron los conteos, La Aurora en 2019, el total y detalle de 2019, los tres modelos, la recuperación y los contextos sin datos. Las predicciones y errores se compararon con los CSV originales, con diferencias inferiores a 0.000001. El índice de 2019 es 100 en las siete series. Para enero a junio de 2026, la base usa únicamente esos mismos meses de 2019 y el índice nacional es 77.9058.

Las capturas se encuentran en [Resumen](evidencias/powerbi/resumen.png), [La Aurora en 2019](evidencias/powerbi/la_aurora_2019.png), [detalle mensual](evidencias/powerbi/jerarquia_mensual.png), [Estacionalidad](evidencias/powerbi/estacionalidad.png), [Pronósticos](evidencias/powerbi/pronosticos.png), [Modelos y confianza](evidencias/powerbi/modelos.png) y [Glosario](evidencias/powerbi/glosario.png).

## Consistencia entre versiones

| Indicador y filtros | Web | DAX en Desktop | Explicación |
|---|---:|---:|---|
| Viajeros nacionales, ene 2009 a jun 2026 | 46,711,917 | 46,711,912.89 | La web suma meses redondeados; diferencia de 4.11 |
| Viajeros nacionales, 2019 | 4,132,252 | 4,132,250.60 | Redondeo mensual; diferencia de 1.40 |
| Viajeros de La Aurora, 2019 | 1,481,702 | 1,481,701.54 | Coinciden al mostrar enteros |
| Participación de La Aurora, 2019 | 35.9 % | 35.8570 % | Coinciden con un decimal |
| Participación de La Aurora, período completo | 40.7 % | 40.6534 % | Coinciden con un decimal |
| RMSE de Prophet, América del Centro | 67,838 | 67,837.57 | Coinciden al mostrar enteros |

Para América del Centro en diciembre de 2023, ambas versiones producen Prophet: 185,430; Holt-Winters: 94,203; LSTM: 75,532. Prophet tiene el menor RMSE de los tres: 67,838 sobre la prueba completa. Estos resultados de Desktop se obtuvieron mediante DAX; no constituyen una prueba cronometrada de su interfaz.

## Diferencias de implementación

| Aspecto | Web | Power BI | Consecuencia |
|---|---|---|---|
| Datos | JSON con meses redondeados | CSV con decimales y relaciones | Las diferencias pequeñas de totales están explicadas arriba |
| Modelos | Resultados importados en JSON | Hechos de predicciones y tabla de métricas | Se conservan los resultados existentes sin entrenar modelos |
| Interacción | Controles propios y enlace V2–V1 | Segmentadores, enlace V2–V1, jerarquía y marcador | Ambas permiten explorar serie y período |
| Estacionalidad | Mapa de calor | Matriz de cifras por año y mes | Desktop permite consultar valores exactos mediante desplazamiento |
| Intervalos | Banda disponible del 80 % | Líneas de límites del 80 % | Se conserva el significado mensual del intervalo |
| Personalización | Componentes React y ECharts | Formato y objetos nativos | La web permite modificar los controles mediante código |
| Validación | Siete pruebas de navegador y compilación | Carga, inspección y diez consultas DAX | Las modalidades son distintas; no se comparan sus tiempos |
| Versiones | Código y pruebas en Git | PBIP en Git y PBIX final identificado | Los cambios de definiciones pueden revisarse como texto |
| Distribución | Requiere alojamiento y control de acceso | PBIX local; servicio sujeto a permisos y licencias | El uso local no demuestra que la distribución sea gratuita |

Para consultas periódicas de indicadores en Windows se recomienda el PBIX por sus filtros, navegación y actualización de CSV. Para exploraciones con controles personalizados se recomienda la web, cuyos componentes se pueden modificar. Para usuarios externos desde un navegador se recomienda desplegar la web con acceso autorizado; no se ha probado un alojamiento. Si se elige el servicio de Power BI, se deben revisar las condiciones de [licencias](https://learn.microsoft.com/en-us/power-bi/fundamentals/service-features-license-type). La opción [Publicar en web](https://learn.microsoft.com/en-us/power-bi/collaborate-share/service-publish-to-web) expone públicamente el contenido y los datos del modelo. Fuentes consultadas el 8 de noviembre de 2026.

## Límites y pendientes

1. No se dispone de una medición humana comparable de las tres tareas en ambas interfaces. No se atribuyen diferencias de aprendizaje o velocidad a una herramienta.
2. Los documentos Word y PDF existentes no se actualizaron. La documentación de esta revisión se limita a Markdown y evidencias técnicas.
3. Falta comprobar `docker compose up --build` cuando esté disponible el servicio de Docker. La web local, sus pruebas y la compilación sí se verificaron.
