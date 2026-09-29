# RunMath

Running pace math: race prediction, pace conversion, and split planning. Part of the app-factory project.

**Live:** https://ilanis-agent.github.io/runmath/

## What it does

- **Race predictor** - Riegel's formula (`T2 = T1 x (D2/D1)^1.06`) from any timed result to any distance, with an equivalents table across 1500m, mile, 5K, 10K, half and full marathon.
- **Pace converter** - finish time + distance to min/km, min/mile, and km/h.
- **Split planner** - even, negative, or positive splits by percent: per-kilometer times plus the two halves, for any distance (including the odd 0.0975 km at the end of a half marathon).
- **Honest bands** - what your pace actually means, from sub-elite to out-the-door.

All math is client-side in `engine.js`, shared with the node test suite (41 tests: Riegel anchors like 50:00 10K to 1:50:19 half and 3:50 marathon, pace/speed conversions, split algebra for negative/positive plans, and parse/format round-trips).

## Files

- `index.html` - landing page
- `app.html` - the calculator
- `engine.js` - pure running math, no DOM

No build step, no dependencies, no server.
