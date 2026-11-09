# Pruebas manuales cronometradas (ejercicios 5.3 y 5.4)

Las pruebas de `pruebas_web.json` (Playwright) y `pruebas_powerbi.json` (DAX) verifican resultados, pero no miden el uso humano. Este registro completa los tres recorridos con una persona usando cada interfaz.

## Entorno

| Dato | Valor |
|---|---|
| Fecha y hora | 8/11/2026 21:28 |
| Persona que ejecuta | Nadissa Vela |
| Equipo y sistema operativo | Laptop HP Victus	Microsoft Windows 11 Home Single Language |
| Navegador y versión (web) | Edge ver. Nombre del SO	Microsoft Windows 11 Home Single Language |
| Power BI Desktop (versión) | 2.159.1231.0 |
| Resolución de pantalla | Resolución	1920 x 1080 x 60 hercios |
| Experiencia previa con la web (construyó vistas: sí/no) | Sí, algunas |
| Experiencia previa con Power BI (horas aprox.) | No, esta es mi primera vez |
| Orden de ejecución (web primero / Power BI primero) | Power Bi primero |

Reglas: se parte de la vista inicial (Restablecer filtros); el tiempo corre desde el primer clic hasta leer el resultado; se cuenta cada clic, tecla o arrastre como una acción. En Power BI se usa el **modo lectura** (sin Ctrl + clic): abrir el `.pbix` y ocultar paneles con *Vista > Paneles*, o usar *Archivo > Vista de lectura* si está disponible.

## Tarea 1. Pregunta de gestión con filtros

¿Cuántos viajeros entraron por La Aurora en 2019, qué parte del total representan y cuál fue su mes más alto?

Esperado: 1,481,702 viajeros; 35.9 %; dic 2019 (157,465).

| Versión | Pasos realizados | Acciones | Tiempo (s) | Resultado obtenido | ¿Correcto? | Dificultades |
|---|---|---:|---:|---|---|---|
| Web | 5 clicks | Aplicar los filtros de la pantalla resumen | 31 | 1,481,702 | Sí | El boton de fecha deberia permitir escribir texto, seleccionar la fecha, scrolear por los meses es lento y desesperante, pero más rápido que en power bi |
| Power BI | 27 clicks | recorrer las pantallas y volver a resumen | 110 | 1,481,702 | Sí | Mantener ctrl presionado, acoplarme a power bi, botones poco practicos |

## Tarea 2. De la vista general al detalle y regreso

En el total nacional de 2019, ¿qué trimestre y qué mes fueron los más altos? Después regresar a la vista inicial.

Esperado: T4 con 1,079,402; diciembre con 449,114; vuelve a total nacional, período completo, nivel anual.

| Versión | Pasos realizados | Acciones | Tiempo (s) | Resultado obtenido | ¿Correcto? | Dificultades |
|---|---|---:|---:|---|---|---|
| Web | 9 clicks | Modificar los filtros, utilizar la barra inferior para modificar las fechas pero no es muy precisa, encontrar los botones de nivel de detalle (sería bueno hacer que resalten más o colocarlos más cerca de la gráfica) | 67 | T4 con 1,079,402 y diciembre con 449 mil | Sí | Encontrar los botones de detalle, asignar las fechas con la barra debajo de la gráfica |
| Power BI | 12 clicks | recordar que debo mantener presionado ctrl y navegar con las flechas hasta encontrar la vista por trimestre | 25 | T4 con 1,079,402 y diciembre con 449,114 | Sí | Entender que puedo obtener los totales al hacer hover sobre los puntos o en los recuadros de arriba, me di cuenta más fácilmente con los recuadros. Entender el funcionamiento de las flechas |

## Tarea 3. Predicciones y desempeño de los tres modelos

Para América del Centro en dic 2023, ¿qué estimó cada modelo y cuál tiene menor error en el conjunto de prueba (abr 2021 a jun 2026)?

Esperado: Prophet 185,430; Holt-Winters 94,203; LSTM 75,532; menor RMSE Prophet (67,838).

| Versión | Pasos realizados | Acciones | Tiempo (s) | Resultado obtenido | ¿Correcto? | Dificultades |
|---|---|---:|---:|---|---|---|
| Web | 8 clicks | Navegar a pronosticos, modificar las fechas, buscar los resultados de cada modelo | 33 | Prophet 185,430, Holt-Winters 94,203, LSTM 75,532 | Sí | Ver que los resultados no eran iguales a los de la primera prueba y recordar que se me habia olvidado colocar la region de América del centro |
| Power BI | 29 clicks | Ir a Pronosticos, seleccionar las fechas de prueba, moverme sobre la gráfica para encontrar el pronostico de prophet | 108 | Prophet 185,430, Holt-Winters 94,203, LSTM 75,532 | Sí | Confundí por un segundo las fechas de prueba con las de pronostico (error mio) | 

## Observaciones

- Diferencias de entorno (ventana, carga inicial, equipo): En power bi tuve que tener presionada la tecla ctrl, pero después todo era bastante parecido en cuanto a la apariencia y organizacion de la interfaz, los botones de powerbi me parecieron un poco más incómodos.
- Efecto de la experiencia previa (no atribuirlo a la herramienta): Nuestra herramienta web es más fácil de navegar, pero hay elementos que convendría resaltar o mover de lugar.
- Capturas guardadas en `docs/evidencias/web/manual_tN.png` y `docs/evidencias/powerbi/manual_tN.png`.
