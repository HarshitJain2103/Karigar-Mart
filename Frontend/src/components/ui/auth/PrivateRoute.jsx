import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from "@/stores/authStore";

const PrivateRoute = ({ allowedRoles }) => {
  const { user } = useAuthStore();
  return user && allowedRoles.includes(user.role) ? <Outlet /> : <Navigate to="/" replace />;
};

export default PrivateRoute;