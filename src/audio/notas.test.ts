import { describe, expect, it } from 'vitest';
import {
  centsDesviacion,
  freqToMidiFloat,
  midiToFreq,
  midiToNombre,
  normalizarOctava,
} from './notas';

describe('notas', () => {
  it.each([
    [69, 440],
    [57, 220],
    [60, 261.625565],
    [81, 880],
  ])('convierte MIDI %i a frecuencia', (midi, frecuencia) => {
    expect(midiToFreq(midi)).toBeCloseTo(frecuencia, 3);
  });

  it.each([
    [440, 69],
    [220, 57],
    [880, 81],
    [midiToFreq(60), 60],
  ])('convierte %i Hz a MIDI flotante', (frecuencia, midi) => {
    expect(freqToMidiFloat(frecuencia)).toBeCloseTo(midi, 8);
  });

  it.each([
    [69, 'La4'],
    [60, 'Do4'],
    [61, 'Do#4'],
    [71, 'Si4'],
    [-1, 'Si-2'],
  ])('da nombre a MIDI %i', (midi, nombre) => {
    expect(midiToNombre(midi)).toBe(nombre);
  });

  it.each([
    [0, { cents: 0, octavas: 0 }],
    [1200, { cents: 0, octavas: 1 }],
    [-1200, { cents: 0, octavas: -1 }],
    [1300, { cents: 100, octavas: 1 }],
    [700, { cents: 700, octavas: 0 }],
    [-700, { cents: -700, octavas: 0 }],
    [1100, { cents: -100, octavas: 1 }],
  ])('normaliza %i cents por octava', (cents, esperado) => {
    expect(normalizarOctava(cents)).toEqual(esperado);
  });

  it('calcula la desviación de A4 respecto a MIDI 69', () => {
    expect(centsDesviacion(440, 69)).toBeCloseTo(0, 10);
  });
});
