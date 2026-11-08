# Verificación técnica

Fecha: 8 de noviembre de 2026.

## Alcance

Se verificaron la preparación de los datos, las ocho visualizaciones web y las definiciones del proyecto editable de Power BI. Las pruebas de navegador son automatizadas. Sus tiempos no permiten comparar la facilidad de uso ni la velocidad de una persona frente a Power BI Desktop.

## Datos

Se reprodujeron las ocho tablas en memoria y se compararon con los CSV existentes. Se comprobaron 1,470 observaciones, 2,331 predicciones y 37 combinaciones de serie y modelo. No se encontraron diferencias fuera de la precisión de almacenamiento. Las claves, fechas y referencias a dimensiones pasaron las validaciones.

Los archivos `data/processed/series.json` y `dashboard/public/data/series.json` son iguales y se reproducen con `src/limpieza.py`. Las 37 métricas coinciden con la preparación de Power BI con una diferencia máxima de 0.49 viajeros por redondeo. También se comprobaron los 35 registros de `powerbi/valores_control.csv`.

## Navegador

Se ejecutó `npm test` con Microsoft Edge 157.0.4341.42 sin interfaz visible, en Windows x64 y con una ventana de 1600 × 1200. Se utilizó Node.js 22.14.0, npm 10.9.2 y Playwright 1.65.0. Se ejecutó la versión de desarrollo local con los datos incluidos en el repositorio. Las capturas completas se guardaron con una ventana de 1600 × 1800 para evitar recortes por desplazamiento.

| Comprobación | Resultado |
|---|---|
| Consulta de La Aurora en 2019 y participación | Correcto; se verificaron tarjetas y tooltip |
| Nivel anual, trimestral, mensual y regreso | Correcto; se verificaron valores y filtros iniciales |
| Predicciones de tres modelos y menor RMSE | Correcto; se verificaron tooltips y tabla |
| Ocho gráficas entre las cuatro páginas | Correcto; dos por página y sin errores de ejecución |
| Selección de una barra de V2 | Correcto; cambian la serie seleccionada y V1 |
| LSTM para Europa | Correcto; aparecen mensajes sin pronóstico y sin entrenamiento |
| Período anterior a la prueba | Correcto; no aparecen predicciones y se conserva la curva de entrenamiento |

Las mediciones exactas se encuentran en [pruebas_web.json](evidencias/pruebas_web.json). Se contaron selecciones de controles y botones; los desplazamientos del puntero no se contaron como clics. Se incluyen capturas de [Resumen](evidencias/web/resumen.png), [Estacionalidad](evidencias/web/estacionalidad.png), [Pronósticos](evidencias/web/pronosticos.png) y [Modelos y confianza](evidencias/web/modelos.png).

| Tarea | Resultado obtenido |
|---|---|
| La Aurora en 2019 | 1,481,702 viajeros; 35.9 %; mes más alto: diciembre |
| Total nacional de 2019 | 4,132,252; T4: 1,079,402; diciembre: 449,114; regreso a la selección inicial |
| América del Centro, dic 2023 | Prophet: 185,430; Holt-Winters: 94,203; LSTM: 75,532; menor RMSE: Prophet, 67,838 |

## Consistencia entre fuentes

| Indicador y filtros | Web | Referencia CSV para Power BI | Explicación |
|---|---:|---:|---|
| Viajeros nacionales, ene 2009 a jun 2026 | 46,711,917 | 46,711,912.89 | La web suma meses redondeados; diferencia de 4.11 |
| Viajeros nacionales, 2019 | 4,132,252 | 4,132,250.60 | Redondeo mensual; diferencia de 1.40 |
| Viajeros de La Aurora, 2019 | 1,481,702 | 1,481,701.54 | Coinciden al mostrar enteros |
| Participación de La Aurora, período completo | 40.7 % | 40.6534 % | Se eliminó el doble redondeo de la etiqueta web |
| RMSE de Prophet, América del Centro, prueba completa | 67,838 | 67,837.57 | Coinciden al mostrar enteros |

La columna CSV es una referencia numérica, no una medición realizada en la interfaz de Desktop. La verificación entre las dos interfaces requiere repetir las mismas selecciones en esa aplicación.

## Power BI editable

Se definieron cinco páginas, ocho visualizaciones analíticas, 24 medidas y nueve relaciones. Las tarjetas, segmentadores, textos y la tabla de modelos se mantienen como elementos complementarios.

Los 67 archivos de configuración se validaron con los esquemas públicos de Microsoft. Las referencias de gráficos a tablas, columnas y medidas se comprobaron contra el modelo. El archivo `model.bim` se deserializó con Microsoft Analysis Services TOM 19.84.1 y se reconocieron las nueve tablas y las nueve relaciones.

Estas comprobaciones verifican la estructura. No ejecutan Power Query, no evalúan DAX y no comprueban el formato ni las interacciones dentro de Desktop.

## Comprobaciones pendientes

1. Abrir `powerbi/proyecto/Observatorio.pbip` en Desktop, ajustar `RutaDatos` y actualizar las fuentes.
2. Revisar el formato de las cinco páginas, las ocho visualizaciones, el filtrado V1–V2, la jerarquía, los segmentadores y el marcador de restablecimiento.
3. Ejecutar las tres tareas en Power BI con las mismas selecciones. Registrar resultado, pasos, tiempo, dificultades, entorno y experiencia previa.
4. Comprobar al menos dos indicadores en ambas interfaces y conservar las capturas correspondientes.
5. Guardar el archivo `powerbi/observatorio_v1.0.pbix` y registrar la versión de Desktop.
6. Completar la comparación de herramientas y sus recomendaciones con las pruebas de ambas versiones. Los documentos Word y PDF existentes no se actualizaron.
7. Comprobar `docker compose up --build` cuando esté disponible el servicio de Docker.
