import { useEffect, useRef, useState } from 'react';

const DURACION_MAXIMA_SEGUNDOS = 60;

interface TomaVocal {
  url: string;
  tipo: string;
  tamano: number;
}

export default function GrabadoraVocal() {
  const [consentimiento, setConsentimiento] = useState(false);
  const [iniciando, setIniciando] = useState(false);
  const [grabando, setGrabando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [toma, setToma] = useState<TomaVocal | null>(null);
  const [error, setError] = useState('');
  const grabadoraRef = useRef<MediaRecorder | null>(null);
  const flujoRef = useRef<MediaStream | null>(null);
  const fragmentosRef = useRef<Blob[]>([]);
  const limiteRef = useRef<number | null>(null);

  useEffect(() => {
    if (!toma) return;
    return () => URL.revokeObjectURL(toma.url);
  }, [toma]);

  useEffect(() => {
    if (!grabando) return;
    const id = window.setInterval(
      () => setSegundos((valor) => Math.min(DURACION_MAXIMA_SEGUNDOS, valor + 1)),
      1000,
    );
    return () => window.clearInterval(id);
  }, [grabando]);

  useEffect(
    () => () => {
      if (limiteRef.current !== null) window.clearTimeout(limiteRef.current);
      const grabadora = grabadoraRef.current;
      if (grabadora && grabadora.state !== 'inactive') {
        grabadora.ondataavailable = null;
        grabadora.onstop = null;
        grabadora.stop();
      }
      flujoRef.current?.getTracks().forEach((pista) => pista.stop());
    },
    [],
  );

  const finalizar = () => {
    if (limiteRef.current !== null) {
      window.clearTimeout(limiteRef.current);
      limiteRef.current = null;
    }
    if (grabadoraRef.current?.state === 'recording') {
      grabadoraRef.current.stop();
    }
  };

  const iniciar = async () => {
    setError('');
    setToma(null);
    setSegundos(0);
    if (!consentimiento) {
      setError('Marcá la casilla para confirmar que querés grabar esta toma.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError('Este navegador no permite grabar audio.');
      return;
    }

    setIniciando(true);
    try {
      const flujo = await navigator.mediaDevices.getUserMedia({ audio: true });
      flujoRef.current = flujo;
      const tipoPreferido = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
      ].find((tipo) => MediaRecorder.isTypeSupported(tipo));
      const grabadora = tipoPreferido
        ? new MediaRecorder(flujo, { mimeType: tipoPreferido })
        : new MediaRecorder(flujo);
      fragmentosRef.current = [];
      grabadoraRef.current = grabadora;
      grabadora.ondataavailable = (evento) => {
        if (evento.data.size > 0) fragmentosRef.current.push(evento.data);
      };
      grabadora.onstop = () => {
        const blob = new Blob(fragmentosRef.current, {
          type: grabadora.mimeType || 'audio/webm',
        });
        flujo.getTracks().forEach((pista) => pista.stop());
        flujoRef.current = null;
        grabadoraRef.current = null;
        setGrabando(false);
        if (blob.size > 0) {
          setToma({
            url: URL.createObjectURL(blob),
            tipo: blob.type || 'audio/webm',
            tamano: blob.size,
          });
        } else {
          setError('La grabación quedó vacía. Revisá el micrófono e intentá otra vez.');
        }
      };
      grabadora.onerror = () => {
        setError('Ocurrió un error durante la grabación. Revisá el micrófono.');
        finalizar();
      };
      grabadora.start(250);
      setGrabando(true);
      limiteRef.current = window.setTimeout(
        finalizar,
        DURACION_MAXIMA_SEGUNDOS * 1000,
      );
    } catch (causa) {
      flujoRef.current?.getTracks().forEach((pista) => pista.stop());
      flujoRef.current = null;
      setError(
        causa instanceof Error
          ? `No se pudo activar el micrófono: ${causa.message}`
          : 'No se pudo activar el micrófono. Revisá el permiso del navegador.',
      );
    } finally {
      setIniciando(false);
    }
  };

  return (
    <section className="mt-4 rounded-xl bg-slate-900 p-4" aria-label="Grabadora vocal">
      <h2 className="font-semibold text-white">Escuchá tu voz</h2>
      <p className="mt-1 text-xs text-slate-400">
        Grabá hasta un minuto para escucharte. El audio queda solo en esta
        pantalla y se elimina al borrarlo, salir de Inicio o recargar la app.
        No se sube ni se guarda en el respaldo.
      </p>
      <label className="mt-3 flex items-start gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={consentimiento}
          onChange={(evento) => setConsentimiento(evento.currentTarget.checked)}
          disabled={grabando}
          className="mt-1 accent-violet-500"
        />
        <span>Entiendo y doy permiso para grabar una toma usando el micrófono.</span>
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => (grabando ? finalizar() : void iniciar())}
          disabled={iniciando || (!grabando && !consentimiento)}
          className="min-h-10 rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {grabando
            ? `Detener (${segundos}/${DURACION_MAXIMA_SEGUNDOS} s)`
            : iniciando
              ? 'Activando micrófono...'
              : 'Empezar a grabar'}
        </button>
        {toma && (
          <button
            onClick={() => setToma(null)}
            className="min-h-10 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700"
          >
            Borrar toma
          </button>
        )}
      </div>
      {grabando && (
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"
          role="progressbar"
          aria-label="Duración máxima de grabación"
          aria-valuemin={0}
          aria-valuemax={DURACION_MAXIMA_SEGUNDOS}
          aria-valuenow={segundos}
        >
          <div
            className="h-full bg-violet-500 transition-[width]"
            style={{ width: `${(segundos / DURACION_MAXIMA_SEGUNDOS) * 100}%` }}
          />
        </div>
      )}
      {toma && (
        <div className="mt-3 rounded-lg bg-slate-950 p-3">
          <p className="mb-2 text-xs text-slate-400">
            Toma lista · {(toma.tamano / 1024).toFixed(0)} KB · {toma.tipo}
          </p>
          <audio className="w-full" controls src={toma.url}>
            Tu navegador no permite reproducir esta grabación.
          </audio>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-950 p-3 text-sm text-red-200">
          {error}
        </p>
      )}
    </section>
  );
}
