import { describe, expect, it } from 'vitest';
import { hashDesdeVista, vistaDesdeHash } from './navegacion';

describe('navegación por hash', () => {
  it.each([
    ['#/', { nombre: 'inicio' }],
    ['#/inicio', { nombre: 'inicio' }],
    ['#/afinador', { nombre: 'afinador' }],
    ['#/afinador-guitarra', { nombre: 'afinador-guitarra' }],
    ['#/rango-vocal', { nombre: 'rango-vocal' }],
    ['#/tono', { nombre: 'tono' }],
    ['#/guitarra', { nombre: 'guitarra' }],
    ['#/aprender-guitarra', { nombre: 'aprender-guitarra' }],
    ['#/aprender-musica', { nombre: 'aprender-musica' }],
    ['#/ejercicio/notas', { nombre: 'ejercicio', id: 'notas' }],
    ['#/cancion/estrellita', { nombre: 'cancion', id: 'estrellita' }],
    ['#/cancion/mi%20cancion', { nombre: 'cancion', id: 'mi cancion' }],
  ])('parsea %s', (hash, vista) => {
    expect(vistaDesdeHash(hash)).toEqual(vista);
  });

  it.each(['#/desconocida', '#/ejercicio', '#/cancion/a/b', '#/cancion/%E0%A4%A'])(
    'rechaza hash inválido %s',
    (hash) => {
      expect(vistaDesdeHash(hash)).toBeNull();
    },
  );

  it.each([
    { nombre: 'inicio' },
    { nombre: 'afinador' },
    { nombre: 'afinador-guitarra' },
    { nombre: 'rango-vocal' },
    { nombre: 'tono' },
    { nombre: 'guitarra' },
    { nombre: 'aprender-guitarra' },
    { nombre: 'aprender-musica' },
    { nombre: 'ejercicio', id: 'notas vocales' },
    { nombre: 'cancion', id: 'cumple' },
  ] as const)('serializa y parsea %o', (vista) => {
    expect(vistaDesdeHash(hashDesdeVista(vista))).toEqual(vista);
  });
});
