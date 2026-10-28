export function transponerNotas<T extends { midi: number }>(
  notas: readonly T[],
  semitonos: number,
): T[] {
  return notas.map((nota) => ({ ...nota, midi: nota.midi + semitonos }));
}

export function cambiarTempo<T extends { segundos: number }>(
  notas: readonly T[],
  porcentaje: number,
): T[] {
  if (!Number.isInteger(porcentaje) || porcentaje < 50 || porcentaje > 100) {
    throw new Error('El tempo debe estar entre 50% y 100%.');
  }
  const factor = 100 / porcentaje;
  return notas.map((nota) => ({
    ...nota,
    segundos: nota.segundos * factor,
  }));
}

export function repetirNotasDeFragmento<T>(
  notas: readonly T[],
  desde: number,
  hasta: number,
  repeticiones: number,
): T[] {
  if (
    !Number.isInteger(desde) ||
    !Number.isInteger(hasta) ||
    desde < 0 ||
    hasta < desde ||
    hasta >= notas.length ||
    !Number.isInteger(repeticiones) ||
    repeticiones < 2 ||
    repeticiones > 8
  ) {
    throw new Error('El fragmento o la cantidad de repeticiones no son válidos.');
  }
  const fragmento = notas.slice(desde, hasta + 1);
  return Array.from({ length: repeticiones }, () => fragmento).flat();
}
