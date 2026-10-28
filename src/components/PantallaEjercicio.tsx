// Pantalla de ejercicio: piano roll en tiempo real + puntuacion por nota.
// Flujo: intro -> (referencia audible -> ventana de canto -> ...) -> resultados.
// Pensada para principiantes: tolera cantar en otra octava y explica con palabras.

import { useEffect, useRef, useState } from 'react';
import { nombreNota, type Ejercicio } from '../data/ejercicios';
import { ensureAudioContext, tocarNota } from '../audio/tono';
import { useMicrofono } from '../audio/useMicrofono';
import { clasificarCents, type Afinacion } from '../audio/pitchDetector';
import {
  contarOctava,
  alcanzaCantoMinimo,
  puntuar,
  type ConteoOctava,
  type NotaResultado,
} from '../audio/puntuacion';
import { colorEnVivo, consejoDe } from './feedback';
import { dibujarPianoRoll } from './pianoRoll';
import AjusteAlturaVocal from './AjusteAlturaVocal';
import AyudaLeccion from './AyudaLeccion';
import { leccionParaEjercicio } from '../data/leccionesMusica';
import {
  cargarModoPrincipiante,
  cargarTransposicionVocal,
  cargarTolerancia,
  guardarSesion,
  guardarTransposicionVocal,
  guardarTolerancia,
  fechaHoraISO,
  hoyISO,
  type TransposicionVocal,
} from '../storage/progreso';
import { transponerNotas } from '../musica/transposicion';

type Fase = 'intro' | 'activa' | 'resultados';
type SubFase = 'escucha' | 'canta';

interface EnVivo {
  hayVoz: boolean;
  cents: number;
  nivel: number;
  clasificacion: Afinacion;
  octava: number;
  consejo: string;
  precisionParcial: number | null;
  tiempoVozMs: number;
}

const MAX_TRAMAS = 3600; // 60 s a 60 fps en modo a tu ritmo
const MAX_DIBUJO = 600;

const VIVO_INICIAL: EnVivo = {
  hayVoz: false,
  cents: 0,
  nivel: 0,
  clasificacion: 'silencio',
  octava: 0,
  consejo: 'Esperando tu voz...',
  precisionParcial: null,
  tiempoVozMs: 0,
};

function pausaCancellable(ms: number, cancelado: { current: boolean }): Promise<void> {
  return new Promise((res) => {
    const t0 = performance.now();
    const tick = () => {
      if (cancelado.current) return res();
      if (performance.now() - t0 >= ms) return res();
      window.setTimeout(tick, 50);
    };
    tick();
  });
}

function etiquetaExigencia(tolerancia: number): string {
  if (tolerancia >= 70) return 'Fácil';
  if (tolerancia >= 50) return 'Normal';
  return 'Exigente';
}

