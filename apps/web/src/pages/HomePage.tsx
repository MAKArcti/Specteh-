import { Navigate } from 'react-router-dom';
import { UserRole } from '@spectech/shared-types';
import { useAuth } from '../context/AuthContext';

export function HomePage() {
  const { session } = useAuth();

  if (!session) return <Navigate to="/login" replace />;
  if (session.role === UserRole.CUSTOMER) return <Navigate to="/requests/new" replace />;
  if (session.role === UserRole.EQUIPMENT_OWNER) return <Navigate to="/equipment/new" replace />;

  return (
    <div className="page">
      <p>There is no web dashboard for this role yet.</p>
    </div>
  );
}
