// Pantalla de inicio: lista de ejercicios + resumen de progreso + ayuda inicial.

import { useEffect, useRef, useState } from 'react';
import { midiToNombre } from '../audio/notas';
import { useMicrofono } from '../audio/useMicrofono';
import { EJERCICIOS } from '../data/ejercicios';
import { CANCIONES, duracionCancion } from '../data/canciones';
import GrabadoraVocal from './GrabadoraVocal';
import MisCanciones from './MisCanciones';
import PracticaBase from './PracticaBase';
import RutinaDiaria from './RutinaDiaria';
import {
  cargarCancionesPersonalizadas,
  type CancionPersonalizada,
} from '../storage/cancionesPersonalizadas';
import type { Resumen, Sesion } from '../storage/progreso';
import {
  cargarProgreso,
  cargarModoPrincipiante,
  cargarRangoVocal,
  obtenerErrorPersistencia,
  guardarModoPrincipiante,
} from '../storage/progreso';
import { exportarRespaldo, importarRespaldo } from '../storage/respaldo';

const NIVEL_COLOR: Record<string, string> = {
  Facil: 'bg-emerald-900 text-emerald-300',
  Media: 'bg-yellow-900 text-yellow-300',
  Dificil: 'bg-red-900 text-red-300',
};

function fechaSesion(sesion: Sesion): string {
  const fecha = sesion.registradoEn
    ? new Date(sesion.registradoEn)
    : new Date(`${sesion.fecha}T12:00:00`);
  const dia = fecha.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
  });
  return sesion.registradoEn
    ? `${dia}, ${fecha.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`
    : dia;
}

