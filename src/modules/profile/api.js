import api from "../../utils/api";

export const getMyProfile = async () => {
  const res = await api.get("/profile");
  return res.data;
};

export const updateMyProfile = async (data) => {
  const res = await api.patch("/profile", data);
  return res.data;
};

export const deleteAvatar = async () => {
  const res = await api.delete("/profile/avatar");
  return res.data;
};

export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append("avatar", file);
  const res = await api.post("/profile/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// запросить OTP-код на email (только для USER)
export const requestPasswordOtp = async () => {
  const res = await api.post("/profile/request-otp");
  return res.data;
};

// сменить пароль через профиль(USER: нужен otp, ADMIN: без otp)
export const changePassword = async (data) => {
  const res = await api.post("/profile/change-password", data);
  return res.data;
};