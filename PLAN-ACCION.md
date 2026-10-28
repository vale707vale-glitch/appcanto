# Plan de accion - Aprende a cantar + Guitarra

Ultima actualizacion: 2026-10-25
Estado general: funciones principales de aprendizaje de las etapas 5-7
implementadas; queda pendiente el feedback automático de guitarra, validar con
voz/guitarra reales y completar las pruebas/decisiones de lanzamiento de etapa
8. No se hizo deploy.

Este documento es la fuente de verdad del trabajo pendiente. Cada etapa se hace
completa, se verifica y se registra en la bitacora antes de pasar a la siguiente.

## Reglas de trabajo

- Una etapa por vez. No se mezclan cambios de etapas distintas en la misma tanda.
- Toda correccion de logica lleva test automatizado que la cubra.
- Definicion de terminado por etapa: `npm run build`, `npm run lint` y
  `npm run test` en verde, verificacion manual del flujo tocado, y bitacora
  actualizada.
- Los commits se hacen solo cuando se piden. Si se piden, un commit por item o
  por etapa, con mensaje descriptivo.
- Si un item crece mas de lo previsto, se parte y se anota en la bitacora.

## Resumen de etapas

| # | Etapa | Objetivo | Depende de | Estado |
|---|-------|----------|------------|--------|
| 1 | Red de seguridad y bugs de puntuacion | Que la nota refleje lo que realmente canto | - | Hecha |
| 2 | Audio y consistencia de escucha | Escuchar, detener y medir bien en todas las pantallas | Etapa 1 | Hecha |
| 3 | Robustez, accesibilidad y persistencia | Navegacion, errores, a11y y datos del usuario | Etapa 1 | Hecha |
| 4 | Base de deploy y PWA | Netlify, cache, instalacion y disponibilidad offline | Etapa 3 | Configurada; falta probar en dispositivo y desplegar |
| 5 | Aprender a cantar | Altura comoda, practica guiada, progreso y contenido | Etapas 1-4 | Funciones implementadas; falta validacion vocal real |
| 6 | Aprender guitarra | Ruta de principiante, afinacion y puente entre apps | Etapas 2-4 | Ruta y puente listos; feedback automatico y prueba de afinador pendientes |
| 7 | Practicar y mejorar | Grabacion, loops y herramientas de estudio | Etapas 5-6 | Funciones iniciales implementadas; falta prueba de uso real |
| 8 | Lanzamiento | Validacion final en dispositivos, CI acordada y deploy | Etapas 4-7 | Pendiente |

## Ya hecho (base de partida)

- [x] Reproduccion "a mi ritmo" en Tono y cejilla, con escuchar/detener por
  acorde y por nota (`PantallaTono.tsx`, `tono.ts`).
- [x] Integracion de guitar-learning como apartado embebido por iframe
  (`public/guitarra`, vista `guitarra` en `App.tsx`, boton en `Inicio.tsx`).
- [x] Documentacion del procedimiento de regeneracion y deploy del iframe en
  `PLAN.md`.

---

## Etapa 1 - Red de seguridad y bugs de puntuacion

Objetivo: que la nota final represente de verdad lo cantado y dejar tests para
no romperlo despues.

### Infraestructura de tests

- [x] T1. Agregar Vitest (`vitest`, `jsdom` solo si hace falta) con scripts
  `test`, `test:watch` y `typecheck`. Config minima en `vite.config.ts`.
  Archivos: `package.json`, `vite.config.ts`, `tsconfig.app.json`.
  Aceptacion: `npm run test` corre y falla/pasa correctamente con un test de
  humo de `notas.ts`.
- [x] T1b. Tests base de logica pura:
  - `notas.ts`: `midiToFreq`, `freqToMidiFloat`, `midiToNombre`,
    `normalizarOctava`, `centsDesviacion`.
  - `puntuacion.ts`: `puntuar` y `contarOctava` con casos borde.
  - `teoria.ts`: `analizarAcordes`, `analizarNotas`, `transponerAnalisis`,
    `detectarTono` con "Sol Do Re7 Sol", "Do Lam Fa Sol" y "La7 Re Mi7".
  - `progreso.ts`: `resumir`, racha y tolerancia con localStorage simulado.
  Aceptacion: al menos 25 casos, todos en verde.

### Bugs que afectan la nota

