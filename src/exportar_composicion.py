"""Exporta vía/tipo para Vianka desde el Excel original, sin publicar microdatos.

Lee el archivo de una rama Git sin cambiar el checkout ni ejecutar notebooks.
Solo acepta la fuente si sus 210 totales mensuales concilian con el tablero.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path
import subprocess
import numpy as np
import pandas as pd

RAIZ = Path(__file__).resolve().parents[1]

def exportar(repo, ref='Lab1', archivo='L01_series_tiempo/data/raw/Base_Migracion_2009-2026jun.xlsx'):
    commit = subprocess.check_output(['git', 'rev-parse', ref], cwd=repo, text=True).strip()
    contenido = subprocess.check_output(['git', 'show', f'{commit}:{archivo}'], cwd=repo)
    base = pd.read_excel(io.BytesIO(contenido), sheet_name='Datos')
    requeridas = {'Año', 'Mes cod', 'Vía', 'Tipo de Viajero', 'Viajero'}
    if not requeridas.issubset(base.columns):
        raise ValueError('Faltan las columnas necesarias en la fuente')
    base['fecha'] = pd.to_datetime(dict(year=base['Año'], month=base['Mes cod'], day=1))
    # Mismo universo que el repositorio actual: incluye la etiqueta Guatemala.
    visitantes = base.loc[base['Tipo de Viajero'].isin(['Turista', 'Excursionista'])].copy()
    if not np.isfinite(visitantes['Viajero']).all() or (visitantes['Viajero'] < 0).any():
        raise ValueError('Los visitantes contienen valores inválidos')
    calendario = pd.date_range('2009-01-01', '2026-06-01', freq='MS')
    if not set(calendario).issubset(set(base['fecha'])):
        raise ValueError('El calendario de la base original está incompleto')
    total = visitantes.groupby('fecha')['Viajero'].sum().reindex(calendario, fill_value=0)
    referencia = pd.read_csv(RAIZ / 'data/raw/series_mensuales.csv', parse_dates=['fecha'])
    esperado = referencia.loc[referencia.serie.eq('total')].set_index('fecha').viajeros.reindex(calendario)
    if esperado.isna().any() or not np.allclose(total, esperado, atol=0.51, rtol=0):
        raise ValueError('La fuente no concilia con los totales del equipo; no mezclar universos')
    registros = []
    for dimension, columna in [('via', 'Vía'), ('tipo', 'Tipo de Viajero')]:
        if visitantes[columna].isna().any():
            raise ValueError(f'Hay categorías faltantes en {columna}')
        tabla = visitantes.groupby(['fecha', columna])['Viajero'].sum()
        for categoria in sorted(visitantes[columna].unique()):
            valores = tabla.xs(categoria, level=1).reindex(calendario, fill_value=0)
            registros.extend({'fecha': fecha.strftime('%Y-%m'), 'dimension': dimension, 'categoria': categoria, 'viajeros': float(v)} for fecha, v in valores.items())
    frame = pd.DataFrame(registros).sort_values(['fecha', 'dimension', 'categoria'])
    for dimension in ['via', 'tipo']:
        conciliado = frame.loc[frame.dimension.eq(dimension)].groupby('fecha').viajeros.sum()
        if not np.allclose(conciliado.to_numpy(), total.to_numpy(), atol=1e-6, rtol=0):
            raise ValueError(f'La composición {dimension} no conserva el total')
    metadatos = {'universo': 'Turista + Excursionista; incluye etiqueta País = Guatemala, igual al histórico del equipo',
                 'fuente': {'rama': ref, 'commit': commit, 'archivo': archivo, 'sha256': hashlib.sha256(contenido).hexdigest()},
                 'cobertura': ['2009-01', '2026-06'], 'meses': 210, 'oficial': False,
                 'limitaciones': ['Quiebre metodológico en enero de 2023', 'Vía marítima pierde detalle desde 2017', '2026 solo cubre enero a junio', 'Cada dimensión suma por separado el total; no sumarlas entre sí']}
    procesado = RAIZ / 'data/processed'
    procesado.mkdir(parents=True, exist_ok=True)
    frame.to_csv(procesado / 'composicion_mensual.csv', index=False, encoding='utf-8')
    texto = json.dumps({'metadatos': metadatos, 'registros': frame.to_dict('records')}, ensure_ascii=False, allow_nan=False, indent=2) + '\n'
    (procesado / 'composicion.json').write_text(texto, encoding='utf-8')
    publico = RAIZ / 'dashboard/public/data/composicion.json'
    publico.parent.mkdir(parents=True, exist_ok=True)
    publico.write_text(texto, encoding='utf-8')
    print(f'{len(frame)} agregados exportados y conciliados con el total del tablero')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-repo', required=True)
    parser.add_argument('--ref', default='Lab1')
    parser.add_argument('--archivo', default='L01_series_tiempo/data/raw/Base_Migracion_2009-2026jun.xlsx')
    args = parser.parse_args()
    exportar(args.source_repo, args.ref, args.archivo)
