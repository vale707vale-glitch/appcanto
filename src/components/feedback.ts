// Textos y colores compartidos para el feedback en vivo.

import type { Afinacion } from '../audio/pitchDetector';

export function consejoDe(c: Afinacion, cents: number): string {
  if (c === 'silencio') return 'Cantá "aaa" más fuerte';
  if (c === 'dentro') return 'Afinado, quedate así';
  const alto = cents > 0;
  if (c === 'cerca') return alto ? 'Un poco alto: bajá' : 'Un poco bajo: subí';
  return alto ? 'Muy alto: bajá' : 'Muy bajo: subí';
}

export function colorEnVivo(c: Afinacion): string {
  if (c === 'dentro') return 'bg-emerald-950 text-emerald-300';
  if (c === 'cerca') return 'bg-yellow-950 text-yellow-300';
  if (c === 'fuera') return 'bg-red-950 text-red-300';
  return 'bg-slate-800 text-slate-300';
}
