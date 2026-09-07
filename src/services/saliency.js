// The Landmark Saliency Score ranks candidate landmarks near a turn point so the
// instruction generator only ever sees the ONE best landmark to reference —
// instead of dumping every nearby POI into the prompt and hoping for the best.
//
// Score = category weight (how naturally Pakistanis reference this type)
//        + distance score (closer to the actual turn = more useful)
//        + prominence score (OSM metadata richness, proxy for real-world recognizability)
//
// This is intentionally a transparent, hand-tuned heuristic rather than a learned
// model — see README for why, and for the "learn weights from feedback" future work.

const CATEGORY_WEIGHT = {
  mosque: 10,        // near-universal reference point, present in every neighborhood
  petrol_pump: 9,     // highly visible, well-lit, memorable
  hospital: 8,
  market: 7,
  bank: 5,
  school: 5,
  park: 4,
  landmark: 3,
};

export function distanceMeters(a, b) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function prominenceScore(tags) {
  let score = 0;
  if (tags.wikidata) score += 3;
  if (tags.brand) score += 2;
  if (tags['addr:housenumber']) score += 1; // suggests it's a properly-surveyed feature
  return score;
}

/**
 * @param {Array} landmarks - candidates from overpass.js
 * @param {{lat:number, lon:number}} turnPoint
 * @returns {Array} landmarks sorted best-first, each with a `.saliency` breakdown
 */
export function rankLandmarks(landmarks, turnPoint) {
  return landmarks
    .map((lm) => {
      const dist = distanceMeters(lm, turnPoint);
      const distanceScore = Math.max(0, 10 - dist / 20); // decays over ~200m
      const categoryScore = CATEGORY_WEIGHT[lm.category] ?? 2;
      const prominence = prominenceScore(lm.tags);
      const total = categoryScore + distanceScore + prominence;

      return {
        ...lm,
        distanceToTurn: Math.round(dist),
        saliency: {
          categoryScore,
          distanceScore: Math.round(distanceScore * 10) / 10,
          prominence,
          total: Math.round(total * 10) / 10,
        },
      };
    })
    .sort((a, b) => b.saliency.total - a.saliency.total);
}

export function bestLandmarkFor(landmarks, turnPoint) {
  const ranked = rankLandmarks(landmarks, turnPoint);
  return ranked[0] ?? null;
}
