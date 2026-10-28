// Lecciones cortas de música pensadas para alguien que empieza desde cero.

export interface EjemploAudioLeccion {
  etiqueta: string;
  notas: number[];
  segundos?: number;
  duraciones?: number[];
  tipo?: 'melodia' | 'acorde';
}

export type PracticaLeccion =
  | { tipo: 'ejercicio'; id: string; etiqueta: string }
  | { tipo: 'cancion'; id: string; etiqueta: string }
  | { tipo: 'rango'; etiqueta: string };

export interface LeccionMusica {
  id: string;
  titulo: string;
  resumen: string;
  parrafos: string[];
  clave: string;
  ejemplos?: EjemploAudioLeccion[];
  practica?: PracticaLeccion;
}

export interface TerminoGlosario {
  termino: string;
  definicion: string;
}

export const LECCIONES_MUSICA: LeccionMusica[] = [
  {
    id: 'las-7-notas',
    titulo: 'Las 7 notas',
    resumen: 'Do, Re, Mi, Fa, Sol, La, Si: el abecedario de la música.',
    parrafos: [
      'La música usa siete nombres para las notas: Do, Re, Mi, Fa, Sol, La y Si. Cuando llegás a Si, después vuelve a empezar Do, pero más agudo.',
      'Cada nota suena a una altura distinta. Si escuchás una melodía y la repetís con "aaa", aunque no sepas los nombres, ya estás cantando notas.',
      'No necesitás memorizar nada para practicar: la app te hace escuchar una nota y vos la imitás. Los nombres sirven para entenderte y para leer las lecciones.',
    ],
    clave:
      'Pensá en las notas como los peldaños de una escalera: cada una está un poquito más arriba que la anterior.',
    ejemplos: [
      {
        etiqueta: 'Escuchar Do Re Mi Fa Sol La Si Do',
        notas: [60, 62, 64, 65, 67, 69, 71, 72],
        segundos: 0.45,
      },
    ],
    practica: {
      tipo: 'ejercicio',
      id: 'notas-sueltas',
      etiqueta: 'Practicar notas sueltas',
    },
  },
  {
    id: 'grave-y-agudo',
    titulo: 'Grave y agudo',
    resumen: 'Grave es abajo y oscuro; agudo es arriba y brillante.',
    parrafos: [
      'Grave y agudo describen si un sonido está más abajo o más arriba. Un trueno es grave; un silbato es agudo.',
      'En tu voz, lo grave es tu zona cómoda baja, parecida a cuando hablás. Lo agudo es cuando subís, como si llamaras a alguien que está lejos.',
      'La app te dice "subí" cuando estás por debajo de la nota pedida y "bajá" cuando estás por encima. No es un reto: son indicaciones para acercarte.',
    ],
    clave:
      'Si una nota te queda cómoda, tu voz ya sabe hacerla. La app solo te ayuda a encontrar la altura.',
    ejemplos: [
      { etiqueta: 'Escuchar una nota grave (Do3)', notas: [48], segundos: 0.9 },
      { etiqueta: 'Escuchar una nota aguda (Do5)', notas: [72], segundos: 0.9 },
    ],
    practica: {
      tipo: 'rango',
      etiqueta: 'Encontrar mi zona cómoda',
    },
  },
  {
    id: 'octavas',
    titulo: 'Octavas: la misma nota, otra altura',
    resumen: 'Do4 y Do5 se llaman igual, pero uno suena más agudo.',
    parrafos: [
      'Una octava es la distancia entre una nota y la siguiente nota con el mismo nombre. Do4 y Do5 se llaman igual, pero Do5 suena más agudo.',
      'La octava tiene doce semitonos. Por eso, después de Si volvés a Do en una altura nueva. El número (4, 5...) indica la octava.',
      'La app tiene en cuenta la octava: si cantás la nota correcta una octava más grave o más aguda, la cuenta como bien. Elegí la altura que te resulte cómoda.',
    ],
    clave:
      'Misma nota, otra altura. Si no llegás a Do5, cantá Do4: para la app sigue siendo Do.',
    ejemplos: [
      { etiqueta: 'Do4 y después Do5', notas: [60, 72], segundos: 0.8 },
      { etiqueta: 'Do4 y Do5 a la vez', notas: [60, 72], tipo: 'acorde' },
    ],
    practica: {
      tipo: 'ejercicio',
      id: 'notas-sueltas',
      etiqueta: 'Practicar notas sueltas',
    },
  },
  {
    id: 'tono-y-semitono',
    titulo: 'Tono y semitono',
    resumen: 'Las distancias entre notas: un paso corto y uno más largo.',
    parrafos: [
      'La distancia más chica entre dos notas se llama semitono. Si imaginás un piano, es pasar de una tecla a la siguiente, blanca o negra.',
      'Dos semitonos forman un tono. Por ejemplo, de Do a Re hay un tono; de Mi a Fa hay un semitono. Por eso las notas no están todas a la misma distancia.',
      'No hace falta ver las teclas: el oído nota la diferencia. Un tono suena como un paso más amplio; un semitono, como un paso cortito.',
    ],
    clave:
      'Tono = dos semitonos. Semitono = el paso más chico entre dos notas.',
    ejemplos: [
      { etiqueta: 'Un tono: Do a Re', notas: [60, 62], segundos: 0.8 },
      { etiqueta: 'Un semitono: Mi a Fa', notas: [64, 65], segundos: 0.8 },
    ],
    practica: {
      tipo: 'ejercicio',
      id: 'notas-sueltas',
      etiqueta: 'Seguir escuchando notas',
    },
  },
  {
    id: 'afinado-y-cents',
    titulo: 'Afinado, alto y bajo',
    resumen: 'Qué mide la app cuando dice que estás cerca o lejos de una nota.',
    parrafos: [
      'Estar afinado significa que la nota que cantás coincide con la nota pedida. Si tu voz queda un poquito más arriba, estás alto; si queda un poquito más abajo, estás bajo.',
      'La app mide esa diferencia en cents. Cien cents equivalen a un semitono. Cuanto más cerca de cero, más afinado estás.',
      'Cada ejercicio acepta un margen, por ejemplo ±50 cents. Dentro de ese margen se considera afinado. Si el número es más grande, la app te dice "subí" o "bajá".',
    ],
    clave:
      'No busques clavar la nota perfecta: buscá acercarte. La app te avisa para qué lado corregir.',
    ejemplos: [
      {
        etiqueta: 'Escuchar la nota de referencia (Do4)',
        notas: [60],
        segundos: 1.2,
      },
    ],
    practica: {
      tipo: 'ejercicio',
      id: 'notas-sueltas',
      etiqueta: 'Probar mi afinación',
    },
  },
  {
    id: 'escala-mayor',
    titulo: 'La escala mayor',
    resumen: 'Do Re Mi Fa Sol La Si Do: la serie de notas más usada.',
    parrafos: [
      'Una escala es una serie de notas que suben o bajan en orden. La escala mayor de Do usa las siete notas naturales, de Do a Do.',
      'Su camino es: tono, tono, semitono, tono, tono, tono y semitono. Ese dibujo es lo que hace que suene familiar, como una canción alegre.',
      'Muchas melodías simples usan solo notas de una escala. Reconocerla te ayuda a imaginar para dónde puede seguir la música.',
    ],
    clave:
      'Si te sabés Do Re Mi Fa Sol La Si, ya conocés la escala mayor de Do.',
    ejemplos: [
      {
        etiqueta: 'Escala subiendo',
        notas: [60, 62, 64, 65, 67, 69, 71, 72],
        segundos: 0.35,
      },
      {
        etiqueta: 'Escala bajando',
        notas: [72, 71, 69, 67, 65, 64, 62, 60],
        segundos: 0.35,
      },
    ],
    practica: {
      tipo: 'ejercicio',
      id: 'escala-mayor',
      etiqueta: 'Practicar la escala mayor',
    },
  },
  {
    id: 'intervalos',
    titulo: 'Intervalos: distancias entre notas',
    resumen: 'Una tercera, una quinta y una octava son formas de medir saltos.',
    parrafos: [
      'Un intervalo es la distancia entre dos notas. Se cuenta incluyendo las dos puntas: de Do a Mi hay una tercera (Do, Re, Mi), y de Do a Sol hay una quinta (Do, Re, Mi, Fa, Sol).',
      'Cada intervalo tiene su propio sonido. Una tercera suena relativamente cerca; una quinta suena más abierta; una octava suena como la misma nota más aguda.',
      'En el ejercicio de intervalos, la app toca una nota base y vos cantás la segunda. No hace falta contar: escuchá el salto y repetilo.',
    ],
    clave:
      'No pienses en números mientras cantás. Escuchá la distancia y copiala.',
    ejemplos: [
      { etiqueta: 'Tercera: Do a Mi', notas: [60, 64], segundos: 0.8 },
      { etiqueta: 'Quinta: Do a Sol', notas: [60, 67], segundos: 0.8 },
      { etiqueta: 'Octava: Do4 a Do5', notas: [60, 72], segundos: 0.8 },
    ],
    practica: {
      tipo: 'ejercicio',
      id: 'intervalos',
      etiqueta: 'Practicar intervalos',
    },
  },
  {
    id: 'ritmo-y-pulso',
    titulo: 'Ritmo y pulso',
    resumen: 'El latido parejo de la música y la duración de cada nota.',
    parrafos: [
      'El pulso es el latido parejo que sentís al seguir una canción, como el tic-tac de un reloj. El tempo es la velocidad de ese pulso.',
      'El ritmo es cómo se reparten las notas en el tiempo: algunas duran más y otras menos.',
      'En "Práctica base" podés encender el metrónomo para sentir el pulso. En las canciones, las notas tienen duraciones distintas; si te apurás o te atrasás, la app lo nota.',
    ],
    clave: 'Primero sentí el pulso; después preocupate por las notas.',
    ejemplos: [
      {
        etiqueta: 'Pulso parejo',
        notas: [60, 60, 60, 60],
        duraciones: [0.5, 0.5, 0.5, 0.5],
      },
      {
        etiqueta: 'Una nota larga y dos cortas',
        notas: [60, 64, 67, 60],
        duraciones: [1, 0.35, 0.35, 1],
      },
    ],
    practica: {
      tipo: 'cancion',
      id: 'estrellita',
      etiqueta: 'Practicar Estrellita',
    },
  },
  {
    id: 'leer-resultados',
    titulo: 'Cómo leer tus resultados',
    resumen: 'Qué significan precisión, notas bien, tempo y "nota a dedicar".',
    parrafos: [
      'Precisión: es el promedio de qué tan cerca cantaste cada nota, de 0 a 100%. No es un examen: sirve para comparar tus propios intentos.',
      'Notas bien / total: cuenta cuántas notas quedaron dentro del margen. Cada nota vale como "bien" si alcanza el 70% de precisión.',
      'Tempo: en las canciones podés practicar al 100%, 80% o 60% de velocidad. Ese porcentaje indica la velocidad que elegiste, no un error.',
      'Cuando ves "Subiste 5 puntos" o "Bajaste 3 puntos", se compara con tu intento anterior de la misma pieza. La "nota a dedicar" es la que más te cuesta en tus últimas prácticas.',
    ],
    clave:
      'Mirá la tendencia, no un solo resultado. Un día flojo no borra lo que ya aprendiste.',
    practica: {
      tipo: 'cancion',
      id: 'estrellita',
      etiqueta: 'Practicar y ver el resultado',
    },
  },
];

