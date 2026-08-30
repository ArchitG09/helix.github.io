# Helix

Lift. Move. Evolve.

A local training app for logging sets, browsing workouts, talking to an on-device coach, and recording outdoor activity (run, ride, walk, hike) in a Trail feed.

## Run it

Python is enough — no Node required.

```bash
cd Helix
py -m http.server 5173
```

Open [http://localhost:5173](http://localhost:5173)

Data stays in your browser (`localStorage`). GPS is optional; the timer still records if location is denied.