- [x] B1. La precision no penaliza el silencio. `puntuacion.ts` divide solo
  entre tramas con voz. Pasar a medir sobre todas las tramas de la ventana o
  exigir un minimo de voz (por ejemplo 60%) para no dar 100% con una sola trama.
  Archivos: `puntuacion.ts`, `PantallaEjercicio.tsx`, `PantallaCancion.tsx`.
  Aceptacion: test con 10% de voz y todo afinado no da 100%; con 90% afinado da
  un valor alto.
- [x] B2. En "Avanzar a mi ritmo" se saca 100% al instante. La ventana depende
  del usuario; exigir un minimo de tiempo o de tramas antes de permitir
  "Siguiente nota", o puntuar por duracion. Archivo: `PantallaEjercicio.tsx`.
  Aceptacion: no se puede obtener 100% con menos de ~0.5 s de canto real.
- [x] B3. Transponer +-12 no cambia la octava de los acordes. `midisDeAcorde`
  usa `pc` mod 12. Pasar un desplazamiento de octava derivado de `semitonos`.
  Archivos: `teoria.ts`, `PantallaTono.tsx`.
  Aceptacion: test de `midisDeAcorde` con octava; +12 suena una octava arriba.
- [x] B4. El microfono queda encendido en resultados. Llamar `detener()` al
  pasar a `resultados` en ejercicios y canciones, y mostrar el estado del
  microfono. Archivos: `PantallaEjercicio.tsx`, `PantallaCancion.tsx`.
  Aceptacion: al ver resultados el indicador del navegador se apaga.
- [x] B5. La referencia audible contamina la medicion. Ignorar tramas mientras
  suena una referencia y dejar ~300 ms de silencio antes de la ventana de canto.
  Archivos: `PantallaEjercicio.tsx` (y helper de audio si conviene).
  Aceptacion: con parlantes, la referencia no sube la nota.

Criterio de salida: tests en verde, build y lint OK, y una prueba manual de
ejercicio y cancion verificando que la nota cambia de forma coherente.

---

## Etapa 2 - Audio y consistencia de escucha

Objetivo: que todo lo que suena se pueda controlar y que las reglas de afinacion
sean iguales en toda la app.

- [x] B6. "Escuchar la melodia" en Canciones no se puede detener ni ir paso a
  paso. Agregar detener, repetir nota y navegacion anterior/siguiente con el
  mismo patron que Tono y cejilla. Archivo: `PantallaCancion.tsx`.
  Aceptacion: se puede escuchar una nota suelta y detener en cualquier momento.
- [x] B8. Umbrales incoherentes. Afinador usa +-15 cents y ejercicios +-50.
  Unificar criterio o hacer configurable el afinador. Archivos: `Afinador.tsx`,
  `storage/progreso.ts`.
  Aceptacion: el mismo desvio recibe el mismo mensaje en afinador y ejercicio.
- [x] B9. El modo automatico no resalta que acorde suena. Usar `suenaIdx`
  tambien en `escucharAcordes`. Archivo: `PantallaTono.tsx`.
  Aceptacion: en automatico se ilumina la fila que suena.
- [x] B10. Diagnostico enganoso cerca del limite de octava. Cantar una quinta
  arriba no debe decir "muy bajo". Ajustar normalizacion y diagnostico.
  Archivos: `notas.ts`, `puntuacion.ts`.
  Aceptacion: test de +700 cents con mensaje que refleje que canto alto.
- [x] T2. Unificar los dos `AudioContext` (`tono.ts` y `useMicrofono.ts`) en un
  modulo de audio compartido, con reanudacion tras gesto y manejo de iOS/Safari.
  Archivos: `audio/tono.ts`, `audio/useMicrofono.ts`, nuevo `audio/contexto.ts`.
  Aceptacion: un solo contexto activo; audio y microfono funcionan tras un clic.
- [x] T12. Chequeo de microfono antes de practicar: nivel, "se te escucha bien",
  y indicador global de microfono activo en todas las pantallas.
  Archivos: nueva pantalla o bloque en `Inicio.tsx`, `useMicrofono.ts`.
  Aceptacion: el usuario sabe si el micro funciona antes de cantar.

Criterio de salida: todas las reproducciones tienen detener; los umbrales son
coherentes; un solo AudioContext; micro visible y apagable.

---

## Etapa 3 - Robustez, accesibilidad y persistencia

Objetivo: que la app no se rompa, se pueda navegar y los datos del usuario sean
confiables.

