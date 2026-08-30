const KEY = "helix.v1";

const seedPath = (n = 80, scale = 0.012) => {
  const pts = [];
  let lat = 34.0522;
  let lng = -118.2437;
  for (let i = 0; i < n; i++) {
    lat += Math.sin(i / 6) * scale;
    lng += Math.cos(i / 8) * scale * 1.2;
    pts.push({ lat, lng, t: i * 8 });
  }
  return pts;
};

export const defaultState = () => ({
  athlete: { name: "You", unit: "kg" },
  customExercises: [],
  sessions: [
    {
      id: "s1",
      name: "Push — Helix Hypertrophy",
      date: Date.now() - 86400000 * 1,
      notes: "Felt snappy on bench. Left shoulder warm.",
      exercises: [
        {
          name: "Barbell Bench Press",
          sets: [
            { reps: 8, weight: 80, notes: "paused" },
            { reps: 8, weight: 85, notes: "" },
            { reps: 6, weight: 90, notes: "last two grinders" },
          ],
        },
        {
          name: "Overhead Press",
          sets: [
            { reps: 8, weight: 45, notes: "" },
            { reps: 8, weight: 47.5, notes: "" },
          ],
        },
      ],
    },
  ],
  activities: [
    {
      id: "a1",
      type: "run",
      title: "Golden hour loop",
      startedAt: Date.now() - 3600 * 1000 * 30,
      duration: 32 * 60,
      distanceM: 5600,
      path: seedPath(90, 0.008),
      notes: "Easy aerobic. Cadence felt smooth.",
      kudos: 12,
      liked: false,
    },
    {
      id: "a2",
      type: "ride",
      title: "Coast rollers",
      startedAt: Date.now() - 3600 * 1000 * 70,
      duration: 78 * 60,
      distanceM: 28400,
      path: seedPath(120, 0.018),
      notes: "Headwind on the return.",
      kudos: 21,
      liked: true,
    },
    {
      id: "a3",
      type: "walk",
      title: "Evening unwind",
      startedAt: Date.now() - 3600 * 1000 * 10,
      duration: 44 * 60,
      distanceM: 3800,
      path: seedPath(60, 0.005),
      notes: "",
      kudos: 4,
      liked: false,
    },
  ],
  customWorkouts: [],
  chat: [
    {
      role: "ai",
      text: "I'm Helix Coach — your on-device trainer. Log lifts, stack outdoor miles, and I'll shape the next session from what you actually did. What's the goal this week: strength, hypertrophy, or engine?",
    },
  ],
});

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return {
      ...defaultState(),
      ...parsed,
      customExercises: parsed.customExercises || [],
    };
  } catch {
    return defaultState();
  }
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export const uid = () =>
  crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
