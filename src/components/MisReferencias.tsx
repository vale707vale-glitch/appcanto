import { useEffect, useMemo, useState } from 'react';
import { nombreNota } from '../data/ejercicios';
import {
  eliminarReferencia,
  listarReferencias,
  type ReferenciaVoz,
} from '../storage/referenciasVoz';

function fechaCorta(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
  });
}

function Toma({
  referencia,
  alBorrar,
}: {
  referencia: ReferenciaVoz;
  alBorrar: (id: string) => void;
}) {
  const url = useMemo(
    () => URL.createObjectURL(referencia.blob),
    [referencia.blob],
  );

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [url]);

  return (
    <li className="rounded-lg bg-slate-950 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="font-semibold text-white">
            {nombreNota(referencia.midi)}
          </span>
          <span className="ml-2 text-xs text-emerald-400">
            {referencia.precision}%
          </span>
        </div>
        <span className="shrink-0 text-xs text-slate-500">
          {fechaCorta(referencia.fecha)}
        </span>
      </div>
      <audio
        className="mt-2 w-full"
        controls
        preload="none"
        src={url}
      >
        Tu navegador no permite reproducir esta toma.
      </audio>
      <button
        type="button"
        onClick={() => alBorrar(referencia.id)}
        className="mt-2 min-h-8 rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
      >
        Borrar
      </button>
    </li>
  );
}

export default function MisReferencias({
  ejercicioId,
  refrescar,
}: {
  ejercicioId: string;
  refrescar: number;
}) {
  const [referencias, setReferencias] = useState<ReferenciaVoz[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;
    listarReferencias()
      .then((todas) => {
        if (!vigente) return;
        setReferencias(
          todas.filter((referencia) => referencia.ejercicioId === ejercicioId),
        );
        setError('');
      })
      .catch(() => {
        if (vigente) setError('No se pudieron leer las tomas guardadas.');
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [ejercicioId, refrescar]);

  const borrar = async (id: string) => {
    try {
      await eliminarReferencia(id);
      setReferencias((actuales) =>
        actuales.filter((referencia) => referencia.id !== id),
      );
    } catch {
      setError('No se pudo borrar la toma.');
    }
  };

  const borrarTodas = async () => {
    if (
      !window.confirm(
        '¿Borrar todas las tomas guardadas de este ejercicio? No se puede deshacer.',
      )
    ) {
      return;
    }
    try {
      await Promise.all(referencias.map((referencia) => eliminarReferencia(referencia.id)));
      setReferencias([]);
    } catch {
      setError('No se pudieron borrar todas las tomas.');
    }
  };

  if (cargando) {
    return (
      <p className="mt-1 text-xs text-slate-500">
        Buscando tomas guardadas...
      </p>
    );
  }
  if (error) {
    return (
      <p role="alert" className="mt-1 text-xs text-red-300">
        {error}
      </p>
    );
  }
  if (referencias.length === 0) {
    return (
      <p className="mt-1 text-xs text-slate-500">
        Todavía no hay tomas guardadas de este ejercicio.
      </p>
    );
  }

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-slate-400">
          {referencias.length} toma{referencias.length === 1 ? '' : 's'}{' '}
          guardada{referencias.length === 1 ? '' : 's'}
        </p>
        <button
          onClick={() => void borrarTodas()}
          className="min-h-8 rounded-lg px-2 text-xs text-red-300 hover:text-red-200"
        >
          Borrar todas
        </button>
      </div>
      <ul className="mt-2 space-y-2">
        {referencias.map((referencia) => (
          <Toma
            key={referencia.id}
            referencia={referencia}
            alBorrar={(id) => void borrar(id)}
          />
        ))}
      </ul>
    </div>
  );
}
