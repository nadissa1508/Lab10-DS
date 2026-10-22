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

import pandas as pd

RAIZ = Path(__file__).resolve().parent.parent
RUTA_CRUDO = RAIZ / "data" / "raw" / "series_mensuales.csv"
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
    for serie, g in df.groupby("serie"):
        meses = pd.date_range(g["fecha"].min(), g["fecha"].max(), freq="MS")
        if len(meses) != len(g):
            raise ValueError(f"La serie {serie} tiene meses faltantes")
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


def main() -> None:
    df = cargar()
    validar(df)
    salida = construir(df)
    RUTA_SALIDA.parent.mkdir(parents=True, exist_ok=True)
    RUTA_SALIDA.write_text(json.dumps(salida, ensure_ascii=False), encoding="utf8")
    RUTA_TABLERO.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy(RUTA_SALIDA, RUTA_TABLERO)
    print(f"{len(salida['meses'])} meses, {len(salida['series'])} series -> {RUTA_SALIDA.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
