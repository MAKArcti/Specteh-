import { Navigate, Outlet } from 'react-router-dom';
import type { UserRole } from '@spectech/shared-types';
import { useAuth } from '../context/AuthContext';

export function RequireAuth({ allowedRoles }: { allowedRoles?: UserRole[] }) {
  const { session } = useAuth();

  if (!session) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(session.role)) return <Navigate to="/" replace />;

  return <Outlet />;
}