export default function PantallaEjercicio({
  ejercicio,
  alVolver,
}: {
  ejercicio: Ejercicio;
  alVolver: () => void;
}) {
  const [fase, setFase] = useState<Fase>('intro');
  const [subFase, setSubFase] = useState<SubFase>('escucha');
  const [idx, setIdx] = useState(0);
  const [tolerancia, setTolerancia] = useState(() =>
    cargarTolerancia(ejercicio.toleranciaDefecto),
  );
  const [transposicion, setTransposicion] = useState(cargarTransposicionVocal);
  const [principiante] = useState(cargarModoPrincipiante);
  const [modoLibre, setModoLibre] = useState(true);
  const [resultados, setResultados] = useState<NotaResultado[]>([]);
  const [enVivo, setEnVivo] = useState<EnVivo>(VIVO_INICIAL);
  const [ocupado, setOcupado] = useState(false);

  const { estado, mensajeError, motorRef, fijarObjetivo, iniciar, detener } =
    useMicrofono();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historialRef = useRef<(number | null)[]>([]);
  const octavaRef = useRef<ConteoOctava>({ arriba: 0, abajo: 0, voz: 0 });
  const idxRef = useRef(0);
  const canceladoRef = useRef(false);
  const rafRef = useRef(0);
  const toleranciaRef = useRef(tolerancia);
  const guardadoRef = useRef(false);
  const avanzarRef = useRef<(() => void) | null>(null);
  const tiempoVozRef = useRef(0);
  const ultimoFrameMsRef = useRef(0);
  const medirRef = useRef(false);

  const notasPractica = transponerNotas(ejercicio.notas, transposicion);
  const notaActual = notasPractica[idx];

  useEffect(() => {
    toleranciaRef.current = tolerancia;
  }, [tolerancia]);

  useEffect(() => {
    canceladoRef.current = false;
    return () => {
      canceladoRef.current = true;
      avanzarRef.current?.();
      avanzarRef.current = null;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const cambiarTolerancia = (v: number) => {
    setTolerancia(v);
    guardarTolerancia(v);
  };

  const cambiarTransposicion = (v: TransposicionVocal) => {
    setTransposicion(v);
    guardarTransposicionVocal(v);
  };

  const empezar = async () => {
    if (ocupado) return;
    setOcupado(true);
    guardadoRef.current = false;
    ensureAudioContext();
    await iniciar();
    if (!motorRef.current.analyser) {
      setOcupado(false);
      return;
    }
    setResultados([]);
    setIdx(0);
    idxRef.current = 0;
    setEnVivo(VIVO_INICIAL);
    tiempoVozRef.current = 0;
    ultimoFrameMsRef.current = performance.now();
    medirRef.current = false;
    setFase('activa');

    // Bucle de muestreo + dibujo a 60 fps durante todo el ejercicio
    const dibujar = () => {
      if (canceladoRef.current) return;
      const frame = motorRef.current.frame;
      const ahora = performance.now();
      const deltaMs = Math.min(ahora - ultimoFrameMsRef.current, 100);
      ultimoFrameMsRef.current = ahora;
      if (medirRef.current) {
        historialRef.current.push(frame.centsAfinado);
        if (frame.centsAfinado !== null) tiempoVozRef.current += deltaMs;
        contarOctava(
          octavaRef.current,
          frame.centsAfinado,
          frame.octavas,
          toleranciaRef.current,
        );
        if (historialRef.current.length > MAX_TRAMAS) historialRef.current.shift();
      }
      if (canvasRef.current) {
        const dibujo =
          historialRef.current.length > MAX_DIBUJO
            ? historialRef.current.slice(-MAX_DIBUJO)
            : historialRef.current;
        dibujarPianoRoll(canvasRef.current, {
          historial: dibujo,
          tolerancia: toleranciaRef.current,
        });
      }
      rafRef.current = requestAnimationFrame(dibujar);
    };
    rafRef.current = requestAnimationFrame(dibujar);

    // Texto en vivo a ~7 Hz
    const idTexto = window.setInterval(() => {
      const f = motorRef.current.frame;
      const clasificacion = clasificarCents(
        f.centsAfinado,
        toleranciaRef.current,
      );
      const cents = Math.round(f.centsAfinado ?? 0);
      const octava =
        f.octavas !== 0 &&
        Math.abs(cents) <= toleranciaRef.current * 2
          ? f.octavas
          : 0;
      const nActual = notasPractica[idxRef.current];
      const parcial =
        nActual && historialRef.current.length > 0
          ? puntuar(
              historialRef.current,
              toleranciaRef.current,
              octavaRef.current,
              nActual.midi,
            )
          : null;
      setEnVivo({
        hayVoz: f.freqHz !== null,
        cents,
        nivel: Math.min(1, Math.round(f.nivel * 800) / 100),
        clasificacion,
        octava,
        consejo: consejoDe(clasificacion, cents),
        precisionParcial: parcial && parcial.conVoz >= 10 ? parcial.precision : null,
        tiempoVozMs: tiempoVozRef.current,
      });
    }, 150);

    // Secuencia de notas
    const res: NotaResultado[] = [];
    for (let i = 0; i < notasPractica.length; i++) {
      if (canceladoRef.current) break;
      const n = notasPractica[i];
      setIdx(i);
      idxRef.current = i;
      historialRef.current = [];
      octavaRef.current = { arriba: 0, abajo: 0, voz: 0 };
      tiempoVozRef.current = 0;
      medirRef.current = false;
      fijarObjetivo(n.midi);
      if (n.referencia !== undefined) {
        setSubFase('escucha');
        try {
          await tocarNota(n.referencia, n.segundosRef ?? 1.2);
        } catch {
          // audio no disponible: seguir igual
        }
        if (canceladoRef.current) break;
        await pausaCancellable(300, canceladoRef);
        if (canceladoRef.current) break;
      }
      setSubFase('canta');
      ultimoFrameMsRef.current = performance.now();
      medirRef.current = true;
      historialRef.current = [];
      octavaRef.current = { arriba: 0, abajo: 0, voz: 0 };
      if (modoLibre) {
        // La nota no avanza sola: espera a que el usuario toque "Siguiente".
        await new Promise<void>((resolver) => {
          avanzarRef.current = resolver;
        });
        avanzarRef.current = null;
        if (canceladoRef.current) break;
      } else {
        await pausaCancellable(n.segundos * 1000, canceladoRef);
        if (canceladoRef.current) break;
      }
      res.push(
        puntuar(
          historialRef.current,
          toleranciaRef.current,
          octavaRef.current,
          n.midi,
        ),
      );
      setResultados([...res]);
    }

    window.clearInterval(idTexto);
    cancelAnimationFrame(rafRef.current);
    fijarObjetivo(null);
    if (!canceladoRef.current) {
      detener();
      setResultados(res);
      setFase('resultados');
      if (!guardadoRef.current && res.length > 0) {
        guardadoRef.current = true;
        const total = Math.round(res.reduce((a, r) => a + r.precision, 0) / res.length);
        guardarSesion({
          fecha: hoyISO(),
          registradoEn: fechaHoraISO(),
          ejercicioId: ejercicio.id,
          precision: total,
          notasBien: res.filter((r) => r.precision >= 70).length,
          notasTotal: res.length,
          detalleNotas: res.map((r, i) => ({
            midi: notasPractica[i].midi,
            precision: r.precision,
          })),
        });
      }
    }
    setOcupado(false);
  };

  const salir = () => {
    canceladoRef.current = true;
    avanzarRef.current?.();
    avanzarRef.current = null;
    cancelAnimationFrame(rafRef.current);
    detener();
    alVolver();
  };

  const pasarSiguiente = () => {
    avanzarRef.current?.();
    avanzarRef.current = null;
  };

  const reproducirReferencia = async (reiniciar: boolean) => {
    if (!notaActual) return;
    medirRef.current = false;
    if (reiniciar) {
      historialRef.current = [];
      octavaRef.current = { arriba: 0, abajo: 0, voz: 0 };
      tiempoVozRef.current = 0;
      setEnVivo((actual) => ({ ...actual, tiempoVozMs: 0 }));
    }
    await tocarNota(
      notaActual.referencia ?? notaActual.midi,
      notaActual.segundosRef ?? 1.2,
    );
    await pausaCancellable(300, canceladoRef);
    if (canceladoRef.current) return;
    ultimoFrameMsRef.current = performance.now();
    medirRef.current = true;
  };

  const repetirNota = () => {
    void reproducirReferencia(true);
  };

  const escucharNota = () => {
    void reproducirReferencia(false);
  };

  const total =
    resultados.length > 0
      ? Math.round(resultados.reduce((a, r) => a + r.precision, 0) / resultados.length)
      : 0;

  const sinVoz =
    resultados.length > 0 &&
    resultados.every((r) => r.diagnostico === 'sin_voz');
  const huboOctava = resultados.some((r) => r.diagnostico === 'octava');
  const ultima = resultados[resultados.length - 1];

  const colorDe = (p: number) =>
    p >= 70 ? 'text-emerald-400' : p >= 40 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button onClick={salir} className="inline-flex min-h-9 items-center px-2 text-sm text-slate-400 hover:text-white">
          {'< Volver'}
        </button>
        <AyudaLeccion leccionId={leccionParaEjercicio(ejercicio.id)} />
      </div>
      {!alcanzaCantoMinimo(enVivo.tiempoVozMs) && (
        <p className="text-center text-xs text-slate-500">
          Cantá al menos medio segundo para registrar la nota.
        </p>
      )}
      <h2 className="text-2xl font-bold text-white">{ejercicio.titulo}</h2>
      <p className="mt-1 text-sm text-slate-400">{ejercicio.descripcion}</p>

      {fase === 'intro' && (
        <AjusteAlturaVocal
          valor={transposicion}
          alCambiar={cambiarTransposicion}
        />
      )}

      <div className="mt-4 rounded-xl bg-slate-900 p-4">
        <label className="flex items-center justify-between text-sm text-slate-300">
          <span>
            Exigencia:{' '}
            {principiante ? etiquetaExigencia(tolerancia) : `±${tolerancia} cents`}
          </span>
          {!principiante && (
            <span className="text-xs text-slate-500">
              {tolerancia > 50 ? 'Más fácil' : tolerancia < 50 ? 'Más exigente' : 'Normal'}
            </span>
          )}
        </label>
        <input
          type="range"
          min={20}
          max={100}
          step={5}
          value={tolerancia}
          onChange={(e) => cambiarTolerancia(Number(e.target.value))}
          className="mt-2 w-full accent-violet-500"
        />
        <p className="mt-1 text-xs text-slate-500">
          Cuánto puede desviarse tu voz de la nota y seguir contando como afinada.
        </p>
      </div>

      {fase === 'intro' && (
        <div className="mt-6">
          <div className="rounded-xl bg-slate-900 p-4 text-sm text-slate-300">
            <p className="font-semibold text-white">Cómo se hace</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>La app toca una nota.</li>
              <li>
                {modoLibre
                  ? 'Cantá y tocá "Siguiente nota" cuando estés listo.'
                  : 'Cuando dice "Cantá ahora", cantá durante el tiempo indicado.'}
              </li>
              <li>No hace falta saber el nombre de la nota: copiá el sonido.</li>
            </ol>
          </div>

          <label className="mt-4 flex cursor-pointer items-center justify-between rounded-xl bg-slate-900 p-4">
            <span className="text-sm text-slate-300">
              Avanzar a mi ritmo
              <span className="mt-0.5 block text-xs text-slate-500">
                La nota no cambia sola: cantá y tocá "Siguiente nota" cuando quieras.
              </span>
            </span>
            <input
              type="checkbox"
              checked={modoLibre}
              onChange={(e) => setModoLibre(e.target.checked)}
              className="h-5 w-5 shrink-0 accent-violet-500"
            />
          </label>

          <ul className="mt-4 space-y-2">
            {notasPractica.map((n, i) => (
              <li key={i} className="flex justify-between rounded-lg bg-slate-900 px-4 py-2 text-sm">
                <span className="text-white">
                  Nota {i + 1}: {nombreNota(n.midi)}
                  {n.referencia !== undefined && n.referencia !== n.midi && (
                    <span className="text-slate-400"> (base: {nombreNota(n.referencia)})</span>
                  )}
                </span>
                <span className="text-slate-400">
                  {modoLibre ? 'a tu ritmo' : `${n.segundos}s`}
                </span>
              </li>
            ))}
          </ul>
          <button
            onClick={() => void empezar()}
            disabled={ocupado}
            className="mt-6 w-full rounded-xl bg-violet-600 py-3 font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {ocupado ? 'Preparando micrófono...' : 'Empezar (activa micrófono y audio)'}
          </button>
          {mensajeError && <p className="mt-3 rounded-lg bg-red-950 p-3 text-sm text-red-300">{mensajeError}</p>}
          <p className="mt-3 text-xs text-slate-500">
            Usá auriculares: si no, el micrófono escucha la nota de la app.
          </p>
        </div>
      )}

      {fase === 'activa' && notaActual && (
        <div className="mt-6">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-slate-400">
              Nota {idx + 1} de {notasPractica.length}
            </span>
            <span className={`text-sm font-semibold ${subFase === 'canta' ? 'text-emerald-400' : 'text-yellow-400'}`}>
              {subFase === 'canta' ? 'Cantá ahora' : 'Escuchá...'}
            </span>
          </div>

          <div className="mt-3 text-center">
            <div className="text-xs text-slate-500">Imitá esta nota con un "aaa"</div>
            <div className="text-3xl font-black text-white">{nombreNota(notaActual.midi)}</div>
          </div>

          <div
            className={`mt-3 rounded-xl px-4 py-3 text-center text-2xl font-black ${colorEnVivo(enVivo.clasificacion)}`}
            aria-live="polite"
          >
            {enVivo.consejo}
          </div>
          <div className="mt-1 text-center text-xs text-slate-500">
            {enVivo.octava !== 0 &&
              `Estás una octava ${enVivo.octava > 0 ? 'arriba' : 'abajo'}; la app lo tiene en cuenta. `}
            {!principiante && enVivo.hayVoz &&
              `${enVivo.cents > 0 ? '+' : ''}${enVivo.cents} cents`}
          </div>
          {subFase === 'canta' && enVivo.precisionParcial !== null && (
            <div className="mt-1 text-center text-xs text-slate-400">
              En esta nota:{' '}
              <span className={`font-bold ${colorDe(enVivo.precisionParcial)}`}>
                {enVivo.precisionParcial}%
              </span>
            </div>
          )}

          {ultima && (
            <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">
                  Nota anterior ({nombreNota(ultima.midi)})
                </span>
                <span className={`font-bold ${colorDe(ultima.precision)}`}>
                  {ultima.precision}%
                </span>
              </div>
              <p className="text-xs text-slate-400">{ultima.detalle}</p>
            </div>
          )}

          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-slate-500">Micrófono activo</span>
            <div
              className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800"
              role="meter"
              aria-label="Nivel del micrófono"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(enVivo.nivel * 100)}
            >
              <div
                className={`h-full rounded-full transition-[width] duration-150 ${
                  enVivo.nivel > 0.08 ? 'bg-emerald-500' : 'bg-slate-600'
                }`}
                style={{ width: `${Math.round(enVivo.nivel * 100)}%` }}
              />
            </div>
            {enVivo.nivel < 0.08 ? (
              <span className="text-xs text-yellow-400">Cantá para probar</span>
            ) : (
              <span className="text-xs text-emerald-400">Se te escucha</span>
            )}
          </div>

          <canvas
            ref={canvasRef}
            role="img"
            aria-label="Curva en vivo de tu afinación respecto de la nota objetivo"
            className="mt-3 h-56 w-full rounded-xl"
          />
          <p className="mt-2 text-center text-xs text-slate-500">
            Línea blanca: la nota. Verde: afinado. Amarillo: cerca. Rojo: fuera.
          </p>

          {subFase === 'canta' && (
            <div className="mt-3 space-y-2">
              {modoLibre ? (
                <>
                  <button
                    onClick={pasarSiguiente}
                    disabled={!alcanzaCantoMinimo(enVivo.tiempoVozMs)}
                    className="w-full rounded-xl bg-violet-600 py-3 font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
                  >
                    {idx === notasPractica.length - 1
                      ? 'Ver resultados'
                      : 'Siguiente nota'}
                  </button>
                  <button
                    onClick={repetirNota}
                    className="w-full rounded-xl bg-slate-800 py-2 text-sm text-white hover:bg-slate-700"
                  >
                    Escuchar otra vez y reintentar
                  </button>
                  <p className="text-center text-xs text-slate-500">
                    La nota no cambia hasta que toques "Siguiente nota".
                  </p>
                </>
              ) : (
                <button
                  onClick={escucharNota}
                  className="w-full rounded-xl bg-slate-800 py-2 text-sm text-white hover:bg-slate-700"
                >
                  Escuchar la nota otra vez
                </button>
              )}
            </div>
          )}
          <p className="mt-2 text-center text-xs text-slate-500">
            Con auriculares, para que el micrófono no escuche la referencia.
          </p>
        </div>
      )}

      {fase === 'resultados' && (
        <div className="mt-6">
          <p className="mb-3 text-center text-xs text-slate-500">
            Micrófono apagado al terminar.
          </p>
          <div className="rounded-2xl bg-slate-900 p-6 text-center">
            <div className="text-sm text-slate-400">Precisión total</div>
            <div className={`text-6xl font-black ${colorDe(total)}`}>{total}%</div>
            <p className="mt-2 text-sm text-slate-300">
              {total >= 70
                ? 'Muy bien: afinaste la mayoría.'
                : total >= 40
                  ? 'Vas bien: ya estás cerca en varias.'
                  : 'Todavía no. Ajustá el micrófono y probá otra vez.'}
            </p>
          </div>

          {sinVoz && (
            <div className="mt-4 rounded-xl bg-yellow-950 p-4 text-sm text-yellow-200">
              <p className="font-semibold">No se detectó tu voz en ninguna nota.</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Revisá que el micrófono esté permitido y elegido en Windows.</li>
                <li>Cantá un "aaa" fuerte y sostenido, no susurres.</li>
                <li>Mirá el medidor de micrófono: tiene que moverse.</li>
              </ul>
            </div>
          )}

          {huboOctava && (
            <div className="mt-4 rounded-xl bg-slate-900 p-4 text-sm text-slate-300">
              <p className="font-semibold text-white">Cantaste en otra octava.</p>
              <p className="mt-1">
                La nota es la misma, solo más grave o más aguda. Para empezar está
                bien: la app ya lo tiene en cuenta. Más adelante podés practicar la
                octava exacta.
              </p>
            </div>
          )}

          <ul className="mt-4 space-y-2">
            {resultados.map((r, i) => (
              <li key={i} className="rounded-lg bg-slate-900 px-4 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-white">
                    {nombreNota(r.midi)}
                    {r.conVoz === 0 && (
                      <span className="ml-2 text-slate-500">(sin voz)</span>
                    )}
                  </span>
                  <span className={`font-bold ${colorDe(r.precision)}`}>{r.precision}%</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                  <span>{r.detalle}</span>
                  {!principiante && r.conVoz > 0 && (
                    <span className="ml-2 shrink-0 text-slate-500">
                      {r.centsMedio > 0 ? '+' : ''}
                      {r.centsMedio} cents
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => { setFase('intro'); }}
              className="flex-1 rounded-xl bg-violet-600 py-3 font-semibold text-white hover:bg-violet-500"
            >
              Reintentar
            </button>
            <button onClick={salir} className="flex-1 rounded-xl bg-slate-700 py-3 text-white hover:bg-slate-600">
              Inicio
            </button>
          </div>
          {estado === 'apagado' && mensajeError && (
            <p className="mt-3 text-sm text-red-300">{mensajeError}</p>
          )}
        </div>
      )}
    </div>
  );
}
