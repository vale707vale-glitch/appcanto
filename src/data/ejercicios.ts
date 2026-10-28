// Ejercicios vocales ordenados de reconocimiento a saltos melodicos.

import { midiToNombre } from '../audio/notas';

export type Nivel = 'Facil' | 'Media' | 'Dificil';

export interface NotaEjercicio {
  /** Nota MIDI que el usuario debe cantar. */
  midi: number;
  /** Segundos de ventana de canto (puntuable). */
  segundos: number;
  /**
   * Si existe, antes de la ventana se toca esta nota como referencia
   * (para intervalos: la base; para escalas/notas: la misma nota).
   */
  referencia?: number;
  /** Segundos que suena la referencia antes de cantar. */
  segundosRef?: number;
}

export interface Ejercicio {
  id: string;
  titulo: string;
  descripcion: string;
  nivel: Nivel;
  toleranciaDefecto: number;
  notas: NotaEjercicio[];
}

const DO4 = 60;
const RE4 = 62;
const MI4 = 64;
const FA4 = 65;
const SOL4 = 67;
const LA4 = 69;
const SI4 = 71;
const DO5 = 72;

export const EJERCICIOS: Ejercicio[] = [
  {
    id: 'notas-sueltas',
    titulo: 'Notas sueltas',
    descripcion:
      'Escucha cada nota y cantala manteniendo la afinacion.',
    nivel: 'Facil',
    toleranciaDefecto: 50,
    notas: [DO4, MI4, SOL4, LA4, DO5].map((midi) => ({
      midi,
      segundos: 4,
      referencia: midi,
      segundosRef: 1.2,
    })),
  },
  {
    id: 'escala-mayor',
    titulo: 'Escala mayor',
    descripcion:
      'Canta la escala de Do mayor ascendente y descendente (do-re-mi-fa-sol-la-si-do...).',
    nivel: 'Media',
    toleranciaDefecto: 50,
    notas: [DO4, RE4, MI4, FA4, SOL4, LA4, SI4, DO5, SI4, LA4, SOL4, FA4, MI4, RE4, DO4].map(
      (midi, i) => ({
        midi,
        segundos: 2,
        // Solo la primera nota lleva referencia audible; el resto sigue de oido.
        referencia: i === 0 ? midi : undefined,
        segundosRef: 1.2,
      }),
    ),
  },
  {
    id: 'intervalos',
    titulo: 'Intervalos',
    descripcion:
      'Suena la nota base y tu cantas la segunda nota del intervalo indicado.',
    nivel: 'Dificil',
    toleranciaDefecto: 50,
    notas: [
      { base: DO4, objetivo: MI4, nombre: '3ra mayor' },
      { base: DO4, objetivo: FA4, nombre: '4ta justa' },
      { base: DO4, objetivo: SOL4, nombre: '5ta justa' },
      { base: SOL4, objetivo: DO5, nombre: '4ta justa' },
      { base: DO4, objetivo: DO5, nombre: '8va' },
    ].map((iv) => ({
      midi: iv.objetivo,
      segundos: 3,
      referencia: iv.base,
      segundosRef: 1.2,
    })),
  },
  {
    id: 'pasos-descendentes',
    titulo: 'Pasos descendentes',
    descripcion:
      'Bajá de a una nota desde Sol hasta Do. Cantá cada sonido con un "aaa" suave y sin apurar el cambio.',
    nivel: 'Facil',
    toleranciaDefecto: 50,
    notas: [SOL4, FA4, MI4, RE4, DO4].map((midi, i) => ({
      midi,
      segundos: 3,
      referencia: i === 0 ? midi : undefined,
      segundosRef: 1.2,
    })),
  },
  {
    id: 'arpegio-mayor',
    titulo: 'Arpegio mayor',
    descripcion:
      'Cantá Do, Mi y Sol por separado; escuchá la primera nota y tratá de mantener cada sonido estable.',
    nivel: 'Media',
    toleranciaDefecto: 50,
    notas: [DO4, MI4, SOL4, DO5, SOL4, MI4, DO4].map((midi, i) => ({
      midi,
      segundos: 2.5,
      referencia: i === 0 ? midi : undefined,
      segundosRef: 1.2,
    })),
  },
  {
    id: 'pentatonica',
    titulo: 'Escala pentatónica',
    descripcion:
      'Subí y bajá por cinco notas cómodas. Seguí la primera referencia y cantá con un "aaa" claro.',
    nivel: 'Media',
    toleranciaDefecto: 50,
    notas: [DO4, RE4, MI4, SOL4, LA4, SOL4, MI4, RE4, DO4].map(
      (midi, i) => ({
        midi,
        segundos: 2.2,
        referencia: i === 0 ? midi : undefined,
        segundosRef: 1.2,
      }),
    ),
  },
];

export function nombreNota(midi: number): string {
  return midiToNombre(midi);
}

export function nombreIntervalo(base: number, objetivo: number): string {
  const mapa: Record<number, string> = {
    3: '3ra menor',
    4: '3ra mayor',
    5: '4ta justa',
    7: '5ta justa',
    12: '8va',
  };
  return mapa[objetivo - base] ?? `${objetivo - base} semitonos`;
}
