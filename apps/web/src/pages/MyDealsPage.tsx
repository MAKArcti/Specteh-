import { useEffect, useState } from 'react';
import type { Deal } from '@spectech/shared-types';
import { getMyDeals } from '../api/deals';
import { ApiError } from '../api/client';

export function MyDealsPage() {
  const [deals, setDeals] = useState<Deal[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyDeals()
      .then(setDeals)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load deals'));
  }, []);

  return (
    <div className="page">
      <h1>My deals</h1>
      {error && <p className="error">{error}</p>}
      {deals === null && !error && <p>Loading…</p>}
      {deals && deals.length === 0 && <p>No deals yet.</p>}
      {deals && deals.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Deal ID</th>
              <th>Status</th>
              <th>Price/hour</th>
              <th>Start</th>
              <th>End</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((deal) => (
              <tr key={deal.id}>
                <td>{deal.id}</td>
                <td>{deal.status}</td>
                <td>{deal.agreedPricePerHour}</td>
                <td>{new Date(deal.startDate).toLocaleDateString()}</td>
                <td>{new Date(deal.endDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
