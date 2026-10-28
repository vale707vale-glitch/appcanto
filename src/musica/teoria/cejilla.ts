import type {
  Analisis,
  SugerenciaCejilla,
  TonoDetectado,
} from '../teoria';
import { acordesPrincipales } from './tonalidad';
import { mod12, nombrePC } from './comun';

const FORMAS_MAYOR: Record<number, number> = {
  0: 10,
  7: 10,
  2: 9,
  9: 9,
  4: 9,
  5: 7,
  10: 6,
  3: 5,
  8: 4,
  1: 4,
  6: 3,
  11: 3,
};

const FORMAS_MENOR: Record<number, number> = {
  9: 10,
  4: 10,
  2: 9,
  11: 7,
  6: 6,
  1: 6,
  7: 6,
  0: 5,
  5: 5,
  10: 4,
  3: 3,
  8: 3,
};

export function sugerirCejillas(
  tono: TonoDetectado,
  analisis: Analisis,
): SugerenciaCejilla[] {
  const opciones: SugerenciaCejilla[] = [];
  for (let traste = 0; traste <= 7; traste++) {
    const formaPc = mod12(tono.pc - traste);
    const formas = tono.modo === 'mayor' ? FORMAS_MAYOR : FORMAS_MENOR;
    if ((formas[formaPc] ?? 0) === 0) continue;
    const acordes =
      analisis.tipo === 'acordes' && analisis.acordes.length > 0
        ? analisis.acordes.map((acorde) => ({
            ...acorde,
            pc: mod12(acorde.pc - traste),
          }))
        : acordesPrincipales({
            ...tono,
            pc: formaPc,
            nombre: `${nombrePC(formaPc)} ${tono.modo}`,
          });
    opciones.push({
      traste,
      formaPc,
      formaModo: tono.modo,
      formaNombre: `${nombrePC(formaPc)} ${tono.modo}`,
      formaCorta:
        tono.modo === 'mayor'
          ? nombrePC(formaPc)
          : `${nombrePC(formaPc)} menor`,
      acordes,
      recomendada: false,
    });
  }
  const puntuar = (opcion: SugerenciaCejilla) =>
    ((opcion.formaModo === 'mayor' ? FORMAS_MAYOR : FORMAS_MENOR)[
      opcion.formaPc
    ] ?? 0) -
    opcion.traste * 0.4 +
    (opcion.traste === 0 ? 1 : 0);
  opciones.sort((a, b) => puntuar(b) - puntuar(a));
  const mejores = opciones.slice(0, 2);
  mejores.forEach((opcion, indice) => {
    opcion.recomendada = indice === 0;
  });
  return mejores;
}
