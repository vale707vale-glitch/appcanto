import { describe, expect, it } from 'vitest';
import { CANCIONES } from './canciones';
import { EJERCICIOS } from './ejercicios';

describe('repertorio para practicar', () => {
  it('incluye al menos seis ejercicios y seis canciones identificables', () => {
    expect(EJERCICIOS.length).toBeGreaterThanOrEqual(6);
    expect(CANCIONES.length).toBeGreaterThanOrEqual(6);
    expect(new Set(EJERCICIOS.map((pieza) => pieza.id)).size).toBe(
      EJERCICIOS.length,
    );
    expect(new Set(CANCIONES.map((pieza) => pieza.id)).size).toBe(
      CANCIONES.length,
    );
  });

  it('cada práctica tiene instrucciones y notas con duraciones válidas', () => {
    for (const pieza of [...EJERCICIOS, ...CANCIONES]) {
      expect(pieza.descripcion.trim()).not.toBe('');
      expect(pieza.notas.length).toBeGreaterThanOrEqual(4);
      for (const nota of pieza.notas) {
        expect(Number.isInteger(nota.midi)).toBe(true);
        expect(nota.segundos).toBeGreaterThan(0);
        if ('referencia' in nota && nota.referencia !== undefined) {
          expect(Number.isInteger(nota.referencia)).toBe(true);
        }
      }
    }
  });
});
