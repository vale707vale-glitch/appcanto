// Hook del microfono: getUserMedia SIN procesamiento del navegador
// (echoCancellation / noiseSuppression / autoGainControl en false,
// si no la deteccion de tono falla) + bucle requestAnimationFrame.

import { useCallback, useEffect, useRef, useState } from 'react';
import { PitchDetector, type PitchFrame } from './pitchDetector';
import { reanudarContextoAudio } from './contexto';

export type MicEstado = 'apagado' | 'pidiendo' | 'activo' | 'denegado' | 'error';

export interface MotorVoz {
  frame: PitchFrame; // ultimo fotograma (mutable, se lee cada frame)
  analyser: AnalyserNode | null;
  detector: PitchDetector | null;
}

const INICIAL: PitchFrame = {
  t: 0,
  freqHz: null,
  clarity: 0,
  nivel: 0,
  centsVsObjetivo: null,
  centsAfinado: null,
  octavas: 0,
};

export function useMicrofono() {
  const [estado, setEstado] = useState<MicEstado>('apagado');
  const [mensajeError, setMensajeError] = useState<string>('');
  const motorRef = useRef<MotorVoz>({
    frame: { ...INICIAL },
    analyser: null,
    detector: null,
  });
  const objetivoRef = useRef<number | null>(null);
  const rafRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const fuenteRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const fijarObjetivo = useCallback((midi: number | null) => {
    objetivoRef.current = midi;
  }, []);

  const detener = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    fuenteRef.current?.disconnect();
    fuenteRef.current = null;
    motorRef.current.analyser = null;
    motorRef.current.detector = null;
    motorRef.current.frame = { ...INICIAL };
    setEstado('apagado');
  }, []);

  // Debe llamarse desde un gesto del usuario (clic).
  const iniciar = useCallback(async () => {
    if (motorRef.current.analyser) return;
    setEstado('pidiendo');
    setMensajeError('');
    try {
      const audioCtx = await reanudarContextoAudio();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;
      const fuente = audioCtx.createMediaStreamSource(stream);
      fuenteRef.current = fuente;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      fuente.connect(analyser);

      const detector = new PitchDetector(
        analyser.fftSize,
        audioCtx.sampleRate,
      );
      motorRef.current.analyser = analyser;
      motorRef.current.detector = detector;
      setEstado('activo');

      const bucle = () => {
        if (motorRef.current.analyser && motorRef.current.detector) {
          motorRef.current.analyser.getFloatTimeDomainData(
            motorRef.current.detector.inputBuffer,
          );
          motorRef.current.frame = motorRef.current.detector.update(
            objetivoRef.current,
          );
        }
        rafRef.current = requestAnimationFrame(bucle);
      };
      rafRef.current = requestAnimationFrame(bucle);
    } catch (e) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      fuenteRef.current?.disconnect();
      fuenteRef.current = null;
      motorRef.current.analyser = null;
      motorRef.current.detector = null;
      const nombre =
        e instanceof DOMException ? e.name : 'ErrorDesconocido';
      if (nombre === 'NotAllowedError') {
        setEstado('denegado');
        setMensajeError(
          'Permiso de microfono denegado. Activalo en el navegador y reintenta.',
        );
      } else {
        setEstado('error');
        setMensajeError(
          'No se pudo abrir el microfono. Revisa que este conectado.',
        );
      }
    }
  }, []);

  useEffect(() => detener, [detener]);

  return { estado, mensajeError, motorRef, fijarObjetivo, iniciar, detener };
}