- [x] B7. `setState` durante el render en `App.tsx` cuando un id no existe.
  Reemplazar por render de fallback o `useEffect`. Archivo: `App.tsx`.
  Aceptacion: URL/estado invalido vuelve al inicio sin warnings de React.
- [x] T3. Routing por hash o `react-router` para tener URL por pantalla y
  sobrevivir a recargas. Archivos: `App.tsx`, `Inicio.tsx`.
  Aceptacion: recargar en un ejercicio lo mantiene; se puede compartir el enlace.
- [x] T4. `ErrorBoundary` global con mensaje claro y boton de reinicio.
  Archivo: nuevo `components/ErrorBoundary.tsx`, `main.tsx`.
  Aceptacion: un error de render no deja la pantalla en blanco. Implementado y
  verificado en navegador provocando un error de render simulado.
- [x] T5. Accesibilidad: `aria-live` en el mensaje de afinacion, `role="meter"`
  en el nivel de microfono, foco visible, `prefers-reduced-motion` para las
  animaciones y textos alternativos. Archivos: componentes de feedback.
  Aceptacion: navegacion por teclado y lectores de pantalla anuncian el estado.
  Implementado; teclado/foco, arbol de accesibilidad y anuncios con Narrador
  comprobados.
- [x] T10. Persistencia robusta: podar sesiones viejas, exportar/importar
  progreso y avisar si localStorage esta bloqueado. Archivo: `progreso.ts`,
  `Inicio.tsx`.
  Aceptacion: se puede descargar y volver a cargar el progreso; no crece sin limite.
- [x] T13. Dividir `teoria.ts` en parser, tono, cejilla y posiciones, sin
  cambiar comportamiento. Tests de T1b deben seguir en verde.
  Aceptacion: mismos resultados y archivos mas chicos.
- [x] T11a. Revision general de responsive en pantallas propias (Inicio,
  Tono, Afinador, Ejercicios, Canciones) en 360 px y 768 px.
  Aceptacion: sin scroll horizontal y botones tocables.

Criterio de salida: recarga y atras del navegador funcionan; sin warnings de
React; progreso exportable; a11y basica verificada.

---

## Etapa 4 - Deploy, CI y PWA

Objetivo: publicar de forma repetible, con cache correcta y app instalable.

- [x] T6. `netlify.toml` con `command = "npm run build"`, `publish = "dist"`,
  headers de cache largo para assets hasheados y `X-Content-Type-Options`.
  Configuracion y build local implementados; el deploy de prueba y la revision
  de `/` y `/guitarra/index.html` quedan en L4.
- [ ] T7. Git e integracion continua. Si se aprueba: `git init`, primer commit y
  GitHub Actions con `npm ci`, `npm run build`, `npm run lint`, `npm run test`.
  Aceptacion: el pipeline corre en cada push. Pendiente decidir si se quiere
  inicializar Git y habilitar Actions.
- [x] T8. PWA con `vite-plugin-pwa`: manifiesto, iconos PNG, service worker y aviso
  de version nueva. Archivos: `vite.config.ts`, `public/`.
  Implementacion y precache comprobados en preview; instalar y probar offline
  en dispositivo real queda pendiente en L2.
- [x] T9. Actualizar `README.md` y `PLAN.md` con la estructura actual, Tono y
  cejilla, Canciones, Guitarra, tests, deploy y comandos. Aceptacion: un lector
  nuevo puede correr y deployar siguiendo el README.
- [x] T9b. Checklist post-deploy: HTTPS, microfono, iframe de Guitarra, cache
  y regeneracion de `public/guitarra`. Dejarlo escrito en `README.md`.

Criterio de salida: deploy reproducible y documentado; CI verde; PWA instalable.

---

## Etapa 5 - Aprender a cantar (funciones implementadas)

Objetivo: adaptar las notas a la voz de la persona y convertir la medicion en
practica gradual, con feedback y progreso entendibles.

- [x] V1. Encontrar rango vocal cómodo con una calibración opcional guiada por
  microfono. Debe registrar solo notas estables que la persona confirme como
  cómodas; el resultado es orientativo, no diagnóstico vocal.
  Aceptacion: se puede repetir, cancelar, escuchar referencias y corregir el
  rango sugerido antes de guardarlo.
- [x] V2. Usar el rango guardado para sugerir transposición de ejercicios y
  canciones, manteniendo el puntaje comparable y permitiendo volver a la altura
  original.
  Aceptacion: las notas objetivo y referencias suenan en el rango elegido;
  preferencias sobreviven recargas y no cambian los criterios de puntuación.
