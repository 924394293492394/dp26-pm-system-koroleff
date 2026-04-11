import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // пока проверяем auth, ничего не показываем
  if (loading) return <div>Loading...</div>;

  // если не авторизован, на логин
  if (!user) return <Navigate to="/login" replace />;

  // если авторизован, показываем страницу
  return children;
};

export default ProtectedRoute;