import { useEffect, useRef, useState } from 'react';
import { tocarAcorde, tocarMelodia, type Reproduccion } from '../audio/tono';
import {
  GLOSARIO_APP,
  GLOSARIO_MUSICA,
  LECCIONES_MUSICA,
  type EjemploAudioLeccion,
  type PracticaLeccion,
  type TerminoGlosario,
} from '../data/leccionesMusica';

function ListaGlosario({
  titulo,
  terminos,
}: {
  titulo: string;
  terminos: TerminoGlosario[];
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-violet-300">
        {titulo}
      </h3>
      <dl className="mt-2 space-y-2">
        {terminos.map((termino) => (
          <div key={termino.termino}>
            <dt className="text-sm font-semibold text-white">
              {termino.termino}
            </dt>
            <dd className="text-xs leading-5 text-slate-400">
              {termino.definicion}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function AprenderMusica({
  alVolver,
  alAbrirEjercicio,
  alAbrirCancion,
  alCalibrarRango,
}: {
  alVolver: () => void;
  alAbrirEjercicio: (id: string) => void;
  alAbrirCancion: (id: string) => void;
  alCalibrarRango: () => void;
}) {
  const [abierta, setAbierta] = useState<string | null>(
    LECCIONES_MUSICA[0]?.id ?? null,
  );
  const [sonando, setSonando] = useState<string | null>(null);
  const [errorAudio, setErrorAudio] = useState('');
  const reproduccionRef = useRef<Reproduccion | null>(null);

  useEffect(() => () => reproduccionRef.current?.detener(), []);

  const escuchar = async (ejemplo: EjemploAudioLeccion, clave: string) => {
    reproduccionRef.current?.detener();
    reproduccionRef.current = null;
    setErrorAudio('');
    setSonando(clave);

    let reproduccion: Reproduccion | null = null;
    try {
      reproduccion =
        ejemplo.tipo === 'acorde'
          ? tocarAcorde(ejemplo.notas, 1.2)
          : tocarMelodia(
              ejemplo.notas.map((midi, indice) => ({
                midi,
                segundos:
                  ejemplo.duraciones?.[indice] ?? ejemplo.segundos ?? 0.45,
              })),
            );
      reproduccionRef.current = reproduccion;
      await reproduccion.fin;
    } catch {
      setErrorAudio(
        'No se pudo reproducir el ejemplo. Revisá el volumen y volvé a probar.',
      );
    } finally {
      if (reproduccionRef.current === reproduccion) {
        reproduccionRef.current = null;
        setSonando(null);
      }
    }
  };

  const alternarLeccion = (id: string) => {
    reproduccionRef.current?.detener();
    reproduccionRef.current = null;
    setSonando(null);
    setAbierta((actual) => (actual === id ? null : id));
  };

  const practicar = (practica: PracticaLeccion) => {
    if (practica.tipo === 'ejercicio') {
      alAbrirEjercicio(practica.id);
    } else if (practica.tipo === 'cancion') {
      alAbrirCancion(practica.id);
    } else {
      alCalibrarRango();
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <button
        onClick={alVolver}
        className="mb-4 text-sm text-slate-400 hover:text-white"
      >
        {'< Volver'}
      </button>

      <h1 className="text-3xl font-black text-white">Lecciones de música</h1>
      <p className="mt-1 text-sm text-slate-400">
        Para entender lo que hacés en la app, sin dar nada por sabido.
      </p>

      <div className="mt-4 rounded-xl border border-violet-800 bg-violet-950/50 p-4 text-sm text-violet-100">
        <p className="font-semibold text-white">
          No necesitás saber leer música.
        </p>
        <p className="mt-1">
          Cada lección dura un par de minutos. Escuchá los ejemplos y, si
          querés, practicá con el botón del final. Podés volver cuando quieras.
        </p>
      </div>

      {errorAudio && (
        <p role="alert" className="mt-3 rounded-lg bg-red-950 p-3 text-sm text-red-200">
          {errorAudio}
        </p>
      )}

      <div className="mt-4 space-y-2">
        {LECCIONES_MUSICA.map((leccion, indice) => {
          const estaAbierta = abierta === leccion.id;
          const idPanel = `leccion-${leccion.id}`;
          return (
            <section
              key={leccion.id}
              className="overflow-hidden rounded-xl bg-slate-900"
            >
              <h2>
                <button
                  onClick={() => alternarLeccion(leccion.id)}
                  aria-expanded={estaAbierta}
                  aria-controls={idPanel}
                  className="flex w-full items-start gap-3 p-4 text-left hover:bg-slate-800"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-900 text-sm font-bold text-violet-200">
                    {indice + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-white">
                      {leccion.titulo}
                    </span>
                    <span className="mt-0.5 block text-sm text-slate-400">
                      {leccion.resumen}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-lg text-slate-500"
                  >
                    {estaAbierta ? '-' : '+'}
                  </span>
                </button>
              </h2>

              <div
                id={idPanel}
                hidden={!estaAbierta}
                className="border-t border-slate-800 p-4"
              >
                  {leccion.parrafos.map((parrafo, posicion) => (
                    <p
                      key={posicion}
                      className="mt-3 text-sm leading-6 text-slate-300 first:mt-0"
                    >
                      {parrafo}
                    </p>
                  ))}

                  <div className="mt-4 rounded-lg border border-violet-900 bg-violet-950/50 p-3 text-sm text-violet-100">
                    <p className="text-xs font-semibold uppercase tracking-wide text-violet-300">
                      En una frase
                    </p>
                    <p className="mt-1">{leccion.clave}</p>
                  </div>

                  {leccion.ejemplos && leccion.ejemplos.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Escuchalo
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {leccion.ejemplos.map((ejemplo, posicion) => {
                          const clave = `${leccion.id}-${posicion}`;
                          return (
                            <button
                              key={clave}
                              onClick={() => void escuchar(ejemplo, clave)}
                              className="min-h-10 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                            >
                              {sonando === clave ? 'Sonando...' : ejemplo.etiqueta}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {leccion.practica && (
                    <button
                      onClick={() => practicar(leccion.practica!)}
                      className="mt-4 min-h-11 w-full rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-600"
                    >
                      {leccion.practica.etiqueta}
                    </button>
                  )}
              </div>
            </section>
          );
        })}
      </div>

      <details className="mt-4 rounded-xl bg-slate-900 p-4">
        <summary className="cursor-pointer font-semibold text-white">
          Glosario: palabras que vas a escuchar
        </summary>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <ListaGlosario titulo="Música" terminos={GLOSARIO_MUSICA} />
          <ListaGlosario titulo="En la app" terminos={GLOSARIO_APP} />
        </div>
      </details>
    </div>
  );
}
