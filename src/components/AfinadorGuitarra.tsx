import { useEffect, useState } from 'react';
import { centsDesviacion, freqANotaMasCercana, midiToFreq, midiToNombre } from '../audio/notas';
import { clasificarDesviacionCuerda } from '../audio/afinadorGuitarra';
import { ensureAudioContext, tocarNota } from '../audio/tono';
import { useMicrofono } from '../audio/useMicrofono';
import { CUERDAS_GUITARRA } from '../data/leccionesGuitarra';

const TEXTOS: Record<
  ReturnType<typeof clasificarDesviacionCuerda>,
  { mensaje: string; color: string }
> = {
  'en-tono': { mensaje: 'En tono', color: 'text-emerald-400' },
  'un-poco-baja': { mensaje: 'Un poco baja: tensá apenas', color: 'text-yellow-300' },
  'un-poco-alta': { mensaje: 'Un poco alta: aflojá apenas', color: 'text-yellow-300' },
  baja: { mensaje: 'Baja: tensá de a poco', color: 'text-red-400' },
  alta: { mensaje: 'Alta: aflojá de a poco', color: 'text-red-400' },
  'octava-baja': {
    mensaje: 'La señal parece una octava más grave; revisá la cuerda y volvé a pulsarla.',
    color: 'text-yellow-300',
  },
  'octava-alta': {
    mensaje: 'La señal parece una octava más aguda; podría ser un armónico.',
    color: 'text-yellow-300',
  },
};

