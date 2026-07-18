import { scoreCandidates } from './matching.scoring';

describe('scoreCandidates', () => {
  it('returns an empty array for no candidates', () => {
    expect(scoreCandidates([], 50)).toEqual([]);
  });

  it('ranks the closer, cheaper, higher-rated candidate first', () => {
    const result = scoreCandidates(
      [
        { equipmentId: 'far-expensive', distanceKm: 40, pricePerHour: 2000, ratingAvg: 3, ratingCount: 10 },
        { equipmentId: 'near-cheap', distanceKm: 2, pricePerHour: 800, ratingAvg: 4.8, ratingCount: 25 },
      ],
      50,
    );

    expect(result[0].equipmentId).toBe('near-cheap');
    expect(result[0].rank).toBe(1);
    expect(result[1].rank).toBe(2);
  });

  it('treats unrated equipment as neutral rather than penalizing it to zero', () => {
    const [unrated, poorlyRated] = scoreCandidates(
      [
        { equipmentId: 'unrated', distanceKm: 5, pricePerHour: 1000, ratingAvg: 0, ratingCount: 0 },
        { equipmentId: 'poorly-rated', distanceKm: 5, pricePerHour: 1000, ratingAvg: 1, ratingCount: 5 },
      ],
      50,
    );

    expect(unrated.score).toBeGreaterThan(poorlyRated.score);
  });

  it('assigns distinct sequential ranks ordered by descending score', () => {
    const result = scoreCandidates(
      [
        { equipmentId: 'a', distanceKm: 10, pricePerHour: 1000, ratingAvg: 4, ratingCount: 10 },
        { equipmentId: 'b', distanceKm: 20, pricePerHour: 1200, ratingAvg: 4, ratingCount: 10 },
        { equipmentId: 'c', distanceKm: 30, pricePerHour: 1500, ratingAvg: 3, ratingCount: 10 },
      ],
      50,
    );

    expect(result.map((r) => r.rank)).toEqual([1, 2, 3]);
    expect(result[0].score).toBeGreaterThanOrEqual(result[1].score);
    expect(result[1].score).toBeGreaterThanOrEqual(result[2].score);
  });
});
