import api from "../utils/api";

export const loginRequest = async (data) => {
    const response = await api.post("/auth/login", data);
    return response.data;
};

export const registerRequest = async (data) => {
    const response = await api.post("/auth/register", data);
    return response.data;
};

export const getMeRequest = async () => {
    const response = await api.get("/auth/me");
    return response.data;
};