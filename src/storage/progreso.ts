// Persistencia en localStorage (sin backend).

const CLAVE = 'canta-app-progreso-v1';
const CLAVE_TOL = 'canta-app-tolerancia-v1';
const CLAVE_PRINCIPIANTE = 'canta-app-principiante-v1';
const CLAVE_TRANSPOSICION_VOCAL = 'canta-app-transposicion-vocal-v1';
const CLAVE_RANGO_VOCAL = 'canta-app-rango-vocal-v1';
export const MAX_SESIONES = 500;
export type TransposicionVocal = -12 | 0 | 12;

export interface RangoVocal {
  graveMidi: number;
  agudaMidi: number;
}

let errorPersistencia: string | null = null;

export function reportarErrorPersistencia(mensaje: string | null): void {
  errorPersistencia = mensaje;
  if (typeof window !== 'undefined') {
    window.setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('canta-persistencia', { detail: mensaje }),
      );
    }, 0);
  }
}

export function obtenerErrorPersistencia(): string | null {
  return errorPersistencia;
}

export interface Sesion {
  fecha: string; // YYYY-MM-DD
  ejercicioId: string;
  precision: number; // 0..100
  notasBien: number;
  notasTotal: number;
  registradoEn?: string;
  tempoPorcentaje?: number;
  detalleNotas?: { midi: number; precision: number }[];
}

export interface Progreso {
  sesiones: Sesion[];
}

export function cargarProgreso(): Progreso {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return { sesiones: [] };
    const parsed = JSON.parse(crudo) as Progreso;
    if (!Array.isArray(parsed.sesiones) || !parsed.sesiones.every(esSesion)) {
      reportarErrorPersistencia('El progreso guardado tiene un formato inválido.');
      return { sesiones: [] };
    }
    reportarErrorPersistencia(null);
    return { sesiones: parsed.sesiones.slice(-MAX_SESIONES) };
  } catch (error) {
    reportarErrorPersistencia(
      error instanceof SyntaxError
        ? 'No se pudo leer el progreso guardado porque está dañado.'
        : 'El almacenamiento del navegador no está disponible.',
    );
    return { sesiones: [] };
  }
}

export function guardarSesion(s: Sesion): Progreso {
  const p = cargarProgreso();
  p.sesiones.push(s);
  p.sesiones = p.sesiones.slice(-MAX_SESIONES);
  try {
    localStorage.setItem(CLAVE, JSON.stringify(p));
    reportarErrorPersistencia(null);
  } catch {
    reportarErrorPersistencia(
      'No se pudo guardar el progreso. Revisá el espacio y los permisos del navegador.',
    );
  }
  return p;
}

export function eliminarSesionesDePieza(ejercicioId: string): void {
  const progreso = cargarProgreso();
  const sesiones = progreso.sesiones.filter(
    (sesion) => sesion.ejercicioId !== ejercicioId,
  );
  if (sesiones.length === progreso.sesiones.length) return;
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ sesiones }));
    reportarErrorPersistencia(null);
  } catch {
    reportarErrorPersistencia(
      'No se pudo borrar el historial de esa canción.',
    );
  }
}

function esSesion(valor: unknown): valor is Sesion {
  if (typeof valor !== 'object' || valor === null) return false;
  const sesion = valor as Partial<Sesion>;
  const detalleValido =
    sesion.detalleNotas === undefined ||
    (Array.isArray(sesion.detalleNotas) &&
      sesion.detalleNotas.length <= 200 &&
      sesion.detalleNotas.every(
        (nota) =>
          typeof nota === 'object' &&
          nota !== null &&
          Number.isInteger(nota.midi) &&
          nota.midi >= 0 &&
          nota.midi <= 127 &&
          Number.isFinite(nota.precision) &&
          nota.precision >= 0 &&
          nota.precision <= 100,
      ));
  return (
    typeof sesion.fecha === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(sesion.fecha) &&
    typeof sesion.ejercicioId === 'string' &&
    Number.isFinite(sesion.precision) &&
    sesion.precision! >= 0 &&
    sesion.precision! <= 100 &&
    Number.isInteger(sesion.notasBien) &&
    sesion.notasBien! >= 0 &&
    Number.isInteger(sesion.notasTotal) &&
    sesion.notasTotal! >= 0 &&
    (sesion.registradoEn === undefined ||
      (typeof sesion.registradoEn === 'string' &&
        Number.isFinite(Date.parse(sesion.registradoEn)))) &&
    (sesion.tempoPorcentaje === undefined ||
      (Number.isInteger(sesion.tempoPorcentaje) &&
        sesion.tempoPorcentaje >= 50 &&
        sesion.tempoPorcentaje <= 100)) &&
    detalleValido
  );
}

export function exportarProgreso(): string {
  const progreso = cargarProgreso();
  if (errorPersistencia) {
    throw new Error(errorPersistencia);
  }
  return JSON.stringify(progreso, null, 2);
}

export function importarProgreso(texto: string): Progreso {
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    throw new Error('El archivo no contiene JSON válido.');
  }
  if (
    typeof datos !== 'object' ||
    datos === null ||
    !('sesiones' in datos) ||
    !Array.isArray(datos.sesiones) ||
    !datos.sesiones.every(esSesion)
  ) {
    throw new Error('El archivo no tiene el formato de progreso esperado.');
  }
  const progreso: Progreso = {
    sesiones: datos.sesiones.slice(-MAX_SESIONES),
  };
  try {
    localStorage.setItem(CLAVE, JSON.stringify(progreso));
    reportarErrorPersistencia(null);
  } catch {
    const mensaje =
      'No se pudo importar el progreso. Revisá el espacio y los permisos del navegador.';
    reportarErrorPersistencia(mensaje);
    throw new Error(mensaje);
  }
  return progreso;
}

