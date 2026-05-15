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

// верификация почты
export const verifyEmailRequest = async (token) => {
    const response = await api.get("/auth/verify-email", { params: { token } });
    return response.data;
};

export const resendVerificationRequest = async (email) => {
    const response = await api.post("/auth/resend-verification", { email });
    return response.data;
};

// сброс пароля
export const forgotPasswordRequest = async (email) => {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
};

export const resetPasswordRequest = async (token, password) => {
    const response = await api.post("/auth/reset-password", { token, password });
    return response.data;
};

// публичный статус системы
export const getSystemStatusRequest = async () => {
  const response = await api.get("/system/status");
  return response.data;
};