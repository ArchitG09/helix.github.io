const KEY = "helix.mapsKey";
const DARK = [
  { elementType: "geometry", stylers: [{ color: "#0e1118" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9aa0b4" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0e1118" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1c2230" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#252c3c" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#07070c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4a5568" }] },
];

let loadPromise = null;
let liveMap = null;
let liveLine = null;
let liveDot = null;

export function getMapsKey() {
  return (localStorage.getItem(KEY) || "").trim();
}

export function setMapsKey(value) {
  localStorage.setItem(KEY, value.trim());
  loadPromise = null;
}

export function hasMapsKey() {
  return Boolean(getMapsKey());
}

export function loadGoogleMaps() {
  const key = getMapsKey();
  if (!key) return Promise.reject(new Error("missing key"));
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById("gmaps-sdk");
    if (existing) existing.remove();
    const s = document.createElement("script");
    s.id = "gmaps-sdk";
    s.async = true;
    s.defer = true;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly`;
    s.onload = () => resolve(window.google.maps);
    s.onerror = () => {
      loadPromise = null;
      reject(new Error("maps failed"));
    };
    document.head.appendChild(s);
  });
  return loadPromise;
}

function sample(path, max = 80) {
  if (!path?.length) return [];
  if (path.length <= max) return path;
  const step = (path.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => path[Math.round(i * step)]);
}

export function staticMapUrl(path, w = 640, h = 280) {
  const key = getMapsKey();
  if (!key || !path?.length) return "";
  const pts = sample(path, 40)
    .map((p) => `${p.lat},${p.lng}`)
    .join("|");
  const styles = [
    "element:geometry|color:0x0e1118",
    "element:labels.text.fill|color:0x9aa0b4",
    "feature:poi|visibility:off",
    "feature:transit|visibility:off",
    "feature:road|element:geometry|color:0x1c2230",
    "feature:water|element:geometry|color:0x07070c",
  ]
    .map((s) => `&style=${encodeURIComponent(s)}`)
    .join("");
  return `https://maps.googleapis.com/maps/api/staticmap?size=${w}x${h}&scale=2&maptype=roadmap${styles}&path=color:0xff6b4aff|weight:4|${pts}&key=${encodeURIComponent(key)}`;
}

function toLatLngs(path) {
  return (path || []).map((p) => ({ lat: p.lat, lng: p.lng }));
}

function drawRoute(maps, map, path) {
  const pts = toLatLngs(path);
  if (!pts.length) return { line: null };
  const line = new maps.Polyline({
    path: pts,
    geodesic: true,
    strokeColor: "#ff6b4a",
    strokeOpacity: 1,
    strokeWeight: 4.5,
    map,
  });
  const bounds = new maps.LatLngBounds();
  pts.forEach((p) => bounds.extend(p));
  map.fitBounds(bounds, 28);
  new maps.Marker({
    position: pts[0],
    map,
    title: "Start",
    icon: {
      path: maps.SymbolPath.CIRCLE,
      scale: 6,
      fillColor: "#2ee9c8",
      fillOpacity: 1,
      strokeWeight: 0,
    },
  });
  new maps.Marker({
    position: pts[pts.length - 1],
    map,
    title: "Finish",
    icon: {
      path: maps.SymbolPath.CIRCLE,
      scale: 7,
      fillColor: "#ff6b4a",
      fillOpacity: 1,
      strokeWeight: 0,
    },
  });
  return { line };
}

export function mountMap(el, path, { follow } = {}) {
  if (!follow) {
    /* activity cards are static images */
  } else {
    liveMap = null;
    liveLine = null;
    liveDot = null;
  }
  return loadGoogleMaps().then((maps) => {
    const pts = toLatLngs(path);
    const center = pts[0] || { lat: 34.0522, lng: -118.2437 };
    const map = new maps.Map(el, {
      center,
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: "greedy",
      clickableIcons: false,
      styles: DARK,
      backgroundColor: "#0e1118",
    });
    const { line } = drawRoute(maps, map, path);
    if (follow) {
      liveMap = map;
      liveLine = line;
      liveDot = new maps.Marker({
        position: pts[pts.length - 1] || center,
        map,
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#8b7cff",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
    }
    return map;
  });
}

export function updateLivePath(path) {
  if (!liveMap || !window.google?.maps || !path?.length) return;
  const maps = window.google.maps;
  const pts = toLatLngs(path);
  if (liveLine) liveLine.setPath(pts);
  else {
    liveLine = new maps.Polyline({
      path: pts,
      geodesic: true,
      strokeColor: "#ff6b4a",
      strokeOpacity: 1,
      strokeWeight: 4.5,
      map: liveMap,
    });
  }
  const last = pts[pts.length - 1];
  if (liveDot) liveDot.setPosition(last);
  liveMap.panTo(last);
}

export async function mountTrailMaps() {
  const key = getMapsKey();
  document.querySelectorAll("[data-static-map]").forEach((el) => {
    const path = JSON.parse(el.dataset.path || "[]");
    if (key) {
      const url = staticMapUrl(path, 800, 320);
      if (url) el.innerHTML = `<img alt="Route map" class="gmap-img" src="${url}"/>`;
    }
  });
  const liveEl = document.getElementById("live-map");
  if (liveEl && key) {
    const path = JSON.parse(liveEl.dataset.path || "[]");
    liveEl.classList.add("gmap-ready");
    try {
      await mountMap(liveEl, path, { follow: true });
    } catch {
      liveEl.classList.add("gmap-error");
    }
  }
}
