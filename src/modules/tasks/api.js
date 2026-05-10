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

// ── комментарии ──
export const getComments = async (projectId, taskId, params = {}) =>
  (await api.get(`/projects/${projectId}/tasks/${taskId}/comments`, { params })).data;

export const createComment = async (projectId, taskId, data) =>
  (await api.post(`/projects/${projectId}/tasks/${taskId}/comments`, data)).data.data;

export const updateComment = async (projectId, taskId, commentId, data) =>
  (await api.patch(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`, data)).data.data;

export const deleteComment = async (projectId, taskId, commentId) =>
  api.delete(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`);

// ── вложения ──
export const getAttachments = (projectId, taskId) =>
  api.get(`/projects/${projectId}/tasks/${taskId}/attachments`).then(r => r.data.data)

export const uploadAttachment = (projectId, taskId, formData, onProgress) =>
  api.post(`/projects/${projectId}/tasks/${taskId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total))
      }
    }
  }).then(r => r.data.data)

export const deleteAttachment = (projectId, taskId, attachmentId) =>
  api.delete(`/projects/${projectId}/tasks/${taskId}/attachments/${attachmentId}`)

// ── чеклист ──
export const getChecklist = (projectId, taskId) =>
  api.get(`/projects/${projectId}/tasks/${taskId}/checklist`).then(r => r.data.data)

export const createChecklistItem = (projectId, taskId, text) =>
  api.post(`/projects/${projectId}/tasks/${taskId}/checklist`, { text }).then(r => r.data.data)

export const updateChecklistItem = (projectId, taskId, itemId, data) =>
  api.patch(`/projects/${projectId}/tasks/${taskId}/checklist/${itemId}`, data).then(r => r.data.data)

export const deleteChecklistItem = (projectId, taskId, itemId) =>
  api.delete(`/projects/${projectId}/tasks/${taskId}/checklist/${itemId}`)

// ── ссылки ──
export const getLinks = (projectId, taskId) =>
  api.get(`/projects/${projectId}/tasks/${taskId}/links`).then(r => r.data.data)

export const createLink = (projectId, taskId, data) =>
  api.post(`/projects/${projectId}/tasks/${taskId}/links`, data).then(r => r.data.data)

export const deleteLink = (projectId, taskId, linkId) =>
  api.delete(`/projects/${projectId}/tasks/${taskId}/links/${linkId}`)

// ── история ──
export const getActivity = (projectId, taskId, params = {}) =>
  api.get(`/projects/${projectId}/tasks/${taskId}/activity`, { params }).then(r => r.data)