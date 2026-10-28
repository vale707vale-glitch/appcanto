import { useCallback, useEffect, useRef, useState } from 'react';
import { reanudarContextoAudio } from '../audio/contexto';
import {
  ACORDES_GUITARRA,
  PAREJAS_CAMBIOS_ACORDE,
  secuenciaDeAcordes,
} from '../data/leccionesGuitarra';
import DiagramaAcorde from './DiagramaAcorde';

const COMPASES = 8;
const PULSOS_POR_COMPAS = 4;

export default function PracticaCambiosAcorde() {
  const [parejaId, setParejaId] = useState(PAREJAS_CAMBIOS_ACORDE[0].id);
  const [tempo, setTempo] = useState(60);
  const [activo, setActivo] = useState(false);
  const [completada, setCompletada] = useState(false);
  const [autoevaluacion, setAutoevaluacion] = useState('');
  const [errorAudio, setErrorAudio] = useState('');
  const [compas, setCompas] = useState(1);
  const [pulso, setPulso] = useState(1);
  const posicionRef = useRef({ compas: 1, pulso: 1 });
  const contextoRef = useRef<AudioContext | null>(null);

  const pareja =
    PAREJAS_CAMBIOS_ACORDE.find((item) => item.id === parejaId) ??
    PAREJAS_CAMBIOS_ACORDE[0];
  const secuencia = secuenciaDeAcordes(
    pareja.primero,
    pareja.segundo,
    COMPASES,
  );
  const acordeActual = ACORDES_GUITARRA.find(
    (acorde) => acorde.id === secuencia[compas - 1],
  );
  const acordeSiguiente =
    compas < COMPASES
      ? ACORDES_GUITARRA.find((acorde) => acorde.id === secuencia[compas])
      : null;

  const emitirPulso = useCallback((acento: boolean) => {
    const contexto = contextoRef.current;
    if (!contexto || contexto.state !== 'running') return;
    const oscilador = contexto.createOscillator();
    const volumen = contexto.createGain();
    const inicio = contexto.currentTime;
    oscilador.type = 'sine';
    oscilador.frequency.value = acento ? 1100 : 760;
    volumen.gain.setValueAtTime(0.0001, inicio);
    volumen.gain.exponentialRampToValueAtTime(acento ? 0.16 : 0.1, inicio + 0.005);
    volumen.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.055);
    oscilador.connect(volumen).connect(contexto.destination);
    oscilador.start(inicio);
    oscilador.stop(inicio + 0.06);
    oscilador.onended = () => {
      oscilador.disconnect();
      volumen.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!activo) return;
    const intervalo = window.setInterval(() => {
      const actual = posicionRef.current;
      if (actual.pulso < PULSOS_POR_COMPAS) {
        const siguiente = { ...actual, pulso: actual.pulso + 1 };
        posicionRef.current = siguiente;
        setPulso(siguiente.pulso);
        emitirPulso(false);
        return;
      }
      if (actual.compas === COMPASES) {
        setActivo(false);
        setCompletada(true);
        return;
      }
      const siguiente = { compas: actual.compas + 1, pulso: 1 };
      posicionRef.current = siguiente;
      setCompas(siguiente.compas);
      setPulso(siguiente.pulso);
      emitirPulso(true);
    }, 60_000 / tempo);
    return () => window.clearInterval(intervalo);
  }, [activo, tempo, emitirPulso]);

  const empezar = async () => {
    try {
      contextoRef.current = await reanudarContextoAudio();
    } catch {
      setErrorAudio('No se pudo iniciar el audio del pulso. Revisá la salida de sonido del navegador.');
      return;
    }
    setErrorAudio('');
    posicionRef.current = { compas: 1, pulso: 1 };
    setCompas(1);
    setPulso(1);
    setCompletada(false);
    setAutoevaluacion('');
    emitirPulso(true);
    setActivo(true);
  };

  const continuar = async () => {
    try {
      contextoRef.current = await reanudarContextoAudio();
    } catch {
      setErrorAudio('No se pudo reanudar el audio del pulso. Revisá la salida de sonido del navegador.');
      return;
    }
    setErrorAudio('');
    emitirPulso(pulso === 1);
    setActivo(true);
  };

  const reiniciar = () => {
    setActivo(false);
    posicionRef.current = { compas: 1, pulso: 1 };
    setCompas(1);
    setPulso(1);
    setCompletada(false);
    setAutoevaluacion('');
  };

  const cambiarPareja = (id: string) => {
    setParejaId(id);
    reiniciar();
  };

  if (!acordeActual) {
    throw new Error(`No se encontró el acorde ${secuencia[compas - 1]}.`);
  }

  return (
    <section className="mt-5 rounded-xl border border-violet-900 bg-violet-950/20 p-4">
      <h3 className="text-lg font-bold text-white">Práctica guiada de cambios</h3>
      <p className="mt-1 text-sm text-slate-300">
        Cambiá de acorde cada cuatro pulsos. La app marca el tiempo, pero no usa
        el micrófono ni califica cómo tocás.
      </p>

      <label className="mt-4 block text-sm text-slate-300">
        Acordes para practicar
        <select
          value={parejaId}
          disabled={activo}
          onChange={(evento) => cambiarPareja(evento.target.value)}
          className="mt-1 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-white disabled:opacity-60"
        >
          {PAREJAS_CAMBIOS_ACORDE.map((item) => (
            <option key={item.id} value={item.id}>{item.nombre}</option>
          ))}
        </select>
      </label>

      <label className="mt-4 block text-sm text-slate-300">
        Velocidad: {tempo} pulsos por minuto
        <input
          type="range"
          min={40}
          max={100}
          step={5}
          value={tempo}
          onChange={(evento) => setTempo(Number(evento.target.value))}
          className="mt-2 w-full accent-violet-500"
          aria-label="Velocidad del pulso"
        />
        <span className="flex justify-between text-xs text-slate-500">
          <span>Lento</span><span>Rápido</span>
        </span>
      </label>

      <div className="mt-4 rounded-xl bg-slate-950 p-4">
        {completada ? (
          <>
            <p className="text-center text-xl font-bold text-emerald-300">
              ¡Terminaste los {COMPASES} compases!
            </p>
            <p className="mt-2 text-center text-sm text-slate-300">
              ¿Cómo te fue con los cambios?
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                onClick={() => setAutoevaluacion('¡Bien! Podés probar otra vuelta o subir un poco el tempo.')}
                className="min-h-11 rounded-lg bg-emerald-900 px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-800"
              >
                Pude cambiar sin frenar
              </button>
              <button
                onClick={() => {
                  setAutoevaluacion('Está bien ir más lento. Bajamos el tempo para la próxima vuelta.');
                  setTempo((actual) => Math.max(40, actual - 10));
                }}
                className="min-h-11 rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
              >
                Necesito practicar más lento
              </button>
            </div>
            {autoevaluacion && (
              <p className="mt-3 text-center text-sm text-violet-200" role="status">
                {autoevaluacion}
              </p>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>Compás {compas} de {COMPASES}</span>
              <span>Pulso {pulso} de {PULSOS_POR_COMPAS}</span>
            </div>
            <div className="mt-3 flex justify-center gap-3" aria-label={`Pulso ${pulso} de cuatro`}>
              {Array.from({ length: PULSOS_POR_COMPAS }, (_, indice) => (
                <span
                  key={indice}
                  className={`h-4 w-4 rounded-full ${
                    pulso === indice + 1 ? 'scale-125 bg-violet-300' : 'bg-slate-700'
                  }`}
                  aria-hidden="true"
                />
              ))}
            </div>
            <div className="mt-4 text-center">
              <p className="sr-only" role="status" aria-live="polite">
                Compás {compas} de {COMPASES}. Acorde actual: {acordeActual.nombre}.
              </p>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {activo
                  ? 'Tocá este acorde'
                  : compas === 1 && pulso === 1
                    ? 'Acorde para empezar'
                    : 'Práctica en pausa'}
              </p>
              <p className="mt-1 text-3xl font-black text-white">
                {acordeActual.nombre}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {acordeSiguiente
                  ? `Prepará el cambio a ${acordeSiguiente.nombre} en el próximo compás.`
                  : 'Último compás: mantené el pulso hasta terminar.'}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
              <DiagramaAcorde
                nombre={acordeActual.nombre}
                cuerdas={acordeActual.cuerdas}
              />
              <p className="max-w-xs text-xs text-slate-400">
                Cuerdas 6 a 1: {acordeActual.dedos.join(' · ')}. En el compás
                resaltado, rasgueá suave una vez por pulso y prepará el cambio.
              </p>
            </div>
          </>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        {!completada && (
          <>
            {!activo && compas === 1 && pulso === 1 ? (
              <button
                onClick={() => void empezar()}
                className="min-h-11 flex-1 rounded-lg bg-violet-700 px-4 py-2 font-semibold hover:bg-violet-600"
              >
                Empezar práctica
              </button>
            ) : activo ? (
              <button
                onClick={() => setActivo(false)}
                className="min-h-11 flex-1 rounded-lg bg-slate-800 px-4 py-2 font-semibold hover:bg-slate-700"
              >
                Pausar
              </button>
            ) : (
              <button
                onClick={() => void continuar()}
                className="min-h-11 flex-1 rounded-lg bg-violet-700 px-4 py-2 font-semibold hover:bg-violet-600"
              >
                Continuar
              </button>
            )}
            {!activo && (
              <button
                onClick={reiniciar}
                className="min-h-11 rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
              >
                Reiniciar
              </button>
            )}
          </>
        )}
        {completada && (
          <button
            onClick={() => void empezar()}
            className="min-h-11 flex-1 rounded-lg bg-violet-700 px-4 py-2 font-semibold hover:bg-violet-600"
          >
            Repetir práctica
          </button>
        )}
      </div>
      {errorAudio && (
        <p className="mt-3 rounded-lg bg-red-950 p-3 text-sm text-red-200" role="alert">
          {errorAudio}
        </p>
      )}
      <p className="mt-3 text-xs text-slate-500">
        El pulso es una guía, no una evaluación. Si no llegás al cambio,
        bajá el tempo o pausá; no hace falta apurar los dedos.
      </p>
    </section>
  );
}
