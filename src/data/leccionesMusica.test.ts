import { describe, expect, it } from 'vitest';
import { CANCIONES } from './canciones';
import { EJERCICIOS } from './ejercicios';
import {
  GLOSARIO_APP,
  GLOSARIO_MUSICA,
  LECCIONES_MUSICA,
  LECCION_POR_CANCION,
  leccionParaEjercicio,
} from './leccionesMusica';

describe('lecciones de música', () => {
  it('tiene lecciones únicas y completas', () => {
    expect(LECCIONES_MUSICA.length).toBeGreaterThanOrEqual(8);
    expect(new Set(LECCIONES_MUSICA.map((leccion) => leccion.id)).size).toBe(
      LECCIONES_MUSICA.length,
    );

    for (const leccion of LECCIONES_MUSICA) {
      expect(leccion.titulo.trim()).not.toBe('');
      expect(leccion.resumen.trim()).not.toBe('');
      expect(leccion.clave.trim()).not.toBe('');
      expect(leccion.parrafos.length).toBeGreaterThanOrEqual(2);
      expect(leccion.parrafos.every((parrafo) => parrafo.trim() !== '')).toBe(
        true,
      );
      expect(leccion.practica).toBeDefined();
    }
  });

  it('usa notas y duraciones válidas en los ejemplos', () => {
    for (const leccion of LECCIONES_MUSICA) {
      for (const ejemplo of leccion.ejemplos ?? []) {
        expect(ejemplo.etiqueta.trim()).not.toBe('');
        expect(ejemplo.notas.length).toBeGreaterThan(0);
        for (const midi of ejemplo.notas) {
          expect(Number.isInteger(midi)).toBe(true);
          expect(midi).toBeGreaterThanOrEqual(0);
          expect(midi).toBeLessThanOrEqual(127);
        }
        if (ejemplo.duraciones) {
          expect(ejemplo.duraciones).toHaveLength(ejemplo.notas.length);
          expect(ejemplo.duraciones.every((duracion) => duracion > 0)).toBe(
            true,
          );
        }
      }
    }
  });

  it('enlaza prácticas que existen en la app', () => {
    for (const leccion of LECCIONES_MUSICA) {
      const practica = leccion.practica;
      if (!practica) continue;

      if (practica.tipo === 'ejercicio') {
        expect(EJERCICIOS.some((ejercicio) => ejercicio.id === practica.id)).toBe(
          true,
        );
      } else if (practica.tipo === 'cancion') {
        expect(CANCIONES.some((cancion) => cancion.id === practica.id)).toBe(
          true,
        );
      } else {
        expect(practica.tipo).toBe('rango');
      }
    }
  });

  it('asigna una lección existente a cada ejercicio y canción', () => {
    const ids = new Set(LECCIONES_MUSICA.map((leccion) => leccion.id));
    for (const ejercicio of EJERCICIOS) {
      expect(ids.has(leccionParaEjercicio(ejercicio.id))).toBe(true);
    }
    expect(ids.has(LECCION_POR_CANCION)).toBe(true);
  });

  it('define glosarios completos y sin términos repetidos', () => {
    for (const terminos of [GLOSARIO_MUSICA, GLOSARIO_APP]) {
      expect(terminos.length).toBeGreaterThan(0);
      expect(new Set(terminos.map((termino) => termino.termino)).size).toBe(
        terminos.length,
      );
      for (const termino of terminos) {
        expect(termino.termino.trim()).not.toBe('');
        expect(termino.definicion.trim()).not.toBe('');
      }
    }
  });
});
