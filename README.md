# Aprende a cantar

Aplicación web para practicar afinación vocal. Está hecha con React, Vite y
TypeScript; detecta la altura con Web Audio API y `pitchy`, y guarda el progreso
localmente en el navegador.

## Requisitos y desarrollo local

Se necesita Node.js compatible con Vite 8 y npm.

```powershell
npm ci
npm run dev
```

Abre la URL que indica Vite. El audio y el micrófono se activan después de una
acción del usuario. El acceso al micrófono requiere un contexto seguro:
`localhost` en desarrollo o HTTPS en producción.

El proyecto se ejecuta localmente y todavía no está publicado en Netlify. Las
pruebas automatizadas y el build pasan; antes de dar por cerrado el lanzamiento
quedan las pruebas con voz y guitarra reales, la comprobación de instalación y
uso offline en un dispositivo y el deploy de prueba.

## Funciones

- Afinador vocal con nota, desvío y nivel de micrófono.
- Ejercicios vocales guiados y práctica de canciones con puntuación.
- Grabadora vocal temporal con consentimiento explícito; las tomas no se suben
  ni se incluyen en el respaldo del progreso.
- Metrónomo general, nota sostenida de referencia y rutinas configurables de
  canto/guitarra sin calificación automática.
- Seis ejercicios graduados y seis canciones o melodías para practicar.
- Velocidad reducida en canciones, manteniendo alineados melodía y feedback.
- Repetición de fragmentos de canción para practicar la escucha.
- Calibración orientativa de notas cómodas para sugerir una altura de práctica.
- Ajuste de una octava para probar ejercicios y canciones en una altura más
  cómoda; la preferencia se comparte entre ambas prácticas.
- Análisis de tono y acordes, y sección de guitarra embebida.
- Ruta inicial de seis lecciones para aprender guitarra desde cero.
- Práctica guiada de cambios de acordes con pulso ajustable y autoevaluación.
- Afinador de guitarra para las seis cuerdas estándar, pendiente de prueba con
  instrumento y micrófono reales.
- Guitarra se adapta a pantallas angostas y puede recibir la progresión desde
  Tono y cejilla.
- Progreso guardado en el dispositivo, con exportación e importación de copias.
- Historial y tendencia de práctica por ejercicio y canción, con sugerencias
  sencillas de notas para repasar.
- Navegación por hash: se puede recargar y compartir una pantalla, por ejemplo
  `/#/ejercicio/notas-sueltas`.
- PWA instalable; sus archivos estáticos se almacenan para abrir la app sin
  conexión. El micrófono requiere permiso y puede necesitar conexión según el
  dispositivo y el navegador.

## Estructura principal

- `src/audio/`: contexto de audio, captura del micrófono, detección y puntuación.
- `src/components/`: inicio, afinador, ejercicios, canciones, tono, guitarra y
  aviso de actualización de la PWA.
- `src/data/`: ejercicios y canciones incluidos.
- `src/musica/`: análisis musical, parser, tonalidad, cejilla y posiciones.
- `src/musica/transposicion.ts`: transposición de notas sin alterar sus duraciones
  ni el cálculo de afinación.
- `src/components/AjusteAlturaVocal.tsx`: selector de altura para las prácticas.
- `src/components/CalibracionVocal.tsx`: calibración opcional, local y
  confirmada por la persona de su zona vocal cómoda.
- `src/storage/progreso.ts`: guardado local, resumen y respaldo del progreso.
- `public/guitarra/`: versión estática de la app de guitarra embebida.

## Tests y build

```powershell
npm run test
npm run lint
npm run typecheck
npm run build
npm run preview
```

`npm run preview` sirve localmente la compilación de producción; es el modo
recomendado para probar el registro del service worker y el funcionamiento
offline. En desarrollo el service worker no se registra.

## Deploy en GitHub Pages

El workflow `.github/workflows/deploy.yml` compila la app, corre tests y lint, y
publica `dist` en GitHub Pages en cada push a `main`.

Antes del primer deploy:

1. Creá el repositorio y subí el proyecto a la rama `main`.
2. En el repositorio, entrá a Settings > Pages y elegí Source:
   `GitHub Actions`.
3. Hacé push o ejecutá el workflow a mano desde la pestaña Actions.

La URL queda en `https://<usuario>.github.io/<repo>/`. La base se detecta sola
desde `GITHUB_REPOSITORY`; si el repositorio es `<usuario>.github.io`, se publica
en la raíz. Para forzar otra base, definí `BASE_PATH` (por ejemplo
`BASE_PATH=/canta-app/`) al compilar.

El deploy en Netlify sigue funcionando sin cambios: ahí la base es `/`.

## Deploy en Netlify

El archivo `netlify.toml` configura `npm run build` y publica `dist`. Netlify
aplica `X-Content-Type-Options: nosniff` y cache de un año a los assets con hash
de la app y de Guitarra. Tras conectar el repositorio, no hacen falta comandos
ni variables adicionales en el panel.

Después de publicar, verifica:

1. La página principal carga por HTTPS y ofrece instalación desde el navegador.
2. Recarga la página y abre una ruta de ejercicio directamente.
3. Prueba el micrófono y confirma que el permiso funciona en ese origen HTTPS.
4. Abre Inicio > Guitarra y confirma que carga `/guitarra/index.html` y sus
   recursos.
5. Tras abrir la app una vez con conexión, vuelve a cargarla sin conexión y
   comprueba que la interfaz básica abre.
6. Publica una versión nueva y confirma que aparece el aviso para actualizar.

### Actualizar la app embebida de Guitarra

La carpeta `public/guitarra` es un bundle estático generado desde
`C:\Users\roros\guitar-learning`. Después de cambios en esa app, ejecuta:

```powershell
Set-Location C:\Users\roros\guitar-learning
npm run build -- --base=./

Remove-Item -LiteralPath C:\Users\roros\canta-app\public\guitarra `
  -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -LiteralPath C:\Users\roros\guitar-learning\dist `
  -Destination C:\Users\roros\canta-app\public\guitarra -Recurse
```

La configuración del proyecto de guitarra genera rutas relativas para que sus
recursos funcionen dentro del iframe. Después regresa a `canta-app` y ejecuta
`npm run build`.

## Documentación del plan

Para aprender a usar cada pantalla, consulta el [manual de usuario](./MANUAL-USUARIO.md).
El estado, los criterios de aceptación y la bitácora de las mejoras están en
[`PLAN-ACCION.md`](./PLAN-ACCION.md).
