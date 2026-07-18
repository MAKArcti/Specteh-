export interface ScoringCandidate {
  equipmentId: string;
  distanceKm: number;
  pricePerHour: number;
  ratingAvg: number;
  ratingCount: number;
}

export interface ScoredCandidate {
  equipmentId: string;
  distanceKm: number;
  priceEstimate: number;
  score: number;
  rank: number;
}

const WEIGHT_DISTANCE = 0.4;
const WEIGHT_PRICE = 0.3;
const WEIGHT_RATING = 0.3;

/**
 * Ranks equipment candidates for a request: geo + price + rating, per the
 * "Гео + ціна + рейтинг + доступність" matching rule from the product spec.
 * Availability is a pre-filter (see EquipmentService.findAvailableCandidates),
 * not a scoring term, since only already-available equipment reaches here.
 *
 * Pure function so the ranking logic is unit-testable without a database.
 */
export function scoreCandidates(
  candidates: ScoringCandidate[],
  searchRadiusKm: number,
): ScoredCandidate[] {
  if (candidates.length === 0) return [];

  const prices = candidates.map((c) => c.pricePerHour);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const scored = candidates.map((candidate) => {
    const distanceScore = Math.max(0, 1 - candidate.distanceKm / searchRadiusKm);
    const priceScore = 1 - (candidate.pricePerHour - minPrice) / priceRange;
    const ratingScore = candidate.ratingCount > 0 ? candidate.ratingAvg / 5 : 0.5;

    const score =
      WEIGHT_DISTANCE * distanceScore + WEIGHT_PRICE * priceScore + WEIGHT_RATING * ratingScore;

    return {
      equipmentId: candidate.equipmentId,
      distanceKm: candidate.distanceKm,
      priceEstimate: candidate.pricePerHour,
      score,
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .map((candidate, index) => ({ ...candidate, rank: index + 1 }));
}
