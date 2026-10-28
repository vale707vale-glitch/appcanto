import type {
  Analisis,
  AcordeEntrada,
  CalidadAcorde,
  ModoTono,
  NotaEntrada,
  TonoDetectado,
} from '../teoria';
import { mod12, nombrePC } from './comun';

const ESCALAS: Record<ModoTono, number[]> = {
  mayor: [0, 2, 4, 5, 7, 9, 11],
  menor: [0, 2, 3, 5, 7, 8, 10],
};

const CALIDADES_DIATONICAS: Record<ModoTono, CalidadAcorde[]> = {
  mayor: ['mayor', 'menor', 'menor', 'mayor', 'mayor', 'menor', 'dim'],
  menor: ['menor', 'dim', 'mayor', 'menor', 'menor', 'mayor', 'mayor'],
};

function calidadBase(
  c: CalidadAcorde,
): 'mayor' | 'menor' | 'dim' | 'aug' | 'neutro' {
  switch (c) {
    case 'mayor':
    case '7':
    case 'maj7':
    case '6':
    case '9':
    case 'add9':
      return 'mayor';
    case 'menor':
    case 'm7':
    case 'm6':
      return 'menor';
    case 'dim':
    case 'dim7':
    case 'm7b5':
      return 'dim';
    case 'aug':
      return 'aug';
    case 'sus2':
    case 'sus4':
    case '5':
      return 'neutro';
    default:
      return 'neutro';
  }
}

function ordenarPorConfianza(candidatos: TonoDetectado[]): TonoDetectado[] {
  const ordenados = [...candidatos].sort((a, b) => b.puntaje - a.puntaje);
  const top = ordenados[0];
  const segundo = ordenados[1];
  if (!top) return [];
  const diferencia = top.puntaje - (segundo?.puntaje ?? 0);
  for (const candidato of ordenados) {
    if (candidato === top) {
      candidato.confianza =
        top.puntaje >= 85 && diferencia >= 6
          ? 'alta'
          : top.puntaje >= 65
            ? 'media'
            : 'baja';
    } else {
      candidato.confianza = candidato.puntaje >= 80 ? 'media' : 'baja';
    }
  }
  if (top.confianza === 'alta' && diferencia < 4) top.confianza = 'media';
  return ordenados;
}

function explicarNotas(
  primera: number,
  ultima: number,
  pc: number,
  modo: ModoTono,
  dentro: number,
  total: number,
): string {
  const partes = [
    `${dentro} de ${total} ${total === 1 ? 'nota encaja' : 'notas encajan'} en la escala de ${nombrePC(pc)} ${modo}.`,
  ];
  if (ultima === pc) {
    partes.push('La última nota es la tónica, así que es la candidata más fuerte.');
  } else if (primera === pc) {
    partes.push('La primera nota es la tónica.');
  } else {
    partes.push(
      'No hay una tónica clara al principio ni al final, así que puede haber otra posibilidad.',
    );
  }
  return partes.join(' ');
}

function explicarAcordes(
  primera: number,
  ultima: number,
  pc: number,
  modo: ModoTono,
  dentro: number,
  total: number,
  tonica: boolean,
  dominante: boolean,
): string {
  const partes = [
    `${dentro} de ${total} ${total === 1 ? 'acorde encaja' : 'acordes encajan'} en ${nombrePC(pc)} ${modo}.`,
  ];
  if (ultima === pc) {
    partes.push('El último acorde es la tónica, la que suena como casa.');
  } else if (primera === pc) {
    partes.push('El primer acorde es la tónica.');
  }
  if (dominante) {
    partes.push('Aparece el dominante (V), que suele resolver a la tónica.');
  }
  if (!tonica) {
    partes.push('No aparece el acorde de tónica, así que la respuesta es menos segura.');
  }
  return partes.join(' ');
}

