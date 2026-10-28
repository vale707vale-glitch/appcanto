# Plan general - Aprende a cantar

## Estado actual

La app es un MVP funcional en React, Vite y TypeScript. Incluye detección de
altura con Web Audio API y `pitchy`, práctica de ejercicios y canciones,
afinador, análisis de acordes, sección de Guitarra embebida, persistencia local
y pruebas automatizadas.

Las etapas 1-3 están completas. La base de Netlify/PWA de la etapa 4 está
preparada, pero el deploy se difiere hasta completar las mejoras de aprendizaje.
La etapa 5 (aprender a cantar) está en progreso: ya incluye el primer ajuste de
altura para practicar ejercicios y canciones en una octava cómoda.
Las etapas 6-8 cubren aprender guitarra, herramientas de práctica y lanzamiento.
GitHub Actions queda pendiente de aprobación para inicializar Git.

## Etapas

| Etapa | Objetivo | Estado |
|---|---|---|
| 1 | Red de seguridad y bugs de puntuación | Hecha |
| 2 | Audio y consistencia de escucha | Hecha |
| 3 | Robustez, accesibilidad y persistencia | Hecha |
| 4 | Base de deploy y PWA | Preparada; publicación diferida |
| 5 | Aprender a cantar | En progreso |
| 6 | Aprender guitarra | Pendiente |
| 7 | Herramientas de práctica y evolución | Pendiente |
| 8 | Validación y lanzamiento | Pendiente |

El detalle, los criterios de aceptación y la bitácora están en
[`PLAN-ACCION.md`](./PLAN-ACCION.md). Las etapas se completan de forma
secuencial; las decisiones que requieren aprobación quedan señaladas allí.

## Desarrollo y verificación

```powershell
npm ci
npm run dev
npm run test
npm run lint
npm run typecheck
npm run build
npm run preview
```

Consulta [`README.md`](./README.md) para la estructura, las instrucciones de
deploy y la lista de comprobaciones posteriores a publicar.