export default function Inicio({
  resumen,
  alElegir,
  alElegirCancion,
  alAfinador,
  alAfinadorGuitarra,
  alCalibrarRango,
  alTono,
  alGuitarra,
  alAprenderGuitarra,
  alAprenderMusica,
  alProgresoActualizado,
}: {
  resumen: Resumen;
  alElegir: (id: string) => void;
  alElegirCancion: (id: string) => void;
  alAfinador: () => void;
  alAfinadorGuitarra: () => void;
  alCalibrarRango: () => void;
  alTono: () => void;
  alGuitarra: () => void;
  alAprenderGuitarra: () => void;
  alAprenderMusica: () => void;
  alProgresoActualizado: () => void;
}) {
  const [principiante, setPrincipiante] = useState(cargarModoPrincipiante);
  const [personalizadas, setPersonalizadas] = useState<CancionPersonalizada[]>(
    cargarCancionesPersonalizadas,
  );
  const { estado, mensajeError, motorRef, iniciar, detener } = useMicrofono();
  const [nivel, setNivel] = useState(0);
  const [errorDatos, setErrorDatos] = useState(obtenerErrorPersistencia);
  const [mensajeDatos, setMensajeDatos] = useState('');
  const archivoRef = useRef<HTMLInputElement>(null);
  const rangoVocal = cargarRangoVocal();
  const sesiones = cargarProgreso().sesiones;
  const progresoPorPieza = [
    ...EJERCICIOS.map((pieza) => ({
      id: pieza.id,
      titulo: pieza.titulo,
      esCancion: false,
    })),
    ...CANCIONES.map((pieza) => ({
      id: `cancion-${pieza.id}`,
      titulo: pieza.titulo,
      esCancion: true,
    })),
    ...personalizadas.map((pieza) => ({
      id: `cancion-${pieza.id}`,
      titulo: pieza.titulo,
      esCancion: true,
    })),
  ].map((pieza) => {
    const historial = sesiones
      .filter((sesion) => sesion.ejercicioId === pieza.id)
      .sort((a, b) =>
        (a.registradoEn ?? a.fecha).localeCompare(b.registradoEn ?? b.fecha),
      );
    const ultimaSesion = historial[historial.length - 1];
    const tempoComparacion = ultimaSesion?.tempoPorcentaje ?? 100;
    const sesionesMismoTempo = historial.filter(
      (sesion) => (sesion.tempoPorcentaje ?? 100) === tempoComparacion,
    );
    const ultimasSesiones = historial.slice(-5);
    const notas = new Map<number, number[]>();
    for (const sesion of ultimasSesiones) {
      for (const nota of sesion.detalleNotas ?? []) {
        const precisiones = notas.get(nota.midi) ?? [];
        precisiones.push(nota.precision);
        notas.set(nota.midi, precisiones);
      }
    }
    const notaADedicar = [...notas.entries()]
      .map(([midi, precisiones]) => ({
        midi,
        intentos: precisiones.length,
        precision: precisiones.reduce((total, valor) => total + valor, 0) / precisiones.length,
      }))
      .filter((nota) => nota.intentos >= 2 && nota.precision < 70)
      .sort((a, b) => a.precision - b.precision)[0];

    return {
      ...pieza,
      historial,
      recientes: historial.slice(-3).reverse(),
      notaADedicar,
      tendencia:
        sesionesMismoTempo.length >= 2
          ? sesionesMismoTempo[sesionesMismoTempo.length - 1].precision -
            sesionesMismoTempo[sesionesMismoTempo.length - 2].precision
          : null,
    };
  });

  useEffect(() => {
    if (estado !== 'activo') return;
    const id = window.setInterval(() => {
      setNivel(Math.min(1, Math.round(motorRef.current.frame.nivel * 800) / 100));
    }, 100);
    return () => window.clearInterval(id);
  }, [estado, motorRef]);
  const nivelVisible = estado === 'activo' ? nivel : 0;

  useEffect(() => {
    const actualizarError = (evento: Event) => {
      setErrorDatos(
        (evento as CustomEvent<string | null>).detail ??
          obtenerErrorPersistencia(),
      );
    };
    window.addEventListener('canta-persistencia', actualizarError);
    return () => window.removeEventListener('canta-persistencia', actualizarError);
  }, []);

  const cambiarPrincipiante = (v: boolean) => {
    setPrincipiante(v);
    guardarModoPrincipiante(v);
  };

  const refrescarCanciones = () => {
    setPersonalizadas(cargarCancionesPersonalizadas());
    alProgresoActualizado();
  };

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-6">
      <h1 className="text-3xl font-black text-white">Aprende a cantar</h1>
      <p className="mt-1 text-sm text-slate-400">
        Practicá afinación con tu micrófono. Sin cuenta, sin servidor.
      </p>

      <div className="mt-4 rounded-xl border border-violet-800 bg-violet-950/60 p-4 text-sm text-violet-100">
        <p className="font-semibold text-white">¿Primera vez? Empezá por "Notas sueltas".</p>
        <p className="mt-1">
          No necesitás saber música ni el nombre de las notas: solo imitá el
          sonido que escuchás, con un "aaa".
        </p>
      </div>

      <button
        onClick={alAprenderMusica}
        className="mt-3 w-full rounded-xl border border-violet-700 bg-slate-900 p-4 text-left hover:bg-slate-800"
      >
        <span className="font-semibold text-white">No sé nada de música</span>
        <span className="mt-1 block text-xs text-slate-400">
          Lecciones cortas de notas, octavas y afinación, más un glosario para
          entender las indicaciones de la app.
        </span>
      </button>

      <button
        onClick={alCalibrarRango}
        className="mt-3 w-full rounded-xl border border-violet-700 bg-slate-900 p-4 text-left hover:bg-slate-800"
      >
        <span className="font-semibold text-white">Encontrá tu zona cómoda</span>
        <span className="mt-1 block text-xs text-slate-400">
          {rangoVocal
            ? `Rango guardado: ${midiToNombre(rangoVocal.graveMidi)} a ${midiToNombre(rangoVocal.agudaMidi)}. Podés revisarlo o volver a calibrar.`
            : 'Calibración opcional para elegir una altura cómoda al practicar canto.'}
        </span>
      </button>

      <section className="mt-4 rounded-xl bg-slate-900 p-4" aria-label="Prueba de micrófono">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-white">Probar micrófono</h2>
            <p className="mt-1 text-xs text-slate-400">
              Hablá o cantá para comprobar que la app recibe tu voz.
            </p>
          </div>
          <button
            onClick={() => {
              if (estado === 'activo' || estado === 'pidiendo') detener();
              else void iniciar();
            }}
            disabled={estado === 'pidiendo'}
            className="shrink-0 rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {estado === 'activo'
              ? 'Apagar'
              : estado === 'pidiendo'
                ? 'Activando...'
                : 'Probar'}
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="w-24 text-xs text-slate-400">
            {estado === 'activo' ? 'Micrófono activo' : 'Nivel de entrada'}
          </span>
          <div
            className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800"
            role="meter"
            aria-label="Nivel del micrófono"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(nivelVisible * 100)}
          >
            <div
              className={`h-full transition-[width] duration-100 ${
                nivelVisible > 0.08 ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
              style={{ width: `${Math.round(nivelVisible * 100)}%` }}
            />
          </div>
          <span className="w-24 text-right text-xs text-slate-400">
            {estado === 'activo'
              ? nivelVisible > 0.08
                ? 'Se te escucha'
                : 'Cantá para probar'
              : estado === 'denegado'
                ? 'Permiso denegado'
                : estado === 'error'
                  ? 'No disponible'
                  : 'Apagado'}
          </span>
        </div>
        {mensajeError && (
          <p className="mt-2 rounded-lg bg-red-950 p-2 text-xs text-red-300">
            {mensajeError}
          </p>
        )}
      </section>

      <GrabadoraVocal />

      <PracticaBase />

      <RutinaDiaria
        alVoz={() => alElegir(EJERCICIOS[0].id)}
        alCancion={() => alElegirCancion(CANCIONES[0].id)}
        alAprenderGuitarra={alAprenderGuitarra}
        alAfinadorGuitarra={alAfinadorGuitarra}
      />

      <section className="mt-4 rounded-xl bg-slate-900 p-4">
        <h2 className="font-semibold text-white">Respaldo del progreso</h2>
        <p className="mt-1 text-xs text-slate-400">
          Exportá tus sesiones y canciones personalizadas, o importá un respaldo
          anterior.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {
              try {
                const archivo = new Blob([exportarRespaldo()], {
                  type: 'application/json',
                });
                const url = URL.createObjectURL(archivo);
                const enlace = document.createElement('a');
                enlace.href = url;
                enlace.download = 'canta-app-respaldo.json';
                enlace.click();
                URL.revokeObjectURL(url);
                setMensajeDatos('Respaldo descargado.');
              } catch (error) {
                setMensajeDatos(
                  error instanceof Error
                    ? error.message
                    : 'No se pudo exportar el progreso.',
                );
              }
            }}
            className="flex-1 rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Exportar
          </button>
          <button
            onClick={() => archivoRef.current?.click()}
            className="flex-1 rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Importar
          </button>
          <input
            ref={archivoRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (evento) => {
              const archivo = evento.currentTarget.files?.[0];
              evento.currentTarget.value = '';
              if (!archivo) return;
              if (
                !window.confirm(
                  'Importar reemplazará el progreso guardado. Si el archivo incluye canciones personalizadas, también reemplazará las tuyas. ¿Continuar?',
                )
              ) {
                return;
              }
              try {
                const resultado = importarRespaldo(await archivo.text());
                setMensajeDatos(
                  resultado.incluyeCanciones
                    ? `Respaldo importado: progreso y ${resultado.cancionesImportadas} ${
                        resultado.cancionesImportadas === 1
                          ? 'canción personalizada'
                          : 'canciones personalizadas'
                      }.`
                    : 'Progreso importado. Tus canciones personalizadas se conservaron.',
                );
                refrescarCanciones();
              } catch (error) {
                setMensajeDatos(
                  error instanceof Error
                    ? error.message
                    : 'No se pudo importar el archivo.',
                );
              }
            }}
          />
        </div>
        {(errorDatos || mensajeDatos) && (
          <div
            className={`mt-3 rounded-lg p-3 text-sm ${
              errorDatos
                ? 'bg-red-950 text-red-200'
                : 'bg-emerald-950 text-emerald-200'
            }`}
            role={errorDatos ? 'alert' : 'status'}
          >
            {errorDatos ?? mensajeDatos}
          </div>
        )}
      </section>

      <details className="mt-4 rounded-xl bg-slate-900 p-4 text-sm text-slate-300">
        <summary className="cursor-pointer font-semibold text-white">
          ¿Cómo funciona?
        </summary>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li>Elegí un ejercicio y tocá "Empezar". Aceptá el micrófono.</li>
          <li>La app toca una nota. Escuchala.</li>
          <li>Cuando diga "Cantá ahora", imitá ese sonido con un "aaa" sostenido.</li>
          <li>
            La app te dice "Afinado", "subí" o "bajá". Al final te muestra el
            resultado de cada nota.
          </li>
        </ol>
        <p className="mt-3 text-xs text-slate-400">
          Usá auriculares para que el micrófono no escuche la nota de la app.
          Si cantás más grave o más agudo que la nota (otra octava), la app lo
          tiene en cuenta: la nota es la misma.
        </p>
      </details>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-slate-900 p-3 text-center">
          <div className="text-2xl font-black text-white">{resumen.precisionMedia}%</div>
          <div className="text-xs text-slate-400">precisión media</div>
        </div>
        <div className="rounded-xl bg-slate-900 p-3 text-center">
          <div className="text-2xl font-black text-white">{resumen.diasPracticados}</div>
          <div className="text-xs text-slate-400">días practicados</div>
        </div>
        <div className="rounded-xl bg-slate-900 p-3 text-center">
          <div className="text-2xl font-black text-white">{resumen.racha}</div>
          <div className="text-xs text-slate-400">racha (días)</div>
        </div>
      </div>

      <section className="mt-6" aria-labelledby="progreso-piezas">
        <h2 id="progreso-piezas" className="text-lg font-bold text-white">
          Tu práctica por pieza
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Mirá cómo venís en cada ejercicio y canción. Cada intento se compara
          con esa misma pieza, no con las demás.
        </p>
        <div className="mt-3 space-y-2">
          {progresoPorPieza.map((pieza) => {
            const ultima = pieza.historial[pieza.historial.length - 1];
            return (
              <details key={pieza.id} className="rounded-xl bg-slate-900 p-4">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-white">{pieza.titulo}</span>
                    <span className="shrink-0 text-xs text-slate-400">
                      {pieza.historial.length === 0
                        ? 'Todavía sin prácticas'
                        : `${pieza.historial.length} ${
                            pieza.historial.length === 1 ? 'práctica' : 'prácticas'
                          } · última ${ultima.precision}%`}
                    </span>
                  </div>
                </summary>
                <div className="mt-3 border-t border-slate-800 pt-3">
                  {pieza.historial.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      Hacé esta práctica para empezar a ver tu evolución.
                    </p>
                  ) : (
                    <>
                      {pieza.tendencia !== null && (
                        <p className="text-sm text-slate-300">
                          {pieza.tendencia > 0
                            ? `Subiste ${pieza.tendencia} puntos respecto del intento anterior.`
                            : pieza.tendencia < 0
                              ? `Bajaste ${Math.abs(pieza.tendencia)} puntos respecto del intento anterior.`
                              : 'Mantuviste el mismo resultado que en el intento anterior.'}
                        </p>
                      )}
                      {pieza.notaADedicar && (
                        <p className="mt-2 rounded-lg bg-violet-950/60 p-3 text-sm text-violet-100">
                          Para la próxima, dedicá un poco más de tiempo a{' '}
                          <b>{midiToNombre(pieza.notaADedicar.midi)}</b>: tu
                          precisión media ahí es{' '}
                          {Math.round(pieza.notaADedicar.precision)}% en los
                          últimos intentos.
                        </p>
                      )}
                      <ol className="mt-3 space-y-2">
                        {pieza.recientes.map((sesion, indice) => (
                          <li
                            key={`${sesion.registradoEn ?? sesion.fecha}-${indice}`}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-slate-400">
                              {fechaSesion(sesion)}
                            </span>
                            <span className="font-semibold text-white">
                              {sesion.precision}% · {sesion.notasBien}/
                              {sesion.notasTotal} notas
                              {pieza.esCancion &&
                                ` · ${sesion.tempoPorcentaje ?? 100}%`}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </>
                  )}
                  <button
                    onClick={() =>
                      pieza.esCancion
                        ? alElegirCancion(pieza.id.slice('cancion-'.length))
                        : alElegir(pieza.id)
                    }
                    className="mt-3 min-h-10 w-full rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                  >
                    {pieza.historial.length === 0
                      ? 'Empezar esta práctica'
                      : 'Practicar de nuevo'}
                  </button>
                </div>
              </details>
            );
          })}
        </div>
      </section>

      <button
        onClick={alAfinador}
        className="mt-4 w-full rounded-xl bg-slate-800 py-3 font-semibold text-white hover:bg-slate-700"
      >
        Abrir afinador
      </button>

      <button
        onClick={alAfinadorGuitarra}
        className="mt-2 w-full rounded-xl bg-slate-800 py-3 font-semibold text-white hover:bg-slate-700"
      >
        Afinador de guitarra
      </button>

      <button
        onClick={alTono}
        className="mt-2 w-full rounded-xl bg-slate-800 p-4 text-left hover:bg-slate-700"
      >
        <span className="font-semibold text-white">Tono y cejilla</span>
        <span className="mt-0.5 block text-xs text-slate-400">
          Pegá acordes o notas: te digo el tono y cómo tocarlo en guitarra.
        </span>
      </button>

      <button
        onClick={alAprenderGuitarra}
        className="mt-2 w-full rounded-xl border border-violet-800 bg-violet-950/40 p-4 text-left hover:bg-violet-950/70"
      >
        <span className="font-semibold text-white">Aprender guitarra desde cero</span>
        <span className="mt-0.5 block text-xs text-slate-400">
          Lecciones guiadas de cuerdas, acordes, cambios y rasgueo.
        </span>
      </button>

      <button
        onClick={alGuitarra}
        className="mt-2 w-full rounded-xl bg-slate-800 p-4 text-left hover:bg-slate-700"
      >
        <span className="font-semibold text-white">Guitarra</span>
        <span className="mt-0.5 block text-xs text-slate-400">
          Acordes, guitarra 3D, rasgueo y ejercicios.
        </span>
      </button>

      <label className="mt-4 flex cursor-pointer items-center justify-between rounded-xl bg-slate-900 p-4">
        <span className="text-sm text-slate-300">
          Modo principiante
          <span className="mt-0.5 block text-xs text-slate-500">
            Menos números, más indicaciones en palabras.
          </span>
        </span>
        <input
          type="checkbox"
          checked={principiante}
          onChange={(e) => cambiarPrincipiante(e.target.checked)}
          className="h-5 w-5 shrink-0 accent-violet-500"
        />
      </label>

      <h2 className="mt-6 text-lg font-bold text-white">Ejercicios</h2>
      <div className="mt-3 space-y-3">
        {EJERCICIOS.map((e) => (
          <button
            key={e.id}
            onClick={() => alElegir(e.id)}
            className="w-full rounded-xl bg-slate-900 p-4 text-left hover:bg-slate-800"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">{e.titulo}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${NIVEL_COLOR[e.nivel]}`}>
                {e.nivel}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">{e.descripcion}</p>
            <p className="mt-1 text-xs text-slate-500">
              {e.notas.length} notas
              {!principiante && ` · ±${e.toleranciaDefecto} cents`}
            </p>
          </button>
        ))}
      </div>

      <h2 className="mt-6 text-lg font-bold text-white">Canciones</h2>
      <p className="mt-1 text-sm text-slate-400">
        Cantá una melodía completa y mirá en qué momentos desafinaste.
      </p>
      <div className="mt-3 space-y-3">
        {CANCIONES.map((c) => (
          <button
            key={c.id}
            onClick={() => alElegirCancion(c.id)}
            className="w-full rounded-xl bg-slate-900 p-4 text-left hover:bg-slate-800"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">{c.titulo}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${NIVEL_COLOR[c.nivel]}`}>
                {c.nivel}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">{c.descripcion}</p>
            <p className="mt-1 text-xs text-slate-500">
              {c.notas.length} notas · {duracionCancion(c).toFixed(1)} s
            </p>
          </button>
        ))}
      </div>

      <MisCanciones
        canciones={personalizadas}
        alPracticar={alElegirCancion}
        alCambiar={refrescarCanciones}
      />
    </div>
  );
}
