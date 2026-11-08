# Codebook: series y resultados del observatorio

Los datos del tablero son **series mensuales agregadas** del ingreso de viajeros internacionales a
Guatemala (enero de 2009 a junio de 2026, 210 meses). Provienen de los Laboratorios 1 y 2 y se
construyen con `Turista + Excursionista`, la única combinación comparable en todo el período.
Son de uso académico y no corresponden a cifras oficiales del INGUAT ni del IGM.

La base original de microdatos (`Base_Migracion_2009-2026jun.xlsx`) **no se versiona**: está
excluida en `.gitignore` por la cláusula de confidencialidad de la guía del proyecto.

## `data/raw/` (entradas, no se modifican)

### `series_mensuales.csv`
| Columna | Tipo | Descripción |
|---|---|---|
| `serie` | texto | Clave de la serie (ver tabla de series) |
| `fecha` | fecha | Primer día del mes (`AAAA-MM-01`) |
| `conjunto` | texto | `train` (2009-01 a 2021-03) o `test` (2021-04 a 2026-06), la partición 70/30 del Laboratorio 1 |
| `viajeros` | número | Viajeros en el mes (personas; son estimaciones expandidas, pueden tener decimales) |

### `resumen_total.csv`, `resumen_regiones.csv`, `resumen_fronteras.csv`
Métricas del Laboratorio 1 sobre el conjunto de prueba (MAE y RMSE en viajeros por mes; AIC y BIC
cuando aplican) y el mejor modelo por serie.

## `data/processed/` (salidas de `src/limpieza.py`)

### `series.json`
| Campo | Descripción |
|---|---|
| `meses` | Lista de 210 meses `AAAA-MM`, en orden |
| `conjunto` | `train` o `test` para cada mes |
| `series[].clave` / `nombre` / `grupo` | Identificador, nombre legible y categoría (`General`, `Región`, `Frontera`) |
| `series[].valores` | Viajeros por mes, alineados con `meses`; `null` significa «sin dato», nunca cero |

## Series

| Clave | Nombre | Grupo |
|---|---|---|
| `total` | Total nacional | General |
| `region_america_central` | América del Centro | Región |
| `region_america_norte` | América del Norte | Región |
| `region_europa` | Europa | Región |
| `frontera_aurora` | 01 La Aurora | Frontera |
| `frontera_valle_nuevo` | 07 Valle Nuevo | Frontera |
| `frontera_san_cristobal` | 09 San Cristóbal | Frontera |

## Limitaciones a tener presentes
- **Quiebre 2022 a 2023:** la fuente cambia (sistema depurado del INGUAT desde 2023), por lo que los niveles no son perfectamente comparables hacia atrás.
- **2026** cubre solo enero a junio; los totales anuales de 2026 son parciales.
- **Pandemia:** colapso desde marzo de 2020 y piso en 2020 y 2021.
- Regiones y fronteras son cortes distintos del mismo total: no se suman entre sí.

## Resultados de modelos en `series.json`

| Campo | Contenido |
|---|---|
| `modelos.pronosticos` | Serie, modelo, detalle, índice inicial y valores predichos; incluye límites cuando existen |
| `modelos.metricas` | MAE y RMSE de los 63 meses de prueba; AIC y BIC disponibles |
| `modelos.perdidas` | Pérdidas estandarizadas de ajuste y validación, configuración y mejor época de LSTM |
| `modelos.similitud` | Coordenadas PC1 y PC2, grupo y proporción de varianza de catch22/PCA |

El índice `desde` alinea cada pronóstico con `meses`. Las predicciones cubren abril de 2021 a junio de 2026. Los intervalos ausentes se guardan como `null`; no representan cero.

La web utiliza observaciones y pronósticos redondeados al entero. MAE y RMSE se calculan antes de redondear. Los CSV de Power BI conservan los decimales. Por ello, sumar los meses del JSON puede dar una cifra ligeramente distinta de redondear la suma de los CSV.

## Tablas de `powerbi/datos/`

| Tabla | Clave | Descripción |
|---|---|---|
| `dim_serie` | `serie_id` | Nombre, grupo, etiqueta y orden de cada serie |
| `dim_fecha` | `fecha` | Mes, año, trimestre, conjunto y marca de pandemia |
| `dim_modelo` | `modelo_id` | Nombre, rol y orden del modelo |
| `hechos_viajeros` | `serie_id`, `fecha` | Valores observados sin redondear |
| `hechos_pronosticos` | `serie_id`, `fecha`, `modelo_id` | Predicción, límites y error respecto al observado |
| `metricas_modelos` | `serie_id`, `modelo_id` | Métricas por combinación y período de evaluación |
| `perdidas_lstm` | `serie_id`, `config`, `epoca` | Error estandarizado durante el entrenamiento |
| `similitud_series` | `serie_id` | Coordenadas PCA y grupo de K-medias |

Se excluye LSTM de un paso. Se conserva LSTM recursiva para el total nacional y América del Centro. Los límites del 80 % solo están disponibles para ARIMA y Prophet. Las predicciones negativas se mantienen como resultado del modelo y se explican como limitación.

Las métricas, pérdidas y coordenadas se refieren al análisis original. Cambiar el período de observaciones no vuelve a entrenar modelos ni recalcula esas salidas. El índice de recuperación sí depende del período y utiliza los mismos meses de 2019 como denominador.
