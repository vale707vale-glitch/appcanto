import { useEffect, useRef, useState } from 'react';
import { ensureAudioContext } from '../audio/tono';
import { midiToFreq } from '../audio/notas';

const NOTAS_DRONE = [
  { nombre: 'Do', midi: 48 },
  { nombre: 'Re', midi: 50 },
  { nombre: 'Mi', midi: 52 },
  { nombre: 'Sol', midi: 55 },
  { nombre: 'La', midi: 57 },
];

export default function PracticaBase() {
  const [bpm, setBpm] = useState(70);
  const [metrónomoActivo, setMetrónomoActivo] = useState(false);
  const [droneActivo, setDroneActivo] = useState(false);
  const [notaDrone, setNotaDrone] = useState(48);
  const [error, setError] = useState('');
  const pulsoRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const droneRef = useRef<{
    osciladores: OscillatorNode[];
    ganancias: GainNode[];
  } | null>(null);
  const bpmRef = useRef(bpm);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  const detenerMetrónomo = () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    setMetrónomoActivo(false);
  };

  const programarPulso = (contexto: AudioContext) => {
    const tiempo = contexto.currentTime + 0.04;
    const oscillator = contexto.createOscillator();
    const gain = contexto.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = pulsoRef.current % 4 === 0 ? 1050 : 720;
    gain.gain.setValueAtTime(0.0001, tiempo);
    gain.gain.exponentialRampToValueAtTime(0.16, tiempo + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, tiempo + 0.07);
    oscillator.connect(gain).connect(contexto.destination);
    oscillator.start(tiempo);
    oscillator.stop(tiempo + 0.08);
    pulsoRef.current++;
    timerRef.current = window.setTimeout(
      () => programarPulso(contexto),
      60000 / bpmRef.current,
    );
  };

  const alternarMetrónomo = () => {
    if (metrónomoActivo) {
      detenerMetrónomo();
      return;
    }
    try {
      setError('');
      const contexto = ensureAudioContext();
      pulsoRef.current = 0;
      setMetrónomoActivo(true);
      programarPulso(contexto);
    } catch (causa) {
      setError(
        causa instanceof Error
          ? `No se pudo iniciar el metrónomo: ${causa.message}`
          : 'No se pudo iniciar el metrónomo.',
      );
    }
  };

  const detenerDrone = () => {
    const drone = droneRef.current;
    if (!drone) return;
    const ahora = drone.osciladores[0].context.currentTime;
    for (const ganancia of drone.ganancias) {
      ganancia.gain.cancelScheduledValues(ahora);
      ganancia.gain.setTargetAtTime(0.0001, ahora, 0.03);
    }
    for (const oscilador of drone.osciladores) {
      try {
        oscilador.stop(ahora + 0.15);
      } catch {
        // Puede haberse detenido al mismo tiempo que se desmonta la pantalla.
      }
    }
    droneRef.current = null;
    setDroneActivo(false);
  };

  const alternarDrone = () => {
    if (droneActivo) {
      detenerDrone();
      return;
    }
    try {
      setError('');
      const contexto = ensureAudioContext();
      const frecuencia = midiToFreq(notaDrone);
      const ahora = contexto.currentTime;

      const fundamental = contexto.createOscillator();
      const gananciaFundamental = contexto.createGain();
      fundamental.type = 'triangle';
      fundamental.frequency.value = frecuencia;
      gananciaFundamental.gain.setValueAtTime(0.0001, ahora);
      gananciaFundamental.gain.exponentialRampToValueAtTime(0.12, ahora + 0.15);
      fundamental.connect(gananciaFundamental).connect(contexto.destination);

      const octava = contexto.createOscillator();
      const gananciaOctava = contexto.createGain();
      octava.type = 'sine';
      octava.frequency.value = frecuencia * 2;
      gananciaOctava.gain.setValueAtTime(0.0001, ahora);
      gananciaOctava.gain.exponentialRampToValueAtTime(0.04, ahora + 0.15);
      octava.connect(gananciaOctava).connect(contexto.destination);

      fundamental.start();
      octava.start();
      droneRef.current = {
        osciladores: [fundamental, octava],
        ganancias: [gananciaFundamental, gananciaOctava],
      };
      setDroneActivo(true);
    } catch (causa) {
      setError(
        causa instanceof Error
          ? `No se pudo iniciar la nota de referencia: ${causa.message}`
          : 'No se pudo iniciar la nota de referencia.',
      );
    }
  };

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      const drone = droneRef.current;
      if (drone) {
        for (const oscilador of drone.osciladores) {
          try {
            oscilador.stop();
          } catch {
            // Puede haberse detenido al mismo tiempo que se desmonta la pantalla.
          }
        }
      }
    },
    [],
  );

  return (
    <section className="mt-4 rounded-xl bg-slate-900 p-4" aria-label="Herramientas de práctica">
      <h2 className="font-semibold text-white">Pulso y nota de referencia</h2>
      <p className="mt-1 text-xs text-slate-400">
        Usalos para practicar ritmo o sostener una nota cómoda. Tocá para
        encender y apagar cada sonido.
      </p>
      <label className="mt-3 flex items-center gap-3 text-sm text-slate-300">
        <span className="w-20">Tempo: {bpm} BPM</span>
        <input
          type="range"
          min="40"
          max="180"
          value={bpm}
          onChange={(evento) => setBpm(Number(evento.currentTarget.value))}
          className="min-w-0 flex-1 accent-violet-500"
          aria-label="Tempo del metrónomo"
        />
      </label>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={alternarMetrónomo}
          aria-pressed={metrónomoActivo}
          className="min-h-10 rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          {metrónomoActivo ? 'Apagar metrónomo' : 'Iniciar metrónomo'}
        </button>
        <label className="flex min-h-10 items-center gap-2 rounded-lg bg-slate-800 px-3 text-sm text-slate-300">
          Nota
          <select
            value={notaDrone}
            onChange={(evento) => {
              const nuevaNota = Number(evento.currentTarget.value);
              setNotaDrone(nuevaNota);
              const drone = droneRef.current;
              if (drone) {
                const [fundamental, octava] = drone.osciladores;
                const t = fundamental.context.currentTime;
                fundamental.frequency.setTargetAtTime(
                  midiToFreq(nuevaNota),
                  t,
                  0.03,
                );
                octava.frequency.setTargetAtTime(
                  midiToFreq(nuevaNota) * 2,
                  t,
                  0.03,
                );
              }
            }}
            className="min-w-0 flex-1 bg-transparent text-white"
            aria-label="Nota de referencia"
          >
            {NOTAS_DRONE.map((nota) => (
              <option key={nota.midi} value={nota.midi}>
                {nota.nombre}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={alternarDrone}
          aria-pressed={droneActivo}
          className="col-span-2 min-h-10 rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          {droneActivo ? 'Apagar nota sostenida' : 'Escuchar nota sostenida'}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-950 p-3 text-sm text-red-200">
          {error}
        </p>
      )}
    </section>
  );
}
