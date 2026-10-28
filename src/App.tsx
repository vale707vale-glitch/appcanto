import { useEffect, useReducer, useState } from 'react';
import Inicio from './components/Inicio';
import Afinador from './components/Afinador';
import AfinadorGuitarra from './components/AfinadorGuitarra';
import PantallaEjercicio from './components/PantallaEjercicio';
import PantallaCancion from './components/PantallaCancion';
import PantallaTono from './components/PantallaTono';
import CalibracionVocal from './components/CalibracionVocal';
import AprenderMusica from './components/AprenderMusica';
import RutaGuitarra from './components/RutaGuitarra';
import { EJERCICIOS } from './data/ejercicios';
import { CANCIONES } from './data/canciones';
import { cargarProgreso, resumir } from './storage/progreso';
import { buscarCancionPersonalizada } from './storage/cancionesPersonalizadas';
import { hashDesdeVista, vistaDesdeHash, type Vista } from './navegacion';

const GUITARRA_URL = `${import.meta.env.BASE_URL}guitarra/index.html`;

function buscarCancion(id: string) {
  return CANCIONES.find((cancion) => cancion.id === id) ??
    buscarCancionPersonalizada(id);
}

export default function App() {
  const [vista, setVista] = useState<Vista>(() =>
    vistaDesdeHash(window.location.hash) ?? { nombre: 'inicio' },
  );
  const [, actualizarProgreso] = useReducer((version: number) => version + 1, 0);
  const [acordesParaGuitarra, setAcordesParaGuitarra] = useState<string[]>([]);

  const resumen = resumir(cargarProgreso());

  const navegar = (destino: Vista) => {
    const hash = hashDesdeVista(destino);
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    } else {
      setVista(destino);
    }
  };

  useEffect(() => {
    const sincronizarRuta = () => {
      const siguiente = vistaDesdeHash(window.location.hash);
      const idValido =
        siguiente?.nombre === 'ejercicio'
          ? EJERCICIOS.some((e) => e.id === siguiente.id)
          : siguiente?.nombre === 'cancion'
            ? buscarCancion(siguiente.id) !== null
            : true;
      if (!siguiente || !idValido) {
        window.location.hash = '#/';
        setVista({ nombre: 'inicio' });
        return;
      }
      setVista(siguiente);
    };
    window.addEventListener('hashchange', sincronizarRuta);
    sincronizarRuta();
    return () => window.removeEventListener('hashchange', sincronizarRuta);
  }, []);

  const volverInicio = () => navegar({ nombre: 'inicio' });

  if (vista.nombre === 'afinador') {
    return (
      <div className="min-h-screen bg-slate-950">
        <Afinador alVolver={volverInicio} />
      </div>
    );
  }

  if (vista.nombre === 'afinador-guitarra') {
    return (
      <div className="min-h-screen bg-slate-950">
        <AfinadorGuitarra alVolver={volverInicio} />
      </div>
    );
  }

  if (vista.nombre === 'rango-vocal') {
    return (
      <div className="min-h-screen bg-slate-950">
        <CalibracionVocal
          alVolver={volverInicio}
          alGuardar={actualizarProgreso}
        />
      </div>
    );
  }

  if (vista.nombre === 'aprender-musica') {
    return (
      <div className="min-h-screen bg-slate-950">
        <AprenderMusica
          alVolver={volverInicio}
          alAbrirEjercicio={(id) => navegar({ nombre: 'ejercicio', id })}
          alAbrirCancion={(id) => navegar({ nombre: 'cancion', id })}
          alCalibrarRango={() => navegar({ nombre: 'rango-vocal' })}
        />
      </div>
    );
  }

  if (vista.nombre === 'ejercicio') {
    const ejercicio = EJERCICIOS.find((e) => e.id === vista.id);
    if (!ejercicio) return null;
    return (
      <div className="min-h-screen bg-slate-950">
        <PantallaEjercicio ejercicio={ejercicio} alVolver={volverInicio} />
      </div>
    );
  }

  if (vista.nombre === 'tono') {
    return (
      <div className="min-h-screen bg-slate-950">
        <PantallaTono
          alVolver={volverInicio}
          alAbrirGuitarra={(acordes) => {
            setAcordesParaGuitarra(acordes);
            navegar({ nombre: 'guitarra' });
          }}
        />
      </div>
    );
  }

  if (vista.nombre === 'aprender-guitarra') {
    return (
      <div className="min-h-screen bg-slate-950">
        <RutaGuitarra
          alVolver={volverInicio}
          alAbrirModulo={() => navegar({ nombre: 'guitarra' })}
        />
      </div>
    );
  }

  if (vista.nombre === 'guitarra') {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="mx-auto w-full max-w-5xl px-4 py-6">
          <button
            onClick={volverInicio}
            className="mb-4 text-sm text-slate-400 hover:text-white"
          >
            {'< Volver'}
          </button>
          <h2 className="text-2xl font-bold text-white">Guitarra</h2>
          <p className="mt-1 text-sm text-slate-400">
            Acordes, guitarra 3D, rasgueo y ejercicios.
          </p>
          <button
            onClick={() => navegar({ nombre: 'aprender-guitarra' })}
            className="mt-3 rounded-lg bg-violet-800 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Aprender guitarra desde cero
          </button>
          <button
            onClick={() => navegar({ nombre: 'afinador-guitarra' })}
            className="ml-2 mt-3 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Afinador de guitarra
          </button>
          <iframe
            key={acordesParaGuitarra.join(',')}
            src={
              acordesParaGuitarra.length > 0
                ? `${GUITARRA_URL}?acordes=${encodeURIComponent(acordesParaGuitarra.join(','))}`
                : GUITARRA_URL
            }
            title="Guitarra: acordes, 3D y rasgueo"
            allow="autoplay"
            className="mt-4 h-[78vh] min-h-[560px] w-full rounded-xl border border-slate-800 bg-slate-900 md:h-[70vh]"
          />
        </div>
      </div>
    );
  }

  if (vista.nombre === 'cancion') {
    const cancion = buscarCancion(vista.id);
    if (!cancion) return null;
    return (
      <div className="min-h-screen bg-slate-950">
        <PantallaCancion
          key={cancion.id}
          cancion={cancion}
          alVolver={volverInicio}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Inicio
        resumen={resumen}
        alElegir={(id) => navegar({ nombre: 'ejercicio', id })}
        alElegirCancion={(id) => navegar({ nombre: 'cancion', id })}
        alAfinador={() => navegar({ nombre: 'afinador' })}
        alAfinadorGuitarra={() => navegar({ nombre: 'afinador-guitarra' })}
        alCalibrarRango={() => navegar({ nombre: 'rango-vocal' })}
        alTono={() => navegar({ nombre: 'tono' })}
        alGuitarra={() => navegar({ nombre: 'guitarra' })}
        alAprenderGuitarra={() => navegar({ nombre: 'aprender-guitarra' })}
        alAprenderMusica={() => navegar({ nombre: 'aprender-musica' })}
        alProgresoActualizado={actualizarProgreso}
      />
    </div>
  );
}
