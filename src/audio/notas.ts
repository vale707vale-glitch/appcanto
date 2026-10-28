// Utilidades de notas musicales. Referencia: A4 = 440 Hz.

export const A4_FREQ = 440;
export const A4_MIDI = 69;

// Nombres en espanol (sostenidos con #)
const NOMBRES = [
  'Do',
  'Do#',
  'Re',
  'Re#',
  'Mi',
  'Fa',
  'Fa#',
  'Sol',
  'Sol#',
  'La',
  'La#',
  'Si',
];

export function midiToFreq(midi: number): number {
  return A4_FREQ * Math.pow(2, (midi - A4_MIDI) / 12);
}

export function freqToMidiFloat(freqHz: number): number {
  return A4_MIDI + 12 * Math.log2(freqHz / A4_FREQ);
}

/** Nombre en espanol + octava, p. ej. 69 -> "La4". */
export function midiToNombre(midiRedondeado: number): string {
  const pc = ((midiRedondeado % 12) + 12) % 12;
  const octava = Math.floor(midiRedondeado / 12) - 1;
  return `${NOMBRES[pc]}${octava}`;
}

/**
 * Desviacion en cents de una frecuencia respecto a una nota MIDI objetivo.
 * +100 = un semitono alto, -100 = un semitono bajo.
 */
export function centsDesviacion(freqHz: number, midiObjetivo: number): number {
  return 1200 * Math.log2(freqHz / midiToFreq(midiObjetivo));
}

/**
 * Lleva una desviacion en cents a la octava mas cercana.
 * Cantar la nota correcta una octava abajo (o arriba) no debe contar como error
 * para un principiante. Devuelve cents en -600..600 y las octavas desplazadas.
 */
export function normalizarOctava(cents: number): { cents: number; octavas: number } {
  const octavas = Math.round(cents / 1200);
  const centsNormalizados = cents - octavas * 1200;
  if (Math.abs(centsNormalizados) > 200) {
    return { cents, octavas: 0 };
  }
  return { cents: centsNormalizados, octavas };
}

/** Nota detectada mas cercana a una frecuencia. */
export function freqANotaMasCercana(freqHz: number): {
  midi: number;
  nombre: string;
  centsOff: number;
} {
  const midiFloat = freqToMidiFloat(freqHz);
  const midi = Math.round(midiFloat);
  return {
    midi,
    nombre: midiToNombre(midi),
    centsOff: Math.round((midiFloat - midi) * 100),
  };
}
