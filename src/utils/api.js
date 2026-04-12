import axios from "axios";

let setGlobalLoading;

// внедрение loader из контекста
export const injectLoader = (_setLoading) => {
    setGlobalLoading = _setLoading;
};

const api = axios.create({
    baseURL: "http://localhost:5000",
    headers: {
        "Content-Type": "application/json",
    },
});

// подстановка токена
api.interceptors.request.use((config) => {
    if (setGlobalLoading) setGlobalLoading(true);

    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// обработка ошибок
api.interceptors.response.use(
    (response) => {
        if (setGlobalLoading) setGlobalLoading(false);
        return response;
    },
    (error) => {
        if (setGlobalLoading) setGlobalLoading(false);

        // при стат 401 релог
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "/login";
        }

        return Promise.reject(error);
    }
);

export default api;