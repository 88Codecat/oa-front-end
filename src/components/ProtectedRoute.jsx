import { Outlet, Navigate } from "react-router-dom";

// 路由保护组件
const ProtectedRoute = () => {
  const token = sessionStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
