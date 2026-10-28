export default function GuiaTono() {
  return (
    <div>
      <div className="mt-4 rounded-xl border border-violet-800 bg-violet-950/60 p-4 text-sm text-violet-100">
        <p className="font-semibold text-white">¿No sabés música? Empezá acá</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>
            Elegí <b>Acordes</b> si tenés la armonía de la canción (Sol, Do, Re7)
            o <b>Notas</b> si tenés la melodía (Do Re Mi).
          </li>
          <li>
            Escribilos separados por espacios. Acepta <b>Do#m</b>, <b>Sib</b>,{' '}
            <b>La7</b>, <b>Re menor</b> y <b>Do sostenido mayor</b>.
          </li>
          <li>
            La app te dice el <b>tono probable</b>. Si hay varias posibilidades,
            te muestra las más probables.
          </li>
          <li>
            Con <b>-1 / +1</b> bajás o subís la canción. <b>1 semitono = 1 traste</b>{' '}
            de la guitarra.
          </li>
        </ol>
        <p className="mt-2 text-xs text-violet-200/80">
          Si no sabés qué escribir, tocá un ejemplo. No hace falta saber leer
          música.
        </p>
      </div>

      <details className="mt-3 rounded-xl bg-slate-900 p-4 text-sm text-slate-300">
        <summary className="cursor-pointer font-semibold text-white">
          Glosario mínimo: nota, tono, acorde y cejilla
        </summary>
        <dl className="mt-3 space-y-2">
          <div>
            <dt className="font-semibold text-white">Nota</dt>
            <dd>
              Un sonido: Do, Re, Mi... La misma nota puede ser más aguda o más
              grave (otra octava).
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-white">Sostenido (#) y bemol (b)</dt>
            <dd>
              # = un poquito más agudo; b = un poquito más grave. Do# y Reb son
              la misma tecla.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-white">Escala</dt>
            <dd>
              Las notas que pertenecen a una canción. En Do mayor: Do Re Mi Fa
              Sol La Si.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-white">Tono o tonalidad</dt>
            <dd>
              La nota que suena como &quot;casa&quot;. En Sol mayor, Sol es la
              casa. La canción suele terminar en esa nota o acorde.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-white">Acorde</dt>
            <dd>
              Varias notas juntas. Do mayor = Do + Mi + Sol. La7 = La + Do# + Mi
              + Sol.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-white">El &quot;7&quot;</dt>
            <dd>
              En un acorde, el 7 agrega una nota extra (la séptima). No es la
              octava.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-white">Cejilla o capo</dt>
            <dd>
              Aparato que aprieta todas las cuerdas en un traste. Sube todo el
              sonido. Si tocás Sol con cejilla en 2, suena La.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-white">Semitono</dt>
            <dd>
              La distancia más chica: un traste en la guitarra. De Do a Do# hay
              un semitono.
            </dd>
          </div>
        </dl>
      </details>

      <details className="mt-3 rounded-xl bg-slate-900 p-4 text-sm text-slate-300">
        <summary className="cursor-pointer font-semibold text-white">
          Cómo sacar el tono a mano
        </summary>
        <p className="mt-3">
          Mirá el <b>último acorde</b> de la canción: casi siempre es la tónica
          (la &quot;casa&quot;). Después fijate si el resto de los acordes
          pertenecen a esa escala.
        </p>
        <p className="mt-2">
          Ejemplo: <b>Sol - Do - Re7 - Sol</b> es Sol mayor. Si termina en{' '}
          <b>Lam</b> y usa Do, Fa y Sol, puede ser La menor.
        </p>
        <p className="mt-2">
          Si tenés solo la melodía, la última nota suele ser la tónica, pero no
          siempre. La app prueba las escalas que mejor encajan con esas notas.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Una canción puede tener acordes &quot;prestados&quot; de otro lado. Por
          eso el resultado es una estimación: si hay dudas, probá con el oído.
        </p>
      </details>
    </div>
  );
}
