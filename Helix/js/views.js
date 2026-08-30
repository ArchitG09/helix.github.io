import { logoMark, helixSvg, ringsSvg, mapSvg, sparkline } from "./graphics.js";

export function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
import { PROGRAMS, EXERCISE_BANK } from "./data.js";
import { pathToSvg, formatKm, formatPace, formatDuration, formatWhen } from "./geo.js";
import { getMapsKey, hasMapsKey } from "./maps.js";

const pill = (type) => {
  const map = { run: "Run", ride: "Ride", walk: "Walk", hike: "Hike", lift: "Lift" };
  return `<span class="pill ${type}">${map[type] || type}</span>`;
};

function layout(active, inner) {
  return `
    <div class="shell page-enter">
      <header class="topbar">
        <a class="brand" href="#/">
          ${logoMark()}
          <div>
            <div class="brand-name">Helix</div>
            <div class="brand-tag">Lift · Move · Evolve</div>
          </div>
        </a>
        <div class="chip-row hide-sm">
          <span class="chip">On-device coach</span>
          <span class="chip">Live trail</span>
        </div>
      </header>
      ${inner}
    </div>
    <nav class="nav" aria-label="Primary">
      <a href="#/" class="${active === "home" ? "active" : ""}">${active === "home" ? '<span class="dot"></span>' : ""} Home</a>
      <a href="#/lift" class="${active === "lift" ? "active" : ""}">${active === "lift" ? '<span class="dot"></span>' : ""} Lift</a>
      <a href="#/programs" class="${active === "programs" ? "active" : ""}">${active === "programs" ? '<span class="dot"></span>' : ""} Programs</a>
      <a href="#/trail" class="${active === "trail" ? "active" : ""}">${active === "trail" ? '<span class="dot"></span>' : ""} Trail</a>
      <a href="#/coach" class="${active === "coach" ? "active" : ""}">${active === "coach" ? '<span class="dot"></span>' : ""} Coach</a>
    </nav>`;
}

export function homeView(state) {
  const week = Date.now() - 7 * 86400000;
  const sessions = state.sessions.filter((s) => s.date > week);
  const acts = state.activities.filter((a) => a.startedAt > week);
  const vol = sessions.reduce(
    (n, s) =>
      n +
      s.exercises.reduce(
        (a, e) => a + e.sets.reduce((b, x) => b + (Number(x.reps) || 0) * (Number(x.weight) || 0), 0),
        0
      ),
    0
  );
  const km = acts.reduce((n, a) => n + a.distanceM, 0);
  const sets = sessions.reduce((n, s) => n + s.exercises.reduce((a, e) => a + e.sets.length, 0), 0);
  const daily = Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - i));
    const start = day.getTime();
    const end = start + 86400000;
    return state.activities
      .filter((a) => a.startedAt >= start && a.startedAt < end)
      .reduce((n, a) => n + a.distanceM, 0);
  });

  const feed = [
    ...state.sessions.map((s) => ({ kind: "lift", ts: s.date, s })),
    ...state.activities.map((a) => ({ kind: "act", ts: a.startedAt, a })),
  ]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 5);

  return layout(
    "home",
    `
    <section class="hero">
      <div class="glass hero-copy">
        <div class="kicker">Training OS</div>
        <h1>Your week,<br>twisting upward.</h1>
        <p class="lede">Log heavy sets, collect outdoor kilometers, and let Helix Coach stitch it into the next session. No feed noise — just the work.</p>
        <div class="cta-row">
          <a class="btn btn-primary" href="#/lift">Log a session</a>
          <a class="btn btn-coral" href="#/trail">Go outside</a>
          <a class="btn btn-ghost" href="#/coach">Talk to Coach</a>
        </div>
      </div>
      <div class="glass helix-stage">${helixSvg()}</div>
    </section>
    <section class="stats">
      <div class="glass stat"><div class="label">Lift volume</div><div class="value">${Math.round(vol).toLocaleString()}</div><div class="delta">${state.athlete.unit} · reps this week</div></div>
      <div class="glass stat"><div class="label">Trail</div><div class="value">${formatKm(km)}</div><div class="delta">kilometers outdoors</div></div>
      <div class="glass stat"><div class="label">Sets</div><div class="value">${sets}</div><div class="delta">logged in 7 days</div></div>
      <div class="glass stat"><div class="label">Activities</div><div class="value">${acts.length}</div><div class="delta">runs, rides, walks</div></div>
    </section>
    <div class="grid-2">
      <div>
        <div class="section-head"><h2>Pulse</h2><span class="muted">Last 7 days</span></div>
        <div class="glass rings">
          <div class="ring-wrap">
            ${ringsSvg(Math.min(1, sets / 40), Math.min(1, km / 25000), Math.min(1, 0.55 + sessions.length * 0.08))}
            <div class="ring-center"><strong>${Math.round(Math.min(100, (sets / 40) * 100))}%</strong><span class="muted">lift target</span></div>
          </div>
          <div>
            <p class="muted" style="margin:0 0 8px">Cyan lift · Coral trail · Violet recovery</p>
            ${sparkline(daily)}
            <p class="muted">Outdoor distance by day</p>
          </div>
        </div>
      </div>
      <div>
        <div class="section-head"><h2>Live feed</h2><a class="muted" href="#/trail">Open Trail</a></div>
        ${feed
          .map((item) => {
            if (item.kind === "lift") {
              const s = item.s;
              return `<div class="glass feed-item">
                <div class="map-thumb" style="display:grid;place-items:center;color:#2ee9c8;font-family:Syne">${s.exercises.length} ex</div>
                <div>${pill("lift")}<div class="card-title">${s.name}</div><div class="meta">${formatWhen(s.date)}</div></div>
              </div>`;
            }
            const a = item.a;
            return `<div class="glass feed-item">
              <div class="map-thumb">${mapSvg(pathToSvg(a.path, 280, 120))}</div>
              <div>${pill(a.type)}<div class="card-title">${a.title}</div><div class="meta">${formatKm(a.distanceM)} km · ${formatDuration(a.duration)}</div></div>
            </div>`;
          })
          .join("")}
      </div>
    </div>`
  );
}

