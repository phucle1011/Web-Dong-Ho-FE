import React, { useEffect, useMemo } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export const decodeToken = (token) => {
  try {
    const decoded = jwtDecode(token);
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return null;
    }
    return decoded;
  } catch (error) {
    console.error("Không thể decode token", error);
    return null;
  }
};

const ProtectedRoute = ({ allowedRoles = [], restrictedRoles = [], children }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();
  const navigate = useNavigate();

  const decoded = useMemo(() => token ? decodeToken(token) : null, [token]);

  useEffect(() => {
    const handleTokenExpired = () => {
      localStorage.removeItem("token");
      navigate('/login', { state: { from: location }, replace: true });
    };

    window.addEventListener("tokenExpired", handleTokenExpired);

    return () => {
      window.removeEventListener("tokenExpired", handleTokenExpired);
    };
  }, [location, navigate]);

  if (!token || !decoded) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Kiểm tra xem user bị cấm không?
  if (restrictedRoles.length && restrictedRoles.includes(decoded.role)) {
    return <Navigate to="/" replace />; // Chuyển về trang chủ nếu là admin
  }

  // Kiểm tra quyền truy cập
  if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;