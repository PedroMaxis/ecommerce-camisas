import { useId } from "react";

// Silhueta única; o "desenho" muda só o que vai por cima, recortado dentro do corpo da camisa
const CORPO = "M78 14c8 10 20 16 42 16s34-6 42-16l56 26 28 62-36 18-14-26v176c0 6-4 10-10 10H64c-6 0-10-4-10-10V94l-14 26-36-18 28-62z";

/** Escurece/clareia uma cor #rrggbb (fator -1..1) para sombras e detalhes da própria camisa */
export function tom(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f));
  return `rgb(${c.join(",")})`;
}
const claro = (hex) => { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 150; };

function Estampa({ design, cor, tinta }) {
  switch (design) {
    case "listras":
      return Array.from({ length: 9 }, (_, i) => <rect key={i} x="0" y={36 + i * 38} width="240" height="16" fill={tinta} opacity=".92" />);
    case "bolinhas":
      return Array.from({ length: 7 * 6 }, (_, i) => {
        const x = i % 7, y = Math.floor(i / 7);
        const r = 2.5 + ((x + y) % 4) * 1.6; // pontos de tamanho variável, como meio-tom
        return <circle key={i} cx={34 + x * 28 + (y % 2) * 14} cy={52 + y * 44} r={r} fill={tinta} />;
      });
    case "sol":
      return (
        <g transform="translate(120 130)" fill={tinta}>
          <circle r="34" />
          {Array.from({ length: 16 }, (_, i) => <rect key={i} x="-3" y="-62" width="6" height={i % 2 ? 14 : 22} rx="3" transform={`rotate(${i * 22.5})`} />)}
        </g>
      );
    case "tipografica":
      return (
        <g fill={tinta} fontFamily="Bricolage Grotesque, sans-serif" fontWeight="800" textAnchor="middle">
          <text x="120" y="118" fontSize="46">BOM</text>
          <text x="120" y="166" fontSize="46">DIA</text>
          <rect x="62" y="182" width="116" height="5" />
        </g>
      );
    case "degrade":
      return <g><rect width="240" height="330" fill={tom(cor, -0.35)} opacity=".0" /><rect y="0" width="240" height="330" fill="url(#deg)" /></g>;
    default:
      return null;
  }
}

/** Camisa desenhada em SVG a partir dos dados do produto: sem imagens para hospedar, nitidez em qualquer tamanho */
export default function Camisa({ cor, design, titulo, className = "" }) {
  const id = useId().replace(/:/g, "");
  const tinta = design === "tipografica" || design === "sol" ? (claro(cor) ? "#1b1b1b" : "#f3eee3") : claro(cor) ? tom(cor, -0.55) : tom(cor, 0.78);
  return (
    <svg viewBox="0 0 240 330" className={className} role="img" aria-label={titulo} preserveAspectRatio="xMidYMid meet">
      <defs>
        <clipPath id={`c${id}`}><path d={CORPO} /></clipPath>
        <linearGradient id="deg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tom(cor, 0.35)} /><stop offset=".55" stopColor={cor} /><stop offset="1" stopColor={tom(cor, -0.55)} />
        </linearGradient>
        <linearGradient id={`s${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity=".16" /><stop offset=".3" stopColor="#000" stopOpacity="0" /><stop offset=".75" stopColor="#fff" stopOpacity=".05" /><stop offset="1" stopColor="#000" stopOpacity=".14" />
        </linearGradient>
      </defs>
      <ellipse cx="120" cy="305" rx="74" ry="4" fill="#000" opacity=".12" />
      <path d={CORPO} fill={cor} />
      <g clipPath={`url(#c${id})`}>
        <Estampa design={design} cor={cor} tinta={tinta} />
        <rect width="240" height="330" fill={`url(#s${id})`} />
        <path d="M78 14c8 10 20 16 42 16s34-6 42-16v14c-8 10-20 17-42 17S86 38 78 28z" fill={tom(cor, -0.28)} opacity=".6" />
      </g>
      <path d={CORPO} fill="none" stroke="#000" strokeOpacity=".28" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M80 18c9 9 20 14 40 14s31-5 40-14" fill="none" stroke="#000" strokeOpacity=".3" strokeWidth="1.2" />
    </svg>
  );
}
