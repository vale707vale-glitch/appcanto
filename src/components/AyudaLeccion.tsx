import { useId, useRef } from 'react';
import { LECCIONES_MUSICA } from '../data/leccionesMusica';

export default function AyudaLeccion({ leccionId }: { leccionId: string }) {
  const dialogoRef = useRef<HTMLDialogElement>(null);
  const tituloId = useId();
  const leccion = LECCIONES_MUSICA.find((item) => item.id === leccionId);

  if (!leccion) return null;

  const abrir = () => {
    const dialogo = dialogoRef.current;
    if (dialogo && !dialogo.open) dialogo.showModal();
  };

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="min-h-9 shrink-0 rounded-lg border border-violet-800 bg-violet-950/40 px-3 py-1.5 text-xs font-semibold text-violet-200 hover:bg-violet-950/70"
      >
        ¿Qué significa esto?
      </button>

      <dialog
        ref={dialogoRef}
        aria-labelledby={tituloId}
        className="m-auto w-[min(32rem,calc(100vw-2rem))] max-h-[85vh] overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-0 text-slate-200"
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-300">
                Lección relacionada
              </p>
              <h2
                id={tituloId}
                className="mt-1 text-xl font-bold text-white"
              >
                {leccion.titulo}
              </h2>
            </div>
            <form method="dialog">
              <button className="min-h-9 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700">
                Cerrar
              </button>
            </form>
          </div>

          <p className="mt-2 text-sm text-slate-400">{leccion.resumen}</p>

          {leccion.parrafos.map((parrafo, indice) => (
            <p
              key={indice}
              className="mt-3 text-sm leading-6 text-slate-300"
            >
              {parrafo}
            </p>
          ))}

          <div className="mt-4 rounded-lg border border-violet-900 bg-violet-950/50 p-3 text-sm text-violet-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-300">
              En una frase
            </p>
            <p className="mt-1">{leccion.clave}</p>
          </div>
        </div>
      </dialog>
    </>
  );
}
