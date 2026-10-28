// API pública de teoría musical; las implementaciones viven en módulos por tema.

import { analizarAcordes, analizarNotas } from './teoria/parser';
import { sugerirCejillas } from './teoria/cejilla';
import { mod12, nombrePC } from './teoria/comun';
import { nombreCuerda, posicionesGuitarra } from './teoria/posiciones';
import { acordesPrincipales, detectarTono } from './teoria/tonalidad';

export {
  acordesPrincipales,
  analizarAcordes,
  analizarNotas,
  detectarTono,
  nombreCuerda,
  nombrePC,
  posicionesGuitarra,
  sugerirCejillas,
};

export type ModoTono = 'mayor' | 'menor';
export type ModoEntrada = 'notas' | 'acordes';

export type CalidadAcorde =
  | 'mayor'
  | 'menor'
  | '7'
  | 'maj7'
  | 'm7'
  | 'dim'
  | 'dim7'
  | 'aug'
  | 'sus2'
  | 'sus4'
  | '6'
  | 'm6'
  | '9'
  | 'add9'
  | '5'
  | 'm7b5';

export interface NotaEntrada {
  pc: number;
  midi: number;
  tieneOctava: boolean;
  texto: string;
}

export interface AcordeEntrada {
  pc: number;
  calidad: CalidadAcorde;
  texto: string;
}

export interface AnalisisNotas {
  tipo: 'notas';
  notas: NotaEntrada[];
  errores: string[];
}

export interface AnalisisAcordes {
  tipo: 'acordes';
  acordes: AcordeEntrada[];
  errores: string[];
}

export type Analisis = AnalisisNotas | AnalisisAcordes;

export interface TonoDetectado {
  pc: number;
  modo: ModoTono;
  nombre: string;
  puntaje: number;
  confianza: 'alta' | 'media' | 'baja';
  coincidencias: number;
  total: number;
  explicacion: string;
}

export interface SugerenciaCejilla {
  traste: number;
  formaPc: number;
  formaModo: ModoTono;
  formaNombre: string;
  formaCorta: string;
  acordes: AcordeEntrada[];
  recomendada: boolean;
}

export interface PosicionGuitarra {
  cuerda: number;
  traste: number;
}

export interface PosicionesNota {
  midiUsado: number;
  exacta: boolean;
  posiciones: PosicionGuitarra[];
}

const SUFIJOS: Record<CalidadAcorde, string> = {
  mayor: '',
  menor: 'm',
  '7': '7',
  maj7: 'maj7',
  m7: 'm7',
  dim: 'dim',
  dim7: 'dim7',
  aug: 'aug',
  sus2: 'sus2',
  sus4: 'sus4',
  '6': '6',
  m6: 'm6',
  '9': '9',
  add9: 'add9',
  '5': '5',
  m7b5: 'm7b5',
};

const INTERVALOS: Record<CalidadAcorde, number[]> = {
  mayor: [0, 4, 7],
  menor: [0, 3, 7],
  '7': [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  dim: [0, 3, 6],
  dim7: [0, 3, 6, 9],
  aug: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  '6': [0, 4, 7, 9],
  m6: [0, 3, 7, 9],
  '9': [0, 4, 7, 10, 14],
  add9: [0, 4, 7, 14],
  '5': [0, 7],
  m7b5: [0, 3, 6, 10],
};

export function nombreAcorde(acorde: AcordeEntrada): string {
  return `${nombrePC(acorde.pc)}${SUFIJOS[acorde.calidad]}`;
}

export function notasDeAcorde(acorde: AcordeEntrada): string[] {
  return INTERVALOS[acorde.calidad].map((intervalo) =>
    nombrePC(acorde.pc + intervalo),
  );
}

export function midisDeAcorde(
  acorde: AcordeEntrada,
  base = 48,
  semitonos = 0,
): number[] {
  const raiz = base + acorde.pc + semitonos;
  return INTERVALOS[acorde.calidad].map((intervalo) => raiz + intervalo);
}

export function transponerAnalisis(
  analisis: Analisis,
  semitonos: number,
): Analisis {
  if (analisis.tipo === 'notas') {
    return {
      ...analisis,
      notas: analisis.notas.map((nota) => ({
        ...nota,
        midi: nota.midi + semitonos,
        pc: mod12(nota.pc + semitonos),
      })),
    };
  }
  return {
    ...analisis,
    acordes: analisis.acordes.map((acorde) => ({
      ...acorde,
      pc: mod12(acorde.pc + semitonos),
    })),
  };
}
