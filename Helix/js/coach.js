import { PROGRAMS } from "./data.js";
import { formatKm } from "./geo.js";

function weekAgo() {
  return Date.now() - 7 * 86400000;
}

function volume(sessions) {
  return sessions.reduce((sum, s) => {
    return (
      sum +
      s.exercises.reduce(
        (a, e) => a + e.sets.reduce((b, set) => b + (Number(set.reps) || 0) * (Number(set.weight) || 0), 0),
        0
      )
    );
  }, 0);
}

function prs(sessions) {
  const map = {};
  for (const s of sessions) {
    for (const e of s.exercises) {
      for (const set of e.sets) {
        const w = Number(set.weight) || 0;
        if (!map[e.name] || w > map[e.name]) map[e.name] = w;
      }
    }
  }
  return map;
}

export function coachReply(message, state) {
  const q = message.toLowerCase();
  const recent = state.sessions.filter((s) => s.date > weekAgo());
  const acts = state.activities.filter((a) => a.startedAt > weekAgo());
  const vol = Math.round(volume(recent));
  const km = acts.reduce((a, x) => a + x.distanceM, 0) / 1000;
  const pr = prs(state.sessions);
  const top = Object.entries(pr).sort((a, b) => b[1] - a[1])[0];

  if (/hi|hello|hey|sup/.test(q) && q.length < 18) {
    return `Hey. You've moved ${km.toFixed(1)} km outdoors this week and stacked ${vol.toLocaleString()} ${state.athlete.unit} of lifting volume. Tell me if you want a session built, a recovery call, or a look at your numbers.`;
  }

  if (/recover|sore|sleep|rest|deload/.test(q)) {
    const hard = recent.length >= 4 || km > 40;
    return hard
      ? `Your week is dense (${recent.length} lift days, ${km.toFixed(1)} km). Take a true easy day: 30–40 min zone-2 walk or spin, nasal breathing, no heroics. Next lift should be 10% lighter on the main lift and stop 2 reps in reserve. Sleep is the actual program.`
      : `You're not overreaching yet. Keep one full rest day. If something is locally sore, swap isolation for a long-range pattern (e.g. machine row instead of pull-ups) and keep the heavy compound.`;
  }

  if (/run|ride|cycle|walk|trail|cardio|engine|zone/.test(q) && !/workout|session|lift/.test(q)) {
    return `Trail prescription: 1 quality session + 1–2 easy. Example — easy ${km > 20 ? "45" : "30"} min conversational pace, then midweek 6×1 min brisk / 1 min easy. Keep easy days actually easy so lifting still has a pulse. Log it in Trail so I can see the week as a whole.`;
  }

  if (/pr|progress|strong|bench|squat|dead/.test(q)) {
    const line = top
      ? `Best logged load so far: ${top[0]} at ${top[1]} ${state.athlete.unit}.`
      : `No heavy sets logged yet — once you start, I'll track peaks per lift.`;
    return `${line}\n\nProgress rule I like for Helix: add a rep before you add load. When you hit the top of the range with 2 RIR, bump 2.5 ${state.athlete.unit}. If last week's notes mention grinders, repeat the weight.`;
  }

  if (/program|list|workout|session|today|generate|plan|what should/.test(q)) {
    const pick =
      km > 25 ? PROGRAMS.find((p) => p.id === "pull") : recent.length % 2 === 0 ? PROGRAMS[0] : PROGRAMS[1];
    const lines = pick.exercises.map((e) => `• ${e.name} — ${e.sets} × ${e.reps}`).join("\n");
    return `Given this week's mix (${recent.length} lifts, ${formatKm(km * 1000)} km outside), run **${pick.name}**.\n\n${lines}\n\nNotes: leave 1–2 reps in reserve on the last set. Open it from Programs when you're ready — I'll remember the log.`;
  }

  if (/diet|eat|protein|food/.test(q)) {
    return `I'm a movement coach, not a meal plan. Simple: protein at each meal, water you can see in the day, don't train heavy fasted if you fade. Your training density this week can handle food — don't cut while stacking volume.`;
  }

  return `I read the room like this:\n• Lift days (7d): ${recent.length}\n• Volume: ${vol.toLocaleString()} ${state.athlete.unit}·reps\n• Outdoor: ${km.toFixed(1)} km across ${acts.length} activities\n\nAsk me to build today's session, call a recovery day, or talk a specific lift. You can also paste how the last set felt — notes in the log make this sharper.`;
}
