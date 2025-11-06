import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useNeon } from '../providers/NeonProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { authState } = useNeon();
  const { isAuthenticated, loading } = authState;
  const location = useLocation();

  if (loading) {
    return (
      <div className="screen bg-bg-secondary flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4" />
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login with return path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
