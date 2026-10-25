# Exportación de resultados de los Laboratorios 1 y 2 para el tablero

Los notebooks de los Laboratorios 1 y 2 calculan los pronósticos y las curvas de pérdida, pero
solo los grafican; no los guardan. Estas celdas los exportan a CSV **sin cambiar ningún modelo**:
se vuelven a correr las mismas especificaciones sobre los mismos datos (el Lab 2 usa semilla 42).

Todas las salidas quedan en `data/processed/` de cada laboratorio y luego se copian a
`Lab10-DS/data/raw/`.

| Repositorio | Notebook | Archivo que produce |
|---|---|---|
| Laboratorio 1 | `03_serie_total.ipynb` | `pronosticos_total.csv`, `metricas_total.csv` |
| Laboratorio 1 | `04_series_regiones.ipynb` | `pronosticos_regiones.csv`, `metricas_regiones.csv` |
| Laboratorio 1 | `05_series_fronteras.ipynb` | `pronosticos_fronteras.csv`, `metricas_fronteras.csv` |
| Laboratorio 2 | `01_lstm_series.ipynb` | `pronosticos_lstm.csv`, `perdidas_lstm.csv` |
| Laboratorio 2 | `02_catch22.ipynb` | `pca_catch22.csv` (además de los CSV que ya exportaba) |

## Entorno probado (Windows, Python 3.12)

Además de los `requirements.txt` de cada laboratorio:

```bash
pip install "prophet==1.5.0" "cmdstanpy==1.2.4"
```

- **Usar Prophet 1.5.0**: reproduce el informe del Laboratorio 1 (MAE del total 132,305). Con
  Prophet 1.1.x o 1.2.x el mismo código da resultados muy distintos (MAE del total 57,475).
- Con `cmdstanpy` 1.3 Prophet falla con `'Prophet' object has no attribute 'stan_backend'`
  (la validación de CmdStan rechaza la copia que trae Prophet).
- No definir `PYTHONUTF8=1` al correr el Laboratorio 1: con Windows en español, cmdstanpy no puede
  leer la salida del comando `where` y produce el mismo error.
- El kernel de los notebooks se llama `cc3084-lab1`; si no existe, ejecutar con
  `jupyter nbconvert --execute --ExecutePreprocessor.kernel_name=python3 ...`.
- La LSTM no reproduce exactamente el informe del Laboratorio 2 aunque use semilla 42: con PyTorch
  2.14 el MAE recursivo fue 124,415 (total) y 86,056 (América del Centro), frente a 126,226 y 94,799
  en el informe. Las conclusiones no cambian. El tablero calcula todas las métricas desde los
  pronósticos exportados, para que cifras y gráficas sean consistentes entre sí.

## Formato de las salidas

`pronosticos_*.csv`: una fila por serie, mes de prueba y modelo.

| Columna | Descripción |
|---|---|
| `serie` | Clave de la serie (`total`, `region_america_central`, ...) |
| `fecha` | Primer día del mes (`AAAA-MM-01`), abril de 2021 a junio de 2026 |
| `modelo` | `ARIMA`, `Holt-Winters`, `Suavizamiento exp. simple`, `Seasonal naive`, `Prophet` o `LSTM` |
| `detalle` | Nombre completo: orden del ARIMA, o `LSTM recursiva` / `LSTM un paso` |
| `real` | Viajeros observados ese mes |
| `predicho` | Viajeros pronosticados |
| `li`, `ls` | Límites del intervalo de predicción del 80 %; vacíos si el modelo no lo da |

`metricas_*.csv`: `serie, modelo, detalle, MAE, RMSE, AIC, BIC` para **todos** los modelos de cada
serie (los `resumen_*.csv` actuales solo traen el mejor).

`perdidas_lstm.csv`: `serie, config, epoca, perdida_ajuste, perdida_validacion, mejor_epoca`.
Las pérdidas son MSE en la escala estandarizada con la que se entrena la red, no en viajeros.

---

## Laboratorio 1

### Paso 1. Cambios en `src/ts_utils.py`

**a)** Agregar esta función al final del archivo:

```python
# ---------------------------------------------------------------------------
# Exportación para el tablero del Laboratorio 10
# ---------------------------------------------------------------------------

def _modelo_base(nombre: str) -> str:
    """Nombre del modelo sin el orden del ARIMA y con un solo nombre para SES."""
    if nombre.startswith("ARIMA"):
        return "ARIMA"
    if nombre.startswith("Suav"):
        return "Suavizamiento exp. simple"
    return nombre


def pronosticos_a_tabla(clave: str, test: pd.Series, forecasts: dict, intervalos: dict | None = None) -> pd.DataFrame:
    """Pronósticos del conjunto de prueba en formato largo (una fila por mes y modelo)."""
    intervalos = intervalos or {}
    tablas = []
    for nombre, pred in forecasts.items():
        pred = np.asarray(pred, dtype=float)
        n = min(len(pred), len(test))
        ci = intervalos.get(nombre)
        ci = np.asarray(ci, dtype=float)[:n] if ci is not None else np.full((n, 2), np.nan)
        tablas.append(pd.DataFrame({
            "serie": clave, "fecha": test.index[:n].strftime("%Y-%m-%d"),
            "modelo": _modelo_base(nombre), "detalle": nombre,
            "real": test.values[:n], "predicho": pred[:n], "li": ci[:, 0], "ls": ci[:, 1],
        }))
    return pd.concat(tablas, ignore_index=True)


def metricas_a_tabla(clave: str, tabla_metricas: pd.DataFrame) -> pd.DataFrame:
    """Tabla de MAE, RMSE, AIC y BIC de todos los modelos de una serie."""
    t = tabla_metricas.rename(columns={"modelo": "detalle"}).copy()
    t.insert(0, "serie", clave)
    t.insert(1, "modelo", t["detalle"].map(_modelo_base))
    return t[["serie", "modelo", "detalle", "MAE", "RMSE", "AIC", "BIC"]]
```

**b)** Dentro de `analizar_serie_completa`, en la sección `# 4h: benchmarks`, cambiar:

```python
    prophet_pred, _ = fit_prophet_model(train, pasos=horizonte)
```

por:

```python
    prophet_pred, prophet_full = fit_prophet_model(train, pasos=horizonte)
```

**c)** Inmediatamente después de la línea `pred_ses = ses.forecast(horizonte)`, agregar:

```python
    # Intervalos de predicción del 80 % (mismo ancho que el de Prophet).
    ci_arima = np.asarray(mejor_arima.get_forecast(steps=horizonte).conf_int(alpha=0.2))
    intervalos = {f"ARIMA {mejor_clave}": np.exp(ci_arima) if usa_log else ci_arima}
    if prophet_full is not None:
        intervalos["Prophet"] = prophet_full[["yhat_lower", "yhat_upper"]].iloc[-horizonte:].values
```

**d)** En el `return` final de `analizar_serie_completa`, agregar dos claves:

```python
        "train": train, "test": test, "corr_nivel_std": corr,
        "forecasts": forecasts, "intervalos": intervalos,
    }
```

### Paso 2. Celda al final de `03_serie_total.ipynb`

```python
# Exportación para el tablero del Laboratorio 10.
ci_arima = np.exp(np.asarray(mejor_arima.get_forecast(steps=HORIZONTE).conf_int(alpha=0.2)))
intervalos = {f"ARIMA {mejor_clave}": ci_arima}
if prophet_full is not None:
    intervalos["Prophet"] = prophet_full[["yhat_lower", "yhat_upper"]].iloc[-HORIZONTE:].values

tsu.pronosticos_a_tabla("total", test, forecasts, intervalos).to_csv(
    "../data/processed/pronosticos_total.csv", index=False)
tsu.metricas_a_tabla("total", tabla_final).to_csv(
    "../data/processed/metricas_total.csv", index=False)
print("Guardado: pronosticos_total.csv y metricas_total.csv")
```

### Paso 3. Celda al final de `04_series_regiones.ipynb`

```python
# Exportación para el tablero del Laboratorio 10.
resultados_region = [resultado_ac, resultado_an, resultado_eu]
pd.concat([tsu.pronosticos_a_tabla(SERIES_REGION[r["nombre"]], r["test"], r["forecasts"], r["intervalos"])
           for r in resultados_region]).to_csv("../data/processed/pronosticos_regiones.csv", index=False)
pd.concat([tsu.metricas_a_tabla(SERIES_REGION[r["nombre"]], r["tabla_metricas"])
           for r in resultados_region]).to_csv("../data/processed/metricas_regiones.csv", index=False)
print("Guardado: pronosticos_regiones.csv y metricas_regiones.csv")
```

