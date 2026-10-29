// Tomas de voz guardadas en IndexedDB. Nunca salen del navegador.
// Se usan como referencia y para escuchar el progreso.

import type { TimbreReferencia } from '../audio/tono';

const DB_NOMBRE = 'canta-app-referencias-v1';
const ALMACEN = 'tomas';
const CLAVE_GRABAR = 'canta-app-grabar-tomas-v1';
const CLAVE_TIMBRE = 'canta-app-timbre-referencia-v1';

export const MAX_REFERENCIAS = 60;
export const PRECISION_MINIMA_TOMA = 80;

export interface ReferenciaVoz {
  id: string;
  midi: number;
  ejercicioId: string;
  precision: number;
  centsMedio: number;
  fecha: string;
  duracionMs: number;
  mimeType: string;
  tamano: number;
  blob: Blob;
}

export interface NuevaReferenciaVoz {
  midi: number;
  ejercicioId: string;
  precision: number;
  centsMedio: number;
  duracionMs: number;
  blob: Blob;
}

function crearId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function abrirBase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('Este navegador no permite guardar tomas.'));
      return;
    }
    const solicitud = indexedDB.open(DB_NOMBRE, 1);
    solicitud.onupgradeneeded = () => {
      const db = solicitud.result;
      if (!db.objectStoreNames.contains(ALMACEN)) {
        db.createObjectStore(ALMACEN, { keyPath: 'id' });
      }
    };
    solicitud.onsuccess = () => resolve(solicitud.result);
    solicitud.onerror = () =>
      reject(
        solicitud.error ?? new Error('No se pudo abrir el almacenamiento de tomas.'),
      );
  });
}

function esperar<T>(solicitud: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    solicitud.onsuccess = () => resolve(solicitud.result);
    solicitud.onerror = () =>
      reject(solicitud.error ?? new Error('Error al leer las tomas.'));
  });
}

function esperarTransaccion(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? new Error('Error al guardar la toma.'));
    tx.onabort = () =>
      reject(tx.error ?? new Error('Se canceló el guardado de la toma.'));
  });
}

function esReferencia(valor: unknown): valor is ReferenciaVoz {
  if (typeof valor !== 'object' || valor === null) return false;
  const referencia = valor as Partial<ReferenciaVoz>;
  return (
    typeof referencia.id === 'string' &&
    Number.isInteger(referencia.midi) &&
    referencia.midi! >= 0 &&
    referencia.midi! <= 127 &&
    typeof referencia.ejercicioId === 'string' &&
    Number.isFinite(referencia.precision) &&
    referencia.precision! >= 0 &&
    referencia.precision! <= 100 &&
    Number.isFinite(referencia.centsMedio) &&
    typeof referencia.fecha === 'string' &&
    Number.isFinite(Date.parse(referencia.fecha)) &&
    Number.isFinite(referencia.duracionMs) &&
    typeof referencia.mimeType === 'string' &&
    Number.isFinite(referencia.tamano) &&
    typeof Blob !== 'undefined' &&
    referencia.blob instanceof Blob
  );
}

export async function listarReferencias(): Promise<ReferenciaVoz[]> {
  const db = await abrirBase();
  try {
    const tx = db.transaction(ALMACEN, 'readonly');
    const todas = await esperar(
      tx.objectStore(ALMACEN).getAll() as IDBRequest<unknown[]>,
    );
    return todas
      .filter(esReferencia)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  } finally {
    db.close();
  }
}

async function recortarReferencias(): Promise<void> {
  const referencias = await listarReferencias();
  if (referencias.length <= MAX_REFERENCIAS) return;
  const sobran = referencias.slice(MAX_REFERENCIAS);
  const db = await abrirBase();
  try {
    const tx = db.transaction(ALMACEN, 'readwrite');
    const almacen = tx.objectStore(ALMACEN);
    for (const referencia of sobran) almacen.delete(referencia.id);
    await esperarTransaccion(tx);
  } finally {
    db.close();
  }
}

export async function guardarReferencia(
  datos: NuevaReferenciaVoz,
): Promise<ReferenciaVoz> {
  if (
    !Number.isInteger(datos.midi) ||
    datos.midi < 0 ||
    datos.midi > 127
  ) {
    throw new Error('La nota de la toma no es válida.');
  }
  if (
    !Number.isFinite(datos.precision) ||
    datos.precision < 0 ||
    datos.precision > 100
  ) {
    throw new Error('La precisión de la toma no es válida.');
  }
  if (datos.blob.size === 0) {
    throw new Error('La toma quedó vacía.');
  }

  const referencia: ReferenciaVoz = {
    id: crearId(),
    midi: datos.midi,
    ejercicioId: datos.ejercicioId,
    precision: Math.round(datos.precision),
    centsMedio: Math.round(datos.centsMedio),
    fecha: new Date().toISOString(),
    duracionMs: Math.max(0, Math.round(datos.duracionMs)),
    mimeType: datos.blob.type || 'audio/webm',
    tamano: datos.blob.size,
    blob: datos.blob,
  };

  const db = await abrirBase();
  try {
    const tx = db.transaction(ALMACEN, 'readwrite');
    tx.objectStore(ALMACEN).put(referencia);
    await esperarTransaccion(tx);
  } finally {
    db.close();
  }
  await recortarReferencias();
  return referencia;
}

export async function eliminarReferencia(id: string): Promise<void> {
  const db = await abrirBase();
  try {
    const tx = db.transaction(ALMACEN, 'readwrite');
    tx.objectStore(ALMACEN).delete(id);
    await esperarTransaccion(tx);
  } finally {
    db.close();
  }
}

export function cargarGrabarTomas(): boolean {
  try {
    return localStorage.getItem(CLAVE_GRABAR) === '1';
  } catch {
    return false;
  }
}

export function guardarGrabarTomas(v: boolean): void {
  try {
    localStorage.setItem(CLAVE_GRABAR, v ? '1' : '0');
  } catch {
    // La preferencia no se guarda, pero la app sigue funcionando.
  }
}

export function cargarTimbreReferencia(): TimbreReferencia {
  try {
    return localStorage.getItem(CLAVE_TIMBRE) === 'nota' ? 'nota' : 'voz';
  } catch {
    return 'voz';
  }
}

export function guardarTimbreReferencia(timbre: TimbreReferencia): void {
  try {
    localStorage.setItem(CLAVE_TIMBRE, timbre);
  } catch {
    // La preferencia no se guarda, pero la app sigue funcionando.
  }
}
