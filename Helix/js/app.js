import { loadState, saveState, uid } from "./store.js";
import { PROGRAMS } from "./data.js";
import { coachReply } from "./coach.js";
import { haversine, pathDistance, formatDuration, formatKm, formatPace } from "./geo.js";
import { homeView, liftView, programsView, trailView, coachView } from "./views.js";

let state = loadState();
let draft = emptyDraft();
let live = {
  running: false,
  paused: false,
  type: "run",
  startedAt: 0,
  elapsed: 0,
  distanceM: 0,
  path: [],
  timer: null,
  watchId: null,
  pauseStarted: 0,
  pausedTotal: 0,
};

function emptyDraft() {
  return { name: "Untitled session", notes: "", exercises: [] };
}

function persist() {
  saveState(state);
}

function toast(text) {
  document.querySelector(".toast")?.remove();
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2400);
}

function route() {
  const hash = location.hash.replace("#", "") || "/";
  const app = document.getElementById("app");
  if (hash.startsWith("/lift")) app.innerHTML = liftView(state, draft);
  else if (hash.startsWith("/programs")) app.innerHTML = programsView(state);
  else if (hash.startsWith("/trail")) app.innerHTML = trailView(state, live);
  else if (hash.startsWith("/coach")) {
    app.innerHTML = coachView(state);
    const box = document.getElementById("messages");
    if (box) box.scrollTop = box.scrollHeight;
  } else app.innerHTML = homeView(state);
}

function startProgram(id) {
  const p = [...PROGRAMS, ...state.customWorkouts].find((x) => x.id === id);
  if (!p) return;
  draft = {
    name: p.name,
    notes: "",
    exercises: p.exercises.map((e) => ({
      name: e.name,
      sets: Array.from({ length: Number(e.sets) || 3 }, () => ({
        reps: String(e.reps).replace(/[^0-9].*/, "") || "8",
        weight: "",
        notes: "",
      })),
    })),
  };
  location.hash = "/lift";
  toast(`Loaded ${p.name}`);
}

function syncDraftFromDom() {
  const name = document.getElementById("session-name");
  const notes = document.getElementById("session-notes");
  if (name) draft.name = name.value;
  if (notes) draft.notes = notes.value;
  document.querySelectorAll("[data-field]").forEach((el) => {
    const ex = draft.exercises[Number(el.dataset.ei)];
    const set = ex?.sets[Number(el.dataset.si)];
    if (set) set[el.dataset.field] = el.value;
  });
}

function saveSession() {
  syncDraftFromDom();
  const name = draft.name.trim() || "Session";
  const notes = draft.notes.trim();
  if (!draft.exercises.length) {
    toast("Add at least one exercise");
    return;
  }
  state.sessions.push({
    id: uid(),
    name,
    notes,
    date: Date.now(),
    exercises: JSON.parse(JSON.stringify(draft.exercises)),
  });
  persist();
  draft = emptyDraft();
  route();
  toast("Session saved");
}

function sendCoach(text) {
  const q = text.trim();
  if (!q) return;
  state.chat.push({ role: "me", text: q });
  state.chat.push({ role: "ai", text: coachReply(q, state) });
  persist();
  route();
}

function startLive() {
  live.running = true;
  live.paused = false;
  live.startedAt = Date.now();
  live.elapsed = 0;
  live.distanceM = 0;
  live.path = [];
  live.pausedTotal = 0;
  live.pauseStarted = 0;
  live.timer = setInterval(() => {
    if (!live.paused) {
      live.elapsed = Math.floor((Date.now() - live.startedAt - live.pausedTotal) / 1000);
      const t = document.querySelector("[data-live=time]");
      const d = document.querySelector("[data-live=dist]");
      const p = document.querySelector("[data-live=pace]");
      if (t) t.textContent = formatDuration(live.elapsed);
      if (d) d.textContent = `${formatKm(live.distanceM)} km`;
      if (p) p.textContent = formatPace(live.distanceM, live.elapsed);
    }
  }, 500);
  if (navigator.geolocation) {
    live.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const pt = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          t: live.elapsed,
        };
        const last = live.path[live.path.length - 1];
        if (last) live.distanceM += haversine(last, pt);
        live.path.push(pt);
        const d = document.querySelector("[data-live=dist]");
        const p = document.querySelector("[data-live=pace]");
        if (d) d.textContent = `${formatKm(live.distanceM)} km`;
        if (p) p.textContent = formatPace(live.distanceM, live.elapsed);
      },
      () => toast("GPS unavailable — timer still running"),
      { enableHighAccuracy: true, maximumAge: 1000 }
    );
  } else {
    toast("GPS unavailable — timer still running");
  }
  route();
}

