import { describe, expect, it } from 'vitest';
import { midiToFreq } from '../audio/notas';
import {
  detectarNotaEstable,
  sugerirTransposicionVocal,
} from './rangoVocal';

describe('calibración del rango vocal', () => {
  it('encuentra una nota estable e ignora cuadros sin voz', () => {
    const muestras = [
      ...Array.from({ length: 10 }, () => ({
        freqHz: midiToFreq(48),
        claridad: 0.9,
      })),
      { freqHz: null, claridad: 0 },
    ];
    expect(detectarNotaEstable(muestras)).toBe(48);
  });

  it('rechaza muestras cortas o inestables', () => {
    expect(
      detectarNotaEstable(
        Array.from({ length: 7 }, () => ({
          freqHz: midiToFreq(48),
          claridad: 0.9,
        })),
      ),
    ).toBeNull();
    expect(
      detectarNotaEstable(
        Array.from({ length: 12 }, (_, indice) => ({
          freqHz: midiToFreq(indice % 2 === 0 ? 48 : 55),
          claridad: 0.9,
        })),
      ),
    ).toBeNull();
  });

  it('no usa tramas con claridad baja', () => {
    expect(
      detectarNotaEstable(
        Array.from({ length: 10 }, () => ({
          freqHz: midiToFreq(48),
          claridad: 0.4,
        })),
      ),
    ).toBeNull();
  });

  it.each([
    [48, 60, -12],
    [60, 72, 0],
    [72, 84, 12],
  ] as const)(
    'sugiere la octava que deja más notas dentro del rango %i-%i',
    (grave, aguda, esperado) => {
      expect(
        sugerirTransposicionVocal([60, 64, 67, 72], grave, aguda),
      ).toBe(esperado);
    },
  );
});