export function liftView(state, draft) {
  const d = draft;
  const history = [...state.sessions].sort((a, b) => b.date - a.date);
  return layout(
    "lift",
    `
    <div class="kicker">Weight room</div>
    <h1>Log the work.</h1>
    <p class="lede">Sets, reps, load, and the note you’ll thank yourself for later.</p>
    <div class="grid-2" style="margin-top:20px">
      <div class="glass card">
        <div class="form-grid">
          <div>
            <label>Session name</label>
            <input id="session-name" value="${esc(d.name)}" placeholder="Push · Helix Hypertrophy"/>
          </div>
          <div>
            <label>Session notes</label>
            <textarea id="session-notes" placeholder="Energy, sleep, what felt off…">${esc(d.notes)}</textarea>
          </div>
        </div>
        <div style="margin:16px 0 8px;display:flex;gap:8px;flex-wrap:wrap">
          <select id="add-ex">
            <option value="">Add exercise…</option>
            ${EXERCISE_BANK.map((n) => `<option>${n}</option>`).join("")}
          </select>
          <button class="btn btn-ghost" data-action="add-custom">Custom</button>
        </div>
        ${d.exercises
          .map(
            (ex, ei) => `
          <div class="glass exercise">
            <div class="exercise-head">
              <strong>${esc(ex.name)}</strong>
              <button class="icon-btn" data-action="del-ex" data-ei="${ei}">✕</button>
            </div>
            ${ex.sets
              .map(
                (set, si) => `
              <div class="set-row">
                <span class="muted">${si + 1}</span>
                <input type="number" data-field="reps" data-ei="${ei}" data-si="${si}" value="${esc(set.reps)}" placeholder="Reps"/>
                <input type="number" data-field="weight" data-ei="${ei}" data-si="${si}" value="${esc(set.weight)}" placeholder="${state.athlete.unit}"/>
                <input data-field="notes" data-ei="${ei}" data-si="${si}" value="${esc(set.notes)}" placeholder="Notes"/>
                <button class="icon-btn" data-action="del-set" data-ei="${ei}" data-si="${si}">–</button>
              </div>`
              )
              .join("")}
            <button class="btn btn-ghost" data-action="add-set" data-ei="${ei}">+ Set</button>
          </div>`
          )
          .join("")}
        <div class="cta-row">
          <button class="btn btn-primary" data-action="save-session">Save session</button>
          <button class="btn btn-ghost" data-action="clear-draft">Clear</button>
        </div>
      </div>
      <div>
        <div class="section-head"><h2>History</h2></div>
        ${
          history.length
            ? history
                .map(
                  (s) => `<div class="glass card" style="margin-bottom:10px">
              <div class="card-title">${esc(s.name)}</div>
              <div class="meta">${formatWhen(s.date)} · ${s.exercises.length} exercises</div>
              ${s.notes ? `<p class="muted">${esc(s.notes)}</p>` : ""}
              <div class="meta">${s.exercises
                .map((e) => `${e.name} (${e.sets.map((x) => `${x.reps}×${x.weight}`).join(", ")})`)
                .join(" · ")}</div>
            </div>`
                )
                .join("")
            : `<div class="glass empty">No sessions yet. First set is the hardest UI.</div>`
        }
      </div>
    </div>`
  );
}

