const NOMBRES_PC = [
  'Do',
  'Do#',
  'Re',
  'Re#',
  'Mi',
  'Fa',
  'Fa#',
  'Sol',
  'Sol#',
  'La',
  'La#',
  'Si',
];

export function mod12(n: number): number {
  return ((n % 12) + 12) % 12;
}

export function nombrePC(pc: number): string {
  return NOMBRES_PC[mod12(pc)];
}
