import React, { useMemo } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { decodeToken } from '../ProtectedRoute';

const GuestRoute = () => {
  const token = localStorage.getItem('token');
  const decoded = useMemo(() => token ? decodeToken(token) : null, [token]);
  const location = useLocation();

  if (token && decoded) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default GuestRoute;