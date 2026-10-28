export interface CuerdaGuitarra {
  numero: number;
  nombre: string;
  midi: number;
  instruccion: string;
}

export interface AcordeGuitarra {
  id: string;
  nombre: string;
  dedos: string[];
  cuerdas: number[];
  midi: number[];
  indicaciones: string[];
}

export interface LeccionGuitarra {
  id: string;
  titulo: string;
  objetivo: string;
  pasos: string[];
}

export interface ParejaAcordes {
  id: string;
  nombre: string;
  primero: string;
  segundo: string;
}

export const PAREJAS_CAMBIOS_ACORDE: ParejaAcordes[] = [
  {
    id: 'mi-menor-la-menor',
    nombre: 'Mi menor ↔ La menor',
    primero: 'mi-menor',
    segundo: 'la-menor',
  },
  {
    id: 'la-menor-do-mayor',
    nombre: 'La menor ↔ Do mayor',
    primero: 'la-menor',
    segundo: 'do-mayor',
  },
];

export function secuenciaDeAcordes(
  primero: string,
  segundo: string,
  compases: number,
): string[] {
  if (!primero || !segundo || primero === segundo) {
    throw new Error('Elegí dos acordes distintos para practicar.');
  }
  if (!Number.isInteger(compases) || compases < 1 || compases > 64) {
    throw new Error('La práctica debe tener entre 1 y 64 compases.');
  }
  return Array.from(
    { length: compases },
    (_, indice) => (indice % 2 === 0 ? primero : segundo),
  );
}

export const CUERDAS_GUITARRA: CuerdaGuitarra[] = [
  { numero: 6, nombre: 'Mi grave', midi: 40, instruccion: 'La más gruesa; arriba cuando sostenés la guitarra.' },
  { numero: 5, nombre: 'La', midi: 45, instruccion: 'La segunda cuerda contando desde la más gruesa.' },
  { numero: 4, nombre: 'Re', midi: 50, instruccion: 'La tercera cuerda desde la más gruesa.' },
  { numero: 3, nombre: 'Sol', midi: 55, instruccion: 'La cuarta cuerda desde la más gruesa.' },
  { numero: 2, nombre: 'Si', midi: 59, instruccion: 'La segunda más fina.' },
  { numero: 1, nombre: 'Mi agudo', midi: 64, instruccion: 'La más fina; abajo cuando sostenés la guitarra.' },
];

export const ACORDES_GUITARRA: AcordeGuitarra[] = [
  {
    id: 'mi-menor',
    nombre: 'Mi menor (Em)',
    dedos: ['0', '2', '2', '0', '0', '0'],
    cuerdas: [0, 2, 2, 0, 0, 0],
    midi: [40, 47, 52, 55, 59, 64],
    indicaciones: [
      'Poné el índice en el 2.º traste de la cuerda La (5.ª).',
      'Poné el dedo medio en el 2.º traste de la cuerda Re (4.ª).',
      'Dejá sonar las otras cuerdas al aire y rasgueá las seis.',
    ],
  },
  {
    id: 'la-menor',
    nombre: 'La menor (Am)',
    dedos: ['x', '0', '2', '2', '1', '0'],
    cuerdas: [-1, 0, 2, 2, 1, 0],
    midi: [45, 52, 57, 60, 64],
    indicaciones: [
      'No toques la cuerda Mi grave (6.ª); empezá desde la cuerda La.',
      'Índice en el 1.º traste de la cuerda Si (2.ª).',
      'Dedo medio en el 2.º traste de la cuerda Re (4.ª) y anular en el 2.º de Sol (3.ª).',
    ],
  },
  {
    id: 'do-mayor',
    nombre: 'Do mayor (C)',
    dedos: ['x', '3', '2', '0', '1', '0'],
    cuerdas: [-1, 3, 2, 0, 1, 0],
    midi: [48, 52, 55, 60, 64],
    indicaciones: [
      'No toques la cuerda Mi grave (6.ª); empezá desde la cuerda La.',
      'Anular en el 3.º traste de La (5.ª), dedo medio en el 2.º de Re (4.ª).',
      'Dejá Sol al aire; índice en el 1.º traste de Si (2.ª); Mi agudo al aire.',
    ],
  },
];

