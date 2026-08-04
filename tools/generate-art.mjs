// Generates the animated SVG art used in the profile README.
// Run: node tools/generate-art.mjs   (writes into assets/)
import { writeFileSync, mkdirSync } from 'node:fs';

const AMBER = '#F59E0B';
const DEEP = '#D97706';
const GRAY = '#9CA3AF';

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const fmt = (n) => n.toFixed(1);
const pathFrom = (pts) =>
  'M' + pts.map(([x, y]) => `${fmt(x)},${fmt(y)}`).join(' L');

// r = R cos(k theta), k odd gives k petals
function rose(k, R, cx, cy, n = 720) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = (Math.PI * i) / n; // k odd: full rose over [0, pi]
    const r = R * Math.cos(k * t);
    pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
  }
  return pts;
}

// x = (R-r)cos t + d cos(((R-r)/r) t), y = (R-r)sin t - d sin(((R-r)/r) t)
function hypotrochoid(R, r, d, scale, cx, cy, n = 1800) {
  const period = (2 * Math.PI * r) / gcd(R, r);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = (period * i) / n;
    const x = (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t);
    const y = (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t);
    pts.push([cx + scale * x, cy + scale * y]);
  }
  return pts;
}

// chords i -> (m*i mod N) on a circle: the multiplication-table envelope
function modChords(N, m, R, cx, cy) {
  const p = (i) => {
    const t = (2 * Math.PI * i) / N - Math.PI / 2;
    return [cx + R * Math.cos(t), cy + R * Math.sin(t)];
  };
  let out = '';
  for (let i = 1; i < N; i++) {
    const [x1, y1] = p(i);
    const [x2, y2] = p((m * i) % N);
    out += `<line x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(y2)}"/>`;
  }
  return out;
}

function polarGrid(cx, cy, rMax) {
  let d = '';
  for (let r = 25; r <= rMax; r += 25)
    d += `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
  let lines = '';
  for (let i = 0; i < 12; i++) {
    const t = (Math.PI * i) / 6;
    lines += `<line x1="${fmt(cx - rMax * Math.cos(t))}" y1="${fmt(cy - rMax * Math.sin(t))}" x2="${fmt(cx + rMax * Math.cos(t))}" y2="${fmt(cy + rMax * Math.sin(t))}"/>`;
  }
  return d + lines;
}

function cartesianGrid(w, h, step) {
  let d = '';
  for (let x = step; x < w; x += step) d += `M${x},0 L${x},${h} `;
  for (let y = step; y < h; y += step) d += `M0,${y} L${w},${y} `;
  return d.trim();
}

const BANNER_CSS = `
  path, line, circle { fill: none; vector-effect: non-scaling-stroke; }
  .draw { stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: draw 6s ease-out forwards; }
  .spin { animation: spin var(--dur, 90s) linear infinite; }
  .rev { animation-direction: reverse; }
  .fade { opacity: 0; animation: fade 3s ease-out 1.2s forwards; }
  @keyframes draw { to { stroke-dashoffset: 0; } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fade { to { opacity: 0.4; } }
  @media (prefers-reduced-motion: reduce) {
    * { animation: none !important; }
    .draw { stroke-dashoffset: 0; }
    .fade { opacity: 0.4; }
  }
`;

function banner() {
  const W = 1000, H = 260, cy = 122;
  const spiro = hypotrochoid(5, 3, 5, 15, 500, cy);
  const roseL = rose(5, 82, 150, cy);
  const chords = modChords(72, 2, 82, 850, cy);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Animated parametric curves: a rose curve, a hypotrochoid, and a modular multiplication envelope">
<style>${BANNER_CSS}</style>
<path d="${cartesianGrid(W, H, 25)}" stroke="${GRAY}" stroke-opacity="0.06" stroke-width="1"/>
<g stroke="${GRAY}" stroke-opacity="0.09" stroke-width="1">${polarGrid(500, cy, 125)}</g>
<g class="spin rev" style="transform-origin:150px ${cy}px; --dur: 70s">
  <path class="draw" d="${pathFrom(roseL)}" pathLength="1000" stroke="${DEEP}" stroke-width="1.6" stroke-opacity="0.85"/>
</g>
<g class="spin" style="transform-origin:500px ${cy}px; --dur: 110s">
  <path class="draw" d="${pathFrom(spiro)}" pathLength="1000" stroke="${AMBER}" stroke-width="1.8"/>
</g>
<g class="spin rev" style="transform-origin:850px ${cy}px; --dur: 140s">
  <g class="fade" stroke="${AMBER}" stroke-width="0.8">${chords}</g>
</g>
<g fill="${GRAY}" fill-opacity="0.6" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" text-anchor="middle">
  <text x="150" y="248">r = 82 cos 5&#952;</text>
  <text x="500" y="248">hypotrochoid R:r:d = 5:3:5</text>
  <text x="850" y="248">n &#8614; 2n mod 72</text>
</g>
</svg>`;
}

function divider() {
  const W = 1000, H = 44, mid = 22;
  const strand = (A, f, phase, n = 200) => {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const x = (W * i) / n;
      pts.push([x, mid + A * Math.sin((2 * Math.PI * f * x) / W + phase)]);
    }
    return pathFrom(pts);
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Animated sine wave divider">
<style>
  path { fill: none; }
  .march { stroke-dasharray: 5 9; animation: march var(--dur, 3s) linear infinite; }
  .rev { animation-direction: reverse; }
  @keyframes march { to { stroke-dashoffset: -14; } }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
</style>
<path class="march" style="--dur: 4s" d="${strand(9, 3, 0)}" stroke="${AMBER}" stroke-width="1.4" stroke-opacity="0.7"/>
<path class="march rev" style="--dur: 6s" d="${strand(9, 5, Math.PI / 2)}" stroke="${GRAY}" stroke-width="1.2" stroke-opacity="0.4"/>
<path class="march" style="--dur: 9s" d="${strand(5, 2, Math.PI)}" stroke="${DEEP}" stroke-width="1.2" stroke-opacity="0.55"/>
</svg>`;
}

mkdirSync('assets', { recursive: true });
writeFileSync('assets/banner.svg', banner());
writeFileSync('assets/divider.svg', divider());
console.log('wrote assets/banner.svg and assets/divider.svg');
