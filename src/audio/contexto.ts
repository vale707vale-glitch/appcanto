let contexto: AudioContext | null = null;

export function obtenerContextoAudio(): AudioContext {
  if (!contexto) {
    const Constructor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    contexto = new Constructor();
  }
  return contexto;
}

export function contextoAudioActual(): AudioContext | null {
  return contexto;
}

export async function reanudarContextoAudio(): Promise<AudioContext> {
  const audio = obtenerContextoAudio();
  if (audio.state === 'suspended') await audio.resume();
  return audio;
}