export default function AfinadorGuitarra({
  alVolver,
}: {
  alVolver: () => void;
}) {
  const { estado, mensajeError, motorRef, iniciar, detener } = useMicrofono();
  const [cuerdaNumero, setCuerdaNumero] = useState(6);
  const [frecuencia, setFrecuencia] = useState<number | null>(null);
  const [nivel, setNivel] = useState(0);
  const cuerda = CUERDAS_GUITARRA.find((item) => item.numero === cuerdaNumero);
  if (!cuerda) {
    throw new Error(`No existe la cuerda ${cuerdaNumero} en la afinación estándar.`);
  }
  const frecuenciaVisible = estado === 'activo' ? frecuencia : null;
  const nivelVisible = estado === 'activo' ? nivel : 0;
  const cents = frecuenciaVisible === null
    ? null
    : Math.round(centsDesviacion(frecuenciaVisible, cuerda.midi));
  const notaDetectada = frecuenciaVisible === null
    ? null
    : freqANotaMasCercana(frecuenciaVisible);
  const clasificacion = cents === null ? null : clasificarDesviacionCuerda(cents);
  const estadoVisual = clasificacion ? TEXTOS[clasificacion] : null;
  const aguja = cents === null ? 0 : Math.max(-50, Math.min(50, cents));
  const afinada = clasificacion === 'en-tono';

  useEffect(() => {
    if (estado !== 'activo') return;
    const id = window.setInterval(() => {
      const frame = motorRef.current.frame;
      setFrecuencia(frame.freqHz);
      setNivel(Math.min(1, frame.nivel * 8));
    }, 100);
    return () => window.clearInterval(id);
  }, [estado, motorRef, cuerdaNumero]);

  const escucharReferencia = () => {
    ensureAudioContext();
    void tocarNota(cuerda.midi, 1.2);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl px-4 py-6 text-white">
      <button
        onClick={() => {
          detener();
          alVolver();
        }}
        className="mb-4 inline-flex min-h-10 items-center px-2 text-sm text-slate-400 hover:text-white"
      >
        {'< Volver'}
      </button>
      <h1 className="text-2xl font-black">Afinador de guitarra</h1>
      <p className="mt-2 text-sm text-slate-300">
        Elegí una cuerda, activá el micrófono y pulsá solo esa cuerda al aire.
        Afinación estándar: Mi - La - Re - Sol - Si - Mi.
      </p>
      <p className="mt-2 rounded-lg bg-slate-900 p-3 text-xs text-slate-400">
        Si la nota está baja, tensá la clavija muy poco; si está alta, aflojala
        muy poco. Volvé a pulsar la cuerda después de cada ajuste. No fuerces una
        clavija que se resista.
      </p>

      <section className="mt-4 rounded-xl bg-slate-900 p-4" aria-label="Elegir cuerda">
        <h2 className="font-semibold">¿Qué cuerda vas a afinar?</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {CUERDAS_GUITARRA.map((item) => (
            <button
              key={item.numero}
              onClick={() => setCuerdaNumero(item.numero)}
              aria-pressed={cuerdaNumero === item.numero}
              className={`min-h-12 rounded-lg px-2 py-2 text-sm font-semibold ${
                cuerdaNumero === item.numero
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {item.numero}.ª · {item.nombre}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-2xl bg-slate-900 p-5 text-center">
        <p className="text-sm text-slate-400">
          Objetivo: {cuerda.numero}.ª cuerda · {cuerda.nombre}
        </p>
        <p className="mt-1 text-4xl font-black text-white">
          {midiToNombre(cuerda.midi)}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {midiToFreq(cuerda.midi).toFixed(1)} Hz
        </p>
        <button
          onClick={escucharReferencia}
          className="mt-3 min-h-10 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold hover:bg-slate-700"
        >
          Escuchar referencia
        </button>

        {estado !== 'activo' ? (
          <button
            onClick={() => void iniciar()}
            disabled={estado === 'pidiendo'}
            className="mt-4 min-h-12 w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold hover:bg-violet-500 disabled:opacity-50"
          >
            {estado === 'pidiendo'
              ? 'Pidiendo micrófono…'
              : 'Activar micrófono'}
          </button>
        ) : (
          <>
            <div className="mt-6">
              <p className="text-xs text-slate-500">Nota detectada</p>
              <p className={`mt-1 text-3xl font-bold ${notaDetectada ? 'text-white' : 'text-slate-500'}`}>
                {notaDetectada?.nombre ?? 'Esperando la cuerda…'}
              </p>
              {estadoVisual && (
                <p className={`mt-2 text-lg font-bold ${estadoVisual.color}`} aria-live="polite">
                  {estadoVisual.mensaje}
                </p>
              )}
              {cents !== null && clasificacion !== 'octava-alta' && clasificacion !== 'octava-baja' && (
                <p className="mt-1 text-sm text-slate-400">
                  Desvío: {cents > 0 ? '+' : ''}{cents} cents
                </p>
              )}
            </div>

            <div
              className="relative mx-auto mt-5 h-4 max-w-sm overflow-hidden rounded-full bg-slate-700"
              role="meter"
              aria-label={`Desvío de afinación respecto de ${midiToNombre(cuerda.midi)}`}
              aria-valuemin={-50}
              aria-valuemax={50}
              aria-valuenow={aguja}
            >
              <div className="absolute left-1/2 top-0 h-full w-0.5 bg-white" />
              {cents !== null && (
                <div
                  className={`absolute top-0 h-full w-2 rounded-full ${
                    afinada ? 'bg-emerald-400' : 'bg-yellow-300'
                  }`}
                  style={{ left: `calc(${50 + aguja}% - 4px)` }}
                />
              )}
            </div>
            <div className="mt-1 flex justify-between text-xs text-slate-500">
              <span>Baja</span>
              <span>En tono</span>
              <span>Alta</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-left">
              <span className="text-xs text-slate-500">Entrada</span>
              <div
                className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800"
                role="meter"
                aria-label="Nivel de entrada del micrófono"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(nivelVisible * 100)}
              >
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${Math.round(nivelVisible * 100)}%` }}
                />
              </div>
              <span className="text-xs text-slate-400">
                {nivelVisible > 0.08 ? 'Señal' : 'Pulsá la cuerda'}
              </span>
            </div>
            <button
              onClick={detener}
              className="mt-4 min-h-11 w-full rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
            >
              Apagar micrófono
            </button>
          </>
        )}
      </section>
      {mensajeError && (
        <p className="mt-3 rounded-lg bg-red-950 p-3 text-sm text-red-200" role="alert">
          {mensajeError}
        </p>
      )}
      <p className="mt-4 text-xs text-slate-500">
        Afiná una cuerda por vez y en un lugar tranquilo. Auriculares ayudan a
        escuchar la referencia sin que vuelva al micrófono. Esta primera versión
        necesita probarse con tu instrumento y micrófono reales.
      </p>
    </main>
  );
}
