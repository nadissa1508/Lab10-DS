# Observatorio de turismo: Laboratorios 10 y 12

Se presenta el ingreso mensual de viajeros internacionales a Guatemala entre enero de 2009 y junio de 2026. Se reutilizan siete series y los resultados existentes de Prophet, Holt-Winters y LSTM. Los datos son académicos y no corresponden a cifras oficiales.

## Archivos y versiones

| Ubicación | Contenido |
|---|---|
| `dashboard/` | Web con ocho visualizaciones y siete pruebas de navegador |
| `src/limpieza.py` | Preparación del JSON |
| `src/preparar_powerbi.py` | Preparación y validación de los CSV |
| `data/raw/` | Series y resultados agregados originales |
| `powerbi/datos/` | Ocho tablas de Power BI |
| `powerbi/proyecto/Observatorio.pbip` | Proyecto editable: cinco páginas, ocho visualizaciones y 24 medidas |
| `powerbi/observatorio_v1.0.pbix` | Versión final con datos cargados, cinco páginas y ocho visualizaciones |
| `powerbi/observatorio_v0.1_avance.pbix` | Versión 0.1 conservada, con dos gráficos |
| `powerbi/power_query.m`, `powerbi/medidas.dax` | Consultas y medidas |
| `docs/evidencias/` | Capturas de ambas versiones y resultados de pruebas |
| `docs/validacion.md` | Verificaciones, diferencias y pendientes |

La versión final se abrió, actualizó y guardó con Power BI Desktop `2.159.1231.0` de 64 bits en Windows. El archivo `.pbix` incluye los datos y puede consultarse sin actualizar las fuentes. El proyecto `.pbip` conserva las definiciones editables para revisar los cambios con Git. La versión 0.1 registra Desktop `2.159.1206.0`.

## Preparación de datos

El entorno comprobado utiliza Python 3.13.2, pandas 2.3.3 y NumPy 2.4.2. Desde la raíz se ejecuta:

```powershell
python -m pip install -r requirements.txt
python src/limpieza.py
python src/preparar_powerbi.py
```

Los CSV necesarios ya están en `data/raw/`. Los scripts transforman resultados existentes y verifican claves, fechas y métricas; no entrenan modelos. La base de microdatos no es necesaria para reproducir estas ocho visualizaciones y permanece excluida de Git.

## Versión web

Se comprobó con Node.js 22.14.0 y npm 10.9.2.

```powershell
cd dashboard
npm ci
npm run dev
```

La aplicación se abre en `http://localhost:5173`. La compilación se realiza con `npm run build` y su vista local con `npm run preview`.

La configuración de Docker se ejecuta desde la raíz con `docker compose up --build` y utiliza `http://localhost:8080`. La imagen no se comprobó porque el servicio de Docker no estaba disponible.

## Power BI Desktop

