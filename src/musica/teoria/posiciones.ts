import type { PosicionGuitarra, PosicionesNota } from '../teoria';

const CUERDAS = [
  { n: 6, midi: 40, nombre: 'Mi grave' },
  { n: 5, midi: 45, nombre: 'La' },
  { n: 4, midi: 50, nombre: 'Re' },
  { n: 3, midi: 55, nombre: 'Sol' },
  { n: 2, midi: 59, nombre: 'Si' },
  { n: 1, midi: 64, nombre: 'Mi agudo' },
];

export function nombreCuerda(n: number): string {
  return CUERDAS.find((c) => c.n === n)?.nombre ?? '';
}

export function posicionesGuitarra(midi: number): PosicionesNota {
  const exactas = buscarPosiciones(midi);
  if (exactas.length > 0) {
    return { midiUsado: midi, exacta: true, posiciones: exactas };
  }
  for (const delta of [-12, -24, 12, 24]) {
    const posiciones = buscarPosiciones(midi + delta);
    if (posiciones.length > 0) {
      return {
        midiUsado: midi + delta,
        exacta: false,
        posiciones,
      };
    }
  }
  return { midiUsado: midi, exacta: false, posiciones: [] };
}

function buscarPosiciones(midi: number): PosicionGuitarra[] {
  const posiciones: PosicionGuitarra[] = [];
  for (const cuerda of CUERDAS) {
    const traste = midi - cuerda.midi;
    if (traste >= 0 && traste <= 12) {
      posiciones.push({ cuerda: cuerda.n, traste });
    }
  }
  return posiciones;
}
