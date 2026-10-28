// Canciones creadas por la persona pegando notas. Se guardan solo en este navegador.

import { midiToNombre } from '../audio/notas';
import type { Cancion, NotaCancion } from '../data/canciones';
import type { Nivel } from '../data/ejercicios';
import { analizarNotas } from '../musica/teoria';
import { reportarErrorPersistencia } from './progreso';

const CLAVE = 'canta-app-canciones-v1';

export const MAX_CANCIONES = 40;
export const MAX_NOTAS = 200;
export const MAX_TITULO = 60;
export const DURACION_NOTA_SEG = 0.6;

export interface CancionPersonalizada extends Cancion {
  creadaEn: string;
}

export interface ResultadoImportacion {
  cancion: CancionPersonalizada | null;
  errores: string[];
  avisos: string[];
}

function nuevoId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `personalizada-${crypto.randomUUID()}`;
  }
  return `personalizada-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

export function cancionDesdeTexto(
  titulo: string,
  texto: string,
): ResultadoImportacion {
  const tituloLimpio = titulo.trim();
  const errores: string[] = [];
  if (!tituloLimpio) errores.push('Poné un título para la canción.');
  if (tituloLimpio.length > MAX_TITULO) {
    errores.push(`El título no puede superar ${MAX_TITULO} caracteres.`);
  }

  const analisis = analizarNotas(texto);
  const notas: NotaCancion[] = analisis.notas.map((nota) => ({
    midi: nota.midi,
    segundos: DURACION_NOTA_SEG,
    silaba: midiToNombre(nota.midi),
  }));

  if (notas.length === 0) {
    errores.push('No encontré notas. Escribí al menos una, por ejemplo Do Re Mi.');
  }
  if (notas.length > MAX_NOTAS) {
    errores.push(
      `La canción tiene ${notas.length} notas. El máximo es ${MAX_NOTAS}; recortá la lista.`,
    );
  }
  if (errores.length > 0) {
    return { cancion: null, errores, avisos: analisis.errores };
  }

  const nivel: Nivel = notas.length <= 16 ? 'Facil' : 'Media';
  return {
    cancion: {
      id: nuevoId(),
      titulo: tituloLimpio,
      descripcion: `Canción personalizada de ${notas.length} ${
        notas.length === 1 ? 'nota' : 'notas'
      }. Cada nota dura ${DURACION_NOTA_SEG} s.`,
      nivel,
      notas,
      creadaEn: new Date().toISOString(),
    },
    errores,
    avisos: analisis.errores,
  };
}

function esNota(valor: unknown): valor is NotaCancion {
  if (typeof valor !== 'object' || valor === null) return false;
  const nota = valor as Partial<NotaCancion>;
  return (
    Number.isInteger(nota.midi) &&
    nota.midi! >= 0 &&
    nota.midi! <= 127 &&
    Number.isFinite(nota.segundos) &&
    nota.segundos! > 0 &&
    nota.segundos! <= 10 &&
    (nota.silaba === undefined ||
      (typeof nota.silaba === 'string' && nota.silaba.length <= 16))
  );
}

function esNivel(valor: unknown): valor is Nivel {
  return valor === 'Facil' || valor === 'Media' || valor === 'Dificil';
}

function esCancion(valor: unknown): valor is CancionPersonalizada {
  if (typeof valor !== 'object' || valor === null) return false;
  const cancion = valor as Partial<CancionPersonalizada>;
  return (
    typeof cancion.id === 'string' &&
    cancion.id.startsWith('personalizada-') &&
    typeof cancion.titulo === 'string' &&
    cancion.titulo.trim() !== '' &&
    cancion.titulo.length <= MAX_TITULO &&
    typeof cancion.descripcion === 'string' &&
    esNivel(cancion.nivel) &&
    Array.isArray(cancion.notas) &&
    cancion.notas.length >= 1 &&
    cancion.notas.length <= MAX_NOTAS &&
    cancion.notas.every(esNota) &&
    typeof cancion.creadaEn === 'string' &&
    Number.isFinite(Date.parse(cancion.creadaEn))
  );
}

export function validarCancionesPersonalizadas(
  valor: unknown,
): CancionPersonalizada[] {
  if (
    !Array.isArray(valor) ||
    valor.length > MAX_CANCIONES ||
    !valor.every(esCancion) ||
    new Set(valor.map((cancion) => cancion.id)).size !== valor.length
  ) {
    throw new Error(
      'Las canciones personalizadas del respaldo tienen un formato inválido.',
    );
  }
  return valor;
}

export function reemplazarCancionesPersonalizadas(
  canciones: CancionPersonalizada[],
): void {
  const validas = validarCancionesPersonalizadas(canciones);
  try {
    localStorage.setItem(CLAVE, JSON.stringify(validas));
    reportarErrorPersistencia(null);
  } catch {
    const mensaje =
      'No se pudieron guardar las canciones personalizadas. Revisá el espacio y los permisos del navegador.';
    reportarErrorPersistencia(mensaje);
    throw new Error(mensaje);
  }
}

export function cargarCancionesPersonalizadas(): CancionPersonalizada[] {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return [];
    const parsed: unknown = JSON.parse(crudo);
    if (!Array.isArray(parsed)) {
      reportarErrorPersistencia(
        'Las canciones guardadas tienen un formato inválido.',
      );
      return [];
    }
    const validas = parsed.filter(esCancion);
    if (validas.length !== parsed.length) {
      reportarErrorPersistencia(
        'Algunas canciones guardadas no se pudieron leer y se omitieron.',
      );
    } else {
      reportarErrorPersistencia(null);
    }
    return validas;
  } catch (error) {
    reportarErrorPersistencia(
      error instanceof SyntaxError
        ? 'No se pudieron leer las canciones guardadas porque están dañadas.'
        : 'No se pudieron leer las canciones guardadas del navegador.',
    );
    return [];
  }
}

export function buscarCancionPersonalizada(
  id: string,
): CancionPersonalizada | null {
  return cargarCancionesPersonalizadas().find((cancion) => cancion.id === id) ?? null;
}

export function guardarCancionPersonalizada(
  cancion: CancionPersonalizada,
): void {
  const canciones = cargarCancionesPersonalizadas();
  if (canciones.some((guardada) => guardada.id === cancion.id)) {
    throw new Error('Esa canción ya está guardada.');
  }
  if (canciones.length >= MAX_CANCIONES) {
    throw new Error(
      `Llegaste al máximo de ${MAX_CANCIONES} canciones. Borrá una para agregar otra.`,
    );
  }
  try {
    localStorage.setItem(CLAVE, JSON.stringify([...canciones, cancion]));
    reportarErrorPersistencia(null);
  } catch {
    const mensaje =
      'No se pudo guardar la canción. Revisá el espacio y los permisos del navegador.';
    reportarErrorPersistencia(mensaje);
    throw new Error(mensaje);
  }
}

export function eliminarCancionPersonalizada(id: string): void {
  const canciones = cargarCancionesPersonalizadas();
  const restantes = canciones.filter((cancion) => cancion.id !== id);
  if (restantes.length === canciones.length) return;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(restantes));
    reportarErrorPersistencia(null);
  } catch {
    const mensaje = 'No se pudo borrar la canción del navegador.';
    reportarErrorPersistencia(mensaje);
    throw new Error(mensaje);
  }
}
