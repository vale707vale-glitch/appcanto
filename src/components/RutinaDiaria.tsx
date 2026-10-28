import { useState } from 'react';

const CLAVE_RUTINA = 'canta-app-rutina-v1';

type Enfoque = 'voz' | 'guitarra' | 'mixta';

interface Rutina {
  fecha: string;
  minutos: 5 | 10 | 15;
  enfoque: Enfoque;
  completados: string[];
}

interface Paso {
  id: string;
  titulo: string;
  detalle: string;
  minutos: number;
  accion: string;
  abrir: () => void;
}

function fechaLocal(): string {
  const hoy = new Date();
  const mes = `${hoy.getMonth() + 1}`.padStart(2, '0');
  const dia = `${hoy.getDate()}`.padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

function rutinaValida(valor: unknown): valor is Rutina {
  if (typeof valor !== 'object' || valor === null) return false;
  const rutina = valor as Partial<Rutina>;
  return (
    rutina.fecha === fechaLocal() &&
    [5, 10, 15].includes(rutina.minutos ?? 0) &&
    ['voz', 'guitarra', 'mixta'].includes(rutina.enfoque ?? '') &&
    Array.isArray(rutina.completados) &&
    rutina.completados.every((id) => typeof id === 'string')
  );
}

function cargarRutina(): { rutina: Rutina; error: string } {
  const inicial: Rutina = {
    fecha: fechaLocal(),
    minutos: 5,
    enfoque: 'mixta',
    completados: [],
  };
  try {
    const guardada = localStorage.getItem(CLAVE_RUTINA);
    if (!guardada) return { rutina: inicial, error: '' };
    const parsed: unknown = JSON.parse(guardada);
    if (rutinaValida(parsed)) return { rutina: parsed, error: '' };
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'fecha' in parsed &&
      parsed.fecha === fechaLocal()
    ) {
      return {
        rutina: inicial,
        error: 'La rutina guardada tiene un formato inválido.',
      };
    }
    return { rutina: inicial, error: '' };
  } catch {
    return {
      rutina: inicial,
      error: 'No se pudo leer la rutina guardada en este navegador.',
    };
  }
}

