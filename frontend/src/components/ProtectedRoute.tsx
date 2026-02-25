import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--bg-main))] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login but save the attempted url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = user?.role;

  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    // User is logged in but doesn't have the right role
    // Redirect to their respective dashboard
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (userRole === 'COMPANY_ADMIN') return <Navigate to="/company/dashboard" replace />;
    if (userRole === 'TRIAGER') return <Navigate to="/triager/dashboard" replace />;
    return <Navigate to="/researcher/dashboard" replace />;
  }

  return <>{children}</>;
}
