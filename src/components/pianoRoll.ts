// Dibujo tipo "piano roll" en canvas: franja de nota objetivo + curva
// en tiempo real del tono detectado (desviacion en cents).
// Se llama una vez por frame desde requestAnimationFrame.

import { clasificarCents } from '../audio/pitchDetector';

export const COLOR = {
  dentro: '#22c55e',
  cerca: '#eab308',
  fuera: '#ef4444',
  silencio: '#475569',
  objetivo: '#f8fafc',
  fondo: '#0f172a',
} as const;

export interface PianoRollOpts {
  /** Historial de desviacion en cents (null = silencio). Izquierda = pasado. */
  historial: (number | null)[];
  tolerancia: number;
  /** Rango vertical total en cents (por defecto 400 = +-200). */
  rangoCents?: number;
  /** Etiqueta de la nota objetivo (p. ej. "Mi4"). */
  etiqueta?: string;
}

export function dibujarPianoRoll(
  canvas: HTMLCanvasElement,
  opts: PianoRollOpts,
): void {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const wCss = canvas.clientWidth || canvas.width;
  const hCss = canvas.clientHeight || canvas.height;
  if (canvas.width !== Math.round(wCss * dpr)) canvas.width = Math.round(wCss * dpr);
  if (canvas.height !== Math.round(hCss * dpr)) canvas.height = Math.round(hCss * dpr);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const W = wCss;
  const H = hCss;
  const rango = opts.rangoCents ?? 400;
  const mitad = rango / 2;
  const yDe = (cents: number) => H / 2 - (cents / mitad) * (H / 2 - 6);
  const tol = opts.tolerancia;

  // Fondo
  ctx.fillStyle = COLOR.fondo;
  ctx.fillRect(0, 0, W, H);

  // Franja amarilla (tolerancia x2) y verde (tolerancia)
  ctx.fillStyle = 'rgba(234, 179, 8, 0.15)';
  ctx.fillRect(0, yDe(tol * 2), W, yDe(-tol * 2) - yDe(tol * 2));
  ctx.fillStyle = 'rgba(34, 197, 94, 0.22)';
  ctx.fillRect(0, yDe(tol), W, yDe(-tol) - yDe(tol));

  // Linea objetivo
  ctx.strokeStyle = COLOR.objetivo;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, H / 2);
  ctx.lineTo(W, H / 2);
  ctx.stroke();

  // Lineas de +-100 cents (semitono)
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.25)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  for (const c of [100, -100]) {
    const y = yDe(c);
    if (y > 0 && y < H) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  }
  ctx.setLineDash([]);

  // Curva del tono detectado, coloreada por tramo
  const hist = opts.historial;
  if (hist.length > 1) {
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    let trazoAbierto = false;
    for (let i = 1; i < hist.length; i++) {
      const a = hist[i - 1];
      const b = hist[i];
      if (a === null || b === null) {
        trazoAbierto = false;
        continue;
      }
      const x1 = ((i - 1) / (hist.length - 1)) * W;
      const x2 = (i / (hist.length - 1)) * W;
      const y1 = Math.max(2, Math.min(H - 2, yDe(a)));
      const y2 = Math.max(2, Math.min(H - 2, yDe(b)));
      ctx.strokeStyle = COLOR[clasificarCents(b, tol)];
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      trazoAbierto = true;
    }
    void trazoAbierto;
  }

  if (opts.etiqueta) {
    ctx.fillStyle = 'rgba(248, 250, 252, 0.9)';
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillText(opts.etiqueta, 8, 18);
  }
}
