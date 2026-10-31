import { useId } from "react";

/* Blusas desenhadas em SVG: 5 cortes × 12 estampas, todas originais (nada de escudo de clube, CBF ou marca).
   Cada corte é uma silhueta; a estampa é pintada dentro dela com clipPath. Tela de 240 × 300. */

const TINTA = "#0b1f5c", VERDE = "#009739", AMARELO = "#fedd00", AZUL = "#012169", CREME = "#f6efe0";

const CORTES = {
  camiseta: {
    d: "M80 16C88 28 102 34 120 34S152 28 160 16L204 34L232 92L200 112L190 96V268Q190 278 180 278H60Q50 278 50 268V96L40 112L8 92L36 34Z",
    gola: "M80 16C88 28 102 34 120 34S152 28 160 16C150 12 136 10 120 10S90 12 80 16Z",
    bainha: ["M14 88L44 106", "M226 88L196 106"], dy: 0,
  },
  oversized: {
    d: "M76 18C86 30 102 36 120 36S154 30 164 18L214 36L236 104L206 118L198 100L204 272Q204 284 194 284H46Q36 284 36 272L42 100L34 118L4 104L26 36Z",
    gola: "M76 18C86 30 102 36 120 36S154 30 164 18C152 13 138 11 120 11S88 13 76 18Z",
    bainha: ["M10 100L38 114", "M230 100L202 114"], dy: 0,
  },
  babylook: {
    d: "M84 16C92 28 104 34 120 34S148 28 156 16L196 30L216 70L190 84L184 76C184 120 192 150 186 232Q186 240 178 240H62Q54 240 54 232C48 150 56 120 56 76L50 84L24 70L44 30Z",
    gola: "M84 16C92 28 104 34 120 34S148 28 156 16C148 12 136 10 120 10S92 12 84 16Z",
    bainha: ["M30 66L52 80", "M210 66L188 80"], dy: 24,
  },
  regata: {
    d: "M82 10L100 10C100 40 108 54 120 54S140 40 140 10L158 10C160 52 170 74 186 92L188 272Q188 282 178 282H62Q52 282 52 272L54 92C70 74 80 52 82 10Z",
    gola: "M100 10C100 40 108 54 120 54S140 40 140 10Z",
    bainha: [], dy: 0,
  },
  futebol: {
    d: "M80 16L120 62L160 16L204 34L232 92L200 112L190 96V268Q190 278 180 278H60Q50 278 50 268V96L40 112L8 92L36 34Z",
    gola: "M80 16L120 62L160 16L120 12Z",
    bainha: ["M14 88L44 106", "M226 88L196 106"], dy: 0, v: true,
  },
};

