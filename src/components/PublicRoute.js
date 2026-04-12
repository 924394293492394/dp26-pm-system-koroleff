import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const PublicRoute = ({ children }) => {
    const { user, initialized } = useAuth();

    // пока проверяем auth, ничего не показываем
    if (!initialized) {
        return <div style={{ padding: 50 }}>Loading...</div>;
    }

    // если уже авторизован, переход на главную
    if (user) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default PublicRoute;