function diaLocal(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dia}`;
}

export interface Resumen {
  precisionMedia: number;
  diasPracticados: number;
  racha: number;
  sesionesTotal: number;
}

export function resumir(p: Progreso): Resumen {
  if (p.sesiones.length === 0) {
    return { precisionMedia: 0, diasPracticados: 0, racha: 0, sesionesTotal: 0 };
  }
  const precisionMedia =
    p.sesiones.reduce((a, s) => a + s.precision, 0) / p.sesiones.length;
  const dias = new Set(p.sesiones.map((s) => s.fecha));
  // Racha: dias consecutivos terminando hoy o ayer
  let racha = 0;
  const cursor = new Date();
  if (!dias.has(diaLocal(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (dias.has(diaLocal(cursor))) {
    racha++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return {
    precisionMedia: Math.round(precisionMedia),
    diasPracticados: dias.size,
    racha,
    sesionesTotal: p.sesiones.length,
  };
}

export function hoyISO(): string {
  return diaLocal(new Date());
}

export function fechaHoraISO(): string {
  return new Date().toISOString();
}

export function cargarTolerancia(defecto: number): number {
  try {
    const v = localStorage.getItem(CLAVE_TOL);
    const n = v === null ? NaN : Number(v);
    return Number.isFinite(n) && n >= 20 && n <= 100 ? n : defecto;
  } catch {
    reportarErrorPersistencia(
      'No se pudo leer la tolerancia guardada del navegador.',
    );
    return defecto;
  }
}

export function guardarTolerancia(v: number): void {
  try {
    localStorage.setItem(CLAVE_TOL, String(v));
  } catch {
    reportarErrorPersistencia(
      'No se pudo guardar la tolerancia en el navegador.',
    );
  }
}

/** Modo principiante activado por defecto: menos numeros, mas palabras claras. */
export function cargarModoPrincipiante(): boolean {
  try {
    return localStorage.getItem(CLAVE_PRINCIPIANTE) !== '0';
  } catch {
    reportarErrorPersistencia(
      'No se pudo leer la configuración del navegador.',
    );
    return true;
  }
}

export function guardarModoPrincipiante(v: boolean): void {
  try {
    localStorage.setItem(CLAVE_PRINCIPIANTE, v ? '1' : '0');
  } catch {
    reportarErrorPersistencia(
      'No se pudo guardar la configuración en el navegador.',
    );
  }
}

export function cargarTransposicionVocal(): TransposicionVocal {
  try {
    const valor = Number(localStorage.getItem(CLAVE_TRANSPOSICION_VOCAL));
    return valor === -12 || valor === 12 ? valor : 0;
  } catch {
    reportarErrorPersistencia(
      'No se pudo leer el ajuste de altura de la voz guardado.',
    );
    return 0;
  }
}

export function guardarTransposicionVocal(
  semitonos: TransposicionVocal,
): void {
  try {
    localStorage.setItem(CLAVE_TRANSPOSICION_VOCAL, String(semitonos));
    reportarErrorPersistencia(null);
  } catch {
    reportarErrorPersistencia(
      'No se pudo guardar el ajuste de altura de la voz.',
    );
  }
}

export function cargarRangoVocal(): RangoVocal | null {
  try {
    const guardado = localStorage.getItem(CLAVE_RANGO_VOCAL);
    if (!guardado) return null;
    const valor: unknown = JSON.parse(guardado);
    if (
      typeof valor !== 'object' ||
      valor === null ||
      !('graveMidi' in valor) ||
      !('agudaMidi' in valor) ||
      typeof valor.graveMidi !== 'number' ||
      typeof valor.agudaMidi !== 'number' ||
      !Number.isInteger(valor.graveMidi) ||
      !Number.isInteger(valor.agudaMidi) ||
      valor.graveMidi < 40 ||
      valor.agudaMidi > 87 ||
      valor.graveMidi > valor.agudaMidi
    ) {
      reportarErrorPersistencia('El rango vocal guardado tiene un formato inválido.');
      return null;
    }
    reportarErrorPersistencia(null);
    return { graveMidi: valor.graveMidi, agudaMidi: valor.agudaMidi };
  } catch {
    reportarErrorPersistencia(
      'No se pudo leer el rango vocal guardado en el navegador.',
    );
    return null;
  }
}

export function guardarRangoVocal(rango: RangoVocal): void {
  if (
    !Number.isInteger(rango.graveMidi) ||
    !Number.isInteger(rango.agudaMidi) ||
    rango.graveMidi < 40 ||
    rango.agudaMidi > 87 ||
    rango.graveMidi > rango.agudaMidi
  ) {
    throw new Error('El rango vocal debe tener dos notas válidas y ordenadas.');
  }
  try {
    localStorage.setItem(CLAVE_RANGO_VOCAL, JSON.stringify(rango));
    reportarErrorPersistencia(null);
  } catch {
    const mensaje = 'No se pudo guardar el rango vocal en el navegador.';
    reportarErrorPersistencia(mensaje);
    throw new Error(mensaje);
  }
}