1. Se abre `powerbi/observatorio_v1.0.pbix` para consultar la versión final. Para editar las definiciones se abre `powerbi/proyecto/Observatorio.pbip` o `powerbi/proyecto/Observatorio.Report/definition.pbir`.
2. Para actualizar en otra ubicación, en Transformar datos > Administrar parámetros se cambia `RutaDatos` a la carpeta absoluta `powerbi\datos\`, con barra invertida al final. Ejemplo: `C:\Datos\Lab10-DS\powerbi\datos\`.
3. Se aplican los cambios y se selecciona Actualizar. El `.pbix` incluye datos cargados. El proyecto editable no versiona la caché; su primera apertura requiere cargar los CSV.
4. Se revisan las páginas Resumen, Estacionalidad, Pronósticos, Modelos y confianza y Glosario.
5. En Resumen se selecciona una barra y se comprueba el cambio de la serie histórica. La jerarquía permite bajar y subir entre año, trimestre y mes.
6. Se verifican los segmentadores sincronizados de serie y período y Restablecer filtros. En modo de edición los botones se activan con Ctrl + clic.
7. Se guarda el archivo tras actualizar las fuentes. Si Desktop propone convertir el proyecto a TMDL, se selecciona No actualizar para conservar `model.bim`.

La navegación utiliza las pestañas de página. Sin una serie seleccionada, los indicadores utilizan el total nacional. V2 y V9 conservan las categorías para permitir su comparación. Se comprobaron en Desktop el enlace V2–V1, la jerarquía anual, trimestral y mensual y el marcador Restablecer filtros. El marcador recupera Resumen, el período completo y el nivel anual; conserva el filtro de regiones y fronteras de V2.

## Tablas y reglas

| Tabla | Filas | Función |
|---|---:|---|
| `dim_serie` | 7 | Total nacional, tres regiones y tres fronteras |
| `dim_fecha` | 210 | Calendario y jerarquía de fecha |
| `dim_modelo` | 6 | Catálogo de modelos |
| `hechos_viajeros` | 1,470 | Observaciones por serie y mes |
| `hechos_pronosticos` | 2,331 | Predicciones e intervalos disponibles |
| `metricas_modelos` | 37 | MAE, RMSE, AIC y BIC disponibles |
| `perdidas_lstm` | 288 | Ajuste y validación por época y configuración |
| `similitud_series` | 7 | Coordenadas PCA y grupos catch22 |

Se definen nueve relaciones activas de uno a varios, desde dimensiones hacia hechos. Las métricas no tienen relación con la fecha: corresponden a los 63 meses de prueba, de abril de 2021 a junio de 2026. Las series son cortes del mismo total y no se suman entre sí.

LSTM está disponible únicamente para el total nacional y América del Centro. Se utiliza la variante recursiva. Seasonal naive es la referencia; ARIMA y suavizamiento exponencial simple son complementarios. Solo ARIMA y Prophet incluyen intervalos del 80 %.

Se conservan los pronósticos negativos para mantener los resultados originales y sus errores. No representan cantidades posibles de viajeros. La pérdida LSTM está estandarizada y no se compara directamente con MAE o RMSE en viajeros.

## Visualizaciones

| Vista | Web | Power BI editable |
|---|---|---|
| V1. Evolución | Líneas, zoom y niveles de detalle | Líneas con jerarquía |
| V2. Participación | Barras enlazadas con V1 | Barras enlazadas con V1 |
| V3. Temporada alta y baja | Mapa de calor año por mes | Matriz año por mes |
| V4. Recuperación | Índice frente a los mismos meses de 2019 | Índice frente a los mismos meses de 2019 |
| V6. Predicción | Observado y estimación con banda disponible | Observado, estimación y líneas de límites |
| V7. Desempeño | Selector MAE/RMSE | Barras de MAE y RMSE |
| V8. Entrenamiento LSTM | Curvas de ajuste y validación | Curvas de ajuste y validación |
| V9. Similitud | Dispersión por grupos | Dispersión por grupos |

La matriz de Power BI permite leer las cifras exactas representadas por intensidad de color en la web. Los intervalos se consultan mensualmente; sumar límites no produce un intervalo válido para un año o trimestre. Las métricas, pérdidas y coordenadas conservan su período original.

No se incluye V5 porque las fuentes versionadas no contienen agregados por vía y tipo de viajero. Las ocho vistas anteriores cubren el alcance implementado.

## Tres tareas de comparación

| Tarea | Secuencia en la web | Secuencia en Power BI | Referencia |
|---|---|---|---|
| Consulta con filtros | La Aurora; ene a dic 2019; leer tarjetas y V2 | Resumen; misma serie y período; leer indicadores y V2 | 1,481,702 viajeros; 35.9 %; máximo en dic 2019 |
| General, detalle y regreso | Total nacional; 2019; nivel anual, trimestral y mensual; restablecer | Bajar de 2019 a T4 y luego a mes; subir o restablecer | T4: 1,079,402; diciembre: 449,114; regreso a la vista inicial |
| Tres modelos | América del Centro; dic 2023; Pronósticos; consultar los tres modelos; abrir Modelos y confianza | Mismos filtros; consultar modelos en Pronósticos y errores en Modelos y confianza | Prophet: 185,430; Holt-Winters: 94,203; LSTM: 75,532; menor RMSE: Prophet, 67,838 |

El total nacional de 2019 es 4,132,252 en la web y 4,132,250.60 en los CSV por el redondeo mensual del JSON. Las diferencias y los resultados obtenidos se registran en `docs/validacion.md`.

Desde `dashboard/` se ejecuta `npm test`. En Windows se utiliza Microsoft Edge; en otros sistemas se instala Chromium con `npx playwright install chromium`. Las pruebas comprueban las tres tareas, las ocho gráficas, el enlace V1–V2 y dos selecciones sin pronósticos. Sus tiempos son automatizados y no representan tiempos humanos de uso.

## Acceso y mantenimiento

| Aspecto | Web | Power BI |
|---|---|---|
| Uso local | Node.js o un servidor de archivos estáticos | Desktop se descarga sin costo y requiere Windows |
| Licencias | React y Vite: MIT; ECharts: Apache 2.0 | El acceso al servicio depende de licencias y capacidad |
| Distribución | Requiere alojamiento y control de acceso; el costo depende del proveedor | Un archivo PBIX requiere Desktop; la consulta por navegador requiere revisar licencias y permisos |
| Actualización | Regeneración de datos y nueva compilación | Actualización de fuentes CSV y ejecución de Actualizar |
| Docker Desktop | El uso educativo figura entre los usos gratuitos; otras organizaciones deben revisar las condiciones | No es necesario para abrir el proyecto |

Publicar en web de Power BI permite acceso público sin autenticación y puede exponer datos del modelo. Los datos académicos requieren acceso autorizado. El repositorio y cualquier alojamiento deben conservar esa restricción.

## Referencias técnicas

Consulta: 8 de noviembre de 2026.

- [Proyectos de Power BI Desktop](https://learn.microsoft.com/en-us/power-bi/developer/projects/projects-overview).
- [Carpeta del informe y apertura de PBIR](https://learn.microsoft.com/en-us/power-bi/developer/projects/projects-report).
- [Modelo semántico y carga sin caché](https://learn.microsoft.com/en-us/power-bi/developer/projects/projects-dataset).
- [Descarga de Power BI Desktop](https://learn.microsoft.com/en-us/power-bi/fundamentals/desktop-get-the-desktop).
- [Funciones según la licencia](https://learn.microsoft.com/en-us/power-bi/fundamentals/service-features-license-type).
- [Condiciones de Publicar en web](https://learn.microsoft.com/en-us/power-bi/collaborate-share/service-publish-to-web).
- [Licencia de Docker Desktop](https://docs.docker.com/subscription-billing/desktop-license/).
