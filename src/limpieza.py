"""
Limpieza y preparación de las series para el tablero.

Lee las salidas del Laboratorio 1 (`data/raw/series_mensuales.csv`), valida que la
serie esté completa y sin valores atípicos de captura, y escribe el archivo
`data/processed/series.json` que consume el tablero. Los datos crudos no se modifican.

Solo se publican agregados mensuales, nunca microdatos, según la cláusula de
confidencialidad de la guía del proyecto.

Uso (desde la raíz del repositorio):
    python src/limpieza.py
"""
from __future__ import annotations

import json
import shutil
from pathlib import Path

import numpy as np
import pandas as pd

RAIZ = Path(__file__).resolve().parent.parent
CRUDO = RAIZ / "data" / "raw"
RUTA_CRUDO = CRUDO / "series_mensuales.csv"
RUTA_SALIDA = RAIZ / "data" / "processed" / "series.json"
RUTA_TABLERO = RAIZ / "dashboard" / "public" / "data" / "series.json"

# Nombre legible y categoría de cada una de las 7 series.
NOMBRES = {
    "total": ("Total nacional", "General"),
    "region_america_central": ("América del Centro", "Región"),
    "region_america_norte": ("América del Norte", "Región"),
    "region_europa": ("Europa", "Región"),
    "frontera_aurora": ("01 La Aurora", "Frontera"),
    "frontera_valle_nuevo": ("07 Valle Nuevo", "Frontera"),
    "frontera_san_cristobal": ("09 San Cristóbal", "Frontera"),
}


def cargar() -> pd.DataFrame:
    df = pd.read_csv(RUTA_CRUDO, parse_dates=["fecha"])
    return df.sort_values(["serie", "fecha"]).reset_index(drop=True)


def validar(df: pd.DataFrame) -> None:
    """Falla con un mensaje claro si los datos no cumplen lo que el tablero supone."""
    faltan = set(NOMBRES) - set(df["serie"].unique())
    if faltan:
        raise ValueError(f"Series ausentes en el archivo crudo: {sorted(faltan)}")
    if df.duplicated(["serie", "fecha"]).any():
        raise ValueError("Hay filas duplicadas para una misma serie y fecha")
    if (df["viajeros"].dropna() < 0).any():
        raise ValueError("Hay valores negativos de viajeros")
    if not np.isfinite(df['viajeros'].dropna()).all():
        raise ValueError('Hay valores infinitos de viajeros')
    for serie, g in df.groupby("serie"):
        meses = pd.date_range('2009-01-01', '2026-06-01', freq='MS')
        if not pd.DatetimeIndex(g['fecha']).sort_values().equals(meses):
            raise ValueError(f"La serie {serie} no cubre los 210 meses esperados")
        esperado = np.where(g['fecha'] <= pd.Timestamp('2021-03-01'), 'train', 'test')
        if not (g['conjunto'].to_numpy() == esperado).all():
            raise ValueError(f'Partición temporal incorrecta en {serie}')
    if df["viajeros"].isna().any():
        print("Aviso: hay meses sin dato; el tablero los mostrará como 'Sin dato', no como cero.")


def construir(df: pd.DataFrame) -> dict:
    fechas = sorted(df["fecha"].unique())
    meses = [pd.Timestamp(f).strftime("%Y-%m") for f in fechas]
    conjunto = df[df["serie"] == "total"].set_index("fecha")["conjunto"].reindex(fechas).tolist()
    series = []
    for clave, (nombre, grupo) in NOMBRES.items():
        s = df[df["serie"] == clave].set_index("fecha")["viajeros"].reindex(fechas)
        series.append({
            "clave": clave, "nombre": nombre, "grupo": grupo,
            "valores": [None if pd.isna(v) else round(float(v)) for v in s],
        })
    return {"meses": meses, "conjunto": conjunto, "series": series}


# Salidas de los notebooks de los Laboratorios 1 y 2 (ver notebooks/exportar_labs_1_y_2.md).
PRONOSTICOS = ["pronosticos_total.csv", "pronosticos_regiones.csv", "pronosticos_fronteras.csv", "pronosticos_lstm.csv"]
METRICAS = ["metricas_total.csv", "metricas_regiones.csv", "metricas_fronteras.csv"]
# Nombres de las series en los CSV de catch22 (Laboratorio 2) -> clave del tablero.
NOMBRES_CATCH22 = {
    "Total (obligatoria)": "total",
    "Región: América del Centro": "region_america_central",
    "Región: América del Norte": "region_america_norte",
    "Región: Europa": "region_europa",
    "Frontera: 01 La Aurora": "frontera_aurora",
    "Frontera: 07 Valle Nuevo": "frontera_valle_nuevo",
    "Frontera: 09 San Cristóbal": "frontera_san_cristobal",
}


def leer_opcionales(nombres: list[str]) -> pd.DataFrame | None:
    """Concatena los CSV que existan; avisa de los que falten en lugar de fallar."""
    rutas = [CRUDO / n for n in nombres]
    faltan = [r.name for r in rutas if not r.exists()]
    if faltan:
        print(f"Aviso: no se encontraron {faltan}; el tablero mostrará esas partes como no disponibles.")
    presentes = [pd.read_csv(r) for r in rutas if r.exists()]
    return pd.concat(presentes, ignore_index=True) if presentes else None


def redondear(valores) -> list:
    return [None if pd.isna(v) else round(float(v)) for v in valores]


