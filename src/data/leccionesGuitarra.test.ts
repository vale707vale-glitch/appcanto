import { describe, expect, it } from 'vitest';
import {
  ACORDES_GUITARRA,
  CUERDAS_GUITARRA,
  LECCIONES_GUITARRA,
  secuenciaDeAcordes,
} from './leccionesGuitarra';
import { hashDesdeVista, vistaDesdeHash } from '../navegacion';

describe('ruta inicial de guitarra', () => {
  it('presenta una secuencia progresiva de seis lecciones con instrucciones', () => {
    expect(LECCIONES_GUITARRA).toHaveLength(6);
    expect(new Set(LECCIONES_GUITARRA.map((leccion) => leccion.id)).size).toBe(6);
    for (const leccion of LECCIONES_GUITARRA) {
      expect(leccion.objetivo.trim()).not.toBe('');
      expect(leccion.pasos.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('ordena las seis cuerdas estándar de grave a aguda', () => {
    expect(CUERDAS_GUITARRA.map((cuerda) => [cuerda.numero, cuerda.nombre])).toEqual([
      [6, 'Mi grave'],
      [5, 'La'],
      [4, 'Re'],
      [3, 'Sol'],
      [2, 'Si'],
      [1, 'Mi agudo'],
    ]);
    expect(CUERDAS_GUITARRA.every((cuerda) => cuerda.midi >= 40 && cuerda.midi <= 64)).toBe(
      true,
    );
  });

  it('define formas de acorde desde cuerda 6 a cuerda 1', () => {
    expect(ACORDES_GUITARRA.map((acorde) => acorde.cuerdas)).toEqual([
      [0, 2, 2, 0, 0, 0],
      [-1, 0, 2, 2, 1, 0],
      [-1, 3, 2, 0, 1, 0],
    ]);
    for (const acorde of ACORDES_GUITARRA) {
      expect(acorde.cuerdas).toHaveLength(6);
      expect(acorde.midi.length).toBeGreaterThan(0);
      expect(acorde.indicaciones.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('permite abrir la ruta de aprendizaje mediante un enlace directo', () => {
    expect(vistaDesdeHash('#/aprender-guitarra')).toEqual({
      nombre: 'aprender-guitarra',
    });
    expect(hashDesdeVista({ nombre: 'aprender-guitarra' })).toBe(
      '#/aprender-guitarra',
    );
  });

  it('alterna los acordes de la práctica en cada compás', () => {
    expect(secuenciaDeAcordes('mi-menor', 'la-menor', 4)).toEqual([
      'mi-menor',
      'la-menor',
      'mi-menor',
      'la-menor',
    ]);
  });

  it.each([
    ['', 'la-menor', 4],
    ['mi-menor', 'mi-menor', 4],
    ['mi-menor', 'la-menor', 0],
    ['mi-menor', 'la-menor', 65],
  ])('rechaza secuencia de práctica inválida', (primero, segundo, compases) => {
    expect(() => secuenciaDeAcordes(primero, segundo, compases)).toThrow();
  });
});
