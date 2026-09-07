import { getRoute } from './osrm';
import { getLandmarksForRoute, getSafetyPointsForRoute } from './overpass';
import { rankLandmarks, distanceMeters } from './saliency';
import { generateInstruction } from './instructions';

const LANDMARK_SEARCH_RADIUS_METERS = 150;
const MAX_DEBUG_CANDIDATES_PER_STEP = 5;

/**
 * Full pipeline: origin + destination -> spoken, landmark-based route steps.
 * This is Rasta's core: GPS route in, natural Urdu guidance out.
 */
export async function buildGuidedRoute(origin, destination) {
  const route = await getRoute(origin, destination);

  // One Overpass call for the whole route corridor, not one per turn —
  // the public Overpass instance queues/rate-limits per-turn queries.
  let candidates = [];
  let safetyPoints = [];
  try {
    candidates = await getLandmarksForRoute(route.geometry.coordinates);
  } catch {
    candidates = []; // falls back to distance-based instructions below
  }
  try {
    safetyPoints = await getSafetyPointsForRoute(route.geometry.coordinates);
  } catch {
    safetyPoints = [];
  }

  const guidedSteps = await Promise.all(
    route.steps.map(async (step) => {
      const nearby = candidates.filter(
        (lm) => distanceMeters(lm, step.location) <= LANDMARK_SEARCH_RADIUS_METERS
      );
      // Ranked, best-first — [0] is the winner used for the instruction;
      // the rest are kept (capped) so a debug view can show what was
      // considered and rejected, and why (see saliency.js's score breakdown).
      const ranked = rankLandmarks(nearby, step.location);
      const landmark = ranked[0] ?? null;
      const rejectedCandidates = ranked.slice(1, MAX_DEBUG_CANDIDATES_PER_STEP);
      const instruction = await generateInstruction(step, landmark);
      return { ...step, landmark, rejectedCandidates, instruction };
    })
  );

  return { ...route, steps: guidedSteps, safetyPoints };
}
