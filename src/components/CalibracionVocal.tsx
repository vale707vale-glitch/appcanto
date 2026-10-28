import { useEffect, useRef, useState } from 'react';
import { freqANotaMasCercana, midiToNombre } from '../audio/notas';
import { ensureAudioContext, tocarNota } from '../audio/tono';
import { useMicrofono } from '../audio/useMicrofono';
import { CANCIONES } from '../data/canciones';
import { EJERCICIOS } from '../data/ejercicios';
import {
  detectarNotaEstable,
  sugerirTransposicionVocal,
} from '../musica/rangoVocal';
import {
  cargarRangoVocal,
  guardarRangoVocal,
  guardarTransposicionVocal,
  obtenerErrorPersistencia,
  type RangoVocal,
} from '../storage/progreso';

type Extremo = 'graveMidi' | 'agudaMidi';

const DURACION_CAPTURA_MS = 2500;
const INTERVALO_CAPTURA_MS = 50;
const DURACION_CUENTA_MS = 500;
const PASOS_CUENTA = 3;

export default function CalibracionVocal({
  alVolver,
  alGuardar,
}: {
  alVolver: () => void;
  alGuardar: () => void;
}) {
  const rangoGuardado = cargarRangoVocal();
  const [graveMidi, setGraveMidi] = useState<number | null>(
    rangoGuardado?.graveMidi ?? null,
  );
  const [agudaMidi, setAgudaMidi] = useState<number | null>(
    rangoGuardado?.agudaMidi ?? null,
  );
  const [capturando, setCapturando] = useState<Extremo | null>(null);
  const [preparando, setPreparando] = useState<Extremo | null>(null);
  const [cuenta, setCuenta] = useState(0);
  const [notaEnVivo, setNotaEnVivo] = useState<number | null>(null);
  const [referencia, setReferencia] = useState<Extremo | null>(null);
  const [nivel, setNivel] = useState(0);
  const [mensaje, setMensaje] = useState('');
  const muestrasRef = useRef<{ freqHz: number | null; claridad: number }[]>([]);
  const intervaloRef = useRef<number | null>(null);
  const preparacionRef = useRef<number | null>(null);
  const referenciaTimeoutRef = useRef<number | null>(null);
  const inicioCapturaRef = useRef(0);
  const { estado, mensajeError, motorRef, iniciar, detener } = useMicrofono();

  useEffect(() => {
    if (estado !== 'activo') return;
    const id = window.setInterval(() => {
      const frame = motorRef.current.frame;
      setNivel(frame.nivel);
      setNotaEnVivo(
        frame.freqHz !== null && frame.clarity >= 0.6
          ? freqANotaMasCercana(frame.freqHz).midi
          : null,
      );
    }, 100);
    return () => window.clearInterval(id);
  }, [estado, motorRef]);

  useEffect(
    () => () => {
      if (intervaloRef.current !== null) {
        window.clearInterval(intervaloRef.current);
      }
      if (preparacionRef.current !== null) {
        window.clearInterval(preparacionRef.current);
      }
      if (referenciaTimeoutRef.current !== null) {
        window.clearTimeout(referenciaTimeoutRef.current);
      }
    },
    [],
  );

  const iniciarCaptura = (extremo: Extremo) => {
    setMensaje('');
    setCapturando(extremo);
    muestrasRef.current = [];
    inicioCapturaRef.current = performance.now();
    intervaloRef.current = window.setInterval(() => {
      const frame = motorRef.current.frame;
      muestrasRef.current.push({
        freqHz: frame.freqHz,
        claridad: frame.clarity,
      });
      if (performance.now() - inicioCapturaRef.current < DURACION_CAPTURA_MS) {
        return;
      }
      if (intervaloRef.current !== null) {
        window.clearInterval(intervaloRef.current);
        intervaloRef.current = null;
      }
      const nota = detectarNotaEstable(muestrasRef.current);
      setCapturando(null);
      if (nota === null) {
        setMensaje(
          'No pude reconocer una nota estable. Acercate al micrófono y sostené un "aaa" cómodo; también podés probar otra vez.',
        );
        return;
      }
      if (extremo === 'graveMidi') setGraveMidi(nota);
      else setAgudaMidi(nota);
      setMensaje(
        `Nota registrada: ${midiToNombre(nota)}. Si no se siente cómoda, repetí la prueba o corregila abajo.`,
      );
    }, INTERVALO_CAPTURA_MS);
  };

  const registrarExtremo = (extremo: Extremo) => {
    if (estado !== 'activo' || capturando !== null || preparando !== null) return;
    setMensaje('');
    setPreparando(extremo);
    let pasos = PASOS_CUENTA;
    setCuenta(pasos);
    preparacionRef.current = window.setInterval(() => {
      pasos -= 1;
      setCuenta(pasos);
      if (pasos > 0) return;
      if (preparacionRef.current !== null) {
        window.clearInterval(preparacionRef.current);
        preparacionRef.current = null;
      }
      setPreparando(null);
      iniciarCaptura(extremo);
    }, DURACION_CUENTA_MS);
  };

  const textoCaptura = (extremo: Extremo): string | null => {
    if (preparando === extremo) return `Preparate: ${cuenta}`;
    if (capturando === extremo) {
      return notaEnVivo !== null
        ? `Detectando ${midiToNombre(notaEnVivo)}. Sostené hasta que termine.`
        : 'Escuchando… cantá un "aaa" sostenido.';
    }
    return null;
  };

  const rangoValido =
    graveMidi !== null && agudaMidi !== null && graveMidi <= agudaMidi;

  const guardar = () => {
    if (!rangoValido || graveMidi === null || agudaMidi === null) {
      setMensaje(
        'Revisá los extremos: la nota más grave debe ser igual o más baja que la más aguda.',
      );
      return;
    }
    const rango: RangoVocal = { graveMidi, agudaMidi };
    const notasContenido = [
      ...EJERCICIOS.flatMap((ejercicio) => ejercicio.notas.map((nota) => nota.midi)),
      ...CANCIONES.flatMap((cancion) => cancion.notas.map((nota) => nota.midi)),
    ];
    const sugerencia = sugerirTransposicionVocal(
      notasContenido,
      rango.graveMidi,
      rango.agudaMidi,
    );
    try {
      guardarRangoVocal(rango);
      guardarTransposicionVocal(sugerencia);
      const errorPreferencia = obtenerErrorPersistencia();
      if (errorPreferencia) {
        setMensaje(
          `El rango se guardó, pero no se pudo guardar la sugerencia de altura: ${errorPreferencia}`,
        );
        return;
      }
      setMensaje(
        `Rango guardado. Para empezar, probaremos las prácticas ${sugerencia === -12 ? 'una octava más grave' : sugerencia === 12 ? 'una octava más aguda' : 'en su altura original'}. Podés cambiarlo cuando quieras.`,
      );
      alGuardar();
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar el rango vocal.',
      );
    }
  };

  const cambiarExtremo = (extremo: Extremo, midi: number) => {
    if (extremo === 'graveMidi') setGraveMidi(midi);
    else setAgudaMidi(midi);
    setMensaje('');
  };

  const escucharReferencia = (extremo: Extremo, midi: number) => {
    const audioCtx = ensureAudioContext();
    void tocarNota(midi, 1.2, audioCtx, 'triangle', 0.3);
    void tocarNota(midi + 12, 1.2, audioCtx, 'sine', 0.12);
    setReferencia(extremo);
    if (referenciaTimeoutRef.current !== null) {
      window.clearTimeout(referenciaTimeoutRef.current);
    }
    referenciaTimeoutRef.current = window.setTimeout(() => {
      setReferencia(null);
      referenciaTimeoutRef.current = null;
    }, 1300);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl px-4 py-6 text-white">
      <button
        onClick={alVolver}
        className="mb-4 inline-flex min-h-9 items-center px-2 text-sm text-slate-400 hover:text-white"
      >
        {'< Volver'}
      </button>
      <h1 className="text-2xl font-black">Encontrá tu zona cómoda</h1>
      <p className="mt-2 text-sm text-slate-300">
        Esta prueba es orientativa: no diagnostica tu voz. Cantá suave y sin
        forzar; si algo molesta, frená. Solo guardaremos las notas que vos
        confirmes como cómodas.
      </p>

      <section className="mt-5 rounded-xl bg-slate-900 p-4">
        <h2 className="font-semibold">Cómo hacer la prueba</h2>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-slate-300">
          <li>Usá un lugar tranquilo y mantenete cerca del micrófono.</li>
          <li>
            Sostené un "aaa" suave en la nota más grave que te resulte cómoda.
            No intentes llegar a un límite.
          </li>
          <li>Repetí con una nota aguda cómoda, sin apretar la garganta.</li>
          <li>
            Al tocar <strong>Registrar</strong> tenés 3 segundos para empezar a
            cantar; mientras escucha, ves la nota detectada en vivo.
          </li>
          <li>
            Escuchá el resultado, corregilo si hace falta y guardalo solo si te
            representa.
          </li>
        </ol>
        <p className="mt-3 text-xs text-slate-400">
          La app no guarda audio: analiza la altura detectada mientras usás el
          micrófono.
        </p>
      </section>

      <section className="mt-4 rounded-xl bg-slate-900 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Micrófono</h2>
            <p className="mt-1 text-xs text-slate-400">
              {estado === 'activo'
                ? `Nivel de entrada: ${Math.round(nivel * 100)}%`
                : estado === 'denegado'
                  ? 'Permiso denegado'
                  : estado === 'error'
                    ? 'No disponible'
                    : 'Se activa solo al tocar el botón.'}
            </p>
          </div>
          <button
            onClick={() => {
              if (estado === 'activo' || estado === 'pidiendo') detener();
              else void iniciar();
            }}
            disabled={
              estado === 'pidiendo' ||
              capturando !== null ||
              preparando !== null
            }
            className="min-h-11 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500 disabled:opacity-50"
          >
            {estado === 'activo'
              ? 'Apagar micrófono'
              : estado === 'pidiendo'
                ? 'Activando…'
                : 'Activar micrófono'}
          </button>
        </div>
        {mensajeError && (
          <p className="mt-3 rounded-lg bg-red-950 p-3 text-sm text-red-200" role="alert">
            {mensajeError}
          </p>
        )}
      </section>

      <section className="mt-4 space-y-3">
        <div className="rounded-xl bg-slate-900 p-4">
          <h2 className="font-semibold">Nota más grave cómoda</h2>
          <p className="mt-1 text-2xl font-black text-violet-200">
            {graveMidi === null ? 'Todavía no registrada' : midiToNombre(graveMidi)}
          </p>
          {graveMidi !== null && (
            <button
              onClick={() => escucharReferencia('graveMidi', graveMidi)}
              className="mt-2 min-h-10 rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
            >
              {referencia === 'graveMidi' ? 'Sonando…' : 'Escuchar referencia'}
            </button>
          )}
          <button
            onClick={() => registrarExtremo('graveMidi')}
            disabled={
              estado !== 'activo' || capturando !== null || preparando !== null
            }
            className="mt-3 min-h-11 w-full rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold hover:bg-slate-700 disabled:opacity-50"
          >
            {preparando === 'graveMidi'
              ? `Preparate… ${cuenta}`
              : capturando === 'graveMidi'
                ? 'Escuchando… sostené la nota'
                : 'Registrar nota grave cómoda'}
          </button>
          {textoCaptura('graveMidi') && (
            <p className="mt-2 text-sm text-violet-200" role="status">
              {textoCaptura('graveMidi')}
            </p>
          )}
          {graveMidi !== null && (
            <label className="mt-4 block text-xs text-slate-400">
              Corregir si hace falta: {midiToNombre(graveMidi)}
              <input
                type="range"
                min={40}
                max={agudaMidi ?? 87}
                value={graveMidi}
                onChange={(evento) =>
                  cambiarExtremo('graveMidi', Number(evento.target.value))
                }
                className="mt-2 w-full accent-violet-500"
                aria-label="Ajustar nota más grave cómoda"
              />
            </label>
          )}
        </div>

        <div className="rounded-xl bg-slate-900 p-4">
          <h2 className="font-semibold">Nota más aguda cómoda</h2>
          <p className="mt-1 text-2xl font-black text-violet-200">
            {agudaMidi === null ? 'Todavía no registrada' : midiToNombre(agudaMidi)}
          </p>
          {agudaMidi !== null && (
            <button
              onClick={() => escucharReferencia('agudaMidi', agudaMidi)}
              className="mt-2 min-h-10 rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
            >
              {referencia === 'agudaMidi' ? 'Sonando…' : 'Escuchar referencia'}
            </button>
          )}
          <button
            onClick={() => registrarExtremo('agudaMidi')}
            disabled={
              estado !== 'activo' || capturando !== null || preparando !== null
            }
            className="mt-3 min-h-11 w-full rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold hover:bg-slate-700 disabled:opacity-50"
          >
            {preparando === 'agudaMidi'
              ? `Preparate… ${cuenta}`
              : capturando === 'agudaMidi'
                ? 'Escuchando… sostené la nota'
                : 'Registrar nota aguda cómoda'}
          </button>
          {textoCaptura('agudaMidi') && (
            <p className="mt-2 text-sm text-violet-200" role="status">
              {textoCaptura('agudaMidi')}
            </p>
          )}
          {agudaMidi !== null && (
            <label className="mt-4 block text-xs text-slate-400">
              Corregir si hace falta: {midiToNombre(agudaMidi)}
              <input
                type="range"
                min={graveMidi ?? 39}
                max={87}
                value={agudaMidi}
                onChange={(evento) =>
                  cambiarExtremo('agudaMidi', Number(evento.target.value))
                }
                className="mt-2 w-full accent-violet-500"
                aria-label="Ajustar nota más aguda cómoda"
              />
            </label>
          )}
        </div>
      </section>

      {!rangoValido && graveMidi !== null && agudaMidi !== null && (
        <p className="mt-3 rounded-lg bg-yellow-950 p-3 text-sm text-yellow-200" role="alert">
          La nota más grave quedó por encima de la más aguda. Volvé a registrar o
          corregí los extremos.
        </p>
      )}

      {mensaje && (
        <p className="mt-3 rounded-lg bg-slate-800 p-3 text-sm text-slate-200" role="status">
          {mensaje}
        </p>
      )}

      <button
        onClick={guardar}
        disabled={!rangoValido || capturando !== null || preparando !== null}
        className="mt-4 min-h-12 w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
      >
        Guardar y usar como sugerencia
      </button>
      {rangoValido && graveMidi !== null && agudaMidi !== null && (
        <p className="mt-2 text-center text-sm text-slate-400">
          Rango elegido: {midiToNombre(graveMidi)} a {midiToNombre(agudaMidi)}
        </p>
      )}
      <button
        onClick={() => {
          detener();
          alVolver();
        }}
        className="mt-3 min-h-11 w-full rounded-xl bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
      >
        Cancelar
      </button>
    </main>
  );
}
