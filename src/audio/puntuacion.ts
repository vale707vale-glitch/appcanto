// Puntuacion de notas cantadas. Compartida por ejercicios y canciones.

export type Diagnostico =
  | 'afinado'
  | 'cerca_alto'
  | 'cerca_bajo'
  | 'alto'
  | 'bajo'
  | 'octava'
  | 'sin_voz';

export interface NotaResultado {
  midi: number;
  precision: number; // 0..100
  conVoz: number;
  tramas: number;
  centsMedio: number; // desviacion media, ya normalizada de octava
  octava: number; // -1 abajo, 1 arriba, 0 igual
  diagnostico: Diagnostico;
  detalle: string;
}

export interface ConteoOctava {
  arriba: number;
  abajo: number;
  voz: number;
}

export const TIEMPO_MINIMO_CANTO_MS = 500;

export function alcanzaCantoMinimo(tiempoVozMs: number): boolean {
  return tiempoVozMs >= TIEMPO_MINIMO_CANTO_MS;
}

export function contarOctava(
  conteo: ConteoOctava,
  centsNormalizado: number | null,
  octavas: number,
  tolerancia: number,
): void {
  if (centsNormalizado === null) return;
  conteo.voz++;
  if (octavas !== 0 && Math.abs(centsNormalizado) <= tolerancia * 2) {
    if (octavas > 0) conteo.arriba++;
    else conteo.abajo++;
  }
}

export function puntuar(
  hist: (number | null)[],
  tol: number,
  octava: ConteoOctava,
  midi: number,
): NotaResultado {
  const voz = hist.filter((c): c is number => c !== null);
  let dentro = 0;
  let cerca = 0;
  for (const c of voz) {
    const a = Math.abs(c);
    if (a <= tol) dentro++;
    else if (a <= tol * 2) cerca++;
  }
  const precision =
    hist.length === 0
      ? 0
      : Math.round(((dentro + cerca * 0.5) / hist.length) * 100);
  const centsMedio =
    voz.length === 0
      ? 0
      : Math.round(voz.reduce((a, c) => a + c, 0) / voz.length);

  const octavaTotal = octava.arriba + octava.abajo;
  const octavaPredominante = octavaTotal > octava.voz * 0.5;
  const octavaDir = octava.abajo > octava.arriba ? -1 : 1;

  let diagnostico: Diagnostico;
  let detalle: string;
  let octavaResultado = 0;

  if (voz.length === 0) {
    diagnostico = 'sin_voz';
    detalle = 'No se detectó tu voz. Revisá el micrófono y cantá más fuerte.';
  } else if (octavaPredominante) {
    diagnostico = 'octava';
    octavaResultado = octavaDir;
    detalle = `Cantaste una octava ${octavaDir > 0 ? 'arriba' : 'abajo'}: la nota es la misma, cuenta igual.`;
  } else if (Math.abs(centsMedio) <= tol) {
    diagnostico = 'afinado';
    detalle = 'Afinado: te mantuviste en la nota.';
  } else if (Math.abs(centsMedio) <= tol * 2) {
    if (centsMedio > 0) {
      diagnostico = 'cerca_alto';
      detalle = 'Casi: un poco alto, bajá un poco.';
    } else {
      diagnostico = 'cerca_bajo';
      detalle = 'Casi: un poco bajo, subí un poco.';
    }
  } else if (centsMedio > 0) {
    diagnostico = 'alto';
    detalle = 'Muy alto: bajá.';
  } else {
    diagnostico = 'bajo';
    detalle = 'Muy bajo: subí.';
  }

  return {
    midi,
    precision,
    conVoz: voz.length,
    tramas: hist.length,
    centsMedio,
    octava: octavaResultado,
    diagnostico,
    detalle,
  };
}
