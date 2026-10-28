// Cancion guiada: suena la melodia y el usuario canta encima.
// Al final se puntua cada nota y se muestra una linea de tiempo con los
// momentos en que estuvo afinado, cerca o fuera.

import { useEffect, useRef, useState } from 'react';
import { centsDesviacion, midiToNombre, normalizarOctava } from '../audio/notas';
import { clasificarCents, type Afinacion } from '../audio/pitchDetector';
import {
  contarOctava,
  puntuar,
  type ConteoOctava,
  type NotaResultado,
} from '../audio/puntuacion';
import {
  ensureAudioContext,
  tocarMelodia,
  type Reproduccion,
} from '../audio/tono';
import { useMicrofono } from '../audio/useMicrofono';
import {
  duracionCancion,
  letraCancion,
  type Cancion,
} from '../data/canciones';
import {
  cargarTransposicionVocal,
  guardarSesion,
  guardarTransposicionVocal,
  fechaHoraISO,
  hoyISO,
  type TransposicionVocal,
} from '../storage/progreso';
import {
  cambiarTempo,
  repetirNotasDeFragmento,
  transponerNotas,
} from '../musica/transposicion';
import AjusteAlturaVocal from './AjusteAlturaVocal';
import AyudaLeccion from './AyudaLeccion';
import { colorEnVivo, consejoDe } from './feedback';
import { LECCION_POR_CANCION } from '../data/leccionesMusica';

type Fase = 'intro' | 'cantando' | 'resultados';

const TOLERANCIA = 50; // cents

interface EnVivo {
  idx: number;
  cents: number;
  nivel: number;
  progreso: number;
  clasificacion: Afinacion;
  consejo: string;
}

const VIVO_INICIAL: EnVivo = {
  idx: -1,
  cents: 0,
  nivel: 0,
  progreso: 0,
  clasificacion: 'silencio',
  consejo: 'Preparate...',
};