function detectarTonoNotas(notas: NotaEntrada[]): TonoDetectado[] {
  if (notas.length === 0) return [];
  const total = notas.length;
  const conteo = new Map<number, number>();
  for (const nota of notas) {
    conteo.set(nota.pc, (conteo.get(nota.pc) ?? 0) + 1);
  }
  const primera = notas[0].pc;
  const ultima = notas[notas.length - 1].pc;
  const candidatos: TonoDetectado[] = [];
  for (const modo of ['mayor', 'menor'] as const) {
    for (let pc = 0; pc < 12; pc++) {
      const escala = ESCALAS[modo].map((grado) => mod12(pc + grado));
      let dentro = 0;
      for (const [notaPc, cantidad] of conteo) {
        if (escala.includes(notaPc)) dentro += cantidad;
      }
      const fit = dentro / total;
      let puntaje = fit * 75;
      const tieneTonica = conteo.has(pc);
      if (tieneTonica) puntaje += 8;
      if (primera === pc) puntaje += 5;
      if (ultima === pc) puntaje += 10;
      const tercera = mod12(pc + (modo === 'mayor' ? 4 : 3));
      if (conteo.has(tercera)) puntaje += 4;
      const quinta = mod12(pc + 7);
      if (conteo.has(quinta)) puntaje += 3;
      if (!tieneTonica) puntaje -= 5;
      candidatos.push({
        pc,
        modo,
        nombre: `${nombrePC(pc)} ${modo}`,
        puntaje: Math.round(puntaje),
        confianza: 'baja',
        coincidencias: dentro,
        total,
        explicacion: explicarNotas(primera, ultima, pc, modo, dentro, total),
      });
    }
  }
  return ordenarPorConfianza(candidatos);
}

function detectarTonoAcordes(acordes: AcordeEntrada[]): TonoDetectado[] {
  if (acordes.length === 0) return [];
  const total = acordes.length;
  const primera = acordes[0].pc;
  const ultima = acordes[acordes.length - 1].pc;
  const candidatos: TonoDetectado[] = [];
  for (const modo of ['mayor', 'menor'] as const) {
    for (let pc = 0; pc < 12; pc++) {
      const grados = ESCALAS[modo];
      let dentro = 0;
      let puntaje = 0;
      let tieneTonica = false;
      let tieneDominante = false;
      let tieneSubdominante = false;
      for (const acorde of acordes) {
        const grado = mod12(acorde.pc - pc);
        const idx = grados.indexOf(grado);
        if (idx === -1) continue;
        dentro++;
        puntaje += 10;
        if (grado === 0) tieneTonica = true;
        if (grado === 7) tieneDominante = true;
        if (grado === 5) tieneSubdominante = true;
        const esperada = CALIDADES_DIATONICAS[modo][idx];
        const base = calidadBase(acorde.calidad);
        if (base === esperada) puntaje += 6;
        else if (base === 'neutro') puntaje += 2;
        else if (
          modo === 'menor' &&
          grado === 7 &&
          (base === 'mayor' || acorde.calidad === '7')
        ) {
          puntaje += 8;
        } else if (modo === 'mayor' && grado === 7 && acorde.calidad === '7') {
          puntaje += 6;
        } else if (
          modo === 'mayor' &&
          (grado === 0 || grado === 5) &&
          acorde.calidad === '7'
        ) {
          puntaje += 4;
        } else {
          puntaje -= 2;
        }
      }
      puntaje += (dentro / total) * 30;
      if (tieneTonica) puntaje += 6;
      else puntaje -= 5;
      if (primera === pc) puntaje += 8;
      if (ultima === pc) puntaje += 12;
      if (tieneDominante) puntaje += 8;
      if (tieneSubdominante) puntaje += 3;
      candidatos.push({
        pc,
        modo,
        nombre: `${nombrePC(pc)} ${modo}`,
        puntaje: Math.round(puntaje),
        confianza: 'baja',
        coincidencias: dentro,
        total,
        explicacion: explicarAcordes(
          primera,
          ultima,
          pc,
          modo,
          dentro,
          total,
          tieneTonica,
          tieneDominante,
        ),
      });
    }
  }
  return ordenarPorConfianza(candidatos);
}

export function detectarTono(analisis: Analisis): TonoDetectado[] {
  return analisis.tipo === 'notas'
    ? detectarTonoNotas(analisis.notas)
    : detectarTonoAcordes(analisis.acordes);
}

export function acordesPrincipales(tono: TonoDetectado): AcordeEntrada[] {
  const grados = tono.modo === 'mayor' ? [0, 5, 7, 9] : [0, 5, 7, 8];
  const calidades: CalidadAcorde[] =
    tono.modo === 'mayor'
      ? ['mayor', 'mayor', 'mayor', 'menor']
      : ['menor', 'menor', 'menor', 'mayor'];
  return grados.map((grado, indice) => ({
    pc: mod12(tono.pc + grado),
    calidad: calidades[indice],
    texto: '',
  }));
}