export const LECCIONES_GUITARRA: LeccionGuitarra[] = [
  {
    id: 'postura-cuerdas',
    titulo: '1. Preparar la guitarra',
    objetivo: 'Reconocer las cuerdas y sostener la guitarra sin tensión innecesaria.',
    pasos: [
      'Sentate estable y apoyá el cuerpo de la guitarra sobre la pierna; acercá el instrumento en vez de encorvarte.',
      'Dejá los hombros relajados y sujetá el mástil sin apretar fuerte con el pulgar.',
      'Las cuerdas se numeran desde la más fina: 1.ª Mi agudo, Si, Sol, Re, La y 6.ª Mi grave.',
      'Tocá cada cuerda al aire una vez, despacio, y nombrala. No hace falta pisar ningún traste.',
    ],
  },
  {
    id: 'afinacion',
    titulo: '2. Conocer la afinación',
    objetivo: 'Aprender el orden de las seis notas de la afinación estándar.',
    pasos: [
      'La afinación estándar, de la cuerda 6.ª a la 1.ª, es Mi - La - Re - Sol - Si - Mi.',
      'Elegí una cuerda para oír su nota de referencia y comparala con el sonido de tu cuerda al aire.',
      'Escuchá de nuevo si hace falta; esta referencia ayuda a reconocer las notas, pero no detecta si tu guitarra quedó afinada.',
      'Si necesitás afinar con precisión, usá un afinador de guitarra externo; el afinador vocal de la app no cumple esa función.',
    ],
  },
  {
    id: 'mi-menor',
    titulo: '3. Primer acorde: Mi menor',
    objetivo: 'Formar Em con dos dedos y hacer sonar cada cuerda con claridad.',
    pasos: ACORDES_GUITARRA[0].indicaciones,
  },
  {
    id: 'la-menor-do',
    titulo: '4. La menor y Do mayor',
    objetivo: 'Probar dos formas frecuentes y distinguir qué cuerdas se rasguean.',
    pasos: [
      ...ACORDES_GUITARRA[1].indicaciones,
      'Después probá Do mayor. Cambian las posiciones de los dedos y no se rasguea la sexta cuerda.',
      'Tocá las cuerdas de a una para comprobar que no estén apagadas por un dedo vecino.',
    ],
  },
  {
    id: 'cambios',
    titulo: '5. Practicar cambios',
    objetivo: 'Cambiar entre Em y Am con movimientos pequeños y relajados, siguiendo un pulso lento.',
    pasos: [
      'Formá Em y rasgueá una vez hacia abajo; dejá sonar el acorde.',
      'Levantá los dedos lo mínimo necesario y armá Am. No hace falta apurarse.',
      'Usá la práctica guiada de abajo: cambia entre Em y Am cada cuatro pulsos durante ocho compases.',
      'Probá después Am y C, primero colocando los dedos y luego rasgueando.',
    ],
  },
  {
    id: 'rasgueo',
    titulo: '6. Primer rasgueo',
    objetivo: 'Mantener un pulso parejo con golpes suaves hacia abajo.',
    pasos: [
      'En la lección anterior, elegí la práctica guiada para alternar Em y Am, o Am y C, con un pulso lento.',
      'Hacé un golpe suave hacia abajo en cada pulso y cambiá de acorde cuando la pantalla indique el nuevo compás.',
      'Mantené el movimiento de la muñeca suelto; el golpe no necesita fuerza.',
      'Si no llegás al cambio, pausá o bajá la velocidad. La práctica no mide el ritmo ni detecta si el acorde sonó limpio.',
    ],
  },
];
