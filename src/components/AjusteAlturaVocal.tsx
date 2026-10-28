import type { TransposicionVocal } from '../storage/progreso';

const OPCIONES: { valor: TransposicionVocal; etiqueta: string }[] = [
  { valor: -12, etiqueta: 'Más grave' },
  { valor: 0, etiqueta: 'Original' },
  { valor: 12, etiqueta: 'Más aguda' },
];

export default function AjusteAlturaVocal({
  valor,
  alCambiar,
}: {
  valor: TransposicionVocal;
  alCambiar: (transposicion: TransposicionVocal) => void;
}) {
  return (
    <fieldset className="mt-4 rounded-xl bg-slate-900 p-4">
      <legend className="px-1 text-sm font-semibold text-white">
        Ajustá la altura a tu voz
      </legend>
      <p className="text-xs text-slate-400">
        Probá la misma práctica una octava más grave o más aguda. Esto no
        cambia cómo se calcula tu afinación.
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {OPCIONES.map((opcion) => (
          <button
            key={opcion.valor}
            type="button"
            aria-pressed={valor === opcion.valor}
            onClick={() => alCambiar(opcion.valor)}
            className={`min-h-11 rounded-lg px-2 py-2 text-sm font-semibold ${
              valor === opcion.valor
                ? 'bg-violet-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {opcion.etiqueta}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