- [x] V3. Progreso didáctico por ejercicio y canción: historial cronológico,
  tendencia por práctica y recomendaciones sencillas basadas en notas difíciles.
  Aceptacion: no promedia indebidamente sesiones distintas y respeta el límite
  de almacenamiento existente.
- [x] V4. Completar el repertorio gradual hasta al menos 6 ejercicios y 6
  canciones, con instrucciones para principiantes, notas de referencia y
  dificultad revisada.
  Aceptacion: cada pieza se puede escuchar, practicar, puntuar y repetir.

### V2a - Ajuste de octava (implementación inicial)

- [x] Selector para practicar ejercicios y canciones una octava más grave,
  en la altura original o una octava más aguda.
- [x] Guardar la preferencia y compartirla entre ambas pantallas.
- [x] Mantener referencias, melodía, objetivos y nombres de nota transpuestos
  de forma consistente, sin cambiar la matemática del puntaje.
- [x] Verificar por test que todas las notas actuales siguen dentro del rango
  admitido por el detector.
- Verificado con 100 tests, typecheck y build. En navegador se comprobó que
  ejercicios y canciones actualizan las notas mostradas en las tres alturas,
  que la preferencia se comparte entre pantallas y que se guarda al recargar.

### V1a - Captura guiada del rango (implementación inicial)

- [x] Ruta opcional con explicación explícita: no es diagnóstico y no hay que
  forzar la voz; el audio no se graba ni se conserva.
- [x] Solicitar permiso del micrófono tras acción del usuario y capturar la nota
  grave/aguda por separado durante una emisión sostenida.
- [x] Rechazar muestras sin tono estable; permitir repetir, escuchar referencias
  y corregir ambos extremos antes de guardar.
- [x] Validar y guardar el rango confirmado localmente; sugerir transposición
  según cuántas notas del repertorio quedan dentro del rango.
- Verificación: pruebas sintéticas, persistencia, typecheck, build y flujo visual
  verificados. La validación con voz y micrófono reales queda pendiente en L1.

### V3a - Historial y guía de práctica

- Cada sesión nueva conserva fecha y hora, resultado por nota objetivo y
  precisión total; no se almacena audio.
- Inicio muestra el historial independiente de cada ejercicio y canción, los
  últimos tres resultados y la variación respecto del intento anterior.
- Tras suficientes intentos, sugiere repasar la nota con menor precisión media
  entre las últimas cinco sesiones de esa pieza.
- Los respaldos antiguos siguen siendo compatibles; se conserva el máximo de
  500 sesiones.
- Verificación: tests de persistencia e importación/exportación, typecheck,
  lint y build.

### V4a - Repertorio inicial ampliado

- Se amplía el catálogo a seis ejercicios con práctica descendente, arpegio
  mayor y escala pentatónica, graduados desde imitación simple a saltos.
- Se agregan tres melodías originales sin letra para practicar con "la" o "aaa".
- Inicio, transposición y sugerencia de rango incluyen automáticamente todo el
  repertorio; cada pieza conserva su audio, puntuación y repetición habituales.
- Verificación: tests de catálogo y de rango del detector para todas las notas
  transpuestas, más tests, typecheck, lint y build.

### G1a - Ruta inicial de guitarra

- Nueva ruta `#/aprender-guitarra` con seis lecciones progresivas: postura y
  cuerdas, referencias de afinación estándar, Mi menor, La menor/Do mayor,
  cambios y rasgueo.
- Incluye diagramas de acordes accesibles, reproducción sintetizada de las seis
  cuerdas y de los acordes, avance secuencial y progreso local.
- Se puede abrir desde Inicio o desde el módulo de Guitarra. No utiliza el
  micrófono ni afirma detectar afinación o ritmo.
- Verificación automatizada: orden y alturas de cuerdas, digitaciones de
  acordes, integridad de lecciones y ruta por hash; 125 tests, typecheck y
  build OK. En navegador se confirmó el avance de una lección, su persistencia
  al recargar y ausencia de scroll horizontal a 360 px. Lint sin errores; quedan
  tres advertencias previas en PantallaEjercicio por performance.now().

### G4a - Afinador de guitarra inicial

- Pantalla independiente para las seis cuerdas estándar, selección de objetivo,
  referencia sintetizada y guía de afinación por desviación en cents.
- Advierte si la detección parece estar una octava desplazada, algo que puede
  ocurrir por armónicos. Incluye permiso explícito, nivel de entrada y botón
  para apagar/liberar el micrófono.
