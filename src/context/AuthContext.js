import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
    loginRequest,
    registerRequest,
    getMeRequest,
} from "../api/authApi";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [initialized, setInitialized] = useState(false);

    // Единая функция загрузки/обновления пользователя
    const loadUser = useCallback(async () => {
        const userData = await getMeRequest();
        setUser(userData);
        return userData;
    }, []);

    // Инициализация при старте — проверяем токен
    useEffect(() => {
        const init = async () => {
            try {
                const token = localStorage.getItem("token");
                if (token) await loadUser();
            } catch {
                localStorage.removeItem("token");
                setUser(null);
            } finally {
                setInitialized(true);
            }
        };
        init();
    }, [loadUser]);

    const login = async (formData) => {
        const data = await loginRequest(formData);
        localStorage.setItem("token", data.token);
        await loadUser();
    };

    const register = async (formData) => {
        return await registerRequest(formData);
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
    };

    // Обновить данные пользователя (вызывается после изменения профиля)
    const refreshUser = useCallback(async () => {
        try {
            await loadUser();
        } catch {
            // если токен протух — interceptor сам редиректит
        }
    }, [loadUser]);

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                register,
                logout,
                refreshUser,
                initialized,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);