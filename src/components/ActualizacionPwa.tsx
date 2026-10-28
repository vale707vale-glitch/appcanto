import { useRegisterSW } from 'virtual:pwa-register/react'

export default function ActualizacionPwa() {
  const {
    needRefresh: [hayActualizacion, setHayActualizacion],
    updateServiceWorker,
  } = useRegisterSW()

  if (!hayActualizacion) return null

  return (
    <aside
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-xl border border-violet-700 bg-slate-900 p-4 text-white shadow-xl"
      role="status"
    >
      <p className="font-semibold">Hay una nueva versión disponible.</p>
      <p className="mt-1 text-sm text-slate-300">
        Actualizá la app para usar los últimos cambios.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => void updateServiceWorker(true)}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500"
        >
          Actualizar
        </button>
        <button
          onClick={() => setHayActualizacion(false)}
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-600"
        >
          Más tarde
        </button>
      </div>
    </aside>
  )
}