- No se presenta como afinador validado: faltan pruebas físicas con la guitarra
  y el micrófono del usuario, en particular la cuerda 6.ª cerca del límite
  inferior de frecuencia.
- Verificación: tests de desviación, navegación, `npm run test`, lint y build;
  falta prueba de afinación real.

### G5a - Práctica visual de cambios de acordes

- En la quinta lección hay práctica de ocho compases con Em/Am o Am/C,
  pulsación sonora y visual, tempo ajustable, pausa/reanudación y repetición.
- El usuario se autoevalúa; no se presenta como detección automática de acordes
  o ritmo. El afinado de cambios y feedback por micrófono siguen pendientes.
- Verificación: tests de secuencia, integridad de datos, build y revisión visual.

### R2a - Canciones a velocidad reducida

- En canciones se puede elegir 60%, 80% o velocidad normal antes de la práctica.
- Se alargan conjuntamente la reproducción, la sílaba activa, la barra temporal
  y las ventanas de medición; la altura y el cálculo de precisión no cambian.
- Se guarda el tempo usado para que la tendencia de una canción compare intentos
  hechos a la misma velocidad.
- Verificación: tests de transformación de duración, persistencia y build.

### R2b - Herramientas generales de ritmo y referencia

- Inicio incorpora metrónomo ajustable entre 40 y 180 BPM y una nota sostenida
  seleccionable; ambos se apagan al salir de la pantalla.
- El módulo embebido de Guitarra tiene tempo ajustable para practicar sus
  secuencias; es un control independiente del tempo de canciones.

### R2c - Repetir fragmento de canción

- Antes de cantar se puede seleccionar una nota inicial/final y repetir el
  fragmento de 2 a 8 veces, respetando transposición y velocidad elegidas.
- La repetición es de escucha; la puntuación vocal sigue siendo para la canción
  completa. Puntuar un fragmento queda como mejora posterior.

Criterio de salida de etapa: práctica adaptada a un rango cómodo confirmado por
la persona, repertorio progresivo y evolución por pieza que ayude a decidir qué
practicar después.

---

## Etapa 6 - Aprender guitarra

Objetivo: que la app acompañe desde conocer los acordes hasta tocar canciones,
no solo mostrar una guitarra embebida.

- [x] G1. Ruta de inicio a la guitarra con lecciones cortas: postura y nombres
  de cuerdas, afinación, primeros acordes, cambios y rasgueo básico.
  Aceptacion: se puede seguir una secuencia y practicar cada habilidad sin
  depender de copiar instrucciones entre pantallas.
- [x] G2. Hacer usable Guitarra dentro del iframe a 360 px y tablet; resolver
  navegación y altura sin scroll horizontal innecesario. Requiere cambio en
  `guitar-learning`.
- [x] G3. Desde Tono y cejilla, abrir Guitarra con la secuencia de acordes
  analizada ya cargada y visible. Preferir mensaje validado y acotado entre
  origenes; no aceptar mensajes arbitrarios.
- [x] G4. Afinador de guitarra para Mi-La-Re-Sol-Si-Mi, reutilizando el detector,
  con cuerda objetivo, desviación y tonos de referencia.
- [x] G5a. Práctica guiada visual de cambios de acorde y ritmo, con pulso,
  pausa/reanudación y autoevaluación; no afirma escuchar ni calificar la guitarra.
- [ ] G5b. Feedback automático de cambios de acorde y ritmo cuando la detección
  de audio resulte fiable; conservar el modo guiado visual como alternativa.

Criterio de salida de etapa: principiante puede aprender acordes, afinarlos,
cambiar entre ellos y tocar una secuencia; el analizador comparte acordes sin
volver a escribirlos.

---

## Etapa 7 - Practicar y mejorar

Objetivo: ayudar a sostener una rutina útil y escuchar la propia evolución.

- [x] R1. Grabar, reproducir y borrar una toma de voz con `MediaRecorder`.
  Consentimiento explícito, límite de 60 segundos y audio temporal en memoria,
  sin subida ni inclusión en los respaldos.
- [x] R2. Tempo reducido en canciones, BPM ajustable en la práctica de acordes
  y repetición de fragmentos de canción.
- [x] R3. Rutinas cortas de práctica diaria y objetivos configurables; no usar
  rachas o puntajes para presionar al usuario.

