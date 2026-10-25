# Validación de los aportes de Vianka

Revisión del 25 de octubre de 2026. Se trabajó sobre el último `origin/main` disponible, cuyo commit inicial era `a91ac7b`, sin modificar los CSV de entrada ni entrenar modelos.

## Resultados comprobados

- `python src/limpieza.py`: siete series, 210 meses, 37 curvas de modelos. Se excluyen los resultados LSTM a un paso. Se validan 63 meses por curva, valores finitos, intervalos completos y coincidencia del observado con el histórico dentro del redondeo de 0.51 viajeros.
- `python src/exportar_composicion.py --source-repo C:\Projects\Data-Science`: 1,050 agregados mensuales de vía y tipo conciliados por separado con los 210 totales del equipo. El JSON registra commit y SHA-256 de la fuente. El Excel se lee desde Git en memoria y no se copia al repositorio.
- `npm test`: ocho pruebas aprobadas sobre conservación de sumas, ceros y faltantes, zoom, selección temporal, errores, al menos tres modelos por serie, intervalos, distancias y conciliación de composición.
- `npm run test:render`: renderizado React correcto para 74 combinaciones de pronóstico y nivel, 21 históricos y siete selecciones de similitud. Esta prueba verifica que los componentes aceptan los datos reales sin excepciones; no comprueba el dibujo de cada píxel ni simula interacciones humanas.
- Validación adicional en Python: se rechazaron calendarios incompletos, particiones incorrectas e infinitos. Las copias públicas de `series.json` y `composicion.json` son idénticas a las procesadas.
- `npm run build`: compilación correcta con Vite 7.3.7 y ECharts 6.1.0. Se mantiene una advertencia de tamaño del bloque JavaScript (aproximadamente 276 kB gzip); no impide compilar.
- La instalación inicial del proyecto reportó tres dependencias vulnerables. Se actualizaron ECharts y Vite dentro de las familias compatibles con React 18, plugin-react 4 y Node 22 del contenedor. La auditoría posterior reportó cero vulnerabilidades. No se aplicó una actualización forzada indiscriminada.
- `git diff --check`: sin errores de espacios en los cambios revisados.

## Límites de esta revisión

La herramienta de navegador devolvió «transport closed before response» en los intentos de conexión; no se completó una revisión visual ni una prueba de clic/zoom en navegador en esta sesión. El tablero se deja disponible en http://127.0.0.1:5173 para revisión. Las pruebas de datos y renderizado no equivalen a las pruebas de usabilidad con tres personas del plan.

El motor Docker no estaba iniciado. No se afirma que se haya probado el contenedor. V3, V5 y V8, las pruebas con usuarios y la integración del PDF final continúan pendientes de sus responsables. La aplicación cuenta actualmente con seis visualizaciones distintas terminadas: V1, V2, V4, V6, V7 y V9; sus modos o tablas no se cuentan como visualizaciones adicionales.

Los cambios de esta preparación se guardan en un commit local con la identidad Git ya configurada de Vianka Castro. No se publican al remoto como parte de esta revisión.
