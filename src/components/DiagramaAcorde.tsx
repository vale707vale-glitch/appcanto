export default function DiagramaAcorde({
  nombre,
  cuerdas,
}: {
  nombre: string;
  cuerdas: number[];
}) {
  const xs = [35, 55, 75, 95, 115, 135];
  const trastes = [35, 65, 95, 125, 155];

  return (
    <svg
      viewBox="0 0 170 184"
      role="img"
      aria-label={`Diagrama de ${nombre}. Cuerdas de izquierda a derecha: sexta a primera.`}
      className="h-44 w-40 max-w-full"
    >
      {trastes.map((y, indice) => (
        <line
          key={`traste-${indice}`}
          x1="35"
          x2="135"
          y1={y}
          y2={y}
          stroke={indice === 0 ? '#e2e8f0' : '#64748b'}
          strokeWidth={indice === 0 ? 3 : 1.5}
        />
      ))}
      {xs.map((x, indice) => (
        <g key={`cuerda-${indice}`}>
          <line x1={x} x2={x} y1="35" y2="155" stroke="#94a3b8" strokeWidth="1.5" />
          {cuerdas[indice] < 0 ? (
            <text x={x} y="22" fill="#fca5a5" textAnchor="middle" fontSize="16" aria-hidden="true">
              ×
            </text>
          ) : cuerdas[indice] === 0 ? (
            <circle cx={x} cy="17" r="5" fill="none" stroke="#86efac" strokeWidth="2" />
          ) : (
            <circle
              cx={x}
              cy={35 + (cuerdas[indice] - 0.5) * 30}
              r="6"
              fill="#c4b5fd"
            />
          )}
          <text x={x} y="176" fill="#94a3b8" textAnchor="middle" fontSize="10">
            {6 - indice}
          </text>
        </g>
      ))}
      <text x="153" y="43" fill="#94a3b8" fontSize="9">traste 1</text>
    </svg>
  );
}