### Paso 4. Celda al final de `05_series_fronteras.ipynb`

```python
# Exportación para el tablero del Laboratorio 10.
resultados_frontera = [resultado_au, resultado_vn, resultado_sc]
pd.concat([tsu.pronosticos_a_tabla(SERIES_FRONTERA[r["nombre"]], r["test"], r["forecasts"], r["intervalos"])
           for r in resultados_frontera]).to_csv("../data/processed/pronosticos_fronteras.csv", index=False)
pd.concat([tsu.metricas_a_tabla(SERIES_FRONTERA[r["nombre"]], r["tabla_metricas"])
           for r in resultados_frontera]).to_csv("../data/processed/metricas_fronteras.csv", index=False)
print("Guardado: pronosticos_fronteras.csv y metricas_fronteras.csv")
```

---

## Laboratorio 2

### Paso 5. Celda al final de `01_lstm_series.ipynb`

La LSTM solo se entrenó para `total` y `region_america_central`; el tablero debe decir «sin
pronóstico LSTM» en las otras cinco series.

```python
# Exportación para el tablero del Laboratorio 10.
CONFIGS = {"Modelo A": CONFIG_A, "Modelo B": CONFIG_B}
pronosticos, perdidas = [], []
for clave, d in datos.items():
    for tipo in ["recursiva", "un paso"]:
        pred = np.asarray(d["pred_recursiva" if tipo == "recursiva" else "pred_un_paso"], dtype=float)
        n = min(len(pred), len(d["test"]))
        pronosticos.append(pd.DataFrame({
            "serie": clave, "fecha": d["test"].index[:n].strftime("%Y-%m-%d"),
            "modelo": "LSTM", "detalle": f"LSTM {tipo}",
            "real": d["test"].values[:n], "predicho": pred[:n], "li": np.nan, "ls": np.nan,
        }))
    for nombre, (_, hist) in d["modelos_base"].items():
        c = CONFIGS[nombre]
        perdidas.append(pd.DataFrame({
            "serie": clave,
            "config": f"{nombre} ({c['hidden_size']} neuronas, {c['num_layers']} capa(s), dropout {c['dropout']})",
            "epoca": np.arange(1, len(hist["perdidas_train"]) + 1),
            "perdida_ajuste": hist["perdidas_train"], "perdida_validacion": hist["perdidas_val"],
            "mejor_epoca": hist["mejor_epoca"] + 1,
        }))

pd.concat(pronosticos).to_csv("../data/processed/pronosticos_lstm.csv", index=False)
pd.concat(perdidas).to_csv("../data/processed/perdidas_lstm.csv", index=False)
print("Guardado: pronosticos_lstm.csv y perdidas_lstm.csv")
```

### Paso 6. Celda al final de `02_catch22.ipynb`

```python
# Exportación para el tablero del Laboratorio 10: coordenadas de cada serie en el plano PC1-PC2.
pca_export = pd.DataFrame(coords[:, :2], index=matriz_std.index, columns=["PC1", "PC2"])
pca_export["var_PC1"] = pca.explained_variance_ratio_[0]
pca_export["var_PC2"] = pca.explained_variance_ratio_[1]
pca_export.to_csv("../data/processed/pca_catch22.csv")
print("Guardado: pca_catch22.csv")
```

---

## Paso 7. Copiar al Laboratorio 10

Copiar a `Lab10-DS/data/raw/`:

- `pronosticos_total.csv`, `pronosticos_regiones.csv`, `pronosticos_fronteras.csv`, `pronosticos_lstm.csv`
- `metricas_total.csv`, `metricas_regiones.csv`, `metricas_fronteras.csv`
- `perdidas_lstm.csv`
- `matriz_catch22.csv`, `grupos_catch22.csv`, `importancia_catch22.csv`, `pca_catch22.csv`
- `comparacion_lab1_lab2.csv` (métricas de la LSTM frente al Lab 1, ya existía)
