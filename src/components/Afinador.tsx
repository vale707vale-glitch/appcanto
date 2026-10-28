// Modo afinador: nota detectada en tiempo real (nombre + desviacion en cents).
// Pensado para principiantes: mensaje en palabras y punto que debe quedar centrado.

import { useEffect, useRef, useState } from 'react';
import { freqANotaMasCercana } from '../audio/notas';
import { clasificarCents } from '../audio/pitchDetector';
import { useMicrofono } from '../audio/useMicrofono';
import { cargarModoPrincipiante, cargarTolerancia } from '../storage/progreso';
import { dibujarPianoRoll } from './pianoRoll';

export default function Afinador({ alVolver }: { alVolver: () => void }) {
  const { estado, mensajeError, motorRef, iniciar, detener } = useMicrofono();
  const [principiante] = useState(cargarModoPrincipiante);
  const [tolerancia] = useState(() => cargarTolerancia(50));
  const [texto, setTexto] = useState({
    nombre: '--',
    cents: 0,
    hayVoz: false,
    nivel: 0,
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historialRef = useRef<(number | null)[]>([]);

  // Texto a ~7 Hz para no saturar React
  useEffect(() => {
    if (estado !== 'activo') return;
    const id = window.setInterval(() => {
      const f = motorRef.current.frame;
      const nivel = Math.min(1, Math.round(f.nivel * 800) / 100);
      if (f.freqHz === null) {
        setTexto({ nombre: '--', cents: 0, hayVoz: false, nivel });
      } else {
        const n = freqANotaMasCercana(f.freqHz);
        setTexto({ nombre: n.nombre, cents: n.centsOff, hayVoz: true, nivel });
      }
    }, 150);
    return () => window.clearInterval(id);
  }, [estado, motorRef]);

  // Curva a 60 fps
  useEffect(() => {
    if (estado !== 'activo') return;
    let raf = 0;
    const dibujar = () => {
      const f = motorRef.current.frame;
      let centsRel: number | null = null;
      if (f.freqHz !== null) {
        const n = freqANotaMasCercana(f.freqHz);
        centsRel = n.centsOff;
      }
      historialRef.current.push(centsRel);
      if (historialRef.current.length > 240) historialRef.current.shift();
      if (canvasRef.current) {
        dibujarPianoRoll(canvasRef.current, {
          historial: historialRef.current,
          tolerancia,
          rangoCents: 200,
        });
      }
      raf = requestAnimationFrame(dibujar);
    };
    raf = requestAnimationFrame(dibujar);
    return () => cancelAnimationFrame(raf);
  }, [estado, motorRef, tolerancia]);

  const aguja = Math.max(-50, Math.min(50, texto.cents));
  const afinacion = clasificarCents(
    texto.hayVoz ? texto.cents : null,
    tolerancia,
  );
  const enTono = afinacion === 'dentro';
  const mensaje =
    afinacion === 'silencio'
      ? 'No te escucho'
      : enTono
        ? 'Afinado'
        : afinacion === 'cerca'
          ? texto.cents > 0
            ? 'Un poco alto: bajá'
            : 'Un poco bajo: subí'
          : texto.cents > 0
            ? 'Muy alto: bajá'
            : 'Muy bajo: subí';
  const colorMensaje =
    afinacion === 'silencio'
      ? 'text-slate-400'
      : enTono
        ? 'text-emerald-400'
        : afinacion === 'cerca'
          ? 'text-yellow-400'
          : 'text-red-400';
  const colorPunto =
    afinacion === 'silencio'
      ? 'bg-slate-500'
      : enTono
        ? 'bg-emerald-400'
        : afinacion === 'cerca'
          ? 'bg-yellow-400'
          : 'bg-red-400';

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-6">
      <button onClick={() => { detener(); alVolver(); }} className="mb-4 inline-flex min-h-9 items-center px-2 text-sm text-slate-400 hover:text-white">
        {'< Volver'}
      </button>
      <h2 className="text-2xl font-bold text-white">Afinador</h2>
      <p className="mt-1 text-sm text-slate-400">
        Cantá un "aaa" sostenido. El punto tiene que quedar en el centro.
      </p>
      <p className="mt-1 text-xs text-slate-500">
        No hace falta saber el nombre de la nota: mirá el centro y el mensaje.
        Tolerancia actual: ±{tolerancia} cents.
      </p>

      {estado !== 'activo' && (
        <button
          onClick={() => void iniciar()}
          disabled={estado === 'pidiendo'}
          className="mt-6 w-full rounded-xl bg-violet-600 py-3 font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
        >
          {estado === 'pidiendo' ? 'Pidiendo micrófono...' : 'Activar micrófono'}
        </button>
      )}
      {mensajeError && <p className="mt-4 rounded-lg bg-red-950 p-3 text-sm text-red-300">{mensajeError}</p>}

      {estado === 'activo' && (
        <div className="mt-6">
          <div className="rounded-2xl bg-slate-900 p-6 text-center">
            <div className="text-xs text-slate-500">Nota detectada</div>
            <div className={`text-5xl font-black ${texto.hayVoz ? 'text-white' : 'text-slate-600'}`}>
              {texto.nombre}
            </div>
            <div
              className={`mt-2 text-xl font-bold ${colorMensaje}`}
              aria-live="polite"
            >
              {mensaje}
            </div>
            {!principiante && (
              <div className="mt-1 text-sm text-slate-400">
                {texto.hayVoz ? `${texto.cents > 0 ? '+' : ''}${texto.cents} cents` : 'sin señal'}
              </div>
            )}

            <div className="relative mx-auto mt-5 h-3 max-w-sm overflow-hidden rounded-full bg-slate-700">
              <div className="absolute left-1/2 top-0 h-full w-0.5 bg-white" />
              <div
                className={`absolute top-0 h-full w-2 rounded-full transition-[left] duration-100 ${colorPunto}`}
                style={{ left: `calc(${50 + aguja}% - 4px)` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-xs text-slate-500">
              <span>Más grave</span>
              <span>En nota</span>
              <span>Más agudo</span>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-slate-500">Micrófono activo</span>
              <div
                className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800"
                role="meter"
                aria-label="Nivel del micrófono"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(texto.nivel * 100)}
              >
                <div
                  className={`h-full rounded-full transition-[width] duration-150 ${
                    texto.nivel > 0.08 ? 'bg-emerald-500' : 'bg-slate-600'
                  }`}
                  style={{ width: `${Math.round(texto.nivel * 100)}%` }}
                />
              </div>
              {texto.nivel < 0.08 && (
                <span className="text-xs text-yellow-400">Cantá para probar</span>
              )}
              {texto.nivel >= 0.08 && (
                <span className="text-xs text-emerald-400">Se te escucha</span>
              )}
            </div>
          </div>

          <canvas
            ref={canvasRef}
            role="img"
            aria-label="Historial de desviación de afinación"
            className="mt-4 h-28 w-full rounded-xl"
          />
          <p className="mt-2 text-center text-xs text-slate-500">
            Línea blanca: el centro de la nota. Verde: afinado.
          </p>
          <button onClick={detener} className="mt-4 w-full rounded-xl bg-slate-700 py-2 text-sm text-white hover:bg-slate-600">
            Apagar micrófono
          </button>
        </div>
      )}
    </div>
  );
}