export default function RutinaDiaria({
  alVoz,
  alCancion,
  alAprenderGuitarra,
  alAfinadorGuitarra,
}: {
  alVoz: () => void;
  alCancion: () => void;
  alAprenderGuitarra: () => void;
  alAfinadorGuitarra: () => void;
}) {
  const [estadoInicial] = useState(cargarRutina);
  const [rutina, setRutina] = useState(estadoInicial.rutina);
  const [error, setError] = useState(estadoInicial.error);

  const pasos: Paso[] = (() => {
    const minutos = rutina.minutos;
    const minutosVoz = Math.floor(minutos / 3);
    const minutosGuitarra = Math.ceil(minutos / 3);
    const minutosCancion = minutos - minutosVoz - minutosGuitarra;
    if (rutina.enfoque === 'voz') {
      return [
        {
          id: 'voz-notas',
          titulo: 'Calentá con notas cómodas',
          detalle: 'Imitá notas sueltas sin forzar la voz.',
          minutos: Math.ceil(minutos / 2),
          accion: 'Abrir ejercicio',
          abrir: alVoz,
        },
        {
          id: 'voz-cancion',
          titulo: 'Cantá una melodía',
          detalle: 'Escuchá y repetí una canción a tu altura cómoda.',
          minutos: Math.floor(minutos / 2),
          accion: 'Abrir canción',
          abrir: alCancion,
        },
      ];
    }
    if (rutina.enfoque === 'guitarra') {
      return [
        {
          id: 'guitarra-leccion',
          titulo: 'Repasá una lección',
          detalle: 'Volvé a practicar una postura o un acorde.',
          minutos: Math.ceil(minutos / 2),
          accion: 'Abrir lecciones',
          abrir: alAprenderGuitarra,
        },
        {
          id: 'guitarra-practica',
          titulo: 'Afiná y escuchá una cuerda',
          detalle: 'Usá la referencia y el afinador si tenés la guitarra cerca.',
          minutos: Math.floor(minutos / 2),
          accion: 'Abrir afinador',
          abrir: alAfinadorGuitarra,
        },
      ];
    }
    return [
      {
        id: 'mixta-voz',
        titulo: 'Imitá algunas notas',
        detalle: 'Empezá suave y quedate en una zona cómoda.',
        minutos: minutosVoz,
        accion: 'Abrir ejercicio',
        abrir: alVoz,
      },
      {
        id: 'mixta-guitarra',
        titulo: 'Repasá un acorde',
        detalle: 'Revisá la posición de los dedos y el sonido.',
        minutos: minutosGuitarra,
        accion: 'Abrir lecciones',
        abrir: alAprenderGuitarra,
      },
      {
        id: 'mixta-cancion',
        titulo: 'Cerrá con una canción',
        detalle: 'Cantá una melodía o escuchala primero.',
        minutos: minutosCancion,
        accion: 'Abrir canción',
        abrir: alCancion,
      },
    ];
  })();

  const actualizar = (cambios: Partial<Rutina>) => {
    const nuevaRutina = { ...rutina, ...cambios, fecha: fechaLocal() };
    setRutina(nuevaRutina);
    setError('');
    try {
      localStorage.setItem(CLAVE_RUTINA, JSON.stringify(nuevaRutina));
    } catch {
      setError('No se pudo guardar la rutina. Revisá el almacenamiento del navegador.');
    }
  };

  const alternarPaso = (id: string) => {
    const yaCompletado = rutina.completados.includes(id);
    actualizar({
      completados: yaCompletado
        ? rutina.completados.filter((paso) => paso !== id)
        : [...rutina.completados, id],
    });
  };

  return (
    <section className="mt-4 rounded-xl bg-slate-900 p-4" aria-label="Rutina de práctica">
      <h2 className="font-semibold text-white">Tu práctica de hoy</h2>
      <p className="mt-1 text-xs text-slate-400">
        Elegí un objetivo amable. Es una guía, no una obligación: no cuenta el
        tiempo ni califica cómo practicás.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-xs text-slate-400">
          Duración
          <select
            value={rutina.minutos}
            onChange={(evento) =>
              actualizar({ minutos: Number(evento.currentTarget.value) as Rutina['minutos'] })
            }
            className="mt-1 min-h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 text-sm text-white"
          >
            <option value={5}>5 minutos</option>
            <option value={10}>10 minutos</option>
            <option value={15}>15 minutos</option>
          </select>
        </label>
        <label className="text-xs text-slate-400">
          Enfoque
          <select
            value={rutina.enfoque}
            onChange={(evento) =>
              actualizar({ enfoque: evento.currentTarget.value as Enfoque, completados: [] })
            }
            className="mt-1 min-h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 text-sm text-white"
          >
            <option value="mixta">Canto y guitarra</option>
            <option value="voz">Canto</option>
            <option value="guitarra">Guitarra</option>
          </select>
        </label>
      </div>
      <ol className="mt-3 space-y-2">
        {pasos.map((paso) => {
          const completado = rutina.completados.includes(paso.id);
          return (
            <li
              key={paso.id}
              className="rounded-lg border border-slate-800 bg-slate-950 p-3"
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={completado}
                  onChange={() => alternarPaso(paso.id)}
                  aria-label={`Marcar como completado: ${paso.titulo}`}
                  className="mt-1 accent-violet-500"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap justify-between gap-1">
                    <span className="text-sm font-semibold text-white">{paso.titulo}</span>
                    <span className="text-xs text-slate-500">~{paso.minutos} min</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{paso.detalle}</p>
                  <button
                    onClick={paso.abrir}
                    className="mt-2 min-h-9 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                  >
                    {paso.accion}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-xs text-slate-500">
        {rutina.completados.filter((id) => pasos.some((paso) => paso.id === id)).length} de{' '}
        {pasos.length} pasos marcados. Se guarda solo en este dispositivo.
      </p>
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-950 p-3 text-sm text-red-200">
          {error}
        </p>
      )}
    </section>
  );
}
