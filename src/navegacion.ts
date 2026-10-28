export type Vista =
  | { nombre: 'inicio' }
  | { nombre: 'afinador' }
  | { nombre: 'afinador-guitarra' }
  | { nombre: 'rango-vocal' }
  | { nombre: 'ejercicio'; id: string }
  | { nombre: 'cancion'; id: string }
  | { nombre: 'tono' }
  | { nombre: 'guitarra' }
  | { nombre: 'aprender-guitarra' }
  | { nombre: 'aprender-musica' };

export function vistaDesdeHash(hash: string): Vista | null {
  const partes = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  try {
    switch (partes[0]) {
      case undefined:
      case 'inicio':
        return partes.length <= 1 ? { nombre: 'inicio' } : null;
      case 'afinador':
        return partes.length === 1 ? { nombre: 'afinador' } : null;
      case 'afinador-guitarra':
        return partes.length === 1 ? { nombre: 'afinador-guitarra' } : null;
      case 'rango-vocal':
        return partes.length === 1 ? { nombre: 'rango-vocal' } : null;
      case 'aprender-guitarra':
        return partes.length === 1 ? { nombre: 'aprender-guitarra' } : null;
      case 'aprender-musica':
        return partes.length === 1 ? { nombre: 'aprender-musica' } : null;
      case 'tono':
      case 'guitarra':
        return partes.length === 1 ? { nombre: partes[0] } : null;
      case 'ejercicio':
      case 'cancion': {
        if (partes.length !== 2) return null;
        const id = decodeURIComponent(partes[1]);
        return id ? { nombre: partes[0], id } : null;
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export function hashDesdeVista(vista: Vista): string {
  switch (vista.nombre) {
    case 'inicio':
      return '#/';
    case 'afinador':
    case 'afinador-guitarra':
    case 'rango-vocal':
    case 'tono':
    case 'guitarra':
    case 'aprender-guitarra':
    case 'aprender-musica':
      return `#/${vista.nombre}`;
    case 'ejercicio':
    case 'cancion':
      return `#/${vista.nombre}/${encodeURIComponent(vista.id)}`;
  }
}