def construir_modelos(meses: list[str]) -> dict:
    """Pronósticos del conjunto de prueba, métricas, curvas de pérdida y similitud entre series."""
    salida = {"pronosticos": [], "metricas": [], "perdidas": [], "similitud": []}
    pron = leer_opcionales(PRONOSTICOS)
    if pron is not None:
        # La LSTM «un paso» usa el valor real del mes anterior: no es comparable con los
        # pronósticos a 63 meses de los demás modelos, así que no se publica.
        pron = pron[pron["detalle"] != "LSTM un paso"]
        pron["mes"] = pd.to_datetime(pron["fecha"]).dt.strftime("%Y-%m")
        aic = {}
        metr = leer_opcionales(METRICAS)
        if metr is not None:
            aic = {(r.serie, r.detalle): (r.AIC, r.BIC) for r in metr.itertuples()}
        for (serie, detalle), g in pron.groupby(["serie", "detalle"], sort=False):
            g = g.sort_values("mes")
            esperado = pd.date_range('2021-04-01', '2026-06-01', freq='MS').strftime('%Y-%m').tolist()
            if serie not in NOMBRES or g['mes'].tolist() != esperado:
                raise ValueError(f'Pronóstico incompleto o duplicado: {serie} / {detalle}')
            if not np.isfinite(g[['real', 'predicho']].to_numpy()).all():
                raise ValueError(f'Pronóstico no finito: {serie} / {detalle}')
            if not (g['li'].isna() == g['ls'].isna()).all() or (g['li'] > g['ls']).any():
                raise ValueError(f'Intervalos inconsistentes: {serie} / {detalle}')
            err = g["predicho"] - g["real"]
            a, b = aic.get((serie, detalle), (np.nan, np.nan))
            salida["pronosticos"].append({
                "serie": serie, "modelo": g["modelo"].iat[0], "detalle": detalle,
                "desde": meses.index(g["mes"].iat[0]),
                "real": [float(v) for v in g['real']],
                "predicho": redondear(g["predicho"]), "li": redondear(g["li"]), "ls": redondear(g["ls"]),
                "nivel_intervalo": 0.8 if g['li'].notna().any() else None,
            })
            salida["metricas"].append({
                "serie": serie, "modelo": g["modelo"].iat[0], "detalle": detalle,
                "MAE": round(float(err.abs().mean())), "RMSE": round(float(np.sqrt((err ** 2).mean()))),
                "AIC": None if pd.isna(a) else round(float(a), 1), "BIC": None if pd.isna(b) else round(float(b), 1),
            })
    perd = leer_opcionales(["perdidas_lstm.csv"])
    if perd is not None:
        for (serie, config), g in perd.groupby(["serie", "config"], sort=False):
            salida["perdidas"].append({
                "serie": serie, "config": config, "mejor_epoca": int(g["mejor_epoca"].iat[0]),
                "ajuste": [round(float(v), 4) for v in g["perdida_ajuste"]],
                "validacion": [round(float(v), 4) for v in g["perdida_validacion"]],
            })
    pca = leer_opcionales(["pca_catch22.csv"])
    grupos = leer_opcionales(["grupos_catch22.csv"])
    if pca is not None:
        pca = pca.rename(columns={pca.columns[0]: "nombre"})
        grupo = {}
        if grupos is not None:
            grupo = dict(zip(grupos["serie"], grupos["grupo K-medias"]))
        for r in pca.itertuples():
            salida["similitud"].append({
                "serie": NOMBRES_CATCH22[r.nombre], "PC1": float(r.PC1), "PC2": float(r.PC2),
                "grupo": None if r.nombre not in grupo else int(grupo[r.nombre]),
                "var_PC1": float(r.var_PC1), "var_PC2": float(r.var_PC2),
            })
    ruta_matriz = CRUDO / 'matriz_catch22.csv'
    if ruta_matriz.exists():
        matriz = pd.read_csv(ruta_matriz, index_col=0)
        x = matriz.to_numpy(dtype=float)
        if x.shape != (7, 22) or not np.isfinite(x).all():
            raise ValueError('La matriz catch22 debe contener 7 x 22 valores finitos')
        if not np.allclose(x.mean(axis=0), 0, atol=1e-6) or not np.allclose(x.std(axis=0), 1, atol=1e-6):
            raise ValueError('La matriz catch22 no está estandarizada como espera el mapa')
        distancias = np.sqrt(((x[:, None] - x[None, :]) ** 2).sum(axis=2))
        salida['distancias_catch22'] = {
            'series': [NOMBRES_CATCH22[n] for n in matriz.index],
            'valores': distancias.tolist(),
        }
    return salida


def main() -> None:
    df = cargar()
    validar(df)
    salida = construir(df)
    salida["modelos"] = construir_modelos(salida["meses"])
    # Cada curva se compara con su misma serie observada, nunca con otro universo.
    por_clave = {s['clave']: s['valores'] for s in salida['series']}
    for p in salida['modelos']['pronosticos']:
        esperado = por_clave[p['serie']][p['desde']:p['desde'] + len(p['real'])]
        if not np.allclose(esperado, p['real'], atol=0.51, rtol=0):
            raise ValueError(f"Los observados no coinciden con la serie histórica: {p['serie']}")
    RUTA_SALIDA.parent.mkdir(parents=True, exist_ok=True)
    RUTA_SALIDA.write_text(json.dumps(salida, ensure_ascii=False, allow_nan=False), encoding="utf8")
    RUTA_TABLERO.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy(RUTA_SALIDA, RUTA_TABLERO)
    print(f"{len(salida['meses'])} meses, {len(salida['series'])} series -> {RUTA_SALIDA.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