Criterio de salida de etapa: una persona puede practicar una sección, repetirla,
escucharse y elegir qué mejorar sin perder control de sus grabaciones.

---

## Etapa 8 - Lanzamiento

Objetivo: confirmar que la experiencia completa es instalable, confiable y
funciona en los dispositivos previstos antes de publicar.

- [ ] L1. Pruebas manuales con equipo real: calibración y canto con micrófono,
  grabar/reproducir/borrar una toma, permiso denegado, afinador con las seis
  cuerdas (especialmente Mi grave), navegación y audio. El responsive de la
  app principal y de Guitarra ya se revisó en navegador a 360/390 px.
- [ ] L2. Probar instalación, actualización y modo offline de PWA en dispositivo
  real; confirmar acceso al micrófono en HTTPS.
- [ ] L3. Decidir si se inicializa Git y se habilita GitHub Actions. Si se
  aprueba, configurar CI con `npm ci`, build, typecheck, lint y tests.
- [ ] L4. Hacer deploy de prueba Netlify, revisar HTTPS/headers, rutas, assets de
  Guitarra, micrófono y regresión offline. No publicar definitivamente sin
  aprobación del usuario.

Criterio de salida: checklist real completado y deploy repetible, sin presentar
como verificado aquello que solo se comprobó localmente.

---

## Registro de progreso

| Fecha | Etapa | Items | Verificacion | Estado |
|-------|-------|-------|--------------|--------|
| 2026-10-25 | - | Plan creado | - | Hecho |
| 2026-10-25 | 1 | T1, T1b, B1-B5 | Tests, build y lint OK; usuario confirma micrófono apagado en resultados y que referencias solas no se detectan | Hecha |
| 2026-10-25 | 2 | B6, B8-B10, T2, T12 | Tests, build y lint OK; controles de canción, afinador y micrófono verificados por navegador/usuario | Hecha |
| 2026-10-25 | 3 | B7, T3-T5, T10, T11a, T13 | 91 tests, build y lint OK; rutas, responsive, recuperación de ErrorBoundary y anuncios con Narrador verificados | Hecha |
| 2026-10-25 | 4 | T6, T8-T9b | Netlify configurado; PWA y precache offline verificados en preview; deploy e instalación real pendientes en etapa 8; CI sujeta a decisión | En progreso |
| 2026-10-25 | 5 | V1a, V2a | Selector y calibración implementados; rango compartido, sugerencia, tests, typecheck y build OK; falta captura con voz real | Implementada; validación pendiente |
| 2026-10-25 | 5 | V3a | Historial por pieza, tendencias, sugerencias por nota y respaldo compatible implementados; tests, typecheck, lint y build | Hecho |
| 2026-10-25 | 5 | V4a | Repertorio ampliado a seis ejercicios y seis melodías/canciones, con instrucciones y validación automatizada del rango de notas | Hecho |
| 2026-10-25 | 6 | G1a | Ruta guiada de seis lecciones, referencias sonoras y progreso local; 125 tests, build y prueba de persistencia/responsive en navegador | Hecho |
| 2026-10-25 | 6 | G4a | Afinador inicial de seis cuerdas, selección, referencias y guía por cents implementados; falta validar con guitarra real | Implementada; validación pendiente |
| 2026-10-25 | 6 | G5a | Práctica guiada de cambios con pulso ajustable, pausa, autoevaluación y secuencia visual implementada; tests, lint y build | Hecho |
| 2026-10-25 | 6 | G2-G3 | Guitarra adaptada a móvil y transferencia validada de acordes desde Tono y cejilla; tests y build de ambos proyectos | Hecho |
| 2026-10-25 | 7 | R2a | Tempo 60/80/100% en canciones, puntuación sincronizada y tendencia comparable por velocidad | Hecho |
| 2026-10-25 | 7 | R1a | Grabadora vocal con consentimiento, máximo de 60 s, reproducción y borrado local; la toma se descarta al salir de Inicio | Hecho |
| 2026-10-25 | 7 | R2b | Metrónomo general de 40-180 BPM y nota sostenida seleccionable, con parada explícita y limpieza al salir | Hecho |
| 2026-10-25 | 7 | R3a | Rutinas diarias configurables de 5/10/15 min para canto, guitarra o ambas; avance manual sin puntajes, guardado local | Hecho |
| 2026-10-25 | 7 | R2c | Selección de nota inicial/final y reproducción repetida 2-8 veces a la velocidad de canción; feedback vocal limitado a la canción completa | Hecho |
| 2026-10-25 | 6-7 | G2-G3, R1-R3 | Responsive y transferencia de acordes verificados en navegador; grabadora, metrónomo, nota sostenida, rutina y loop implementados; falta prueba real de micrófono/instrumento | Funciones implementadas; validación pendiente |

