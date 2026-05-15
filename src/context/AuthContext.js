import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
    loginRequest,
    registerRequest,
    getMeRequest,
} from "../api/authApi";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user,        setUser]        = useState(null);
    const [initialized, setInitialized] = useState(false);

    const loadUser = useCallback(async () => {
        const response = await getMeRequest();
        const userData = response?.data ?? response;
        setUser(userData);
        return userData;
    }, []);

    useEffect(() => {
        const init = async () => {
            try {
                const token = localStorage.getItem("token");
                if (token && token !== "undefined") await loadUser();
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
        const response = await loginRequest(formData);
        const token = response?.data?.token ?? response?.token;
        localStorage.setItem("token", token);
        await loadUser();
    };

    const register = async (formData) => {
        return await registerRequest(formData);
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
    };

    const refreshUser = useCallback(async () => {
        try {
            await loadUser();
        } catch {

        }
    }, [loadUser]);

    return (
        <AuthContext.Provider
            value={{ user, login, register, logout, refreshUser, initialized }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);