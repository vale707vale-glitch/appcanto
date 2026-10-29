// Notas de referencia generadas con osciladores (sin archivos de audio).
// El AudioContext compartido se crea SOLO tras un gesto del usuario (clic).

import { midiToFreq } from './notas';
import {
  contextoAudioActual,
  obtenerContextoAudio,
  reanudarContextoAudio,
} from './contexto';

export function ensureAudioContext(): AudioContext {
  const contexto = obtenerContextoAudio();
  if (contexto.state === 'suspended') void reanudarContextoAudio();
  return contexto;
}

export function getAudioContext(): AudioContext | null {
  return contextoAudioActual();
}

/** Toca una nota MIDI con envolvente suave. Devuelve cuando termina. */
export interface NotaMelodia {
  midi: number;
  segundos: number;
}

export interface Reproduccion {
  /** Momento (performance.now) en que empieza a sonar la primera nota. */
  inicioMs: number;
  fin: Promise<void>;
  detener: () => void;
}

/**
 * Toca una melodia completa con osciladores, programando todas las notas
 * de antemano para que el ritmo sea parejo. Pensada para cantar encima.
 */
export function tocarMelodia(
  notas: NotaMelodia[],
  audioCtx: AudioContext = ensureAudioContext(),
  tipo: OscillatorType = 'sine',
  volumen = 0.2,
): Reproduccion {
  const lead = 0.06;
  const inicioMs = performance.now() + lead * 1000;
  const t0 = audioCtx.currentTime + lead;
  const pares: { osc: OscillatorNode; gain: GainNode }[] = [];
  let t = t0;

  for (const n of notas) {
    const dur = Math.max(0.12, n.segundos);
    const ataque = Math.min(0.04, dur * 0.2);
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = tipo;
    osc.frequency.value = midiToFreq(n.midi);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volumen, t + ataque);
    gain.gain.setValueAtTime(volumen, t + Math.max(ataque, dur - 0.06));
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    pares.push({ osc, gain });
    t += dur;
  }

  const duracionMs = (t - t0) * 1000;
  let resolver: () => void = () => undefined;
  const fin = new Promise<void>((resolve) => {
    let terminado = false;
    const terminar = () => {
      if (terminado) return;
      terminado = true;
      for (const { osc, gain } of pares) {
        try {
          osc.stop();
        } catch {
          // ya estaba detenido
        }
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {
          // ignorar
        }
      }
      resolve();
    };
    resolver = terminar;
    window.setTimeout(terminar, duracionMs + 120);
  });

  return { inicioMs, fin, detener: () => resolver() };
}

/** Toca un acorde (varias notas a la vez) con control para detenerlo. */
export function tocarAcorde(
  midis: number[],
  segundos = 1,
  tipo: OscillatorType = 'triangle',
  volumen = 0.07,
): Reproduccion {
  const audioCtx = ensureAudioContext();
  const reps = midis.map((midi) =>
    tocarMelodia([{ midi, segundos }], audioCtx, tipo, volumen),
  );
  return {
    inicioMs: reps[0]?.inicioMs ?? performance.now(),
    fin: Promise.all(reps.map((r) => r.fin)).then(() => undefined),
    detener: () => reps.forEach((r) => r.detener()),
  };
}

export type TimbreReferencia = 'voz' | 'nota';

/**
 * Referencia con timbre de voz humana cantando "ah".
 * Sintesis por formantes: una fuente con armonicos pasa por tres filtros
 * (F1/F2/F3) y un vibrato suave. No usa archivos de audio.
 */
export function tocarVoz(
  midi: number,
  duracionSec: number,
  audioCtx: AudioContext = ensureAudioContext(),
  volumen = 0.18,
): Promise<void> {
  return new Promise((resolve) => {
    const t0 = audioCtx.currentTime;
    const dur = Math.max(0.4, duracionSec);
    const ataque = Math.min(0.09, dur * 0.25);
    const liberacion = Math.min(0.18, dur * 0.3);
    const f0 = midiToFreq(midi);

    const fuente = audioCtx.createOscillator();
    fuente.type = 'sawtooth';
    fuente.frequency.setValueAtTime(f0, t0);

    const vibrato = audioCtx.createOscillator();
    const vibratoGanancia = audioCtx.createGain();
    vibrato.type = 'sine';
    vibrato.frequency.setValueAtTime(5.2, t0);
    vibratoGanancia.gain.setValueAtTime(6, t0);
    vibrato.connect(vibratoGanancia);
    vibratoGanancia.connect(fuente.detune);

    const salida = audioCtx.createGain();
    salida.gain.setValueAtTime(0.0001, t0);
    salida.gain.exponentialRampToValueAtTime(volumen, t0 + ataque);
    salida.gain.setValueAtTime(
      volumen,
      t0 + Math.max(ataque, dur - liberacion),
    );
    salida.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    salida.connect(audioCtx.destination);

    const cuerpoFiltro = audioCtx.createBiquadFilter();
    cuerpoFiltro.type = 'lowpass';
    cuerpoFiltro.frequency.setValueAtTime(3200, t0);
    cuerpoFiltro.Q.setValueAtTime(0.6, t0);
    const cuerpo = audioCtx.createGain();
    cuerpo.gain.setValueAtTime(0.22, t0);
    fuente.connect(cuerpoFiltro);
    cuerpoFiltro.connect(cuerpo);
    cuerpo.connect(salida);

    const formantes = [
      { frecuencia: 700, q: 8, ganancia: 0.9 },
      { frecuencia: 1180, q: 11, ganancia: 0.55 },
      { frecuencia: 2600, q: 9, ganancia: 0.28 },
    ];
    const nodos: AudioNode[] = [cuerpoFiltro, cuerpo, salida, vibratoGanancia];
    for (const formante of formantes) {
      const filtro = audioCtx.createBiquadFilter();
      filtro.type = 'bandpass';
      filtro.frequency.setValueAtTime(formante.frecuencia, t0);
      filtro.Q.setValueAtTime(formante.q, t0);
      const ganancia = audioCtx.createGain();
      ganancia.gain.setValueAtTime(formante.ganancia, t0);
      fuente.connect(filtro);
      filtro.connect(ganancia);
      ganancia.connect(salida);
      nodos.push(filtro, ganancia);
    }

    fuente.start(t0);
    vibrato.start(t0);
    fuente.stop(t0 + dur + 0.05);
    vibrato.stop(t0 + dur + 0.05);
    fuente.onended = () => {
      for (const nodo of nodos) {
        try {
          nodo.disconnect();
        } catch {
          // ya estaba desconectado
        }
      }
      try {
        fuente.disconnect();
        vibrato.disconnect();
      } catch {
        // ignorar
      }
      resolve();
    };
  });
}

export function tocarReferencia(
  midi: number,
  duracionSec: number,
  timbre: TimbreReferencia = 'voz',
  audioCtx: AudioContext = ensureAudioContext(),
): Promise<void> {
  return timbre === 'voz'
    ? tocarVoz(midi, duracionSec, audioCtx)
    : tocarNota(midi, duracionSec, audioCtx);
}

export function tocarNota(
  midi: number,
  duracionSec: number,
  audioCtx: AudioContext = ensureAudioContext(),
  tipo: OscillatorType = 'sine',
  volumen = 0.25,
): Promise<void> {
  return new Promise((resolve) => {
    const t0 = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = tipo;
    osc.frequency.value = midiToFreq(midi);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volumen, t0 + 0.05);
    gain.gain.setValueAtTime(volumen, t0 + Math.max(0.05, duracionSec - 0.15));
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duracionSec);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + duracionSec + 0.05);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
      resolve();
    };
  });
}
