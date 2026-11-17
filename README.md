# Guaquiri Connect

Portal comunitario (PWA) y panel de ingeniería para la red rural de Guaquirí (corregimiento de Pedraza, Magdalena): Starlink en la casa principal, cable UTP y radios, con Kruskal, Prim y Dijkstra. El peso del grafo es la distancia en metros.

- Repositorio: https://github.com/jpertuzperea58-spec/guaquiri-connect
- Página: https://jpertuzperea58-spec.github.io/guaquiri-connect/
- Documento del curso: `latex/documento-guaquiri.pdf`

## Cómo correrlo

```bash
npm install
npm test
npm run dev
```

Abre la dirección que imprime Vite (por defecto `http://localhost:5173`).

```bash
npm run build
npm run preview
```

La interfaz está en español. Los pagos son simulados: no hay credenciales ni cobros reales.

## Centroide

La Casa Principal usa el placemark confirmado del proyecto Google Earth «senso para instalacion de internet»: 10°06'56.56" N, 74°55'28.23" W.

Las otras viviendas son una red de prueba (20 posiciones representativas: núcleo y casas alejadas). No son un levantamiento casa por casa.

## Pruebas

`npm test` ejecuta Vitest sobre Union-Find, Kruskal, Prim, Dijkstra y la red de prueba.
