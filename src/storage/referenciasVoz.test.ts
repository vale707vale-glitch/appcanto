import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cargarGrabarTomas,
  cargarTimbreReferencia,
  guardarGrabarTomas,
  guardarReferencia,
  guardarTimbreReferencia,
} from './referenciasVoz';

const datos = new Map<string, string>();

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

describe('referenciasVoz storage', () => {
  describe('preferencias de timbre y grabación', () => {
    it('timbre por defecto es "voz"', () => {
      expect(cargarTimbreReferencia()).toBe('voz');
    });

    it('guarda y recupera timbre "nota"', () => {
      guardarTimbreReferencia('nota');
      expect(cargarTimbreReferencia()).toBe('nota');
    });

    it('guarda y recupera timbre "voz"', () => {
      guardarTimbreReferencia('nota');
      guardarTimbreReferencia('voz');
      expect(cargarTimbreReferencia()).toBe('voz');
    });

    it('grabar tomas por defecto es false', () => {
      expect(cargarGrabarTomas()).toBe(false);
    });

    it('guarda y recupera preferencia de grabar tomas', () => {
      guardarGrabarTomas(true);
      expect(cargarGrabarTomas()).toBe(true);
      guardarGrabarTomas(false);
      expect(cargarGrabarTomas()).toBe(false);
    });
  });

  describe('validaciones de guardarReferencia', () => {
    it('rechaza notas MIDI fuera de rango', async () => {
      await expect(
        guardarReferencia({
          midi: -1,
          ejercicioId: 'notas-sueltas',
          precision: 80,
          centsMedio: 0,
          duracionMs: 1000,
          blob: new Blob(['audio']),
        }),
      ).rejects.toThrow('La nota de la toma no es válida.');

      await expect(
        guardarReferencia({
          midi: 130,
          ejercicioId: 'notas-sueltas',
          precision: 80,
          centsMedio: 0,
          duracionMs: 1000,
          blob: new Blob(['audio']),
        }),
      ).rejects.toThrow('La nota de la toma no es válida.');
    });

    it('rechaza precisión inválida', async () => {
      await expect(
        guardarReferencia({
          midi: 60,
          ejercicioId: 'notas-sueltas',
          precision: -5,
          centsMedio: 0,
          duracionMs: 1000,
          blob: new Blob(['audio']),
        }),
      ).rejects.toThrow('La precisión de la toma no es válida.');

      await expect(
        guardarReferencia({
          midi: 60,
          ejercicioId: 'notas-sueltas',
          precision: 105,
          centsMedio: 0,
          duracionMs: 1000,
          blob: new Blob(['audio']),
        }),
      ).rejects.toThrow('La precisión de la toma no es válida.');
    });

    it('rechaza blobs vacíos', async () => {
      await expect(
        guardarReferencia({
          midi: 60,
          ejercicioId: 'notas-sueltas',
          precision: 90,
          centsMedio: 0,
          duracionMs: 1000,
          blob: new Blob([]),
        }),
      ).rejects.toThrow('La toma quedó vacía.');
    });
  });
});
