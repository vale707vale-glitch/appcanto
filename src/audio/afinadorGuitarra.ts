export type EstadoAfinacionGuitarra =
  | 'en-tono'
  | 'un-poco-baja'
  | 'un-poco-alta'
  | 'baja'
  | 'alta'
  | 'octava-baja'
  | 'octava-alta';

export function clasificarDesviacionCuerda(
  cents: number,
): EstadoAfinacionGuitarra {
  if (!Number.isFinite(cents)) {
    throw new Error('La desviación de afinación debe ser un número válido.');
  }
  if (Math.abs(Math.abs(cents) - 1200) <= 60) {
    return cents < 0 ? 'octava-baja' : 'octava-alta';
  }
  if (Math.abs(cents) <= 5) return 'en-tono';
  if (Math.abs(cents) <= 50) return cents < 0 ? 'un-poco-baja' : 'un-poco-alta';
  return cents < 0 ? 'baja' : 'alta';
}
