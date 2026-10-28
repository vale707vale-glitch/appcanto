import { freqANotaMasCercana } from '../audio/notas';
import type { TransposicionVocal } from '../storage/progreso';

export interface MuestraVocal {
  freqHz: number | null;
  claridad: number;
}

export function detectarNotaEstable(
  muestras: readonly MuestraVocal[],
): number | null {
  const notas = muestras
    .filter(
      (muestra) =>
        muestra.freqHz !== null &&
        Number.isFinite(muestra.freqHz) &&
        muestra.claridad >= 0.6,
    )
    .map((muestra) => freqANotaMasCercana(muestra.freqHz!).midi)
    .sort((a, b) => a - b);

  if (notas.length < 8) return null;

  const mediana = notas[Math.floor(notas.length / 2)];
  const estables = notas.filter((nota) => Math.abs(nota - mediana) <= 1);
  return estables.length / notas.length >= 0.75 ? mediana : null;
}

export function sugerirTransposicionVocal(
  notasObjetivo: readonly number[],
  graveMidi: number,
  agudaMidi: number,
): TransposicionVocal {
  const opciones: TransposicionVocal[] = [-12, 0, 12];
  let mejor = 0;
  let mejorDentro = -1;

  for (const opcion of opciones) {
    const dentro = notasObjetivo.filter(
      (nota) => nota + opcion >= graveMidi && nota + opcion <= agudaMidi,
    ).length;
    if (
      dentro > mejorDentro ||
      (dentro === mejorDentro && Math.abs(opcion) < Math.abs(mejor))
    ) {
      mejor = opcion;
      mejorDentro = dentro;
    }
  }

  return mejor as TransposicionVocal;
}
