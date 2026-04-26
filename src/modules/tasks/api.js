import api from "../../utils/api";

export const getTasks = async (projectId, params) => {
  const res = await api.get(`/projects/${projectId}/tasks`, { params });
  return res.data.data;
};

export const getMyProjectTasks = async (projectId, params) => {
  const res = await api.get(`/projects/${projectId}/tasks/my`, { params });
  return res.data.data;
};

export const getTask = async (projectId, taskId) => {
  const res = await api.get(`/projects/${projectId}/tasks/${taskId}`);
  return res.data.data;
};

export const createTask = async (projectId, data) => {
  const res = await api.post(`/projects/${projectId}/tasks`, data);
  return res.data.data;
};

export const updateTask = async (projectId, taskId, data) => {
  const res = await api.patch(`/projects/${projectId}/tasks/${taskId}`, data);
  return res.data.data;
};

export const deleteTask = async (projectId, taskId) => {
  await api.delete(`/projects/${projectId}/tasks/${taskId}`);
};

export const getGlobalTasks = async (params) => {
  const res = await api.get("/tasks", { params });
  return res.data.data;
};