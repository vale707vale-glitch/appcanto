// Respaldo completo: progreso y canciones personalizadas en un solo archivo.

import type { Sesion } from './progreso';
import {
  cargarProgreso,
  importarProgreso,
  obtenerErrorPersistencia,
} from './progreso';
import {
  cargarCancionesPersonalizadas,
  reemplazarCancionesPersonalizadas,
  validarCancionesPersonalizadas,
  type CancionPersonalizada,
} from './cancionesPersonalizadas';

export const VERSION_RESPALDO = 2;

export interface Respaldo {
  version: typeof VERSION_RESPALDO;
  sesiones: Sesion[];
  cancionesPersonalizadas: CancionPersonalizada[];
}

export interface ResultadoImportacionRespaldo {
  incluyeCanciones: boolean;
  cancionesImportadas: number;
}

export function exportarRespaldo(): string {
  const progreso = cargarProgreso();
  const error = obtenerErrorPersistencia();
  if (error) throw new Error(error);

  const respaldo: Respaldo = {
    version: VERSION_RESPALDO,
    sesiones: progreso.sesiones,
    cancionesPersonalizadas: cargarCancionesPersonalizadas(),
  };
  return JSON.stringify(respaldo, null, 2);
}

export function importarRespaldo(texto: string): ResultadoImportacionRespaldo {
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    throw new Error('El archivo no contiene JSON válido.');
  }
  if (typeof datos !== 'object' || datos === null) {
    throw new Error('El archivo no tiene el formato de respaldo esperado.');
  }

  const incluyeCanciones = 'cancionesPersonalizadas' in datos;
  const canciones = incluyeCanciones
    ? validarCancionesPersonalizadas(
        (datos as { cancionesPersonalizadas: unknown })
          .cancionesPersonalizadas,
      )
    : null;

  const sesiones = (datos as { sesiones?: unknown }).sesiones;
  importarProgreso(JSON.stringify({ sesiones }));

  if (canciones) {
    reemplazarCancionesPersonalizadas(canciones);
  }

  return {
    incluyeCanciones,
    cancionesImportadas: canciones?.length ?? 0,
  };
}
