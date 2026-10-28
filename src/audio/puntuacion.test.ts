import { describe, expect, it } from 'vitest';
import {
  alcanzaCantoMinimo,
  contarOctava,
  puntuar,
  type ConteoOctava,
} from './puntuacion';

const conteoVacio = (): ConteoOctava => ({ arriba: 0, abajo: 0, voz: 0 });

describe('puntuacion', () => {
  it.each([
    [0, false],
    [499, false],
    [500, true],
    [700, true],
  ])('exige al menos medio segundo real de voz: %i ms', (tiempo, esperado) => {
    expect(alcanzaCantoMinimo(tiempo)).toBe(esperado);
  });

  it.each([
    { historial: [], esperado: 0, conVoz: 0 },
    { historial: [0, 0, 0], esperado: 100, conVoz: 3 },
    { historial: [0, 0, null, null], esperado: 50, conVoz: 2 },
    { historial: [0, 0, 0, 0, 0, 0, 0, 0, 0, null], esperado: 90, conVoz: 9 },
    { historial: [null, null, null, null, null, null, null, null, null, 0], esperado: 10, conVoz: 1 },
    { historial: [100, 100], esperado: 50, conVoz: 2 },
    { historial: [101, -101], esperado: 0, conVoz: 2 },
  ])('puntúa $historial sobre la ventana completa', ({ historial, esperado, conVoz }) => {
    const resultado = puntuar(historial, 50, conteoVacio(), 60);
    expect(resultado.precision).toBe(esperado);
    expect(resultado.conVoz).toBe(conVoz);
    expect(resultado.tramas).toBe(historial.length);
  });

  it('informa silencio cuando ninguna trama contiene voz', () => {
    const resultado = puntuar([null, null], 50, conteoVacio(), 60);
    expect(resultado.diagnostico).toBe('sin_voz');
    expect(resultado.detalle).toContain('No se detectó');
  });

  it.each([
    [700, 'alto', 'Muy alto'],
    [-700, 'bajo', 'Muy bajo'],
  ] as const)('diagnostica correctamente un intervalo de %i cents', (cents, diagnostico, mensaje) => {
    const resultado = puntuar([cents], 50, conteoVacio(), 60);
    expect(resultado.diagnostico).toBe(diagnostico);
    expect(resultado.detalle).toContain(mensaje);
  });

  it.each([
    { octavas: 1, campo: 'arriba', esperado: 1 },
    { octavas: -1, campo: 'abajo', esperado: 1 },
  ] as const)('cuenta desplazamiento de octava $octavas', ({ octavas, campo, esperado }) => {
    const conteo = conteoVacio();
    contarOctava(conteo, 0, octavas, 50);
    expect(conteo[campo]).toBe(esperado);
    expect(conteo.voz).toBe(1);
  });

  it('ignora una trama sin tono al contar octavas', () => {
    const conteo = conteoVacio();
    contarOctava(conteo, null, 0, 50);
    expect(conteo).toEqual(conteoVacio());
  });
});