## Bitacora

### 2026-10-25

- Se crea este plan con todos los hallazgos de la revision: 10 bugs, 13 mejoras
  tecnicas y 7 agregados de producto.
- Base ya completada antes del plan: modo "a mi ritmo" en Tono y cejilla e
  integracion de Guitarra por iframe.
- Se configura Vitest (ya estaba instalado) y se agregan 61 casos automatizados
  para notas, puntuacion, teoria musical y progreso.
- Se corrige el calculo de precision para penalizar silencio, se exige medio
  segundo de voz antes de avanzar libremente, se transpone la octava de los
  acordes y se apaga el microfono al mostrar resultados.
- Se excluyen de la medicion las referencias reproducidas y los 300 ms de cola.
- Verificacion automatizada: `npm test` (61 tests), `npm run build` y
  `npm run lint` en verde. Falta probar en navegador con microfono real y
  parlantes para confirmar el indicador de apagado y ausencia de contaminacion.
- El usuario confirma que ya habia probado el microfono y funcionaba; se toma
  como validada la captura basica.
- Prueba manual posterior: el usuario confirma que el indicador de micrófono
  desaparece al llegar a resultados. En una prueba sin cantar con parlantes, la
  app indicó que no detectó voz; se considera verificado que la referencia sola
  no está puntuándose como canto. El usuario reporta puntajes de 0-2% al cantar
  en casi todas las notas; el medidor indica "Se te escucha". Eso confirma nivel
  de entrada, pero no que el detector haya reconocido una altura estable. Luego
  el usuario confirma que Afinador sí muestra el nombre de una nota, validando
  detección de altura en esa pantalla. Falta comprobar el mensaje grande de
  afinación durante un ejercicio.

### 2026-10-25 - Etapa 2

- Canciones ahora permite reproducir la melodía completa con detener y escuchar
  una nota elegida, repetirla y navegar anterior/siguiente.
- El afinador usa la tolerancia guardada que comparten los ejercicios (50 cents
  por defecto), en lugar de un umbral independiente de 15 cents.
- La reproducción automática de acordes en Tono y cejilla resalta el acorde que
  está sonando.
- La normalización solo trata como octava una desviación cercana a un múltiplo
  exacto; una quinta (+700 cents) queda diagnosticada como alta. Se añaden casos
  de regresión para +700/-700 cents.
- `tono.ts` y `useMicrofono.ts` reutilizan un único `AudioContext`; detener el
  micrófono libera las pistas y la fuente, sin cerrar el contexto compartido.
- Inicio incorpora una comprobación de micrófono con nivel y mensaje "Se te
  escucha"; Afinador, Ejercicio y Canción muestran estado y nivel mientras está
  activo.
- Verificación automatizada: `npm test` (66 tests), `npm run build` y
  `npm run lint` OK.
- Verificación en navegador: se abrió Canciones, se avanzó a la segunda nota,
  se repitió y se detuvo la melodía; controles y estado visual correctos.
- El usuario confirma que la reproducción se oye y funciona en su dispositivo.
- El usuario confirma que el micrófono se apaga al mostrar resultados y que,
  sin cantar mientras suenan los parlantes, se muestra "no se detectó voz".
- El usuario confirma que el medidor de nivel muestra "Se te escucha", que el
  Afinador muestra el nombre de una nota y que, en el ejercicio, una nota aparece
  "Afinado" mientras las demás indican "Muy bajo, subí". Esto apunta a que el
  micrófono y la detección funcionan; queda revisar un rango vocal más cómodo
  en la Etapa 5, no asumir que la puntuación baja es un fallo técnico.

### 2026-10-25 - Etapa 3 (avance)

- Se agrega navegación por hash, recuperación de IDs inválidos y un
  `ErrorBoundary` global.
- Se incorporan avisos accesibles, roles/etiquetas de controles, foco visible y
  respeto a `prefers-reduced-motion`.
- El progreso limita sesiones, valida la importación y ofrece respaldo
  exportable/importable con avisos de errores de almacenamiento.
- `teoria.ts` queda como API pública; parser, tonalidad, cejilla, posiciones y
  utilidades musicales quedan separados en módulos. Se evita dependencia
  circular entre el punto de entrada y los módulos de dominio.
