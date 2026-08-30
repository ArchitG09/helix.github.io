export function haversine(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function pathDistance(path) {
  let d = 0;
  for (let i = 1; i < path.length; i++) d += haversine(path[i - 1], path[i]);
  return d;
}

export function pathToSvg(path, w = 280, h = 160, pad = 12) {
  if (!path?.length) return "";
  const lats = path.map((p) => p.lat);
  const lngs = path.map((p) => p.lng);
  const minLa = Math.min(...lats);
  const maxLa = Math.max(...lats);
  const minLn = Math.min(...lngs);
  const maxLn = Math.max(...lngs);
  const dx = maxLn - minLn || 0.001;
  const dy = maxLa - minLa || 0.001;
  const pts = path.map((p) => {
    const x = pad + ((p.lng - minLn) / dx) * (w - pad * 2);
    const y = pad + (1 - (p.lat - minLa) / dy) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return pts.join(" ");
}

export function formatKm(m) {
  return (m / 1000).toFixed(m >= 10000 ? 1 : 2);
}

export function formatPace(m, seconds) {
  if (!m || !seconds) return "—";
  const secPerKm = seconds / (m / 1000);
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60)
    .toString()
    .padStart(2, "0");
  return `${min}:${sec} /km`;
}

export function formatDuration(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function formatWhen(ts) {
  return new Date(ts).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
