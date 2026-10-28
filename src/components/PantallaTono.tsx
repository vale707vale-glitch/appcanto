import { useRef, useState } from 'react';
import { midiToFreq, midiToNombre } from '../audio/notas';
import { ensureAudioContext, tocarAcorde, tocarMelodia } from '../audio/tono';
import type { Reproduccion } from '../audio/tono';
import {
  acordesPrincipales,
  analizarAcordes,
  analizarNotas,
  detectarTono,
  midisDeAcorde,
  nombreAcorde,
  nombreCuerda,
  notasDeAcorde,
  posicionesGuitarra,
  sugerirCejillas,
  transponerAnalisis,
} from '../musica/teoria';
import type { Analisis, ModoEntrada, PosicionesNota } from '../musica/teoria';
import GuiaTono from './GuiaTono';

const EJEMPLO_ACORDES = 'Sol Do Re7 Sol';
const EJEMPLO_NOTAS = 'Do Re Mi Fa Sol';

const EJEMPLOS: Record<ModoEntrada, { etiqueta: string; texto: string }[]> = {
  acordes: [
    { etiqueta: 'Sol mayor', texto: 'Sol Do Re7 Sol' },
    { etiqueta: 'Do mayor', texto: 'Do Lam Fa Sol' },
    { etiqueta: 'Blues en La', texto: 'La7 Re Mi7' },
    { etiqueta: 'Do# mayor', texto: 'Do# Fa# Sol# Do#' },
  ],
  notas: [
    { etiqueta: 'Do mayor', texto: 'Do Re Mi Fa Sol' },
    { etiqueta: 'La menor', texto: 'La Si Do Re La' },
    { etiqueta: 'Do# mayor', texto: 'Do# Re# Fa# Sol# La#' },
  ],
};

const COLOR_CONFIANZA: Record<string, string> = {
  alta: 'bg-emerald-900 text-emerald-300',
  media: 'bg-yellow-900 text-yellow-300',
  baja: 'bg-slate-800 text-slate-300',
};