function stopLive() {
  if (live.watchId != null) navigator.geolocation.clearWatch(live.watchId);
  clearInterval(live.timer);
  const dist = live.path.length > 1 ? pathDistance(live.path) : live.distanceM;
  const titles = { run: "Run", ride: "Ride", walk: "Walk", hike: "Hike" };
  state.activities.unshift({
    id: uid(),
    type: live.type,
    title: `${titles[live.type] || "Move"} · ${new Date().toLocaleDateString()}`,
    startedAt: live.startedAt || Date.now(),
    duration: live.elapsed,
    distanceM: dist || live.distanceM,
    path: live.path.length ? live.path : [{ lat: 34.05, lng: -118.24, t: 0 }],
    notes: "",
    kudos: 0,
    liked: false,
  });
  persist();
  live.running = false;
  live.paused = false;
  live.timer = null;
  live.watchId = null;
  live.path = [];
  live.distanceM = 0;
  live.elapsed = 0;
  route();
  toast("Activity saved to Trail");
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-action]");
  if (!t) return;
  const action = t.dataset.action;
  if (action === "add-custom") {
    const name = prompt("Exercise name");
    if (name) {
      draft.exercises.push({ name, sets: [{ reps: "8", weight: "", notes: "" }] });
      route();
    }
  }
  if (action === "del-ex") {
    draft.exercises.splice(Number(t.dataset.ei), 1);
    route();
  }
  if (action === "add-set") {
    draft.exercises[Number(t.dataset.ei)].sets.push({ reps: "8", weight: "", notes: "" });
    route();
  }
  if (action === "del-set") {
    draft.exercises[Number(t.dataset.ei)].sets.splice(Number(t.dataset.si), 1);
    route();
  }
  if (action === "save-session") saveSession();
  if (action === "clear-draft") {
    draft = emptyDraft();
    route();
  }
  if (action === "start-program") startProgram(t.dataset.id);
  if (action === "set-type") {
    live.type = t.dataset.type;
    route();
  }
  if (action === "start-live") startLive();
  if (action === "stop-live") stopLive();
  if (action === "pause-live") {
    if (!live.paused) {
      live.paused = true;
      live.pauseStarted = Date.now();
    } else {
      live.paused = false;
      live.pausedTotal += Date.now() - live.pauseStarted;
    }
    route();
  }
  if (action === "kudos") {
    const a = state.activities.find((x) => x.id === t.dataset.id);
    if (a) {
      a.liked = !a.liked;
      a.kudos += a.liked ? 1 : -1;
      persist();
      route();
    }
  }
  if (action === "prompt") sendCoach(t.dataset.q);
});

document.addEventListener("input", (e) => {
  const el = e.target;
  if (el.id === "session-name" || el.id === "session-notes" || el.dataset?.field) {
    syncDraftFromDom();
  }
});

document.addEventListener("change", (e) => {
  const el = e.target;
  if (el.id === "add-ex" && el.value) {
    syncDraftFromDom();
    draft.exercises.push({ name: el.value, sets: [{ reps: "8", weight: "", notes: "" }] });
    route();
  }
});

document.addEventListener("submit", (e) => {
  if (e.target.id === "coach-form") {
    e.preventDefault();
    sendCoach(new FormData(e.target).get("q") || "");
  }
});

window.addEventListener("hashchange", route);
route();
