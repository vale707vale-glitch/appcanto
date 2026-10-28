// Canciones guiadas y melodias originales simples para cantar encima.
// La letra es opcional; si una nota no tiene silaba, se canta con "la".

import type { Nivel } from './ejercicios';

export interface NotaCancion {
  midi: number;
  segundos: number;
  /** Silaba que se muestra mientras suena la nota (opcional). */
  silaba?: string;
}

export interface Cancion {
  id: string;
  titulo: string;
  descripcion: string;
  nivel: Nivel;
  notas: NotaCancion[];
}

const DO4 = 60;
const RE4 = 62;
const MI4 = 64;
const FA4 = 65;
const SOL4 = 67;
const LA4 = 69;
const SI4 = 71;
const DO5 = 72;
const RE5 = 74;

export const CANCIONES: Cancion[] = [
  {
    id: 'estrellita',
    titulo: 'Estrellita',
    descripcion:
      'La melodía de "Estrellita, ¿dónde estás?". Podés cantarla con la letra o con "la".',
    nivel: 'Facil',
    notas: [
      { midi: DO4, segundos: 0.55, silaba: 'Es' },
      { midi: DO4, segundos: 0.55, silaba: 'tre' },
      { midi: SOL4, segundos: 0.55, silaba: 'lli' },
      { midi: SOL4, segundos: 0.55, silaba: 'ta' },
      { midi: LA4, segundos: 0.55, silaba: 'dón' },
      { midi: LA4, segundos: 0.55, silaba: 'de' },
      { midi: SOL4, segundos: 1.1, silaba: 'es-tás' },
      { midi: FA4, segundos: 0.55, silaba: 'Me' },
      { midi: FA4, segundos: 0.55, silaba: 'pre' },
      { midi: MI4, segundos: 0.55, silaba: 'gun' },
      { midi: MI4, segundos: 0.55, silaba: 'to' },
      { midi: RE4, segundos: 0.55, silaba: 'qué' },
      { midi: RE4, segundos: 0.55, silaba: 'se' },
      { midi: DO4, segundos: 1.1, silaba: 'rás' },
    ],
  },
  {
    id: 'alegria',
    titulo: 'Himno de la alegría',
    descripcion:
      'La melodía de Beethoven. No tiene letra: cantala con "la" o con "aaa".',
    nivel: 'Media',
    notas: [
      { midi: MI4, segundos: 0.5 },
      { midi: MI4, segundos: 0.5 },
      { midi: FA4, segundos: 0.5 },
      { midi: SOL4, segundos: 0.9 },
      { midi: SOL4, segundos: 0.5 },
      { midi: FA4, segundos: 0.5 },
      { midi: MI4, segundos: 0.5 },
      { midi: RE4, segundos: 0.9 },
      { midi: DO4, segundos: 0.5 },
      { midi: DO4, segundos: 0.5 },
      { midi: RE4, segundos: 0.5 },
      { midi: MI4, segundos: 0.9 },
      { midi: MI4, segundos: 0.5 },
      { midi: RE4, segundos: 0.5 },
      { midi: RE4, segundos: 1.2 },
    ],
  },
  {
    id: 'cumple',
    titulo: 'Cumpleaños feliz',
    descripcion:
      'Las dos primeras frases de "Cumpleaños feliz". Podés usar la letra o "la".',
    nivel: 'Facil',
    notas: [
      { midi: SOL4, segundos: 0.5, silaba: 'Cum' },
      { midi: SOL4, segundos: 0.5, silaba: 'ple' },
      { midi: LA4, segundos: 0.5, silaba: 'a' },
      { midi: SOL4, segundos: 0.5, silaba: 'ños' },
      { midi: DO5, segundos: 0.5, silaba: 'fe' },
      { midi: SI4, segundos: 1.1, silaba: 'liz' },
      { midi: SOL4, segundos: 0.5, silaba: 'Cum' },
      { midi: SOL4, segundos: 0.5, silaba: 'ple' },
      { midi: LA4, segundos: 0.5, silaba: 'a' },
      { midi: SOL4, segundos: 0.5, silaba: 'ños' },
      { midi: RE5, segundos: 0.5, silaba: 'fe' },
      { midi: DO5, segundos: 1.1, silaba: 'liz' },
    ],
  },
  {
    id: 'eco-tres-notas',
    titulo: 'Eco de tres notas',
    descripcion:
      'Melodía original breve: repetí el eco con "la" o "aaa" y escuchá el cambio entre las notas.',
    nivel: 'Facil',
    notas: [
      { midi: DO4, segundos: 0.7 },
      { midi: MI4, segundos: 0.7 },
      { midi: SOL4, segundos: 0.9 },
      { midi: MI4, segundos: 0.7 },
      { midi: DO4, segundos: 1 },
      { midi: DO4, segundos: 0.7 },
      { midi: MI4, segundos: 0.7 },
      { midi: SOL4, segundos: 1.1 },
    ],
  },
  {
    id: 'camino-de-vuelta',
    titulo: 'Camino de vuelta',
    descripcion:
      'Melodía original por pasos: seguí la subida y bajada sin apretar la voz; podés cantarla con "la".',
    nivel: 'Facil',
    notas: [
      { midi: DO4, segundos: 0.6 },
      { midi: RE4, segundos: 0.6 },
      { midi: MI4, segundos: 0.6 },
      { midi: SOL4, segundos: 0.9 },
      { midi: MI4, segundos: 0.6 },
      { midi: RE4, segundos: 0.6 },
      { midi: DO4, segundos: 1.1 },
      { midi: RE4, segundos: 0.6 },
      { midi: MI4, segundos: 0.6 },
      { midi: DO4, segundos: 1 },
    ],
  },
  {
    id: 'salto-y-regreso',
    titulo: 'Salto y regreso',
    descripcion:
      'Melodía original con saltos suaves: escuchá cada nota y volvé a la más grave cuando termine la frase.',
    nivel: 'Media',
    notas: [
      { midi: DO4, segundos: 0.7 },
      { midi: MI4, segundos: 0.7 },
      { midi: SOL4, segundos: 0.9 },
      { midi: MI4, segundos: 0.7 },
      { midi: RE4, segundos: 0.7 },
      { midi: FA4, segundos: 0.7 },
      { midi: LA4, segundos: 1 },
      { midi: FA4, segundos: 0.7 },
      { midi: MI4, segundos: 0.7 },
      { midi: DO4, segundos: 1.1 },
    ],
  },
];

export function letraCancion(cancion: Cancion): string[] {
  return cancion.notas.map((n) => n.silaba ?? 'la');
}

export function duracionCancion(cancion: Cancion): number {
  return cancion.notas.reduce((a, n) => a + n.segundos, 0);
}