function pausa(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function textoPosiciones(pos: PosicionesNota, midiOriginal: number): string {
  if (pos.posiciones.length === 0) {
    return 'No entra en los primeros 12 trastes.';
  }
  const base = pos.posiciones
    .map(
      (p) =>
        `Cuerda ${p.cuerda} (${nombreCuerda(p.cuerda)}), ${
          p.traste === 0 ? 'al aire' : `traste ${p.traste}`
        }`,
    )
    .join(' · ');
  if (pos.exacta) return base;
  const octavas = Math.round((pos.midiUsado - midiOriginal) / 12);
  const cantidad = Math.abs(octavas) === 1 ? 'una octava' : `${Math.abs(octavas)} octavas`;
  return `${base} (la misma nota ${cantidad} ${octavas < 0 ? 'más grave' : 'más aguda'})`;
}

export default function PantallaTono({
  alVolver,
  alAbrirGuitarra,
}: {
  alVolver: () => void;
  alAbrirGuitarra: (acordes: string[]) => void;
}) {
  const [modo, setModo] = useState<ModoEntrada>('acordes');
  const [entrada, setEntrada] = useState(EJEMPLO_ACORDES);
  const [semitonos, setSemitonos] = useState(0);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [modoEscucha, setModoEscucha] = useState<'auto' | 'paso'>('auto');
  const [paso, setPaso] = useState(0);
  const [suenaIdx, setSuenaIdx] = useState<number | null>(null);
  const reproRef = useRef<Reproduccion | null>(null);
  const runRef = useRef(0);

  const detener = () => {
    runRef.current++;
    reproRef.current?.detener();
    reproRef.current = null;
    setReproduciendo(false);
    setSuenaIdx(null);
  };

  const volver = () => {
    detener();
    alVolver();
  };

  const analisis: Analisis =
    modo === 'acordes' ? analizarAcordes(entrada) : analizarNotas(entrada);
  const trans = transponerAnalisis(analisis, semitonos);
  const tonos = detectarTono(trans);
  const tono = tonos[0];
  const nombreTono = tono?.nombre ?? '';
  const tonosOriginales = semitonos !== 0 ? detectarTono(analisis) : [];
  const cejillas = modo === 'acordes' && tono ? sugerirCejillas(tono, trans) : [];
  const acompanamiento = modo === 'notas' && tono ? acordesPrincipales(tono) : [];
  const validos =
    trans.tipo === 'acordes' ? trans.acordes.length : trans.notas.length;
  const acordesAnalizados =
    trans.tipo === 'acordes' ? trans.acordes : [];
  const faltanOctavas =
    trans.tipo === 'notas' && trans.notas.some((n) => !n.tieneOctava);

  const cambiarModo = (m: ModoEntrada) => {
    if (m === modo) return;
    detener();
    setPaso(0);
    setModo(m);
    setSemitonos(0);
    if (m === 'notas' && entrada.trim() === EJEMPLO_ACORDES) {
      setEntrada(EJEMPLO_NOTAS);
    }
    if (m === 'acordes' && entrada.trim() === EJEMPLO_NOTAS) {
      setEntrada(EJEMPLO_ACORDES);
    }
  };

  const usarEjemplo = (m: ModoEntrada, texto: string) => {
    detener();
    setPaso(0);
    setModo(m);
    setEntrada(texto);
    setSemitonos(0);
  };

  const transponer = (delta: number) => {
    detener();
    setSemitonos((s) => Math.max(-12, Math.min(12, s + delta)));
  };

  const escucharNotas = () => {
    if (modo !== 'notas' || trans.tipo !== 'notas' || trans.notas.length === 0) {
      return;
    }
    if (reproduciendo) {
      detener();
      return;
    }
    ensureAudioContext();
    const repro = tocarMelodia(
      trans.notas.map((n) => ({ midi: n.midi, segundos: 0.55 })),
    );
    reproRef.current = repro;
    setReproduciendo(true);
    void repro.fin.finally(() => {
      if (reproRef.current === repro) {
        reproRef.current = null;
        setReproduciendo(false);
      }
    });
  };

  const escucharAcordes = async () => {
    if (modo !== 'acordes' || trans.tipo !== 'acordes' || trans.acordes.length === 0) {
      return;
    }
    if (reproduciendo) {
      detener();
      return;
    }
    ensureAudioContext();
    const run = ++runRef.current;
    setReproduciendo(true);
    for (let i = 0; i < trans.acordes.length; i++) {
      if (run !== runRef.current) return;
      const midis = midisDeAcorde(analisis.tipo === 'acordes' ? analisis.acordes[i] : trans.acordes[i], 48, semitonos);
      setSuenaIdx(i);
      const repro = tocarAcorde(midis, 1, 'triangle', 0.07);
      reproRef.current = repro;
      await repro.fin;
      if (run !== runRef.current) return;
      reproRef.current = null;
      setSuenaIdx(null);
      await pausa(120);
    }
    if (run === runRef.current) {
      reproRef.current = null;
      setSuenaIdx(null);
      setReproduciendo(false);
    }
  };

  const escucharUno = (i: number) => {
    if (modo === 'acordes') {
      if (trans.tipo !== 'acordes' || !trans.acordes[i]) return;
    } else if (trans.tipo !== 'notas' || !trans.notas[i]) {
      return;
    }
    detener();
    ensureAudioContext();
    setPaso(i);
    let repro: Reproduccion;
    if (modo === 'acordes' && trans.tipo === 'acordes') {
      const acorde =
        analisis.tipo === 'acordes' ? analisis.acordes[i] : trans.acordes[i];
      repro = tocarAcorde(midisDeAcorde(acorde, 48, semitonos), 0.9);
    } else if (trans.tipo === 'notas') {
      repro = tocarMelodia([{ midi: trans.notas[i].midi, segundos: 0.6 }]);
    } else {
      return;
    }
    reproRef.current = repro;
    setSuenaIdx(i);
    setReproduciendo(true);
    void repro.fin.finally(() => {
      if (reproRef.current === repro) {
        reproRef.current = null;
        setReproduciendo(false);
        setSuenaIdx(null);
      }
    });
  };

  const alternarUno = (i: number) => {
    if (reproduciendo && suenaIdx === i) {
      detener();
      return;
    }
    escucharUno(i);
  };

  const indicePaso = Math.min(paso, Math.max(0, validos - 1));

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-6">
      <button onClick={volver} className="mb-4 inline-flex min-h-9 items-center px-2 text-sm text-slate-400 hover:text-white">
        {'< Volver'}
      </button>
      <h2 className="text-2xl font-bold text-white">Tono y cejilla</h2>
      <p className="mt-1 text-sm text-slate-400">
        Pegá los acordes o las notas de una canción: te digo el tono, cómo
        transponerla y cómo tocarla con guitarra.
      </p>

      <GuiaTono />

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => cambiarModo('acordes')}
          className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold ${
            modo === 'acordes'
              ? 'bg-violet-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Acordes (canción)
        </button>
        <button
          onClick={() => cambiarModo('notas')}
          className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold ${
            modo === 'notas'
              ? 'bg-violet-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Notas (melodía)
        </button>
      </div>

      <label className="mt-4 block text-sm text-slate-300">
        {modo === 'acordes' ? 'Acordes de la canción' : 'Notas de la melodía'}
        <textarea
          value={entrada}
          onChange={(e) => {
            detener();
            setPaso(0);
            setEntrada(e.target.value);
            setSemitonos(0);
          }}
          rows={2}
          placeholder={
            modo === 'acordes' ? 'Ej: Sol Do Re7 Sol' : 'Ej: Do Re Mi Fa Sol'
          }
          className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white placeholder:text-slate-600 focus:border-violet-500 focus:outline-none"
        />
      </label>
      <p className="mt-1 text-xs text-slate-500">
        {modo === 'acordes'
          ? 'Separá con espacios. También vale Lam, Sib, Fa#m7, Do sostenido mayor.'
          : 'Separá con espacios. Octava opcional (Do4). Si no, la app elige la más cercana. En Notas, "La7" es la nota La octava 7; el acorde La7 va en Acordes.'}
      </p>

      {analisis.errores.length > 0 && (
        <div className="mt-3 rounded-xl bg-yellow-950 p-3 text-sm text-yellow-200">
          <p className="font-semibold">No pude leer todo:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {analisis.errores.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3">
        <p className="text-xs text-slate-500">Probar un ejemplo:</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {EJEMPLOS[modo].map((e) => (
            <button
              key={e.texto}
              onClick={() => usarEjemplo(modo, e.texto)}
              className="min-h-9 rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200 hover:bg-slate-700"
            >
              {e.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {validos === 0 && (
        <div className="mt-4 rounded-xl bg-slate-900 p-4 text-sm text-slate-400">
          {entrada.trim() === ''
            ? 'Escribí algunos acordes o notas para empezar.'
            : 'No hay datos válidos todavía. Revisá los avisos de arriba o probá un ejemplo.'}
        </div>
      )}

      {tono && (
        <>
          <div className="mt-4 rounded-2xl bg-slate-900 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Tono probable
                </p>
                <p className="mt-1 text-3xl font-black text-white">{nombreTono}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${COLOR_CONFIANZA[tono.confianza]}`}
              >
                Confianza {tono.confianza}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-300">{tono.explicacion}</p>
            {tonos[1] && (
              <p className="mt-2 text-xs text-slate-400">
                También podría ser{' '}
                <b className="text-slate-200">{tonos[1].nombre}</b> (
                {tonos[1].coincidencias} de {tonos[1].total}).
              </p>
            )}
            {tono.confianza !== 'alta' && (
              <p className="mt-2 text-xs text-yellow-300">
                No es 100% seguro: puede haber otra tonalidad parecida. Si
                agregás el último acorde, la respuesta mejora.
              </p>
            )}
            {semitonos !== 0 && tonosOriginales[0] && (
              <p className="mt-2 text-xs text-slate-500">
                Tono original: {tonosOriginales[0].nombre}. Ahora está{' '}
                {semitonos > 0
                  ? `${semitonos} semitono(s) más agudo`
                  : `${Math.abs(semitonos)} semitono(s) más grave`}
                .
              </p>
            )}
          </div>

          <div className="mt-3 rounded-xl bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Transponer</p>
              <p className="text-xs text-slate-400">
                {semitonos === 0
                  ? 'Tono original'
                  : `${semitonos > 0 ? '+' : ''}${semitonos} semitono${
                      Math.abs(semitonos) === 1 ? '' : 's'
                    }`}
              </p>
            </div>
            <div className="mt-2 grid grid-cols-5 gap-2">
              <button
                onClick={() => transponer(-12)}
                disabled={semitonos <= -12}
                className="rounded-lg bg-slate-800 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-40"
              >
                -12
              </button>
              <button
                onClick={() => transponer(-1)}
                disabled={semitonos <= -12}
                className="rounded-lg bg-slate-800 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-40"
              >
                -1
              </button>
              <button
                onClick={() => {
                  detener();
                  setSemitonos(0);
                }}
                className="rounded-lg bg-slate-800 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                0
              </button>
              <button
                onClick={() => transponer(1)}
                disabled={semitonos >= 12}
                className="rounded-lg bg-slate-800 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-40"
              >
                +1
              </button>
              <button
                onClick={() => transponer(12)}
                disabled={semitonos >= 12}
                className="rounded-lg bg-slate-800 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-40"
              >
                +12
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              1 semitono = 1 traste. -12/+12 cambia una octava.
            </p>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-semibold text-white">
              {modo === 'acordes' ? 'Acordes en este tono' : 'Notas en este tono'}
            </h3>

            <div className="mt-2 flex gap-2">
              <button
                onClick={() => {
                  detener();
                  setModoEscucha('auto');
                }}
                className={`min-h-9 flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  modoEscucha === 'auto'
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Automático
              </button>
              <button
                onClick={() => {
                  detener();
                  setModoEscucha('paso');
                }}
                className={`min-h-9 flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  modoEscucha === 'paso'
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                A mi ritmo
              </button>
            </div>

            {modoEscucha === 'auto' ? (
              <button
                onClick={
                  modo === 'acordes' ? () => void escucharAcordes() : escucharNotas
                }
                className="mt-2 min-h-9 w-full rounded-lg bg-slate-800 py-2 text-xs font-semibold text-white hover:bg-slate-700"
              >
                {reproduciendo
                  ? 'Detener'
                  : modo === 'acordes'
                    ? 'Escuchar todos los acordes'
                    : 'Escuchar toda la melodía'}
              </button>
            ) : (
              <div className="mt-2 rounded-xl bg-slate-900 p-3">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>
                    {modo === 'acordes' ? 'Acorde' : 'Nota'} {indicePaso + 1} de{' '}
                    {validos}
                  </span>
                  <span className="text-xs text-slate-500">
                    {reproduciendo ? 'Sonando...' : 'Elegí uno'}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => alternarUno(Math.max(0, indicePaso - 1))}
                    disabled={indicePaso === 0}
                    className="min-h-9 rounded-lg bg-slate-800 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => alternarUno(indicePaso)}
                    className="min-h-9 rounded-lg bg-violet-600 py-1.5 text-xs font-semibold text-white hover:bg-violet-500"
                  >
                    {reproduciendo && suenaIdx === indicePaso
                      ? 'Detener'
                      : 'Escuchar'}
                  </button>
                  <button
                    onClick={() =>
                      alternarUno(Math.min(validos - 1, indicePaso + 1))
                    }
                    disabled={indicePaso >= validos - 1}
                    className="min-h-9 rounded-lg bg-slate-800 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-40"
                  >
                    Siguiente
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  La reproducción no avanza sola. También podés tocar "Escuchar"
                  en la lista.
                </p>
              </div>
            )}

            {modo === 'acordes' && trans.tipo === 'acordes' ? (
              <ul className="mt-2 space-y-2">
                {trans.acordes.map((a, i) => (
                  <li
                    key={i}
                    className={`rounded-lg px-4 py-2 ${
                      suenaIdx === i
                        ? 'bg-violet-900/80 ring-1 ring-violet-400'
                        : 'bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-semibold text-white">
                          {nombreAcorde(a)}
                        </span>
                        <span className="ml-2 text-xs text-slate-500">
                          {notasDeAcorde(a).join(' · ')}
                        </span>
                      </div>
                      <button
                        onClick={() => alternarUno(i)}
                        className="min-h-9 shrink-0 rounded-lg bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                      >
                        {suenaIdx === i ? 'Detener' : 'Escuchar'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : trans.tipo === 'notas' ? (
              <ul className="mt-2 space-y-2">
                {trans.notas.map((n, i) => {
                  const pos = posicionesGuitarra(n.midi);
                  return (
                    <li key={i} className="rounded-lg bg-slate-900 px-4 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-white">
                          {midiToNombre(n.midi)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">
                            {Math.round(midiToFreq(n.midi))} Hz
                          </span>
                          <button
                            onClick={() => alternarUno(i)}
                            className="min-h-9 shrink-0 rounded-lg bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                          >
                            {suenaIdx === i ? 'Detener' : 'Escuchar'}
                          </button>
                        </div>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {textoPosiciones(pos, n.midi)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : null}

            {modo === 'acordes' && (
              <p className="mt-2 text-xs text-slate-500">
                Los acordes se muestran con #: La# y Sib son la misma nota.
              </p>
            )}
            {modo === 'notas' && (
              <p className="mt-2 text-xs text-slate-500">
                Afinación estándar: 6ª = Mi grave, 5ª = La, 4ª = Re, 3ª = Sol,
                2ª = Si, 1ª = Mi agudo.
              </p>
            )}
            {faltanOctavas && (
              <p className="mt-2 text-xs text-yellow-300">
                Algunas notas no tenían octava; elegí la más cercana. Si querés
                fijarla, escribí Do4, Re4, etc.
              </p>
            )}
          </div>

          {modo === 'acordes' && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-white">
                Cómo tocarlo en guitarra
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Las opciones de abajo te dejan acordes fáciles. La cejilla sube
                todo: cada traste es un semitono.
              </p>
              <div className="mt-2 space-y-2">
                {cejillas.map((s) => (
                  <div
                    key={s.traste}
                    className={`rounded-xl bg-slate-900 p-4 ${
                      s.recomendada ? 'border border-violet-700' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-white">
                        {s.traste === 0
                          ? 'Sin cejilla'
                          : `Cejilla en el traste ${s.traste}`}
                        <span className="font-normal text-slate-400">
                          {' '}
                          · formas de {s.formaCorta}
                        </span>
                      </p>
                      {s.recomendada && (
                        <span className="shrink-0 rounded-full bg-violet-900 px-2 py-0.5 text-xs font-semibold text-violet-200">
                          Recomendado
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-300">
                      {s.acordes.map(nombreAcorde).join(' · ')}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {s.traste === 0
                        ? `Tocá estos acordes: suenan en ${nombreTono}.`
                        : `Poné la cejilla en ${s.traste} y tocá estos acordes: suenan en ${nombreTono}.`}
                    </p>
                  </div>
                ))}
              </div>
              <button
                onClick={() =>
                  alAbrirGuitarra(acordesAnalizados.map(nombreAcorde))
                }
                disabled={
                  acordesAnalizados.length === 0 ||
                  acordesAnalizados.length > 64
                }
                className="mt-3 min-h-11 w-full rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Practicar estos acordes en Guitarra
              </button>
              <p className="mt-2 text-xs text-slate-500">
                Sin cejilla, los acordes son los de la lista de arriba. Si te
                quedan incómodos, probá una de las opciones con cejilla.
              </p>
            </div>
          )}

          {modo === 'notas' && acompanamiento.length > 0 && (
            <div className="mt-4 rounded-xl bg-slate-900 p-4">
              <p className="text-sm font-semibold text-white">
                Para acompañar con acordes
              </p>
              <p className="mt-1 text-sm text-slate-300">
                En {nombreTono}, los acordes principales son:{' '}
                {acompanamiento.map(nombreAcorde).join(' · ')}.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Si querés una cejilla, pasá a Acordes y escribí los acordes de la
                canción.
              </p>
            </div>
          )}

          <p className="mt-4 text-center text-xs text-slate-600">
            El tono es una estimación. La app no reemplaza tu oído: probá y
            ajustá.
          </p>
        </>
      )}
    </div>
  );
}
