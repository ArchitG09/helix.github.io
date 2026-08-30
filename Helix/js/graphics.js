export function helixSvg() {
  const strands = [];
  for (let s = 0; s < 2; s++) {
    const pts = [];
    for (let i = 0; i <= 120; i++) {
      const t = (i / 120) * Math.PI * 6;
      const x = 160 + Math.cos(t + s * Math.PI) * (42 + i * 0.08);
      const y = 20 + i * 2.2;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    strands.push(pts.join(" "));
  }
  const rungs = [];
  for (let i = 8; i < 118; i += 7) {
    const t = (i / 120) * Math.PI * 6;
    const x1 = 160 + Math.cos(t) * (42 + i * 0.08);
    const x2 = 160 + Math.cos(t + Math.PI) * (42 + i * 0.08);
    const y = 20 + i * 2.2;
    rungs.push(`<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="url(#g)" stroke-width="1.6" opacity="0.55"/>`);
  }
  return `
    <svg viewBox="0 0 320 300" fill="none">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#2ee9c8"/>
          <stop offset="50%" stop-color="#8b7cff"/>
          <stop offset="100%" stop-color="#ff6b4a"/>
        </linearGradient>
      </defs>
      ${rungs.join("")}
      <polyline points="${strands[0]}" stroke="url(#g)" stroke-width="3.4" stroke-linecap="round" class="strand"/>
      <polyline points="${strands[1]}" stroke="url(#g)" stroke-width="3.4" stroke-linecap="round" opacity="0.85"/>
    </svg>`;
}

export function logoMark() {
  return `<svg class="brand-mark" viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" rx="18" fill="#12141e"/>
    <path d="M18 48c8-18 20-18 28-36" stroke="#2ee9c8" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M18 16c8 18 20 18 28 36" stroke="#8b7cff" stroke-width="3.2" stroke-linecap="round"/>
    <circle cx="32" cy="32" r="4" fill="#ff6b4a"/>
  </svg>`;
}

export function ringsSvg(liftPct, trailPct, recPct) {
  const c = 2 * Math.PI * 52;
  const ring = (r, pct, color, w) => {
    const dash = Math.max(0.04, Math.min(1, pct)) * (2 * Math.PI * r);
    const gap = 2 * Math.PI * r;
    return `<circle cx="84" cy="84" r="${r}" fill="none" stroke="${color}" stroke-width="${w}"
      stroke-linecap="round" stroke-dasharray="${dash} ${gap}" transform="rotate(-90 84 84)"/>`;
  };
  return `<svg width="168" height="168" viewBox="0 0 168 168">
    <circle cx="84" cy="84" r="70" fill="none" stroke="#ffffff10" stroke-width="8"/>
    <circle cx="84" cy="84" r="58" fill="none" stroke="#ffffff10" stroke-width="8"/>
    <circle cx="84" cy="84" r="46" fill="none" stroke="#ffffff10" stroke-width="8"/>
    ${ring(70, liftPct, "#2ee9c8", 8)}
    ${ring(58, trailPct, "#ff6b4a", 8)}
    ${ring(46, recPct, "#8b7cff", 8)}
  </svg>`;
}

export function mapSvg(points, w = 280, h = 120) {
  if (!points) return "";
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <defs>
      <linearGradient id="route" x1="0" y1="0" x2="1" y2="0">
        <stop stop-color="#2ee9c8"/><stop offset="1" stop-color="#ff6b4a"/>
      </linearGradient>
    </defs>
    <polyline fill="none" stroke="url(#route)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" points="${points}"/>
  </svg>`;
}

export function sparkline(values) {
  if (!values.length) return "";
  const max = Math.max(...values, 1);
  const w = 240;
  const h = 56;
  const step = w / Math.max(values.length - 1, 1);
  const pts = values.map((v, i) => `${i * step},${h - 8 - (v / max) * (h - 16)}`).join(" ");
  return `<svg class="spark" viewBox="0 0 ${w} ${h}"><polyline fill="none" stroke="#2ee9c8" stroke-width="2.4" points="${pts}"/></svg>`;
}
