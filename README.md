# Laboratorio 10: Visualización interactiva (CC3084 Data Science)

Tablero del observatorio de turismo sostenible: ingreso mensual de viajeros internacionales a
Guatemala (2009 a junio de 2026), construido en React + Vite + Apache ECharts. Reutiliza las series
y los modelos de los Laboratorios 1 y 2; no entrena modelos nuevos.

## Estructura

```bash
Lab10/
├── data/
│   ├── raw/           # series y métricas de los Labs 1 y 2 (no se modifican)
│   └── processed/     # series.json generado por src/limpieza.py
├── notebooks/         # exploración y preparación de datos
├── src/
│   └── limpieza.py    # valida las series y genera data/processed/series.json
├── dashboard/         # aplicación web (React + Vite + ECharts), con su Dockerfile
├── docker-compose.yml
├── codebook.md        # descripción de los datos y sus limitaciones
└── README.md
```

## Cómo ejecutarlo

1. Preparar los datos (requiere Python con `pandas`):

```bash
python src/limpieza.py
```

2. Levantar el tablero en desarrollo (requiere Node.js 22.12 o posterior):

```bash
cd dashboard
npm install
npm run dev
```

El tablero queda en http://localhost:5173.

3. O desplegarlo con Docker, desde la raíz:

```bash
docker compose up --build
```

El tablero queda en http://localhost:8080.

## Aportes de Vianka integrados

- V1 conserva zoom y detalle; las fechas y la selección de gráficas se controlan desde el resumen.
- V6 muestra observado y estimaciones de los modelos exportados, sus errores y límites mensuales disponibles.
- V9 permite explorar el PCA y las distancias catch22 con selección compartida.
- Preguntas, alcance y criterios de interpretación: [diseño de Vianka](docs/diseno_vianka.md).
- Historial del equipo y pendientes: [revisión de aportes](docs/aportes_y_pendientes.md).

Para exportar composición por vía y tipo con la base de Lab1, sin cambiar la rama del repositorio fuente:

```powershell
python -m pip install -r requirements.txt
python src/exportar_composicion.py --source-repo C:\Projects\Data-Science
```

El exportador verifica los 210 totales mensuales contra el histórico del equipo antes de publicar
`data/processed/composicion_mensual.csv` y `dashboard/public/data/composicion.json`. No copia el Excel ni expone microdatos.

Para comprobar la aplicación, desde `dashboard`: `npm test`, `npm run test:render` y `npm run build`.
Resultados y límites de la comprobación: [validación de Vianka](docs/validacion_vianka.md).
Los pendientes de V3, V5 y V8 deben cerrarse para alcanzar ocho visualizaciones; V9 no cuenta dos veces por sus dos modos.

## Datos y confidencialidad

La base original (`Base_Migracion_2009-2026jun.xlsx`) no se versiona ni se publica; el tablero solo
contiene series agregadas. El repositorio debe ser privado, con los docentes y auxiliares como
colaboradores. Los datos son de uso académico y no son cifras oficiales.
