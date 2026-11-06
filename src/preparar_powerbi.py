"""
Prepara las tablas que importa el informe de Power BI (Laboratorio 12).

Lee las mismas salidas de los Laboratorios 1 y 2 que usa el tablero de React y escribe un
modelo en estrella en `powerbi/datos/`. No entrena ni recalibra modelos. Aplica las mismas
reglas que `src/limpieza.py` para que ambas versiones sean comparables:

- se descarta la LSTM "un paso", porque usa el valor real del mes anterior y no es
  comparable con los pronósticos a 63 meses;
- MAE y RMSE se calculan desde los pronósticos, sobre abril 2021 a junio 2026;
- AIC y BIC se toman de los archivos de métricas, solo donde existen.

A diferencia de `limpieza.py`, aquí no se redondea: los valores conservan sus decimales.

Si una validación falla, el script se detiene sin escribir archivos.

Uso (desde la raíz del repositorio):
    python src/preparar_powerbi.py
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd

from limpieza import NOMBRES, NOMBRES_CATCH22

RAIZ = Path(__file__).resolve().parent.parent
CRUDO = RAIZ / "data" / "raw"
RUTA_JSON = RAIZ / "data" / "processed" / "series.json"
SALIDA = RAIZ / "powerbi" / "datos"
RUTA_CONTROL = RAIZ / "powerbi" / "valores_control.csv"

PRONOSTICOS = ["pronosticos_total.csv", "pronosticos_regiones.csv", "pronosticos_fronteras.csv", "pronosticos_lstm.csv"]
METRICAS = ["metricas_total.csv", "metricas_regiones.csv", "metricas_fronteras.csv"]

MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

# Los tres modelos del alcance del Laboratorio 10, su referencia y los complementarios.
MODELOS = [
    ("prophet", "Prophet", "Principal", 1),
    ("holt_winters", "Holt-Winters", "Principal", 2),
    ("lstm", "LSTM", "Principal", 3),
    ("seasonal_naive", "Seasonal naive", "Referencia", 4),
    ("arima", "ARIMA", "Complementario", 5),
    ("suavizamiento", "Suavizamiento exp. simple", "Complementario", 6),
]


def dim_serie() -> pd.DataFrame:
    filas = [
        {"serie_id": clave, "serie": nombre, "grupo": grupo, "orden": i,
         "etiqueta": nombre if grupo == "General" else f"{grupo} · {nombre}"}
        for i, (clave, (nombre, grupo)) in enumerate(NOMBRES.items(), start=1)
    ]
    return pd.DataFrame(filas)


def dim_fecha(viajeros: pd.DataFrame) -> pd.DataFrame:
    base = viajeros[viajeros["serie_id"] == "total"][["fecha", "conjunto"]].sort_values("fecha")
    f = base["fecha"]
    return pd.DataFrame({
        "fecha": f.dt.strftime("%Y-%m-%d"),
        "anio": f.dt.year,
        "trimestre_num": f.dt.quarter,
        "trimestre": "T" + f.dt.quarter.astype(str),
        "mes_num": f.dt.month,
        "mes": f.dt.month.map(lambda m: MESES[m - 1]),
        "mes_anio": f.dt.month.map(lambda m: MESES[m - 1]) + " " + f.dt.year.astype(str),
        "conjunto": base["conjunto"].map({"train": "Entrenamiento", "test": "Prueba"}),
        "pandemia": ((f >= "2020-03-01") & (f <= "2021-12-01")).map({True: "Sí", False: "No"}),
    })


def cargar_pronosticos() -> pd.DataFrame:
    pron = pd.concat([pd.read_csv(CRUDO / n) for n in PRONOSTICOS], ignore_index=True)
    pron = pron[pron["detalle"] != "LSTM un paso"].copy()
    pron["fecha"] = pd.to_datetime(pron["fecha"])
    pron["modelo_id"] = pron["modelo"].map({nombre: clave for clave, nombre, _, _ in MODELOS})
    pron = pron.rename(columns={"serie": "serie_id"})
    pron["error"] = pron["predicho"] - pron["real"]
    return pron


def tabla_metricas(pron: pd.DataFrame, viajeros: pd.DataFrame) -> pd.DataFrame:
    nivel = viajeros[viajeros["conjunto"] == "test"].groupby("serie_id")["viajeros"].mean()
    aic = pd.concat([pd.read_csv(CRUDO / n) for n in METRICAS], ignore_index=True)
    aic = {(r.serie, r.detalle): (r.AIC, r.BIC) for r in aic.itertuples()}
    filas = []
    for (serie, modelo, detalle), g in pron.groupby(["serie_id", "modelo_id", "detalle"], sort=False):
        mae = g["error"].abs().mean()
        rmse = np.sqrt((g["error"] ** 2).mean())
        a, b = aic.get((serie, detalle), (np.nan, np.nan))
        filas.append({
            "serie_id": serie, "modelo_id": modelo, "detalle": detalle, "MAE": mae, "RMSE": rmse,
            "MAE_pct_nivel": mae / nivel[serie], "RMSE_pct_nivel": rmse / nivel[serie],
            "AIC": a, "BIC": b, "meses_evaluados": len(g),
            "conjunto_evaluacion": "Prueba: abr 2021 a jun 2026",
        })
    return pd.DataFrame(filas)


def tabla_perdidas() -> pd.DataFrame:
    return pd.read_csv(CRUDO / "perdidas_lstm.csv").rename(columns={"serie": "serie_id"})


def tabla_similitud() -> pd.DataFrame:
    pca = pd.read_csv(CRUDO / "pca_catch22.csv")
    pca = pca.rename(columns={pca.columns[0]: "nombre"})
    grupos = pd.read_csv(CRUDO / "grupos_catch22.csv")
    pca["grupo_kmedias"] = pca["nombre"].map(dict(zip(grupos["serie"], grupos["grupo K-medias"])))
    pca["serie_id"] = pca["nombre"].map(NOMBRES_CATCH22)
    return pca[["serie_id", "PC1", "PC2", "grupo_kmedias", "var_PC1", "var_PC2"]]


def validar(tablas: dict[str, pd.DataFrame], pron: pd.DataFrame) -> None:
    """Falla si las tablas podrían duplicar registros o alterar los resultados del Lab 10."""
    series = set(tablas["dim_serie"]["serie_id"])
    fechas = set(tablas["dim_fecha"]["fecha"])
    modelos = set(tablas["dim_modelo"]["modelo_id"])
    viajeros = tablas["hechos_viajeros"]
    pronos = tablas["hechos_pronosticos"]
    metricas = tablas["metricas_modelos"]

    # Claves únicas: cada dimensión es el lado "uno" de su relación.
    for tabla, clave in [("dim_serie", ["serie_id"]), ("dim_fecha", ["fecha"]), ("dim_modelo", ["modelo_id"]),
                         ("hechos_viajeros", ["serie_id", "fecha"]),
                         ("hechos_pronosticos", ["serie_id", "fecha", "modelo_id"]),
                         ("metricas_modelos", ["serie_id", "modelo_id"])]:
        if tablas[tabla].duplicated(clave).any():
            raise ValueError(f"{tabla} tiene claves duplicadas en {clave}")

    # Integridad: toda fila de hechos encuentra su dimensión.
    for tabla in ["hechos_viajeros", "hechos_pronosticos", "metricas_modelos", "perdidas_lstm", "similitud_series"]:
        if not set(tablas[tabla]["serie_id"]) <= series:
            raise ValueError(f"{tabla} tiene series que no están en dim_serie")
    for tabla in ["hechos_viajeros", "hechos_pronosticos"]:
        if not set(tablas[tabla]["fecha"]) <= fechas:
            raise ValueError(f"{tabla} tiene fechas que no están en dim_fecha")
    for tabla in ["hechos_pronosticos", "metricas_modelos"]:
        if pd.isna(tablas[tabla]["modelo_id"]).any() or not set(tablas[tabla]["modelo_id"]) <= modelos:
            raise ValueError(f"{tabla} tiene modelos que no están en dim_modelo")

    # El valor real de los pronósticos debe ser el mismo de la serie observada.
    obs = viajeros.assign(fecha=pd.to_datetime(viajeros["fecha"]))
    cruce = pron.merge(obs, on=["serie_id", "fecha"], how="left")
    dif = (cruce["real"] - cruce["viajeros"]).abs().max()
    if pd.isna(dif) or dif > 0.5:
        raise ValueError(f"El valor real de los pronósticos difiere de la serie observada (máx. {dif})")

    # Cada combinación serie y modelo cubre los 63 meses de prueba.
    if set(metricas["meses_evaluados"]) != {63}:
        raise ValueError("Hay combinaciones de serie y modelo sin los 63 meses de prueba")

    # Mismas métricas que el tablero de React (que las redondea al entero).
    if RUTA_JSON.exists():
        ref = pd.DataFrame(json.loads(RUTA_JSON.read_text(encoding="utf8"))["modelos"]["metricas"])
        ref["modelo_id"] = ref["modelo"].map({nombre: clave for clave, nombre, _, _ in MODELOS})
        c = metricas.merge(ref, left_on=["serie_id", "modelo_id"], right_on=["serie", "modelo_id"], suffixes=("", "_react"))
        if len(c) != len(metricas):
            raise ValueError("Las métricas no cubren las mismas combinaciones que el tablero de React")
        peor = max((c["MAE"] - c["MAE_react"]).abs().max(), (c["RMSE"] - c["RMSE_react"]).abs().max())
        if peor > 0.51:
            raise ValueError(f"Las métricas difieren de las del tablero de React (máx. {peor})")
        print(f"Métricas iguales a las de React en {len(c)} combinaciones (diferencia máx. {peor:.2f} por redondeo)")


def valores_control(t: dict[str, pd.DataFrame]) -> pd.DataFrame:
    """Cifras esperadas para comprobar el informe y ejecutar las pruebas del protocolo."""
    v = t["hechos_viajeros"].merge(t["dim_fecha"], on="fecha")
    tot = v[v["serie_id"] == "total"]
    filas = []

    def agregar(indicador, filtros, valor, nota=""):
        filas.append({"indicador": indicador, "filtros": filtros, "valor": valor, "nota": nota})

    agregar("Viajeros en el período", "Total nacional; ene 2009 a jun 2026", round(tot["viajeros"].sum(), 2),
            "React muestra la suma de meses ya redondeados")
    agregar("Viajeros en el período (como React)", "Total nacional; ene 2009 a jun 2026", tot["viajeros"].round().sum())
    agregar("Promedio mensual", "Total nacional; ene 2009 a jun 2026", round(tot["viajeros"].mean(), 2))
    alto, bajo = tot.loc[tot["viajeros"].idxmax()], tot.loc[tot["viajeros"].idxmin()]
    agregar("Mes más alto", "Total nacional; ene 2009 a jun 2026", round(alto["viajeros"], 2), alto["mes_anio"])
    agregar("Mes más bajo", "Total nacional; ene 2009 a jun 2026", round(bajo["viajeros"], 2), bajo["mes_anio"])

    for s in t["dim_serie"].itertuples():
        if s.serie_id != "total":
            parte = v[v["serie_id"] == s.serie_id]["viajeros"].sum() / tot["viajeros"].sum()
            agregar("Participación", f"{s.etiqueta}; ene 2009 a jun 2026", round(parte, 6))

    aur = v[(v["serie_id"] == "frontera_aurora") & (v["anio"] == 2019)]
    alto = aur.loc[aur["viajeros"].idxmax()]
    agregar("Prueba 1: viajeros", "Frontera 01 La Aurora; año 2019", round(aur["viajeros"].sum(), 2))
    agregar("Prueba 1: mes más alto", "Frontera 01 La Aurora; año 2019", round(alto["viajeros"], 2), alto["mes_anio"])
    agregar("Prueba 1: participación", "Frontera 01 La Aurora; año 2019",
            round(aur["viajeros"].sum() / tot[tot["anio"] == 2019]["viajeros"].sum(), 4))

    t19 = tot[tot["anio"] == 2019]
    agregar("Prueba 2: año", "Total nacional; 2019", round(t19["viajeros"].sum(), 2))
    for q, g in t19.groupby("trimestre"):
        agregar("Prueba 2: trimestre", f"Total nacional; 2019 {q}", round(g["viajeros"].sum(), 2))
    t4 = t19[t19["trimestre"] == "T4"]
    for r in t4.itertuples():
        agregar("Prueba 2: mes", f"Total nacional; {r.mes_anio}", round(r.viajeros, 2))

    p = t["hechos_pronosticos"]
    m = t["metricas_modelos"]
    obs = v[(v["serie_id"] == "region_america_central") & (v["fecha"] == "2023-12-01")]["viajeros"].iat[0]
    agregar("Prueba 3: observado", "América del Centro; dic 2023", round(obs, 2))
    for modelo in ["prophet", "holt_winters", "lstm", "seasonal_naive"]:
        pred = p[(p["serie_id"] == "region_america_central") & (p["fecha"] == "2023-12-01") & (p["modelo_id"] == modelo)]
        fila = m[(m["serie_id"] == "region_america_central") & (m["modelo_id"] == modelo)].iloc[0]
        agregar("Prueba 3: pronóstico", f"América del Centro; dic 2023; {modelo}", round(pred["predicho"].iat[0], 2))
        agregar("Prueba 3: MAE", f"América del Centro; prueba; {modelo}", round(fila["MAE"], 2))
        agregar("Prueba 3: RMSE", f"América del Centro; prueba; {modelo}", round(fila["RMSE"], 2))
    return pd.DataFrame(filas)


def main() -> None:
    crudo = pd.read_csv(CRUDO / "series_mensuales.csv", parse_dates=["fecha"]).rename(columns={"serie": "serie_id"})
    pron = cargar_pronosticos()

    salida_viajeros = crudo[["serie_id", "fecha", "viajeros"]].assign(fecha=crudo["fecha"].dt.strftime("%Y-%m-%d"))
    tablas = {
        "dim_serie": dim_serie(),
        "dim_fecha": dim_fecha(crudo),
        "dim_modelo": pd.DataFrame(MODELOS, columns=["modelo_id", "modelo", "rol", "orden"]),
        "hechos_viajeros": salida_viajeros,
        "hechos_pronosticos": pron[["serie_id", "fecha", "modelo_id", "detalle", "predicho", "li", "ls", "error"]]
        .assign(fecha=pron["fecha"].dt.strftime("%Y-%m-%d")),
        "metricas_modelos": tabla_metricas(pron, crudo),
        "perdidas_lstm": tabla_perdidas(),
        "similitud_series": tabla_similitud(),
    }
    validar(tablas, pron)

    SALIDA.mkdir(parents=True, exist_ok=True)
    for nombre, tabla in tablas.items():
        tabla.to_csv(SALIDA / f"{nombre}.csv", index=False, encoding="utf-8")
        print(f"{nombre}: {len(tabla)} filas")
    valores_control(tablas).to_csv(RUTA_CONTROL, index=False, encoding="utf-8")
    print(f"Valores de control -> {RUTA_CONTROL.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