const LECCION_POR_EJERCICIO: Record<string, string> = {
  'notas-sueltas': 'las-7-notas',
  'escala-mayor': 'escala-mayor',
  intervalos: 'intervalos',
  'pasos-descendentes': 'grave-y-agudo',
  'arpegio-mayor': 'escala-mayor',
  pentatonica: 'escala-mayor',
};

export const LECCION_POR_CANCION = 'ritmo-y-pulso';

export function leccionParaEjercicio(id: string): string {
  return LECCION_POR_EJERCICIO[id] ?? 'afinado-y-cents';
}

export const GLOSARIO_MUSICA: TerminoGlosario[] = [
  {
    termino: 'Afinación',
    definicion: 'Qué tan cerca está una nota de la altura correcta.',
  },
  {
    termino: 'Agudo',
    definicion: 'Sonido alto y brillante. Se opone a grave.',
  },
  {
    termino: 'Grave',
    definicion: 'Sonido bajo y oscuro. Se opone a agudo.',
  },
  {
    termino: 'Octava',
    definicion:
      'Distancia de doce semitonos entre dos notas con el mismo nombre.',
  },
  {
    termino: 'Semitono',
    definicion: 'La distancia más chica entre dos notas.',
  },
  {
    termino: 'Tono',
    definicion: 'Dos semitonos.',
  },
  {
    termino: 'Escala',
    definicion: 'Serie de notas que suben o bajan en orden.',
  },
  {
    termino: 'Intervalo',
    definicion: 'Distancia entre dos notas.',
  },
  {
    termino: 'Pulso',
    definicion: 'Latido parejo que se repite en la música.',
  },
  {
    termino: 'Tempo',
    definicion: 'Velocidad del pulso.',
  },
  {
    termino: 'Cent',
    definicion: 'Medida de afinación. Cien cents son un semitono.',
  },
  {
    termino: 'Rango vocal',
    definicion: 'Las notas que podés cantar cómodamente.',
  },
];

export const GLOSARIO_APP: TerminoGlosario[] = [
  {
    termino: 'Precisión',
    definicion: 'Porcentaje de qué tan cerca cantaste las notas.',
  },
  {
    termino: 'Tolerancia',
    definicion:
      'Margen de desafinación que la app acepta, medido en cents.',
  },
  {
    termino: 'Nota a dedicar',
    definicion:
      'La nota que más te cuesta en tus últimas prácticas de una pieza.',
  },
  {
    termino: 'Calibración',
    definicion:
      'Prueba corta para encontrar las notas que te resultan cómodas.',
  },
  {
    termino: 'Modo principiante',
    definicion:
      'Muestra menos números y más indicaciones en palabras.',
  },
  {
    termino: 'Tempo de práctica',
    definicion:
      'Velocidad elegida para una canción: 100%, 80% o 60%.',
  },
];
