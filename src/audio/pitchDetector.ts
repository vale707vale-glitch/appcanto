// Modulo aislado de deteccion de tono (metodo McLeod via `pitchy`).
// Interfaz clara: la UI solo usa PitchDetector y PitchFrame.

import { PitchDetector as McLeod } from 'pitchy';
import {
  centsDesviacion,
  freqANotaMasCercana,
  normalizarOctava,
} from './notas';

export const MIN_FREQ_HZ = 80; // rango vocal tipico
export const MAX_FREQ_HZ = 1250;
export const CLARITY_MIN = 0.6; // umbral de confianza de pitchy (0..1)

/** Un fotograma de deteccion. freqHz === null significa "sin voz / sin tono". */
export interface PitchFrame {
  t: number; // timestamp (performance.now())
  freqHz: number | null;
  clarity: number;
  nivel: number; // volumen RMS (0..1 aprox), para el medidor de microfono
  centsVsObjetivo: number | null; // desviacion cruda en cents
  centsAfinado: number | null; // desviacion respecto de la octava mas cercana
  octavas: number; // -1 = una octava abajo, 1 = una octava arriba, 0 = igual
}

export class PitchDetector {
  private detector: ReturnType<typeof McLeod.forFloat32Array>;
  private buffer: Float32Array<ArrayBuffer>;
  private sampleRate: number;
  private suavizado: number | null = null;

  constructor(bufferSize = 2048, sampleRate = 48000) {
    this.detector = McLeod.forFloat32Array(bufferSize);
    this.buffer = new Float32Array(new ArrayBuffer(bufferSize * 4));
    this.sampleRate = sampleRate;
  }

  setSampleRate(sr: number): void {
    this.sampleRate = sr;
  }

  get inputBuffer(): Float32Array<ArrayBuffer> {
    return this.buffer;
  }

  private nivelRms(): number {
    let suma = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      suma += this.buffer[i] * this.buffer[i];
    }
    return Math.sqrt(suma / this.buffer.length);
  }

  /**
   * Analiza el contenido actual de `inputBuffer` (dominio temporal).
   * Si se pasa midiObjetivo, calcula tambien la desviacion en cents.
   */
  update(midiObjetivo: number | null = null): PitchFrame {
    const [pitch, clarity] = this.detector.findPitch(
      this.buffer,
      this.sampleRate,
    );

    let freqHz: number | null = null;
    if (
      Number.isFinite(pitch) &&
      clarity >= CLARITY_MIN &&
      pitch >= MIN_FREQ_HZ &&
      pitch <= MAX_FREQ_HZ
    ) {
      // Suavizado leve para que la curva se dibuje fluida
      this.suavizado =
        this.suavizado === null ? pitch : this.suavizado * 0.6 + pitch * 0.4;
      freqHz = this.suavizado;
    } else {
      this.suavizado = null;
    }

    const centsVsObjetivo =
      freqHz !== null && midiObjetivo !== null
        ? centsDesviacion(freqHz, midiObjetivo)
        : null;
    const afinado =
      centsVsObjetivo === null ? null : normalizarOctava(centsVsObjetivo);

    return {
      t: performance.now(),
      freqHz,
      clarity,
      nivel: this.nivelRms(),
      centsVsObjetivo,
      centsAfinado: afinado?.cents ?? null,
      octavas: afinado?.octavas ?? 0,
    };
  }

  reset(): void {
    this.suavizado = null;
  }
}

/** Clasificacion de afinacion segun tolerancia en cents. */
export type Afinacion = 'dentro' | 'cerca' | 'fuera' | 'silencio';

export function clasificarCents(
  cents: number | null,
  tolerancia: number,
): Afinacion {
  if (cents === null || !Number.isFinite(cents)) return 'silencio';
  const a = Math.abs(cents);
  if (a <= tolerancia) return 'dentro';
  if (a <= tolerancia * 2) return 'cerca';
  return 'fuera';
}

export { freqANotaMasCercana };
