import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_CANCIONES,
  MAX_NOTAS,
  cancionDesdeTexto,
  cargarCancionesPersonalizadas,
  eliminarCancionPersonalizada,
  guardarCancionPersonalizada,
  type CancionPersonalizada,
} from './cancionesPersonalizadas';
import {
  cargarProgreso,
  eliminarSesionesDePieza,
  guardarSesion,
} from './progreso';

const datos = new Map<string, string>();
const CLAVE = 'canta-app-canciones-v1';

beforeEach(() => {
  datos.clear();
  vi.stubGlobal('localStorage', {
    getItem: (clave: string) => datos.get(clave) ?? null,
    setItem: (clave: string, valor: string) => datos.set(clave, valor),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('canciones personalizadas', () => {
  it('convierte notas pegadas en una canción con nombres y duración', () => {
    const resultado = cancionDesdeTexto('Mi canción', 'Do Re Mi Fa Sol');
    expect(resultado.errores).toEqual([]);
    expect(resultado.avisos).toEqual([]);
    expect(resultado.cancion?.notas.map((nota) => nota.midi)).toEqual([
      60, 62, 64, 65, 67,
    ]);
    expect(resultado.cancion?.notas[0].silaba).toBe('Do4');
    expect(resultado.cancion?.notas.every((nota) => nota.segundos > 0)).toBe(true);
    expect(resultado.cancion?.id.startsWith('personalizada-')).toBe(true);
  });

  it('rechaza título vacío o lista sin notas', () => {
    expect(cancionDesdeTexto('', 'Do Re Mi').errores.length).toBeGreaterThan(0);
    expect(cancionDesdeTexto('X', '').cancion).toBeNull();
    expect(cancionDesdeTexto('X', '   ').cancion).toBeNull();
  });

  it('avisa por notas inválidas pero guarda las válidas', () => {
    const resultado = cancionDesdeTexto('X', 'Do XYZ Mi');
    expect(resultado.cancion?.notas).toHaveLength(2);
    expect(resultado.avisos).toHaveLength(1);
  });

  it('rechaza más de 200 notas', () => {
    const texto = Array.from({ length: MAX_NOTAS + 1 }, () => 'Do').join(' ');
    const resultado = cancionDesdeTexto('X', texto);
    expect(resultado.cancion).toBeNull();
    expect(resultado.errores[0]).toContain(String(MAX_NOTAS));
  });

  it('guarda, recupera y borra la canción', () => {
    const cancion = cancionDesdeTexto('Guardable', 'Do Re Mi').cancion;
    if (!cancion) throw new Error('Se esperaba una canción');

    guardarCancionPersonalizada(cancion);
    expect(cargarCancionesPersonalizadas()).toEqual([cancion]);

    eliminarCancionPersonalizada(cancion.id);
    expect(cargarCancionesPersonalizadas()).toEqual([]);
  });

  it('no supera el máximo de canciones guardadas', () => {
    const base = cancionDesdeTexto('Base', 'Do').cancion;
    if (!base) throw new Error('Se esperaba una canción');
    const llenas: CancionPersonalizada[] = Array.from(
      { length: MAX_CANCIONES },
      (_, indice) => ({ ...base, id: `personalizada-test-${indice}` }),
    );
    datos.set(CLAVE, JSON.stringify(llenas));
    expect(() => guardarCancionPersonalizada(base)).toThrow(
      new RegExp(String(MAX_CANCIONES)),
    );
  });

  it('ignora datos guardados con formato inválido', () => {
    datos.set(CLAVE, JSON.stringify([{ id: 'malo' }]));
    expect(cargarCancionesPersonalizadas()).toEqual([]);
  });

  it('borra también el historial de prácticas de la canción', () => {
    guardarSesion({
      fecha: '2026-10-27',
      ejercicioId: 'cancion-personalizada-x',
      precision: 80,
      notasBien: 1,
      notasTotal: 1,
    });
    guardarSesion({
      fecha: '2026-10-27',
      ejercicioId: 'otro',
      precision: 60,
      notasBien: 1,
      notasTotal: 1,
    });

    eliminarSesionesDePieza('cancion-personalizada-x');

    expect(cargarProgreso().sesiones.map((sesion) => sesion.ejercicioId)).toEqual([
      'otro',
    ]);
  });
});
