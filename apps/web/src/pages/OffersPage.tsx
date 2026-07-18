import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { MatchOffer } from '@spectech/shared-types';
import { getOffers } from '../api/requests';
import { confirmDeal } from '../api/deals';
import { ApiError } from '../api/client';

export function OffersPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<MatchOffer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) return;
    getOffers(requestId)
      .then(setOffers)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load offers'));
  }, [requestId]);

  const handleConfirm = async (offer: MatchOffer) => {
    setError(null);
    setConfirmingId(offer.id);
    try {
      const deal = await confirmDeal({ matchOfferId: offer.id });
      navigate(`/deals/${deal.id}`, { state: { deal } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to confirm deal');
      setConfirmingId(null);
    }
  };

  return (
    <div className="page">
      <h1>Matched offers</h1>
      {error && <p className="error">{error}</p>}
      {offers === null && !error && <p>Loading offers…</p>}
      {offers && offers.length === 0 && <p>No matching equipment was found nearby.</p>}
      {offers && offers.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Equipment</th>
              <th>Distance (km)</th>
              <th>Estimated price</th>
              <th>Score</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer.id}>
                <td>{offer.rank}</td>
                <td>{offer.equipmentId}</td>
                <td>{offer.distanceKm.toFixed(1)}</td>
                <td>{offer.priceEstimate.toFixed(2)}</td>
                <td>{offer.score.toFixed(2)}</td>
                <td>
                  <button
                    type="button"
                    disabled={confirmingId !== null}
                    onClick={() => handleConfirm(offer)}
                  >
                    {confirmingId === offer.id ? 'Confirming…' : 'Confirm deal'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