function esperar(ms: number, cancelado: { current: boolean }): Promise<void> {
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

export default function PantallaCancion({
  cancion,
  alVolver,
}: {
  cancion: Cancion;
  alVolver: () => void;
}) {
  const [fase, setFase] = useState<Fase>('intro');
  const [cuenta, setCuenta] = useState<number | null>(null);
  const [resultados, setResultados] = useState<NotaResultado[]>([]);
  const [vivo, setVivo] = useState<EnVivo>(VIVO_INICIAL);
  const [anterior, setAnterior] = useState<NotaResultado | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [indiceEscucha, setIndiceEscucha] = useState(0);
  const [versionReproduccion, setVersionReproduccion] = useState(0);
  const [transposicion, setTransposicion] = useState(cargarTransposicionVocal);
  const [tempoPorcentaje, setTempoPorcentaje] = useState(100);
  const [loopDesde, setLoopDesde] = useState(0);
  const [loopHasta, setLoopHasta] = useState(cancion.notas.length - 1);
  const [vueltasLoop, setVueltasLoop] = useState(2);

  const { estado, mensajeError, motorRef, iniciar, detener } = useMicrofono();
  const notasPractica = cambiarTempo(
    transponerNotas(cancion.notas, transposicion),
    tempoPorcentaje,
  );
  const reproRef = useRef<Reproduccion | null>(null);
  const rafRef = useRef(0);
  const canceladoRef = useRef(false);
  const idxRef = useRef(-1);
  const anteriorIdxRef = useRef(-2);
  const guardadoRef = useRef(false);
  const reproduccionIdRef = useRef(0);

  useEffect(() => {
    canceladoRef.current = false;
    return () => {
      canceladoRef.current = true;
    };
  }, []);

  useEffect(() => {
    const reproduccion = reproRef.current;
    return () => reproduccion?.detener();
  }, [versionReproduccion]);

  const salir = () => {
    canceladoRef.current = true;
    cancelAnimationFrame(rafRef.current);
    detenerEscucha();
    detener();
    alVolver();
  };

  const detenerEscucha = () => {
    reproduccionIdRef.current++;
    reproRef.current?.detener();
    reproRef.current = null;
    setVersionReproduccion((version) => version + 1);
    setOcupado(false);
  };

  const cambiarTransposicion = (v: TransposicionVocal) => {
    setTransposicion(v);
    guardarTransposicionVocal(v);
  };

  const reproducirPaso = (indice: number) => {
    const nota = notasPractica[indice];
    if (!nota || estado === 'pidiendo' || (ocupado && !reproRef.current)) return;
    detenerEscucha();
    const reproduccionId = reproduccionIdRef.current;
    setIndiceEscucha(indice);
    setOcupado(true);
    ensureAudioContext();
    const repro = tocarMelodia([{ midi: nota.midi, segundos: nota.segundos }]);
    reproRef.current = repro;
    setVersionReproduccion((version) => version + 1);
    void repro.fin.finally(() => {
      if (
        !canceladoRef.current &&
        reproduccionIdRef.current === reproduccionId
      ) {
        reproRef.current = null;
        setOcupado(false);
      }
    });
  };

  const escuchar = () => {
    if (reproRef.current) {
      detenerEscucha();
      return;
    }
    if (ocupado) return;
    setOcupado(true);
    ensureAudioContext();
    const repro = tocarMelodia(notasPractica);
    const reproduccionId = ++reproduccionIdRef.current;
    reproRef.current = repro;
    setVersionReproduccion((version) => version + 1);
    void repro.fin.finally(() => {
      if (
        !canceladoRef.current &&
        reproduccionIdRef.current === reproduccionId
      ) {
        reproRef.current = null;
        setOcupado(false);
      }
    });
  };

  const escucharFragmentoEnLoop = () => {
    if (reproRef.current) {
      detenerEscucha();
      return;
    }
    if (ocupado) return;
    const notasLoop = repetirNotasDeFragmento(
      notasPractica,
      loopDesde,
      loopHasta,
      vueltasLoop,
    );
    setOcupado(true);
    ensureAudioContext();
    const reproduccionId = ++reproduccionIdRef.current;
    const repro = tocarMelodia(notasLoop);
    reproRef.current = repro;
    setVersionReproduccion((version) => version + 1);
    void repro.fin.finally(() => {
      if (
        !canceladoRef.current &&
        reproduccionIdRef.current === reproduccionId
      ) {
        reproRef.current = null;
        setOcupado(false);
      }
    });
  };

  const cantar = async () => {
    if (ocupado) return;
    setOcupado(true);
    setResultados([]);
    setVivo(VIVO_INICIAL);
    setAnterior(null);
    anteriorIdxRef.current = -2;
    guardadoRef.current = false;
    ensureAudioContext();
    await iniciar();
    if (!motorRef.current.analyser) {
      setOcupado(false);
      return;
    }
    reproRef.current?.detener();

    const acumulados: number[] = [];
    let acc = 0;
    for (const n of notasPractica) {
      acumulados.push(acc);
      acc += n.segundos;
    }
    const totalMs = acc * 1000;
    const historiales = notasPractica.map<(number | null)[]>(() => []);
    const octavas = notasPractica.map<ConteoOctava>(() => ({
      arriba: 0,
      abajo: 0,
      voz: 0,
    }));

    setFase('cantando');
    setOcupado(false);

    for (const c of [3, 2, 1]) {
      setCuenta(c);
      await esperar(650, canceladoRef);
      if (canceladoRef.current) {
        setCuenta(null);
        return;
      }
    }
    setCuenta(0);
    await esperar(500, canceladoRef);
    setCuenta(null);
    if (canceladoRef.current) return;

    const repro = tocarMelodia(notasPractica);
    reproRef.current = repro;
    const inicioMs = repro.inicioMs;

    let idTexto = 0;

    const finalizar = () => {
      cancelAnimationFrame(rafRef.current);
      window.clearInterval(idTexto);
      if (canceladoRef.current) return;
      reproRef.current?.detener();
      reproRef.current = null;
      detener();
      const res = notasPractica.map((n, i) =>
        puntuar(historiales[i], TOLERANCIA, octavas[i], n.midi),
      );
      setResultados(res);
      setFase('resultados');
      setVivo((v) => ({ ...v, idx: -1, progreso: 1, nivel: 0 }));
      if (!guardadoRef.current && res.length > 0) {
        guardadoRef.current = true;
        const total = Math.round(
          res.reduce((a, r) => a + r.precision, 0) / res.length,
        );
        guardarSesion({
          fecha: hoyISO(),
          registradoEn: fechaHoraISO(),
          ejercicioId: `cancion-${cancion.id}`,
          tempoPorcentaje,
          precision: total,
          notasBien: res.filter((r) => r.precision >= 70).length,
          notasTotal: res.length,
          detalleNotas: res.map((r, i) => ({
            midi: notasPractica[i].midi,
            precision: r.precision,
          })),
        });
      }
    };

    const bucle = () => {
      if (canceladoRef.current) return;
      const f = motorRef.current.frame;
      const transcurrido = performance.now() - inicioMs;
      let idx = -1;
      if (transcurrido >= 0) {
        for (let i = 0; i < notasPractica.length; i++) {
          const desde = acumulados[i] * 1000;
          const hasta = desde + notasPractica[i].segundos * 1000;
          if (transcurrido >= desde && transcurrido < hasta) {
            idx = i;
            break;
          }
        }
      }
      idxRef.current = idx;

      if (idx >= 0) {
        if (f.freqHz !== null) {
          const z = normalizarOctava(
            centsDesviacion(f.freqHz, notasPractica[idx].midi),
          );
          historiales[idx].push(z.cents);
          contarOctava(octavas[idx], z.cents, z.octavas, TOLERANCIA);
        } else {
          historiales[idx].push(null);
        }
      }

      if (transcurrido > totalMs + 250) {
        finalizar();
        return;
      }
      rafRef.current = requestAnimationFrame(bucle);
    };

    idTexto = window.setInterval(() => {
      const f = motorRef.current.frame;
      const idx = idxRef.current;
      const transcurrido = performance.now() - inicioMs;
      let cents: number | null = null;
      if (idx >= 0 && f.freqHz !== null) {
        cents = normalizarOctava(
          centsDesviacion(f.freqHz, notasPractica[idx].midi),
        ).cents;
      }
      const clasificacion = clasificarCents(cents, TOLERANCIA);
      if (idx > 0 && anteriorIdxRef.current !== idx) {
        anteriorIdxRef.current = idx;
        setAnterior(
          puntuar(
            historiales[idx - 1],
            TOLERANCIA,
            octavas[idx - 1],
            notasPractica[idx - 1].midi,
          ),
        );
      }
      setVivo({
        idx,
        cents: Math.round(cents ?? 0),
        nivel: Math.min(1, Math.round(f.nivel * 800) / 100),
        progreso: Math.max(0, Math.min(1, transcurrido / totalMs)),
        clasificacion,
        consejo: consejoDe(clasificacion, cents ?? 0),
      });
    }, 150);

    rafRef.current = requestAnimationFrame(bucle);
  };

  const total =
    resultados.length > 0
      ? Math.round(
          resultados.reduce((a, r) => a + r.precision, 0) / resultados.length,
        )
      : 0;
  const sinVoz =
    resultados.length > 0 &&
    resultados.every((r) => r.diagnostico === 'sin_voz');
  const huboOctava = resultados.some((r) => r.diagnostico === 'octava');
  const letra = letraCancion(cancion);
  const tieneLetra = cancion.notas.some((n) => n.silaba !== undefined);

  const colorDe = (p: number) =>
    p >= 70 ? 'text-emerald-400' : p >= 40 ? 'text-yellow-400' : 'text-red-400';

  const colorSegmento = (r: NotaResultado) =>
    r.diagnostico === 'sin_voz'
      ? 'bg-slate-600'
      : r.precision >= 70
        ? 'bg-emerald-500'
        : r.precision >= 40
          ? 'bg-yellow-500'
          : 'bg-red-500';

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button onClick={salir} className="inline-flex min-h-9 items-center px-2 text-sm text-slate-400 hover:text-white">
          {'< Volver'}
        </button>
        <AyudaLeccion leccionId={LECCION_POR_CANCION} />
      </div>
      <h2 className="text-2xl font-bold text-white">{cancion.titulo}</h2>
      <p className="mt-1 text-sm text-slate-400">{cancion.descripcion}</p>

      {fase === 'intro' && (
        <div className="mt-5">
          <AjusteAlturaVocal
            valor={transposicion}
            alCambiar={cambiarTransposicion}
          />
          <section className="mt-4 rounded-xl bg-slate-900 p-4" aria-label="Velocidad de práctica">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Velocidad</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Más despacio alarga cada nota; no cambia su altura.
                </p>
              </div>
              <span className="text-sm font-semibold text-violet-200">
                {tempoPorcentaje}%
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[60, 80, 100].map((tempo) => (
                <button
                  key={tempo}
                  onClick={() => setTempoPorcentaje(tempo)}
                  aria-pressed={tempoPorcentaje === tempo}
                  className={`min-h-10 rounded-lg px-3 py-2 text-sm font-semibold ${
                    tempoPorcentaje === tempo
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {tempo === 100 ? 'Normal' : `${tempo}%`}
                </button>
              ))}
            </div>
          </section>
          <section className="mt-4 rounded-xl bg-slate-900 p-4" aria-label="Repetir fragmento">
            <h3 className="text-sm font-semibold text-white">Repetir un fragmento</h3>
            <p className="mt-1 text-xs text-slate-400">
              Elegí la primera y la última nota. El fragmento se reproduce a la
              velocidad elegida.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="text-xs text-slate-400">
                Desde
                <select
                  value={loopDesde}
                  onChange={(evento) => {
                    const desde = Number(evento.currentTarget.value);
                    setLoopDesde(desde);
                    if (desde > loopHasta) setLoopHasta(desde);
                  }}
                  className="mt-1 min-h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 text-sm text-white"
                >
                  {letra.map((silaba, indice) => (
                    <option key={indice} value={indice}>
                      {indice + 1} · {silaba}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-slate-400">
                Hasta
                <select
                  value={loopHasta}
                  onChange={(evento) => {
                    const hasta = Number(evento.currentTarget.value);
                    setLoopHasta(hasta);
                    if (hasta < loopDesde) setLoopDesde(hasta);
                  }}
                  className="mt-1 min-h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 text-sm text-white"
                >
                  {letra.map((silaba, indice) => (
                    <option key={indice} value={indice}>
                      {indice + 1} · {silaba}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="mt-2 block text-xs text-slate-400">
              Repeticiones
              <select
                value={vueltasLoop}
                onChange={(evento) => setVueltasLoop(Number(evento.currentTarget.value))}
                className="mt-1 min-h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 text-sm text-white"
              >
                {[2, 3, 4, 6, 8].map((vueltas) => (
                  <option key={vueltas} value={vueltas}>
                    {vueltas} veces
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={escucharFragmentoEnLoop}
              disabled={estado === 'pidiendo'}
              className="mt-3 min-h-11 w-full rounded-lg bg-violet-700 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-600 disabled:opacity-50"
            >
              {ocupado ? 'Detener audio' : 'Repetir fragmento'}
            </button>
          </section>
          <div className="rounded-xl bg-slate-900 p-4 text-sm text-slate-300">
            <p className="font-semibold text-white">Cómo se canta</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Escuchá la melodía completa (opcional, pero ayuda).</li>
              <li>Pulsá "Cantar la canción". Hay una cuenta de 3, 2, 1.</li>
              <li>Cantá encima de la melodía con la letra o con "la".</li>
            </ol>
          </div>

          <div className="mt-4 rounded-xl bg-slate-900 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">
                {tieneLetra ? 'Letra (opcional)' : 'Sin letra: cantá con "la"'}
              </span>
              <span className="text-xs text-slate-500">
                {(duracionCancion(cancion) * (100 / tempoPorcentaje)).toFixed(1)} s
              </span>
            </div>
            {tieneLetra && (
              <p className="mt-2 text-sm leading-relaxed text-slate-200">
                {letra.join(' · ')}
              </p>
            )}
            <p className="mt-2 text-xs text-slate-500">
              No hace falta saber la letra: la app mide la altura del sonido, no
              las palabras. Cantá con "la" o "aaa" y cuenta igual.
            </p>
          </div>

          <button
            onClick={escuchar}
            disabled={estado === 'pidiendo'}
            className="mt-4 w-full rounded-xl bg-slate-800 py-3 font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {ocupado ? 'Detener reproducción' : 'Escuchar la melodía'}
          </button>
          <div className="mt-3 rounded-xl bg-slate-900 p-4">
            <p className="text-sm font-semibold text-white">Escuchar paso a paso</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <button
                onClick={() => reproducirPaso(Math.max(0, indiceEscucha - 1))}
                disabled={indiceEscucha === 0 || estado === 'pidiendo'}
                className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="text-center text-sm text-slate-300">
                {indiceEscucha + 1}/{notasPractica.length} ·{' '}
                {midiToNombre(notasPractica[indiceEscucha].midi)} ·{' '}
                {letra[indiceEscucha]}
              </span>
              <button
                onClick={() =>
                  reproducirPaso(Math.min(notasPractica.length - 1, indiceEscucha + 1))
                }
                disabled={
                  indiceEscucha === notasPractica.length - 1 ||
                  estado === 'pidiendo'
                }
                className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
            <button
              onClick={() => reproducirPaso(indiceEscucha)}
              disabled={estado === 'pidiendo'}
              className="mt-2 w-full rounded-lg bg-slate-800 py-2 text-sm text-white hover:bg-slate-700"
            >
              Repetir esta nota
            </button>
            <div className="mt-3 flex flex-wrap gap-1">
              {letra.map((silaba, indice) => (
                <button
                  key={indice}
                  onClick={() => reproducirPaso(indice)}
                  disabled={estado === 'pidiendo'}
                  className={`min-h-9 min-w-9 rounded px-2 py-1 text-xs ${
                    indice === indiceEscucha
                      ? 'bg-violet-700 text-white'
                      : 'bg-slate-800 text-slate-300'
                  } disabled:opacity-50`}
                  aria-label={`Reproducir nota ${indice + 1}, ${midiToNombre(
                    notasPractica[indice].midi,
                  )}, ${silaba}`}
                >
                  {silaba}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => void cantar()}
            disabled={ocupado}
            className="mt-3 w-full rounded-xl bg-violet-600 py-3 font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {ocupado ? 'Preparando micrófono...' : 'Cantar la canción'}
          </button>
          {mensajeError && (
            <p className="mt-3 rounded-lg bg-red-950 p-3 text-sm text-red-300">
              {mensajeError}
            </p>
          )}
          <p className="mt-3 text-xs text-slate-500">
            Usá auriculares: si no, el micrófono escucha la melodía y la app no
            puede distinguir tu voz.
          </p>
        </div>
      )}

      {fase === 'cantando' && (
        <div className="mt-5">
          {cuenta !== null ? (
            <div className="rounded-2xl bg-slate-900 p-10 text-center">
              <div className="text-sm text-slate-400">Preparate</div>
              <div className="text-6xl font-black text-white">
                {cuenta === 0 ? '¡Cantá!' : cuenta}
              </div>
              <p className="mt-2 text-sm text-slate-400">
                {cuenta === 0 ? 'Empieza la melodía' : 'Después empieza la melodía'}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Cantá con la melodía</span>
                <span className="text-slate-400">
                  {Math.round(vivo.progreso * 100)}%
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-violet-500 transition-[width] duration-150"
                  style={{ width: `${Math.round(vivo.progreso * 100)}%` }}
                />
              </div>
              <div className="mt-4 flex min-h-14 flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
                {letra.map((s, i) => (
                  <span
                    key={i}
                    className={
                      i === vivo.idx
                      ? 'text-2xl font-black text-white'
                        : i < vivo.idx
                          ? 'text-sm text-slate-600'
                          : 'text-sm text-slate-400'
                    }
                  >
                    {s}
                  </span>
                ))}
              </div>

              <div
                className={`mt-3 rounded-xl px-4 py-3 text-center text-2xl font-black ${colorEnVivo(vivo.clasificacion)}`}
                aria-live="polite"
              >
                {vivo.consejo}
              </div>

              {anterior && (
                <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Nota anterior</span>
                    <span className={`font-bold ${colorDe(anterior.precision)}`}>
                      {anterior.precision}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{anterior.detalle}</p>
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
                  aria-valuenow={Math.round(vivo.nivel * 100)}
                >
                  <div
                    className={`h-full rounded-full transition-[width] duration-150 ${
                      vivo.nivel > 0.08 ? 'bg-emerald-500' : 'bg-slate-600'
                    }`}
                    style={{ width: `${Math.round(vivo.nivel * 100)}%` }}
                  />
                </div>
                {vivo.nivel < 0.08 ? (
                  <span className="text-xs text-yellow-400">Cantá para probar</span>
                ) : (
                  <span className="text-xs text-emerald-400">Se te escucha</span>
                )}
              </div>

              <button
                onClick={salir}
                className="mt-6 w-full rounded-xl bg-slate-800 py-2 text-sm text-slate-300 hover:bg-slate-700"
              >
                Cortar
              </button>
            </>
          )}
          {estado !== 'activo' && mensajeError && (
            <p className="mt-3 text-sm text-red-300">{mensajeError}</p>
          )}
        </div>
      )}

      {fase === 'resultados' && (
        <div className="mt-5">
          <p className="mb-3 text-center text-xs text-slate-500">
            Micrófono apagado al terminar.
          </p>
          <div className="rounded-2xl bg-slate-900 p-6 text-center">
            <div className="text-sm text-slate-400">Precisión total</div>
            <div className={`text-6xl font-black ${colorDe(total)}`}>{total}%</div>
            <p className="mt-2 text-sm text-slate-300">
              {total >= 70
                ? 'Muy bien: seguiste la melodía.'
                : total >= 40
                  ? 'Vas bien: en varias notas estuviste cerca.'
                  : 'Todavía no. Revisá el micrófono y probá otra vez.'}
            </p>
          </div>

          {sinVoz && (
            <div className="mt-4 rounded-xl bg-yellow-950 p-4 text-sm text-yellow-200">
              <p className="font-semibold">No se detectó tu voz.</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Revisá el micrófono y el volumen de entrada en Windows.</li>
                <li>Cantá fuerte y sostenido, no susurres.</li>
                <li>Usá auriculares para no cantarle a la melodía de la app.</li>
              </ul>
            </div>
          )}

          {huboOctava && (
            <div className="mt-4 rounded-xl bg-slate-900 p-4 text-sm text-slate-300">
              <p className="font-semibold text-white">Cantaste en otra octava.</p>
              <p className="mt-1">
                La nota es la misma, solo más grave o más aguda. Para empezar
                está bien: la app ya lo tiene en cuenta.
              </p>
            </div>
          )}

          <div className="mt-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Momento a momento</span>
              <span className="text-xs text-slate-500">verde = afinado</span>
            </div>
            <div className="mt-2 flex h-8 w-full overflow-hidden rounded-lg bg-slate-900">
              {resultados.map((r, i) => (
                <div
                  key={i}
                  className={`h-full border-r border-slate-900 last:border-r-0 ${colorSegmento(r)}`}
                  style={{ flexGrow: notasPractica[i].segundos }}
                  title={`${letra[i]} (${Math.round(notasPractica[i].segundos * 10) / 10}s): ${r.precision}% - ${r.detalle}`}
                />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-xs text-slate-500">
              <span>Inicio</span>
              <span>Fin</span>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {resultados.map((r, i) => (
              <li key={i} className="rounded-lg bg-slate-900 px-4 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-white">
                    <span className="font-semibold">{letra[i]}</span>
                    <span className="ml-2 text-xs text-slate-500">
                      ({Math.round(notasPractica[i].segundos * 10) / 10}s)
                    </span>
                  </span>
                  <span className={`font-bold ${colorDe(r.precision)}`}>
                    {r.precision}%
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{r.detalle}</p>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                setResultados([]);
                setVivo(VIVO_INICIAL);
                setAnterior(null);
                anteriorIdxRef.current = -2;
                setFase('intro');
              }}
              className="flex-1 rounded-xl bg-violet-600 py-3 font-semibold text-white hover:bg-violet-500"
            >
              Reintentar
            </button>
            <button
              onClick={salir}
              className="flex-1 rounded-xl bg-slate-700 py-3 text-white hover:bg-slate-600"
            >
              Inicio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
