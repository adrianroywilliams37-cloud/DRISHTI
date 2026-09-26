import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, UserRole } from '../../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; // Or an unauthorized page
  }

  return <Outlet />;
}