export const luminosidade = (hex) => { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000; };
/** Escurece (f < 0) ou clareia (f > 0) um #rrggbb */
export function tom(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f));
  return `rgb(${c.join(",")})`;
}
// gerador pseudoaleatório com semente: o confete é sempre o mesmo, em qualquer renderização
function semente(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const pentagono = (cx, cy, r, rot = -90) => Array.from({ length: 5 }, (_, i) => { const a = ((rot + i * 72) * Math.PI) / 180; return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`; }).join(" ");
const FONTE = { fontFamily: "Archivo, Arial Black, sans-serif", fontWeight: 900, fontStretch: "125%" };

function Estampa({ design, id }) {
  switch (design) {
    case "ginga":
      return (
        <g>
          <polygon points="120,84 176,148 120,212 64,148" fill={AMARELO} />
          <circle cx="120" cy="148" r="36" fill={AZUL} />
          <path d="M86 140C108 128 134 128 154 142L152 156C134 144 108 144 88 156Z" fill="#fff" />
          {[[14, 88, 44, 106], [226, 88, 196, 106]].map(([a, b, c, d], i) => (
            <g key={i}><path d={`M${a} ${b}L${c} ${d}`} stroke={AMARELO} strokeWidth="11" /><path d={`M${a} ${b + 11}L${c} ${d + 11}`} stroke={AZUL} strokeWidth="5" /></g>
          ))}
          <text x="120" y="248" textAnchor="middle" fontSize="15" fill={AMARELO} {...FONTE} letterSpacing="3">GINGA</text>
        </g>
      );
    case "pelada": {
      const lados = Array.from({ length: 5 }, (_, i) => { const a = ((-90 + i * 72) * Math.PI) / 180; return [120 + 15 * Math.cos(a), 124 + 15 * Math.sin(a), 120 + 54 * Math.cos(a), 124 + 54 * Math.sin(a)]; });
      return (
        <g>
          <clipPath id={`bola${id}`}><circle cx="120" cy="124" r="54" /></clipPath>
          <circle cx="120" cy="124" r="54" fill="#fff" stroke="#111" strokeWidth="3" />
          <g clipPath={`url(#bola${id})`} fill="#111" stroke="#111" strokeWidth="2" strokeLinejoin="round">
            <polygon points={pentagono(120, 124, 16)} />
            {lados.map(([x1, y1, x2, y2], i) => <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />)}
            {Array.from({ length: 5 }, (_, i) => { const a = ((-54 + i * 72) * Math.PI) / 180; return <polygon key={i} points={pentagono(120 + 55 * Math.cos(a), 124 + 55 * Math.sin(a), 14, -54 + i * 72 + 180)} />; })}
          </g>
          <text x="120" y="224" textAnchor="middle" fontSize="40" fill={VERDE} textLength="132" lengthAdjust="spacingAndGlyphs" {...FONTE}>PELADA</text>
          <text x="120" y="246" textAnchor="middle" fontSize="10" fill={AZUL} fontFamily="DM Mono, monospace" fontWeight="500" letterSpacing="2">DOMINGO · 10H</text>
        </g>
      );
    }
    case "copacabana":
      return (
        <g>
          <pattern id={`onda${id}`} width="60" height="40" patternUnits="userSpaceOnUse"><path d="M0 8Q15 -4 30 8T60 8V28Q45 40 30 28T0 28Z" fill="#111" /></pattern>
          <rect x="0" y="0" width="240" height="300" fill={`url(#onda${id})`} />
          <rect x="58" y="132" width="124" height="30" rx="15" fill={CREME} stroke="#111" strokeWidth="3" />
          <text x="120" y="152" textAnchor="middle" fontSize="13" fill="#111" textLength="98" lengthAdjust="spacingAndGlyphs" {...FONTE}>COPACABANA</text>
        </g>
      );
    case "caju": {
      const frutas = [[96, 96, -16, 1], [150, 110, 14, 0.9], [78, 168, 10, 0.95], [132, 172, -10, 1.05], [168, 192, 20, 0.8], [108, 214, 6, 0.8], [66, 214, -20, 0.7]];
      return (
        <g>
          <defs>
            <g id={`caju${id}`}>
              <path d="M0 -22C16 -22 22 -6 20 8C18 24 6 32 0 32C-6 32 -18 24 -20 8C-22 -6 -16 -22 0 -22Z" fill="#e8392b" />
              <path d="M-12 -6C-14 6 -10 16 -4 22" stroke="#ff9d8a" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M-5 -22C-12 -34 -2 -46 10 -40C17 -37 14 -30 8 -30C4 -30 3 -26 5 -22Z" fill="#4a4636" />
              <path d="M-2 -23L-6 -32" stroke="#2f6b3a" strokeWidth="3" strokeLinecap="round" />
            </g>
          </defs>
          {frutas.map(([x, y, r, s], i) => <use key={i} href={`#caju${id}`} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} />)}
          {[[60, 108], [186, 150], [52, 188], [150, 224]].map(([x, y], i) => <path key={i} d={`M${x} ${y}q10-14 22-4q-8 14-22 4z`} fill={VERDE} />)}
        </g>
      );
    }
    case "sol":
      return (
        <g>
          <g transform="translate(120 118)" fill={AMARELO}>
            <circle r="30" />
            {Array.from({ length: 20 }, (_, i) => <rect key={i} x="-3" y="-62" width="6" height={i % 2 ? 14 : 24} rx="3" transform={`rotate(${i * 18})`} />)}
          </g>
          {[206, 224, 242, 260].map((y, i) => <path key={y} d={`M40 ${y}q20-12 40 0t40 0t40 0t40 0`} stroke="#fff" strokeOpacity={0.9 - i * 0.16} strokeWidth="5" fill="none" strokeLinecap="round" />)}
        </g>
      );
    case "bonfim": {
      const cores = ["#e63946", AMARELO, VERDE, "#1d4ed8", "#ff5d8f", "#ff8a00", "#7b2cbf", "#e63946", AMARELO, VERDE];
      return (
        <g>
          <g transform="rotate(-32 120 160)">{cores.map((c, i) => <rect key={i} x="-120" y={20 + i * 29} width="480" height="21" fill={c} />)}</g>
          <g fill={CREME} stroke={TINTA} strokeWidth="2.5">{[[78, 150], [120, 150], [162, 150]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="9" />)}</g>
          <rect x="62" y="236" width="116" height="20" rx="10" fill={CREME} stroke={TINTA} strokeWidth="2" /><text x="120" y="249.5" textAnchor="middle" fontSize="8.5" fill={TINTA} fontFamily="DM Mono, monospace" fontWeight="500" letterSpacing=".6">3 NÓS · 3 DESEJOS</text>
        </g>
      );
    }
    case "carnaval": {
      const r = semente(26);
      const paleta = [VERDE, AMARELO, "#ff5d8f", "#fff", "#ff8a00", "#3ac0ff"];
      return (
        <g>
          {Array.from({ length: 62 }, (_, i) => {
            const x = 38 + r() * 164, y = 28 + r() * 252, c = paleta[Math.floor(r() * paleta.length)], k = r(), rot = Math.floor(r() * 360);
            if (k < 0.4) return <rect key={i} x={x} y={y} width="9" height="4.5" fill={c} transform={`rotate(${rot} ${x} ${y})`} />;
            if (k < 0.7) return <circle key={i} cx={x} cy={y} r="3.2" fill={c} />;
            return <path key={i} d="M0 0c6-9 12 9 18 0s12 9 18 0" stroke={c} strokeWidth="2.6" fill="none" strokeLinecap="round" transform={`translate(${x} ${y}) rotate(${rot})`} />;
          })}
        </g>
      );
    }
    case "azulejo":
      return (
        <g>
          <pattern id={`az${id}`} width="46" height="46" patternUnits="userSpaceOnUse">
            <rect width="46" height="46" fill={CREME} />
            <rect x="1" y="1" width="44" height="44" fill="none" stroke="#1e4ba0" strokeWidth="1.4" />
            <circle cx="23" cy="23" r="5" fill="#1e4ba0" />
            {[0, 90, 180, 270].map((a) => <path key={a} d="M23 5C29 12 29 17 23 18C17 17 17 12 23 5Z" fill="#1e4ba0" transform={`rotate(${a} 23 23)`} />)}
            {[[0, 0], [46, 0], [0, 46], [46, 46]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="9" fill="none" stroke="#1e4ba0" strokeWidth="1.4" />)}
          </pattern>
          <rect width="240" height="300" fill={`url(#az${id})`} />
        </g>
      );
    case "arara":
      return (
        <g>
          <path d="M44 252C90 240 150 240 196 252" stroke="#6b4423" strokeWidth="7" strokeLinecap="round" fill="none" />
          <g transform="translate(106 190)">{[["#1d4ed8", 18, 72], [AMARELO, 30, 66], ["#e63946", 42, 60]].map(([c, a, h], i) => <rect key={i} x="-6" y="-4" width="12" height={h} rx="6" fill={c} transform={`rotate(${a})`} />)}</g>
          <ellipse cx="116" cy="152" rx="28" ry="48" transform="rotate(-14 116 152)" fill="#e63946" />
          <ellipse cx="124" cy="158" rx="15" ry="44" transform="rotate(-10 124 158)" fill="#1d4ed8" />
          <ellipse cx="116" cy="150" rx="11" ry="34" transform="rotate(-10 116 150)" fill={AMARELO} />
          <circle cx="140" cy="94" r="24" fill="#e63946" />
          <ellipse cx="148" cy="98" rx="14" ry="11" fill="#fff" />
          <circle cx="150" cy="95" r="3.6" fill="#111" />
          <path d="M158 84C182 82 190 104 172 116C170 106 164 102 158 102Z" fill="#f5efe0" stroke="#222" strokeWidth="2" />
          <path d="M160 104C170 104 172 112 170 116C164 114 160 110 160 104Z" fill="#222" />
          {[[58, 234], [182, 236]].map(([x, y], i) => <path key={i} d={`M${x} ${y}q10-16 24-4q-8 16-24 4z`} fill={AMARELO} />)}
        </g>
      );
    case "cobogo":
      return (
        <g>
          <pattern id={`cb${id}`} width="42" height="42" patternUnits="userSpaceOnUse">
            <rect x="2" y="2" width="38" height="38" fill="none" stroke={CREME} strokeWidth="2.4" opacity=".9" />
            <circle cx="21" cy="21" r="11" fill="none" stroke={CREME} strokeWidth="2.4" opacity=".9" />
            <path d="M21 10L32 21L21 32L10 21Z" fill={CREME} opacity=".9" />
            {[[2, 2], [40, 2], [2, 40], [40, 40]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="6" fill={CREME} opacity=".9" />)}
          </pattern>
          <rect width="240" height="300" fill={`url(#cb${id})`} />
        </g>
      );
    case "saudade":
      return (
        <g fill={AMARELO} {...FONTE} textAnchor="middle">
          <text x="120" y="132" fontSize="78" textLength="126" lengthAdjust="spacingAndGlyphs">SAU</text>
          <text x="120" y="204" fontSize="78" textLength="126" lengthAdjust="spacingAndGlyphs">DADE</text>
          <text x="120" y="232" fontSize="8" fill="#fff" fontFamily="DM Mono, monospace" fontWeight="500" textLength="112" style={{ fontStretch: "normal" }}>PRESENÇA DA AUSÊNCIA</text>
        </g>
      );
    default:
      return null;
  }
}

