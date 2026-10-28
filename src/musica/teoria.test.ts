import { describe, expect, it } from 'vitest';
import {
  analizarAcordes,
  analizarNotas,
  detectarTono,
  midisDeAcorde,
  transponerAnalisis,
} from './teoria';

describe('teoria musical', () => {
  it.each([
    ['Sol Do Re7 Sol', [7, 0, 2, 7]],
    ['Do Lam Fa Sol', [0, 9, 5, 7]],
    ['La7 Re Mi7', [9, 2, 4]],
  ])('analiza acordes: %s', (entrada, pcs) => {
    const resultado = analizarAcordes(entrada);
    expect(resultado.errores).toEqual([]);
    expect(resultado.acordes.map((acorde) => acorde.pc)).toEqual(pcs);
  });

  it.each([
    ['Do Re Mi Fa Sol', [60, 62, 64, 65, 67]],
    ['La Si Do Re La', [69, 71, 72, 74, 69]],
    ['Do4 Mi4 Sol4', [60, 64, 67]],
  ])('analiza notas: %s', (entrada, midis) => {
    const resultado = analizarNotas(entrada);
    expect(resultado.errores).toEqual([]);
    expect(resultado.notas.map((nota) => nota.midi)).toEqual(midis);
  });

  it('informa tokens de acorde inválidos', () => {
    expect(analizarAcordes('Do XYZ').errores).toHaveLength(1);
  });

  it('informa tokens de nota inválidos', () => {
    expect(analizarNotas('Do XYZ').errores).toHaveLength(1);
  });

  it.each([
    ['Sol Do Re7 Sol', 'Sol mayor'],
    ['Do Lam Fa Sol', 'Do mayor'],
    ['La7 Re Mi7', 'La mayor'],
  ])('detecta el tono esperado para %s', (entrada, tono) => {
    const resultado = detectarTono(analizarAcordes(entrada));
    expect(resultado[0]?.nombre).toBe(tono);
  });

  it('transpone notas con su MIDI y clase de altura', () => {
    const notas = analizarNotas('Do4 Mi4');
    const transpuestas = transponerAnalisis(notas, 12);
    expect(transpuestas.tipo).toBe('notas');
    if (transpuestas.tipo !== 'notas') throw new Error('Se esperaba análisis de notas');
    expect(transpuestas.notas.map((nota) => nota.midi)).toEqual([72, 76]);
    expect(transpuestas.notas.map((nota) => nota.pc)).toEqual([0, 4]);
  });

  it('transpone acordes una octava sin perder el desplazamiento audible', () => {
    const acorde = analizarAcordes('Do').acordes[0];
    expect(midisDeAcorde(acorde)).toEqual([48, 52, 55]);
    expect(midisDeAcorde(acorde, 48, 12)).toEqual([60, 64, 67]);
    const transpuestos = transponerAnalisis(analizarAcordes('Do'), 12);
    expect(transpuestos.tipo).toBe('acordes');
    if (transpuestos.tipo !== 'acordes') throw new Error('Se esperaba análisis de acordes');
    expect(midisDeAcorde(analizarAcordes('Do').acordes[0], 48, 12)).toEqual(
      midisDeAcorde(acorde).map((midi) => midi + 12),
    );
  });
});