export function programsView(state) {
  const all = [...PROGRAMS, ...state.customWorkouts];
  return layout(
    "programs",
    `
    <div class="kicker">Library</div>
    <h1>Workouts with a spine.</h1>
    <p class="lede">Start a template and it drops straight into the lift log — sets waiting for numbers.</p>
    <div class="grid-3" style="margin-top:20px">
      ${all
        .map(
          (p) => `<article class="glass program" data-action="start-program" data-id="${p.id}">
          <div class="program-banner ${p.vibe || ""}"></div>
          <div class="program-body">
            <div class="pill lift">${p.days} day${p.days > 1 ? "s" : ""}</div>
            <h3 style="margin-top:10px">${p.name}</h3>
            <p class="muted">${p.blurb}</p>
            <div class="meta">${p.exercises.map((e) => e.name).join(" · ")}</div>
          </div>
        </article>`
        )
        .join("")}
    </div>`
  );
}

export function trailView(state, live) {
  const acts = [...state.activities].sort((a, b) => b.startedAt - a.startedAt);
  const weekKm = acts.filter((a) => a.startedAt > Date.now() - 7 * 86400000).reduce((n, a) => n + a.distanceM, 0);
  return layout(
    "trail",
    `
    <div class="kicker">Trail</div>
    <h1>Move like it counts.</h1>
    <p class="lede">Runs, rides, walks — GPS when you allow it, a clean feed either way. ${formatKm(weekKm)} km this week.</p>
    <div class="glass live-bar" style="margin:18px 0">
      <div style="display:flex;align-items:center;gap:10px">${live.running ? '<span class="pulse-dot"></span>' : ""} <strong>${live.running ? "Recording" : "Ready"}</strong></div>
      <div class="live-stat"><span class="muted">Time</span><b data-live="time">${formatDuration(live.elapsed)}</b></div>
      <div class="live-stat"><span class="muted">Distance</span><b data-live="dist">${formatKm(live.distanceM)} km</b></div>
      <div class="live-stat"><span class="muted">Pace</span><b data-live="pace">${formatPace(live.distanceM, live.elapsed)}</b></div>
      <div class="chip-row">
        ${["run", "ride", "walk", "hike"]
          .map(
            (t) =>
              `<button class="chip ${live.type === t ? "active" : ""}" data-action="set-type" data-type="${t}">${t}</button>`
          )
          .join("")}
      </div>
    </div>
    <div class="cta-row" style="margin-bottom:18px">
      ${
        live.running
          ? `<button class="btn btn-coral" data-action="stop-live">Finish & save</button>
             <button class="btn btn-ghost" data-action="pause-live">${live.paused ? "Resume" : "Pause"}</button>`
          : `<button class="btn btn-primary" data-action="start-live">Start activity</button>`
      }
    </div>
    <div class="section-head"><h2>Activity feed</h2><span class="muted">Strava energy, Helix taste</span></div>
    ${acts
      .map(
        (a) => `<article class="glass" style="margin-bottom:14px;overflow:hidden">
        <div class="map-thumb" style="height:180px">${mapSvg(pathToSvg(a.path, 1100, 180), 1100, 180)}</div>
        <div class="feed-item">
          <div>
            ${pill(a.type)}
            <div class="card-title">${a.title}</div>
            <div class="meta">${formatWhen(a.startedAt)}</div>
          </div>
          <div>
            <div class="card-title">${formatKm(a.distanceM)} km</div>
            <div class="meta">${formatDuration(a.duration)} · ${formatPace(a.distanceM, a.duration)}</div>
            ${a.notes ? `<p class="muted">${a.notes}</p>` : ""}
          </div>
          <button class="kudos ${a.liked ? "on" : ""}" data-action="kudos" data-id="${a.id}">▲ ${a.kudos}</button>
        </div>
      </article>`
      )
      .join("")}`
  );
}

export function coachView(state) {
  return layout(
    "coach",
    `
    <div class="kicker">Helix Coach</div>
    <h1>A trainer that read the log.</h1>
    <p class="lede">On-device: I use your sessions and trail data — nothing leaves this browser.</p>
    <div class="glass chat" style="margin-top:18px">
      <div class="messages" id="messages">
        ${state.chat
          .map((m) => `<div class="bubble ${m.role === "me" ? "me" : "ai"}">${esc(m.text).replace(/\n/g, "<br>")}</div>`)
          .join("")}
      </div>
      <form class="composer" id="coach-form">
        <input name="q" placeholder="Build today’s session, call recovery, talk bench…" autocomplete="off"/>
        <button class="btn btn-violet" type="submit">Send</button>
      </form>
    </div>
    <div class="chip-row" style="margin-top:12px">
      <button class="chip" data-action="prompt" data-q="What should I train today?">Today’s session</button>
      <button class="chip" data-action="prompt" data-q="Do I need a recovery day?">Recovery call</button>
      <button class="chip" data-action="prompt" data-q="Help me progress my squat">Progress a lift</button>
      <button class="chip" data-action="prompt" data-q="Give me a zone 2 trail plan">Trail plan</button>
    </div>`
  );
}
