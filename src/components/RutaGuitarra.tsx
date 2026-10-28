import { useEffect, useRef, useState } from 'react';
import { ensureAudioContext, tocarAcorde, tocarNota, type Reproduccion } from '../audio/tono';
import {
  ACORDES_GUITARRA,
  CUERDAS_GUITARRA,
  LECCIONES_GUITARRA,
} from '../data/leccionesGuitarra';
import DiagramaAcorde from './DiagramaAcorde';
import PracticaCambiosAcorde from './PracticaCambiosAcorde';

export const CLAVE_PROGRESO_GUITARRA = 'canta-app-lecciones-guitarra-v1';

function cargarLeccionesCompletadas(): { completadas: number[]; aviso: string } {
  try {
    const guardado = localStorage.getItem(CLAVE_PROGRESO_GUITARRA);
    if (!guardado) return { completadas: [], aviso: '' };
    const valor: unknown = JSON.parse(guardado);
    if (
      !Array.isArray(valor) ||
      !valor.every(
        (indice, posicion) =>
          typeof indice === 'number' &&
          Number.isInteger(indice) &&
          indice >= 0 &&
          indice < LECCIONES_GUITARRA.length &&
          indice === posicion,
      )
    ) {
      return {
        completadas: [],
        aviso: 'El progreso de guitarra tiene un formato inválido; podés empezar la ruta de nuevo.',
      };
    }
    return {
      completadas: valor.filter((indice): indice is number => typeof indice === 'number'),
      aviso: '',
    };
  } catch {
    return {
      completadas: [],
      aviso: 'No se pudo leer el progreso de guitarra guardado en este navegador.',
    };
  }
}


