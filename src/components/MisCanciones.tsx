import { useState } from 'react';
import { midiToNombre } from '../audio/notas';
import { analizarNotas } from '../musica/teoria';
import { eliminarSesionesDePieza } from '../storage/progreso';
import {
  MAX_NOTAS,
  MAX_TITULO,
  cancionDesdeTexto,
  eliminarCancionPersonalizada,
  guardarCancionPersonalizada,
  type CancionPersonalizada,
} from '../storage/cancionesPersonalizadas';

interface Mensaje {
  tipo: 'ok' | 'error';
  texto: string;
}

export default function MisCanciones({
  canciones,
  alPracticar,
  alCambiar,
}: {
  canciones: CancionPersonalizada[];
  alPracticar: (id: string) => void;
  alCambiar: () => void;
}) {
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);

  const analisis = texto.trim() ? analizarNotas(texto) : { notas: [], errores: [] };
  const cantidad = analisis.notas.length;
  const muestra = analisis.notas
    .slice(0, 16)
    .map((nota) => midiToNombre(nota.midi))
    .join(' · ');
  const puedeGuardar =
    titulo.trim().length > 0 && cantidad > 0 && cantidad <= MAX_NOTAS;

  const guardar = () => {
    setMensaje(null);
    const resultado = cancionDesdeTexto(titulo, texto);
    if (!resultado.cancion) {
      setMensaje({ tipo: 'error', texto: resultado.errores.join(' ') });
      return;
    }
    try {
      guardarCancionPersonalizada(resultado.cancion);
      setTitulo('');
      setTexto('');
      const aviso =
        resultado.avisos.length > 0
          ? ` Se ignoraron: ${resultado.avisos.join(' ')}`
          : '';
      setMensaje({
        tipo: 'ok',
        texto: `Guardada "${resultado.cancion.titulo}".${aviso} Ya podés escucharla y practicarla.`,
      });
      alCambiar();
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto:
          error instanceof Error ? error.message : 'No se pudo guardar la canción.',
      });
    }
  };

  const borrar = (cancion: CancionPersonalizada) => {
    if (
      !window.confirm(
        `¿Borrar "${cancion.titulo}"? También se borra su historial de prácticas.`,
      )
    ) {
      return;
    }
    try {
      eliminarCancionPersonalizada(cancion.id);
      eliminarSesionesDePieza(`cancion-${cancion.id}`);
      setMensaje({ tipo: 'ok', texto: 'Canción borrada.' });
      alCambiar();
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto:
          error instanceof Error ? error.message : 'No se pudo borrar la canción.',
      });
    }
  };

  return (
    <section className="mt-4 rounded-xl bg-slate-900 p-4" aria-label="Mis canciones">
      <h2 className="font-semibold text-white">Mis canciones</h2>
      <p className="mt-1 text-xs text-slate-400">
        Pegá la melodía de una canción, una nota por vez, para escucharla y
        practicarla con el micrófono. Se guardan solo en este navegador.
      </p>

      <div className="mt-3 rounded-lg border border-amber-900 bg-amber-950/40 p-3 text-xs text-amber-100">
        <p className="font-semibold text-amber-200">
          Acá van melodías, no acordes.
        </p>
        <p className="mt-1">
          Si en un sitio ves <b>Re7</b>, <b>Lam</b> o <b>Sol mayor</b>, son
          acordes de guitarra. No indican qué nota canta la voz.
        </p>
        <p className="mt-1">
          Ejemplo: en Estrellita los acordes son Do, Sol, Fa y Do. La melodía
          que se canta es <b>Do Do Sol Sol La La Sol</b>.
        </p>
        <p className="mt-1">
          Para conseguir la melodía, buscá "notas para flauta", "notas en Do Re
          Mi" o "melodía fácil en piano".
        </p>
      </div>

      <label className="mt-3 block text-sm text-slate-300">
        Título
        <input
          type="text"
          value={titulo}
          maxLength={MAX_TITULO}
          onChange={(evento) => setTitulo(evento.currentTarget.value)}
          placeholder="Ej: Mi canción"
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-white placeholder:text-slate-600 focus:border-violet-500 focus:outline-none"
        />
      </label>

      <label className="mt-3 block text-sm text-slate-300">
        Notas
        <textarea
          value={texto}
          onChange={(evento) => setTexto(evento.currentTarget.value)}
          rows={3}
          placeholder="Ej: Do Re Mi Fa Sol La Si Do5"
          className="mt-1 w-full resize-y rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-white placeholder:text-slate-600 focus:border-violet-500 focus:outline-none"
        />
      </label>
      <p className="mt-1 text-xs text-slate-500">
        Separá con espacios. Podés escribir Do, Re, Mi... o C, D, E, y fijar la
        octava con Do4, Re4. Escribí solo notas, sin sufijos como 7, m o mayor.
        Cada nota dura 0,6 s.
      </p>

      {cantidad > 0 && (
        <div className="mt-3 rounded-lg bg-slate-950 p-3 text-sm">
          <p className="text-slate-300">
            {cantidad} {cantidad === 1 ? 'nota' : 'notas'}
            {cantidad > MAX_NOTAS && ` (máximo ${MAX_NOTAS})`}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {muestra}
            {cantidad > 16 && ' · ...'}
          </p>
        </div>
      )}

      {analisis.errores.length > 0 && (
        <div className="mt-2 rounded-lg bg-yellow-950 p-3 text-xs text-yellow-200">
          <p className="font-semibold">No pude leer todo:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {analisis.errores.map((error, indice) => (
              <li key={indice}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={guardar}
        disabled={!puedeGuardar}
        className="mt-3 min-h-11 w-full rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Guardar canción
      </button>

      {mensaje && (
        <p
          role={mensaje.tipo === 'error' ? 'alert' : 'status'}
          className={`mt-3 rounded-lg p-3 text-sm ${
            mensaje.tipo === 'error'
              ? 'bg-red-950 text-red-200'
              : 'bg-emerald-950 text-emerald-200'
          }`}
        >
          {mensaje.texto}
        </p>
      )}

      {canciones.length > 0 && (
        <ul className="mt-4 space-y-2">
          {canciones.map((cancion) => (
            <li
              key={cancion.id}
              className="flex items-center justify-between gap-3 rounded-lg bg-slate-950 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{cancion.titulo}</p>
                <p className="text-xs text-slate-500">{cancion.notas.length} notas</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => alPracticar(cancion.id)}
                  className="min-h-9 rounded-lg bg-slate-800 px-3 text-xs font-semibold text-white hover:bg-slate-700"
                >
                  Escuchar y practicar
                </button>
                <button
                  onClick={() => borrar(cancion)}
                  className="min-h-9 rounded-lg bg-slate-800 px-3 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Borrar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
