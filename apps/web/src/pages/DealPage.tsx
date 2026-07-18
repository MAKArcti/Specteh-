import { Link, useLocation, useParams } from 'react-router-dom';
import type { Deal } from '@spectech/shared-types';

interface DealLocationState {
  deal?: Deal;
}

/**
 * There is no GET /deals/:id endpoint for customers (only GET /deals/mine
 * for operators/owners), so the deal shown here is the one returned by the
 * POST /deals call and handed off through router state, not re-fetched.
 */
export function DealPage() {
  const { dealId } = useParams<{ dealId: string }>();
  const location = useLocation();
  const deal = (location.state as DealLocationState | null)?.deal;

  if (!deal) {
    return (
      <div className="page">
        <h1>Deal {dealId}</h1>
        <p>
          Deal details are only available right after confirming it. Start a new{' '}
          <Link to="/requests/new">request</Link> to see a fresh deal.
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Deal confirmed</h1>
      <dl>
        <dt>Deal ID</dt>
        <dd>{deal.id}</dd>
        <dt>Status</dt>
        <dd>{deal.status}</dd>
        <dt>Equipment ID</dt>
        <dd>{deal.equipmentId}</dd>
        <dt>Agreed price per hour</dt>
        <dd>{deal.agreedPricePerHour}</dd>
        <dt>Start date</dt>
        <dd>{new Date(deal.startDate).toLocaleString()}</dd>
        <dt>End date</dt>
        <dd>{new Date(deal.endDate).toLocaleString()}</dd>
      </dl>
      <p>
        <Link to="/requests/new">Create another request</Link>
      </p>
    </div>
  );
}
