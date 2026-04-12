import { createContext, useContext, useState, useEffect } from "react";
import {
    loginRequest,
    registerRequest,
    getMeRequest,
} from "../api/authApi";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [initialized, setInitialized] = useState(false);

    // проверяем при входе
    useEffect(() => {
        const init = async () => {
            try {
                const token = localStorage.getItem("token");

                if (token) {
                    const userData = await getMeRequest();
                    setUser(userData);
                }
            } catch (e) {
                localStorage.removeItem("token");
                setUser(null);
            } finally {
                setInitialized(true);
            }
        };

        init();
    }, []);

    // лог
    const login = async (formData) => {
        const data = await loginRequest(formData);

        localStorage.setItem("token", data.token);

        const userData = await getMeRequest();
        setUser(userData);
    };

    // рег
    const register = async (formData) => {
        return await registerRequest(formData);
    };

    // вых
    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                register,
                logout,
                initialized,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// простой кастом хук
export const useAuth = () => useContext(AuthContext);