export default function RutaGuitarra({
  alVolver,
  alAbrirModulo,
}: {
  alVolver: () => void;
  alAbrirModulo: () => void;
}) {
  const [estadoInicial] = useState(cargarLeccionesCompletadas);
  const [completadas, setCompletadas] = useState(estadoInicial.completadas);
  const [aviso, setAviso] = useState(estadoInicial.aviso);
  const [seleccionada, setSeleccionada] = useState(() =>
    Math.min(estadoInicial.completadas.length, LECCIONES_GUITARRA.length - 1),
  );
  const [notaSonando, setNotaSonando] = useState<number | null>(null);
  const reproduccionRef = useRef<Reproduccion | null>(null);
  const disponible = Math.min(completadas.length, LECCIONES_GUITARRA.length - 1);
  const leccionActual = LECCIONES_GUITARRA[seleccionada];

  useEffect(
    () => () => reproduccionRef.current?.detener(),
    [],
  );

  const completarLeccion = () => {
    const siguiente = [...new Set([...completadas, seleccionada])].sort(
      (a, b) => a - b,
    );
    setCompletadas(siguiente);
    setSeleccionada(
      Math.min(seleccionada + 1, LECCIONES_GUITARRA.length - 1),
    );
    try {
      localStorage.setItem(CLAVE_PROGRESO_GUITARRA, JSON.stringify(siguiente));
      setAviso('Lección guardada. Ya podés seguir con la siguiente.');
    } catch {
      setAviso(
        'La lección quedó marcada mientras esta pantalla esté abierta, pero el navegador no pudo guardarla.',
      );
    }
  };

  const escucharCuerda = async (midi: number) => {
    ensureAudioContext();
    setNotaSonando(midi);
    try {
      await tocarNota(midi, 1);
    } finally {
      setNotaSonando((actual) => (actual === midi ? null : actual));
    }
  };

  const escucharAcorde = async (id: string, midi: number[]) => {
    reproduccionRef.current?.detener();
    const reproduccion = tocarAcorde(midi, 1.4);
    reproduccionRef.current = reproduccion;
    setAviso(`Escuchando ${ACORDES_GUITARRA.find((acorde) => acorde.id === id)?.nombre ?? 'acorde'}.`);
    await reproduccion.fin;
    if (reproduccionRef.current === reproduccion) {
      reproduccionRef.current = null;
      setAviso('');
    }
  };

  const reiniciar = () => {
    if (!window.confirm('¿Querés borrar las lecciones completadas y empezar de nuevo?')) {
      return;
    }
    setCompletadas([]);
    setSeleccionada(0);
    try {
      localStorage.removeItem(CLAVE_PROGRESO_GUITARRA);
      setAviso('Se reinició el progreso de esta ruta.');
    } catch {
      setAviso('No se pudo borrar el progreso guardado en el navegador.');
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-6 text-white">
      <button
        onClick={alVolver}
        className="mb-4 inline-flex min-h-10 items-center px-2 text-sm text-slate-400 hover:text-white"
      >
        {'< Volver'}
      </button>
      <h1 className="text-3xl font-black">Aprender guitarra desde cero</h1>
      <p className="mt-2 text-sm text-slate-300">
        Lecciones breves para conocer las cuerdas, formar tus primeros acordes y
        acompañar con un rasgueo sencillo. Avanzá sin apuro; no hace falta saber
        música.
      </p>
      <div className="mt-4 rounded-xl border border-violet-800 bg-violet-950/50 p-4 text-sm text-violet-100">
        Esta guía no usa el micrófono ni detecta si la guitarra está afinada.
        Para afinar con precisión, usá un afinador de guitarra.
      </div>
      <div className="mt-4 rounded-xl bg-slate-900 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold">Tu recorrido</p>
          <span className="text-sm text-slate-400">
            {completadas.length} de {LECCIONES_GUITARRA.length} lecciones
          </span>
        </div>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"
          role="progressbar"
          aria-label="Progreso de la ruta de guitarra"
          aria-valuemin={0}
          aria-valuemax={LECCIONES_GUITARRA.length}
          aria-valuenow={completadas.length}
        >
          <div
            className="h-full rounded-full bg-violet-500"
            style={{ width: `${(completadas.length / LECCIONES_GUITARRA.length) * 100}%` }}
          />
        </div>
      </div>
      <nav className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="Lecciones de guitarra">
        {LECCIONES_GUITARRA.map((leccion, indice) => {
          const bloqueada = indice > disponible;
          return (
            <button
              key={leccion.id}
              onClick={() => {
                setSeleccionada(indice);
              }}
              disabled={bloqueada}
              className={`min-h-12 rounded-lg px-3 py-2 text-left text-sm ${
                indice === seleccionada
                    ? 'bg-violet-700 text-white'
                    : completadas.includes(indice)
                      ? 'bg-emerald-950 text-emerald-200'
                    : 'bg-slate-900 text-slate-500'
              } disabled:cursor-not-allowed`}
              aria-label={`${leccion.titulo}${bloqueada ? ', bloqueada' : completadas.includes(indice) ? ', completada' : ', disponible'}`}
            >
              {leccion.titulo}
              {completadas.includes(indice) ? ' ✓' : bloqueada ? ' · bloqueada' : ''}
            </button>
          );
        })}
      </nav>

      <section
        id={`leccion-${leccionActual.id}`}
        className="mt-4 scroll-mt-4 rounded-2xl bg-slate-900 p-5"
        aria-labelledby="leccion-actual"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-300">
          Lección {seleccionada + 1} de {LECCIONES_GUITARRA.length}
        </p>
        <h2 id="leccion-actual" className="mt-1 text-2xl font-bold">
          {leccionActual.titulo}
        </h2>
        <p className="mt-2 text-sm text-slate-300">{leccionActual.objetivo}</p>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-slate-200">
          {leccionActual.pasos.map((paso) => (
            <li key={paso}>{paso}</li>
          ))}
        </ol>

        {leccionActual.id === 'postura-cuerdas' && (
          <div className="mt-5 space-y-2">
            <h3 className="font-semibold">Escuchá las cuerdas al aire</h3>
            {CUERDAS_GUITARRA.map((cuerda) => (
              <div
                key={cuerda.numero}
                className="flex items-center justify-between gap-3 rounded-lg bg-slate-950 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {cuerda.numero}.ª · {cuerda.nombre}
                  </p>
                  <p className="text-xs text-slate-400">{cuerda.instruccion}</p>
                </div>
                <button
                  onClick={() => void escucharCuerda(cuerda.midi)}
                  className="min-h-10 shrink-0 rounded-lg bg-slate-800 px-3 text-sm hover:bg-slate-700"
                  aria-label={`Escuchar referencia de ${cuerda.numero}.ª cuerda, ${cuerda.nombre}`}
                >
                  {notaSonando === cuerda.midi ? 'Sonando…' : 'Escuchar'}
                </button>
              </div>
            ))}
          </div>
        )}

        {leccionActual.id === 'afinacion' && (
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CUERDAS_GUITARRA.map((cuerda) => (
              <button
                key={cuerda.numero}
                onClick={() => void escucharCuerda(cuerda.midi)}
                className="min-h-12 rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700"
              >
                {cuerda.numero}.ª {cuerda.nombre} · Escuchar
              </button>
            ))}
          </div>
        )}

        {['mi-menor', 'la-menor-do', 'cambios', 'rasgueo'].includes(
          leccionActual.id,
        ) && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {ACORDES_GUITARRA.filter((acorde) => {
              if (leccionActual.id === 'mi-menor') return acorde.id === 'mi-menor';
              if (leccionActual.id === 'rasgueo') {
                return acorde.id === 'mi-menor' || acorde.id === 'la-menor';
              }
              return true;
            }).map((acorde) => (
              <article key={acorde.id} className="rounded-xl bg-slate-950 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">{acorde.nombre}</h3>
                  <button
                    onClick={() => void escucharAcorde(acorde.id, acorde.midi)}
                    className="min-h-10 rounded-lg bg-slate-800 px-3 text-sm hover:bg-slate-700"
                  >
                    Escuchar acorde
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <DiagramaAcorde nombre={acorde.nombre} cuerdas={acorde.cuerdas} />
                  <p className="text-xs text-slate-400">
                    Vista de frente: cuerda 6 a la izquierda, cuerda 1 a la
                    derecha. O = al aire; × = no tocar; punto = presionar ese
                    traste. Números inferiores: cuerdas.
                  </p>
                </div>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-300">
                  {acorde.indicaciones.map((indicacion) => (
                    <li key={indicacion}>{indicacion}</li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        )}

        {leccionActual.id === 'cambios' && <PracticaCambiosAcorde />}

        <div className="mt-5 rounded-lg border border-slate-700 p-4">
          <p className="font-semibold">Tu turno</p>
          <p className="mt-1 text-sm text-slate-300">
            Practicá los pasos de esta lección. Cuando quieras seguir, marcala
            como completada; podés volver a las anteriores en cualquier momento.
          </p>
          {completadas.includes(seleccionada) ? (
            <p className="mt-3 text-sm text-emerald-300" role="status">
              Esta lección ya está completada. Podés repasarla o continuar con la siguiente.
            </p>
          ) : (
            <button
              onClick={completarLeccion}
              className="mt-3 min-h-11 w-full rounded-lg bg-emerald-700 px-4 py-2 font-semibold hover:bg-emerald-600"
            >
              Marcar lección como completada
            </button>
          )}
        </div>
      </section>

      {aviso && (
        <p className="mt-3 rounded-lg bg-slate-800 p-3 text-sm text-slate-200" role="status">
          {aviso}
        </p>
      )}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          onClick={alAbrirModulo}
          className="min-h-11 flex-1 rounded-lg bg-violet-700 px-4 py-2 font-semibold hover:bg-violet-600"
        >
          Abrir herramientas de Guitarra
        </button>
        {completadas.length > 0 && (
          <button
            onClick={reiniciar}
            className="min-h-11 rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
          >
            Reiniciar ruta
          </button>
        )}
      </div>
    </main>
  );
}
