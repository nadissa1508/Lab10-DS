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

2. Levantar el tablero en desarrollo (requiere Node.js):

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

## Datos y confidencialidad

La base original (`Base_Migracion_2009-2026jun.xlsx`) no se versiona ni se publica; el tablero solo
contiene series agregadas. El repositorio debe ser privado, con los docentes y auxiliares como
colaboradores. Los datos son de uso académico y no son cifras oficiales.