- Verificación automatizada tras el refactor: `npm test` (91 tests),
  `npm run build` y `npm run lint`, todo OK.
- Verificación manual: las rutas inválidas vuelven a Inicio, las rutas válidas
  persisten al recargar y el botón Volver funciona. Inicio, Afinador, Tono,
  Ejercicio y Canciones no presentan desbordamiento horizontal a 360 ni 768 px.
- En navegador, Exportar informa que descargó el respaldo; al importar JSON
  inválido, la app solicita confirmación y muestra el error de formato sin
  reemplazar el progreso.
- La revisión de objetivos táctiles encontró botones pequeños en navegación,
  ejemplos, reproducción de Tono y selección de notas en Canciones. Se elevó
  su tamaño mínimo a 36 px. Verificación posterior: las cinco pantallas no
  tienen botones visibles menores de 32 px ni desbordamiento horizontal a 360
  o 768 px.
- Verificación adicional: se inyectó un error de render simulado en el módulo
  `App` desde el navegador; el `ErrorBoundary` mostró su alerta y botón de
  recuperación. Se comprobó que un ejercicio mantiene su URL al recargar y que
  Atrás vuelve a Inicio. El árbol de accesibilidad expone la región de prueba
  de micrófono y su medidor con nombre accesible. El usuario confirma que
  Narrador anuncia correctamente el mensaje y el nivel del micrófono; T5 queda
  cerrado y la etapa 3 completa.

### 2026-10-25 - Etapa 4 (avance)

- Se añade `netlify.toml` con build de producción, carpeta `dist`, protección
  contra MIME sniffing y caché larga para assets con hash de ambas apps.
- Se incorpora `vite-plugin-pwa` con manifiesto, iconos PNG, precache de los
  archivos estáticos y aviso accesible para aplicar actualizaciones.
- Se actualizan `README.md` y `PLAN.md` con estructura, comandos, deploy y
  checklist post-deploy, incluido el procedimiento para regenerar Guitarra.
- El usuario elige `vite-plugin-pwa`; Git y GitHub Actions quedan diferidos.
- Build verificado: 23 archivos (aprox. 1.7 MiB) en precache. En preview, la
  app, el manifiesto, los iconos y `/guitarra/index.html` respondieron offline.
- Pendiente: comprobar instalación en Chrome/Android y verificar un deploy real
  en Netlify.

### 2026-10-25 - Etapa 5 (inicio)

- Se prioriza que la app ayude a aprender canto y guitarra antes de publicar.
- Se define una etapa vocal con rango cómodo confirmado por la persona,
  progreso por pieza y repertorio gradual; no presentará el rango como
  diagnóstico médico.
- Se define una etapa de guitarra centrada en una ruta guiada para principiantes,
  afinador, práctica de acordes y uso responsive; el puente con el analizador
  queda como parte del flujo de aprendizaje.
- Se separan grabación, loops y herramientas de práctica de la primera etapa
  vocal, y se aplaza el lanzamiento final hasta probar dispositivos reales.
- Inicio de V2a: selector Original/Más grave/Más aguda en ejercicios y
  canciones; la elección queda guardada y no modifica la matemática del puntaje.
- El selector de octava es un ajuste manual seguro para probar sin esperar a la
  calibración completa del rango.
- Se añade una pantalla de calibración de rango accesible desde Inicio. Captura
  cada extremo por separado, valida estabilidad, deja repetir/escuchar/corregir,
  guarda solo tras confirmación y propone una octava que maximiza notas del
  repertorio dentro del rango informado.
- La captura no graba audio ni intenta detectar límites vocales; el usuario
  confirma que las notas se sienten cómodas. La verificación con voz real queda
  pendiente para no confundir tests sintéticos con validación del micrófono.

## Decisiones abiertas

- [ ] Decidir si se inicializa Git y se habilita GitHub Actions (T7).
- [x] Cambios aditivos en `guitar-learning` autorizados: responsive y puente
  validado de acordes implementados.
- [x] Elegir `vite-plugin-pwa` para la PWA (T8).
- [x] B8: el afinador comparte la tolerancia persistida de ejercicios; si no hay
  ajuste guardado, usa ±50 cents.
- [x] Definir minimo de canto para avanzar: 500 ms de voz en modo "a mi ritmo";
  B1 penaliza el silencio dividiendo por todas las tramas de la ventana.
