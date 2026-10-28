import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_CANCIONES,
  cancionDesdeTexto,
  cargarCancionesPersonalizadas,
  guardarCancionPersonalizada,
  type CancionPersonalizada,
} from './cancionesPersonalizadas';
import { cargarProgreso, guardarSesion, type Sesion } from './progreso';
import { VERSION_RESPALDO, exportarRespaldo, importarRespaldo } from './respaldo';

const datos = new Map<string, string>();

const sesion: Sesion = {
  fecha: '2026-10-27',
  ejercicioId: 'notas-sueltas',
  precision: 80,
  notasBien: 4,
  notasTotal: 5,
};

function cancion(titulo = 'Mi canción'): CancionPersonalizada {
  const resultado = cancionDesdeTexto(titulo, 'Do Re Mi Fa Sol');
  if (!resultado.cancion) throw new Error('Se esperaba una canción válida');
  return resultado.cancion;
}

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

describe('respaldo completo', () => {
  it('exporta el progreso y las canciones personalizadas', () => {
    guardarSesion(sesion);
    const guardada = cancion();
    guardarCancionPersonalizada(guardada);

    const respaldo = JSON.parse(exportarRespaldo()) as {
      version: number;
      sesiones: Sesion[];
      cancionesPersonalizadas: CancionPersonalizada[];
    };

    expect(respaldo.version).toBe(VERSION_RESPALDO);
    expect(respaldo.sesiones).toEqual([sesion]);
    expect(respaldo.cancionesPersonalizadas).toEqual([guardada]);
  });

  it('importa progreso y canciones, y reemplaza lo que había', () => {
    guardarSesion(sesion);
    guardarCancionPersonalizada(cancion('Original'));
    const texto = exportarRespaldo();

    datos.clear();
    guardarSesion({ ...sesion, precision: 40 });
    guardarCancionPersonalizada(cancion('Otra'));

    const resultado = importarRespaldo(texto);
    expect(resultado).toEqual({
      incluyeCanciones: true,
      cancionesImportadas: 1,
    });
    expect(cargarProgreso().sesiones).toEqual([sesion]);
    expect(cargarCancionesPersonalizadas().map((item) => item.titulo)).toEqual([
      'Original',
    ]);
  });

  it('conserva las canciones al importar un respaldo viejo sin canciones', () => {
    guardarCancionPersonalizada(cancion('Conservar'));

    const resultado = importarRespaldo(JSON.stringify({ sesiones: [sesion] }));

    expect(resultado).toEqual({
      incluyeCanciones: false,
      cancionesImportadas: 0,
    });
    expect(cargarProgreso().sesiones).toEqual([sesion]);
    expect(cargarCancionesPersonalizadas().map((item) => item.titulo)).toEqual([
      'Conservar',
    ]);
  });

  it('vacía las canciones si el respaldo nuevo incluye una lista vacía', () => {
    guardarCancionPersonalizada(cancion('Borrar'));

    importarRespaldo(
      JSON.stringify({
        version: VERSION_RESPALDO,
        sesiones: [],
        cancionesPersonalizadas: [],
      }),
    );

    expect(cargarCancionesPersonalizadas()).toEqual([]);
  });

  it('rechaza canciones inválidas antes de modificar nada', () => {
    guardarSesion(sesion);
    guardarCancionPersonalizada(cancion('Original'));

    expect(() =>
      importarRespaldo(
        JSON.stringify({
          sesiones: [{ ...sesion, precision: 10 }],
          cancionesPersonalizadas: [{ id: 'malo' }],
        }),
      ),
    ).toThrow();
    expect(cargarProgreso().sesiones).toEqual([sesion]);
    expect(cargarCancionesPersonalizadas().map((item) => item.titulo)).toEqual([
      'Original',
    ]);
  });

  it('rechaza canciones repetidas o de más', () => {
    const base = cancion('Base');
    expect(() =>
      importarRespaldo(
        JSON.stringify({
          sesiones: [],
          cancionesPersonalizadas: [base, base],
        }),
      ),
    ).toThrow();

    const demasiadas = Array.from({ length: MAX_CANCIONES + 1 }, (_, indice) => ({
      ...base,
      id: `personalizada-test-${indice}`,
    }));
    expect(() =>
      importarRespaldo(
        JSON.stringify({
          sesiones: [],
          cancionesPersonalizadas: demasiadas,
        }),
      ),
    ).toThrow();
  });

  it('no guarda canciones si el progreso del respaldo es inválido', () => {
    guardarCancionPersonalizada(cancion('Original'));

    expect(() =>
      importarRespaldo(
        JSON.stringify({
          sesiones: [
            {
              fecha: 'no-es-fecha',
              ejercicioId: 'a',
              precision: 80,
              notasBien: 1,
              notasTotal: 1,
            },
          ],
          cancionesPersonalizadas: [cancion('Nueva')],
        }),
      ),
    ).toThrow();
    expect(cargarCancionesPersonalizadas().map((item) => item.titulo)).toEqual([
      'Original',
    ]);
  });
});
