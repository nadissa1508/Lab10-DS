# Revisión del repositorio y aportes del equipo

Revisión del 25 de octubre de 2026 sobre `origin/main`, actualizado desde el remoto. Punto de partida: `a91ac7b32904a713d61f7f372147cdcad1901aa4`. El árbol de trabajo estaba limpio. Se revisaron todos los 14 commits existentes; no se atribuyen esos cambios por lo que dice el mensaje únicamente, sino también por los archivos afectados.

| Autor del historial | Commits revisados | Aporte guardado |
|---|---|---|
| Nadissa | 47188a8, c7e64c5, 63b4cab, 204c1b9, 8068ac9 | Inicio del repositorio, README, codebook, series agregadas y preparación del JSON |
| ricgo01 / Ricgo01 | 0f45fd2, 9377de8, a91ac7b | Base React, paleta/tipografías y V2, V4, V7, glosario y nuevos artefactos de modelos |
| Vann06 | 76162b9, b50f40b, 358b618 | Carga y agregación, envoltura ECharts y V1 con zoom y detalle |
| Ninaswiftie09 | d4ab027, 0aa9d95, f9abd77 | Participación inicial, interfaz con filtros e indicadores, Docker |

Los tres commits anteriores de Vianka sí existen. La estructura `observatorio/` preparada en la sesión anterior no forma parte de este historial. La aplicación compartida actual vive en `dashboard/`; se continuó allí para conservar los aportes de todos.

## Parte de Vianka recuperada y completada

| Tarea del avance | Entrega actual |
|---|---|
| 1. Preguntas de gestión y alcance | `docs/diseno_vianka.md` |
| 5. V1 serie histórica | Se conserva su componente; se ajusta zoom y suma de períodos parciales, y se añaden fechas accesibles por teclado |
| 12. Agregados por vía y tipo | `src/exportar_composicion.py`, CSV mensual y JSON públicos agregados con trazabilidad y conciliación |
| 13. V6 real frente a pronóstico | Selector de al menos tres modelos por serie, observaciones y estimaciones, errores mensuales e intervalos existentes |
| 17. V9 similitud catch22 y PCA | Plano exportado y mapa de distancias de 22 características, con selección compartida |

## Diferencias respecto a la revisión anterior

Ahora están versionados los pronósticos exactos, las pérdidas LSTM y las coordenadas PCA, por lo que V6 y V9 pueden completarse. Las series actuales incluyen fronteras reales; no se sustituyen por las vías de la rama local de Data-Science. La composición nueva usa la misma definición de total del equipo, que incluye la etiqueta País = Guatemala. La exportación comprueba la coincidencia mensual antes de escribir.

La documentación de exportación del equipo dice que se volvieron a ejecutar especificaciones previas para obtener los CSV y que los resultados LSTM difieren del informe. Se conserva ese dato de procedencia: este trabajo solo lee esas salidas, no entrena ni vuelve a ejecutar modelos.

## Pendientes del resto del tablero

V3 (mapa año-mes, Nina), V5 (vista de composición, Nadissa), V8 (curvas LSTM, Nina), pruebas con tres usuarios, integración del PDF final y revisión de Docker siguen siendo tareas de sus responsables. Los insumos para V5 y V8 ya están disponibles. El tablero actual cuenta con V1, V2, V4, V6, V7 y V9; todavía no debe declararse cumplido el mínimo de ocho visualizaciones.

El PDF `lab10 data.pdf` fue incorporado por el equipo en su último commit; no se elimina como parte de la petición anterior de borrar los originales de Descargas.
