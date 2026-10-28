import type {
  AcordeEntrada,
  AnalisisAcordes,
  AnalisisNotas,
  CalidadAcorde,
  NotaEntrada,
} from '../teoria';
import { mod12 } from './comun';

export { mod12 } from './comun';

const BASE_PC: Record<string, number> = {
  do: 0,
  re: 2,
  mi: 4,
  fa: 5,
  sol: 7,
  la: 9,
  si: 11,
  c: 0,
  d: 2,
  e: 4,
  f: 5,
  g: 7,
  a: 9,
  b: 11,
};

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/♯/g, '#')
    .replace(/♭/g, 'b');
}

function unirPalabras(texto: string): string {
  const raiz = '(?:do|re|mi|fa|sol|la|si|[a-g])';
  const acc = '(?:#|b|sostenido|bemol|sharp|flat)';
  const cal =
    '(?:maj7|m7b5|m7|min7|m6|add9|sus2|sus4|dim7|dism7|dim|dism|diminished|aug|aum|augmented|mayor|major|menor|minor|septima|seventh|7|6|9|[0-8]|m|M|\\+)';
  const re = new RegExp(`\\b(${raiz}(?:${acc})*)\\s+(${acc}|${cal})\\b`, 'gi');
  let anterior = '';
  let actual = texto;
  while (actual !== anterior) {
    anterior = actual;
    actual = actual.replace(re, (_, nota: string, palabra: string) => {
      const p = palabra.toLowerCase();
      if (p === 'sostenido' || p === 'sharp') return `${nota}#`;
      if (p === 'bemol' || p === 'flat') return `${nota}b`;
      return `${nota}${palabra}`;
    });
  }
  return actual;
}

function separarTokens(texto: string): string[] {
  const unido = unirPalabras(normalizar(texto))
    .replace(/[|,;]+/g, ' ')
    .replace(/[()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return unido ? unido.split(' ') : [];
}

function parsearNota(
  token: string,
): { pc: number; octava: number | null } | null {
  const m = token.match(/^(do|re|mi|fa|sol|la|si|[a-g])([#b]*)([0-8])?$/i);
  if (!m) return null;
  const base = BASE_PC[m[1].toLowerCase()];
  if (base === undefined) return null;
  let pc = base;
  for (const c of m[2]) pc += c === '#' ? 1 : -1;
  return { pc: mod12(pc), octava: m[3] ? Number(m[3]) : null };
}

function normalizarCalidad(resto: string): CalidadAcorde | null {
  const raw = resto.trim();
  if (raw === 'M') return 'mayor';
  if (raw === 'M7') return 'maj7';
  const c = raw.toLowerCase();
  const mapa: Record<string, CalidadAcorde> = {
    '': 'mayor',
    mayor: 'mayor',
    major: 'mayor',
    m: 'menor',
    min: 'menor',
    menor: 'menor',
    minor: 'menor',
    '7': '7',
    septima: '7',
    seventh: '7',
    dom7: '7',
    maj7: 'maj7',
    m7: 'm7',
    min7: 'm7',
    dim: 'dim',
    dism: 'dim',
    diminished: 'dim',
    dim7: 'dim7',
    dism7: 'dim7',
    aug: 'aug',
    aum: 'aug',
    augmented: 'aug',
    '+': 'aug',
    sus: 'sus4',
    sus4: 'sus4',
    sus2: 'sus2',
    '6': '6',
    m6: 'm6',
    min6: 'm6',
    '9': '9',
    add9: 'add9',
    '5': '5',
    m7b5: 'm7b5',
    'ø': 'm7b5',
  };
  return mapa[c] ?? null;
}

function parsearAcorde(
  token: string,
): { pc: number; calidad: CalidadAcorde } | null {
  const m = token.match(/^(do|re|mi|fa|sol|la|si|[a-g])([#b]*)(.*)$/i);
  if (!m) return null;
  const base = BASE_PC[m[1].toLowerCase()];
  if (base === undefined) return null;
  let pc = base;
  for (const c of m[2]) pc += c === '#' ? 1 : -1;
  const calidad = normalizarCalidad(m[3].split('/')[0]);
  if (!calidad) return null;
  return { pc: mod12(pc), calidad };
}

export function analizarNotas(texto: string): AnalisisNotas {
  const notas: NotaEntrada[] = [];
  const errores: string[] = [];
  let anterior: number | null = null;
  for (const token of separarTokens(texto)) {
    const parsed = parsearNota(token);
    if (!parsed) {
      errores.push(
        `No entendí "${token}". En Notas se escribe Do, Re, Mi... con octava opcional (Do4).`,
      );
      continue;
    }
    let midi: number;
    if (parsed.octava !== null) {
      midi = (parsed.octava + 1) * 12 + parsed.pc;
    } else if (anterior === null) {
      midi = 60 + parsed.pc;
    } else {
      const base = 60 + parsed.pc;
      const referencia = anterior;
      const candidatos = [base - 24, base - 12, base, base + 12, base + 24];
      midi = candidatos.reduce((a, b) =>
        Math.abs(b - referencia) < Math.abs(a - referencia) ? b : a,
      );
    }
    anterior = midi;
    notas.push({
      pc: parsed.pc,
      midi,
      tieneOctava: parsed.octava !== null,
      texto: token,
    });
  }
  return { tipo: 'notas', notas, errores };
}

export function analizarAcordes(texto: string): AnalisisAcordes {
  const acordes: AcordeEntrada[] = [];
  const errores: string[] = [];
  for (const token of separarTokens(texto)) {
    const parsed = parsearAcorde(token);
    if (!parsed) {
      errores.push(
        `No entendí "${token}". En Acordes se escribe Do, Lam, Re7, Fa#m...`,
      );
      continue;
    }
    acordes.push({ ...parsed, texto: token });
  }
  return { tipo: 'acordes', acordes, errores };
}
