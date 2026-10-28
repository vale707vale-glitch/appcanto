import { describe, expect, it } from 'vitest';
import { midiToFreq } from '../audio/notas';
import { MAX_FREQ_HZ, MIN_FREQ_HZ } from '../audio/pitchDetector';
import { CANCIONES } from '../data/canciones';
import { EJERCICIOS } from '../data/ejercicios';
import {
  cambiarTempo,
  repetirNotasDeFragmento,
  transponerNotas,
} from './transposicion';

describe('transponerNotas', () => {
  it('cambia la altura manteniendo los datos de cada nota', () => {
    const notas = [
      { midi: 60, segundos: 2, texto: 'do' },
      { midi: 64, segundos: 1, texto: 'mi' },
    ];

    expect(transponerNotas(notas, -12)).toEqual([
      { midi: 48, segundos: 2, texto: 'do' },
      { midi: 52, segundos: 1, texto: 'mi' },
    ]);
    expect(notas[0].midi).toBe(60);
  });

  describe('cambiarTempo', () => {
    it('alenta la melodía manteniendo las notas y el resto de sus datos', () => {
      const notas = [
        { midi: 60, segundos: 1, silaba: 'la' },
        { midi: 64, segundos: 0.5, silaba: 'mi' },
      ];

      expect(cambiarTempo(notas, 50)).toEqual([
        { midi: 60, segundos: 2, silaba: 'la' },
        { midi: 64, segundos: 1, silaba: 'mi' },
      ]);
      expect(notas[0].segundos).toBe(1);
    });

    describe('repetirNotasDeFragmento', () => {
      it('repite solo el segmento seleccionado sin alterar las notas', () => {
        const notas = [
          { midi: 60, segundos: 1 },
          { midi: 62, segundos: 0.5 },
          { midi: 64, segundos: 2 },
        ];

        expect(repetirNotasDeFragmento(notas, 1, 2, 2)).toEqual([
          notas[1],
          notas[2],
          notas[1],
          notas[2],
        ]);
      });

      it.each([
        [-1, 1, 2],
        [1, 3, 2],
        [2, 1, 2],
        [0, 1, 1],
        [0, 1, 9],
      ])('rechaza límites o repeticiones inválidos: %s', (desde, hasta, veces) => {
        expect(() =>
          repetirNotasDeFragmento([{ midi: 60 }, { midi: 62 }], desde, hasta, veces),
        ).toThrow('no son válidos');
      });
    });

    it.each([0, 49, 101, 75.5])('rechaza un tempo no admitido: %s', (tempo) => {
      expect(() => cambiarTempo([{ segundos: 1 }], tempo)).toThrow(
        'El tempo debe estar entre 50% y 100%.',
      );
    });
  });

  it('acepta transposición neutra y ascendente', () => {
    const notas = [{ midi: 72 }];

    expect(transponerNotas(notas, 0)).toEqual([{ midi: 72 }]);
    expect(transponerNotas(notas, 12)).toEqual([{ midi: 84 }]);
  });

  it('mantiene las notas de ejercicios y canciones dentro del detector', () => {
    const notas = [
      ...EJERCICIOS.flatMap((ejercicio) => ejercicio.notas),
      ...CANCIONES.flatMap((cancion) => cancion.notas),
    ];

    for (const semitonos of [-12, 0, 12]) {
      for (const nota of transponerNotas(notas, semitonos)) {
        const frecuencia = midiToFreq(nota.midi);
        expect(frecuencia).toBeGreaterThanOrEqual(MIN_FREQ_HZ);
        expect(frecuencia).toBeLessThanOrEqual(MAX_FREQ_HZ);
      }
    }
  });
});
