import api from "../../utils/api";

// список всех пользователей системы (с пагинацией и поиском)
export const getUsers = async (params = {}) => {
  const res = await api.get("/profile/system/users", { params });
  return res.data;
};

// публичный профиль пользователя по id
export const getUserProfile = async (userId) => {
  const res = await api.get(`/profile/users/${userId}`);
  return res.data;
};

// мой профиль
export const getMyProfile = async () => {
  const res = await api.get("/profile");
  return res.data;
};

// обновить мой профиль
export const updateMyProfile = async (data) => {
  const res = await api.patch("/profile", data);
  return res.data;
};