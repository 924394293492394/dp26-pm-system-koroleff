import { createContext, useContext, useState, useEffect } from "react";
import {
    loginRequest,
    registerRequest,
    getMeRequest,
} from "../api/authApi";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // проверяем при входе
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const data = await getMeRequest();
                setUser(data);
            } catch (err) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    // лог
    const login = async (formData) => {
        const data = await loginRequest(formData);
        localStorage.setItem("token", data.token);
        setUser(data.user);
    };

    // рег
    const register = async (formData) => {
        const data = await registerRequest(formData);
        localStorage.setItem("token", data.token);
        setUser(data.user);
    };

    // вых
    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{ user, login, register, logout, loading }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// простой кастом хук
export const useAuth = () => useContext(AuthContext);