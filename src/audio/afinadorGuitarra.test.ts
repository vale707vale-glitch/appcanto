import { describe, expect, it } from 'vitest';
import { clasificarDesviacionCuerda } from './afinadorGuitarra';

describe('afinador de guitarra', () => {
  it.each([
    [-1200, 'octava-baja'],
    [-25, 'un-poco-baja'],
    [-5, 'en-tono'],
    [0, 'en-tono'],
    [5, 'en-tono'],
    [25, 'un-poco-alta'],
    [80, 'alta'],
    [1200, 'octava-alta'],
  ] as const)('clasifica %s cents como %s', (cents, estado) => {
    expect(clasificarDesviacionCuerda(cents)).toBe(estado);
  });

  it('rechaza una desviación que no sea numérica', () => {
    expect(() => clasificarDesviacionCuerda(Number.NaN)).toThrow(
      'La desviación de afinación debe ser un número válido.',
    );
  });
});
