import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cargarModoPrincipiante,
  cargarProgreso,
  cargarRangoVocal,
  cargarTransposicionVocal,
  cargarTolerancia,
  exportarProgreso,
  importarProgreso,
  guardarSesion,
  guardarRangoVocal,
  guardarTransposicionVocal,
  guardarTolerancia,
  hoyISO,
  MAX_SESIONES,
  obtenerErrorPersistencia,
  resumir,
  type Sesion,
} from './progreso';

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

describe('progreso', () => {
  it('carga progreso vacío sin datos guardados', () => {
    expect(cargarProgreso()).toEqual({ sesiones: [] });
  });

  it('recupera sesiones guardadas', () => {
    const sesiones: Sesion[] = [
      { fecha: '2026-10-25', ejercicioId: 'a', precision: 80, notasBien: 2, notasTotal: 3 },
    ];
    datos.set('canta-app-progreso-v1', JSON.stringify({ sesiones }));
    expect(cargarProgreso()).toEqual({ sesiones });
  });

  it.each(['inválido', '{"sesiones":{}}'])('maneja datos corruptos: %s', (valor) => {
    datos.set('canta-app-progreso-v1', valor);
    expect(cargarProgreso()).toEqual({ sesiones: [] });
  });

  it('guarda una sesión y la devuelve junto con el progreso', () => {
    const sesion: Sesion = {
      fecha: hoyISO(),
      ejercicioId: 'vocalizacion',
      precision: 90,
      notasBien: 3,
      notasTotal: 3,
    };
    expect(guardarSesion(sesion)).toEqual({ sesiones: [sesion] });
    expect(cargarProgreso()).toEqual({ sesiones: [sesion] });
  });

  it('guarda detalle por nota y fecha precisa sin cambiar sesiones antiguas', () => {
    const sesion: Sesion = {
      fecha: hoyISO(),
      registradoEn: '2026-10-25T18:30:00.000Z',
      tempoPorcentaje: 60,
      ejercicioId: 'notas-sueltas',
      precision: 75,
      notasBien: 1,
      notasTotal: 2,
      detalleNotas: [
        { midi: 60, precision: 100 },
        { midi: 64, precision: 50 },
      ],
    };
    guardarSesion(sesion);
    expect(cargarProgreso()).toEqual({ sesiones: [sesion] });
    expect(importarProgreso(exportarProgreso())).toEqual({ sesiones: [sesion] });

    const sesionAnterior: Sesion = {
      fecha: hoyISO(),
      ejercicioId: 'notas',
      precision: 80,
      notasBien: 1,
      notasTotal: 1,
    };
    expect(importarProgreso(JSON.stringify({ sesiones: [sesionAnterior] }))).toEqual({
      sesiones: [sesionAnterior],
    });
  });

  it('exporta e importa progreso validado', () => {
    const sesion: Sesion = {
      fecha: '2026-10-25',
      ejercicioId: 'notas',
      precision: 82,
      notasBien: 4,
      notasTotal: 5,
    };
    const texto = JSON.stringify({ sesiones: [sesion] });
    expect(importarProgreso(texto)).toEqual({ sesiones: [sesion] });
    expect(JSON.parse(exportarProgreso())).toEqual({ sesiones: [sesion] });
  });

  it.each([
    'texto',
    '{}',
    '{"sesiones":[{"fecha":"no-es-fecha","ejercicioId":"a","precision":80,"notasBien":1,"notasTotal":1}]}',
    '{"sesiones":[{"fecha":"2026-10-25","ejercicioId":"a","precision":101,"notasBien":1,"notasTotal":1}]}',
    '{"sesiones":[{"fecha":"2026-10-25","ejercicioId":"a","precision":80,"notasBien":1,"notasTotal":1,"detalleNotas":[{"midi":200,"precision":50}]}]}',
    '{"sesiones":[{"fecha":"2026-10-25","ejercicioId":"a","precision":80,"notasBien":1,"notasTotal":1,"registradoEn":"fecha inválida"}]}',
    '{"sesiones":[{"fecha":"2026-10-25","ejercicioId":"a","precision":80,"notasBien":1,"notasTotal":1,"tempoPorcentaje":150}]}',
  ])('rechaza un respaldo inválido: %s', (texto) => {
    expect(() => importarProgreso(texto)).toThrow();
  });

  it('conserva como máximo las sesiones más recientes', () => {
    const sesiones: Sesion[] = Array.from(
      { length: MAX_SESIONES + 2 },
      (_, i) => ({
        fecha: '2026-10-25',
        ejercicioId: `sesion-${i}`,
        precision: 50,
        notasBien: 1,
        notasTotal: 2,
      }),
    );
    datos.set('canta-app-progreso-v1', JSON.stringify({ sesiones }));
    const progreso = cargarProgreso();
    expect(progreso.sesiones).toHaveLength(MAX_SESIONES);
    expect(progreso.sesiones[0].ejercicioId).toBe('sesion-2');
  });

  it('avisa si el almacenamiento no permite guardar', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
    });
    guardarSesion({
      fecha: hoyISO(),
      ejercicioId: 'notas',
      precision: 80,
      notasBien: 1,
      notasTotal: 1,
    });
    expect(obtenerErrorPersistencia()).toContain('No se pudo guardar');
  });

  it('calcula el promedio, días y total de sesiones', () => {
    const resumen = resumir({
      sesiones: [
        { fecha: '2026-10-24', ejercicioId: 'a', precision: 80, notasBien: 2, notasTotal: 3 },
        { fecha: '2026-10-24', ejercicioId: 'b', precision: 61, notasBien: 1, notasTotal: 2 },
        { fecha: '2026-10-25', ejercicioId: 'a', precision: 99, notasBien: 3, notasTotal: 3 },
      ],
    });
    expect(resumen.precisionMedia).toBe(80);
    expect(resumen.diasPracticados).toBe(2);
    expect(resumen.sesionesTotal).toBe(3);
  });

  it('cuenta la racha de hoy y ayer', () => {
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    const fecha = (dia: Date) =>
      `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(
        dia.getDate(),
      ).padStart(2, '0')}`;
    const racha = resumir({
      sesiones: [
        { fecha: fecha(hoy), ejercicioId: 'a', precision: 80, notasBien: 1, notasTotal: 1 },
        { fecha: fecha(ayer), ejercicioId: 'a', precision: 80, notasBien: 1, notasTotal: 1 },
      ],
    });
    expect(racha.racha).toBe(2);
  });

  it('usa cero como resumen de progreso vacío', () => {
    expect(resumir({ sesiones: [] })).toEqual({
      precisionMedia: 0,
      diasPracticados: 0,
      racha: 0,
      sesionesTotal: 0,
    });
  });

  it.each([
    [20, 20],
    [75, 75],
    [100, 100],
    [19, 50],
    [101, 50],
    ['no-numérico', 50],
  ])('carga tolerancia %s o usa el defecto', (valor, esperado) => {
    datos.set('canta-app-tolerancia-v1', String(valor));
    expect(cargarTolerancia(50)).toBe(esperado);
  });

  it('guarda tolerancia y carga modo principiante activado por defecto', () => {
    guardarTolerancia(65);
    expect(cargarTolerancia(50)).toBe(65);
    expect(cargarModoPrincipiante()).toBe(true);
    datos.set('canta-app-principiante-v1', '0');
    expect(cargarModoPrincipiante()).toBe(false);
  });

  it.each([
    ['-12', -12],
    ['0', 0],
    ['12', 12],
    ['5', 0],
    ['dato', 0],
  ])('carga transposición vocal %s con fallback seguro', (valor, esperado) => {
    datos.set('canta-app-transposicion-vocal-v1', valor);
    expect(cargarTransposicionVocal()).toBe(esperado);
  });

  it('guarda la transposición vocal elegida', () => {
    guardarTransposicionVocal(-12);
    expect(cargarTransposicionVocal()).toBe(-12);
  });

  it('guarda y carga un rango vocal confirmado', () => {
    const rango = { graveMidi: 48, agudaMidi: 67 };
    guardarRangoVocal(rango);
    expect(cargarRangoVocal()).toEqual(rango);
  });

  it.each([
    '{"graveMidi":70,"agudaMidi":60}',
    '{"graveMidi":39,"agudaMidi":60}',
    '{"graveMidi":"48","agudaMidi":67}',
    '{"graveMidi":48}',
  ])('rechaza un rango vocal inválido: %s', (valor) => {
    datos.set('canta-app-rango-vocal-v1', valor);
    expect(cargarRangoVocal()).toBeNull();
  });

  it('rechaza guardar extremos invertidos', () => {
    expect(() => guardarRangoVocal({ graveMidi: 67, agudaMidi: 48 })).toThrow(
      'El rango vocal debe tener dos notas válidas y ordenadas.',
    );
  });
});
