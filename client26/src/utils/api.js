import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5000",
    headers: {
        "Content-Type": "application/json",
    },
});

// подстановка токена
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// обработка ошибок
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // при стат 401 релог
        if (error.response && error.response.status === 401) {
            localStorage.removeItem("token");
        }

        return Promise.reject(error);
    }
);

export default api;