export default function Camisa({ cor = "#f6efe0", design = "lisa", corte = "camiseta", titulo = "", className = "" }) {
  const id = useId().replace(/:/g, "");
  const c = CORTES[corte] ?? CORTES.camiseta;
  const clara = luminosidade(cor) > 150;
  const escura = tom(cor, -0.45);
  return (
    <svg viewBox="0 0 240 300" className={className} role={titulo ? "img" : "presentation"} aria-label={titulo || undefined} aria-hidden={titulo ? undefined : true} preserveAspectRatio="xMidYMid meet">
      <defs>
        <clipPath id={`c${id}`}><path d={c.d} /></clipPath>
        <linearGradient id={`s${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity=".2" /><stop offset=".28" stopColor="#000" stopOpacity="0" /><stop offset=".7" stopColor="#fff" stopOpacity=".07" /><stop offset="1" stopColor="#000" stopOpacity=".18" />
        </linearGradient>
        <linearGradient id={`v${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".1" /><stop offset=".6" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".14" />
        </linearGradient>
      </defs>
      <g transform={`translate(0 ${c.dy})`}>
        <ellipse cx="120" cy="288" rx="78" ry="4.5" fill="#000" opacity=".13" transform={`translate(0 ${-c.dy + 2})`} />
        <path d={c.d} fill={cor} />
        <g clipPath={`url(#c${id})`}>
          <Estampa design={design} id={id} />
          <rect width="240" height="300" fill={`url(#s${id})`} />
          <rect width="240" height="300" fill={`url(#v${id})`} />
          <path d="M66 214C92 226 116 220 142 230M70 120C86 128 104 124 120 130" stroke="#000" strokeOpacity=".07" strokeWidth="7" fill="none" strokeLinecap="round" />
          <path d={c.gola} fill={escura} opacity=".85" />
        </g>
        {c.v && <path d="M80 16L120 62L160 16" fill="none" stroke={design === "ginga" ? AMARELO : clara ? TINTA : "#fff"} strokeWidth="8" strokeLinejoin="round" />}
        {!c.v && corte !== "regata" && <path d="M82 17C90 28 103 34 120 34S150 28 158 17" fill="none" stroke={tom(cor, clara ? -0.3 : 0.25)} strokeWidth="5" strokeLinecap="round" />}
        {c.bainha.map((b, i) => <path key={i} d={b} stroke="#000" strokeOpacity=".2" strokeWidth="2" fill="none" />)}
        <path d={c.d} fill="none" stroke="#000" strokeOpacity=".3" strokeWidth="1.6" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
