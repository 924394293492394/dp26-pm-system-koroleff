import api from "../../utils/api";

export const getProjectById = async (id) => {
    const res = await api.get(`/projects/${id}`);
    return res.data.data;
};

export const getMyProjects = async (params) => {
    const res = await api.get("/projects/my", { params });
    return res.data.data;
};

export const getAllProjects = async (params) => {
    const res = await api.get("/projects", { params });
    return res.data.data;
};

export const createProject = async (data) => {
    const res = await api.post("/projects", data);
    return res.data.data;
};

export const updateProject = async (id, data) => {
    const res = await api.patch(`/projects/${id}`, data);
    return res.data.data;
};

export const archiveProject = async (id) => {
    await api.patch(`/projects/${id}/archive`);
};

export const unarchiveProject = async (id) => {
    await api.patch(`/projects/${id}/unarchive`);
};

export const deleteProject = async (id) => {
    await api.delete(`/projects/${id}`);
};

// апи участников проекта
export const getMembers = async (projectId, params) => {
    const res = await api.get(`/projects/${projectId}/members`, { params });
    return res.data.data;
};

export const getMyMembership = async (projectId) => {
    const res = await api.get(`/projects/${projectId}/members/me`);
    return res.data.data;
};

export const addMember = async (projectId, data) => {
    const res = await api.post(`/projects/${projectId}/members`, data);
    return res.data.data;
};

export const updateMemberRole = async (projectId, userId, data) => {
    const res = await api.patch(`/projects/${projectId}/members/${userId}`, data);
    return res.data.data;
};

export const removeMember = async (projectId, userId) => {
    await api.delete(`/projects/${projectId}/members/${userId}`);
};

export const leaveProject = async (projectId) => {
    await api.post(`/projects/${projectId}/members/leave`);
};

// поиск новых участников
export const searchUsers = async (params) => {
    const res = await api.get("/profile/users/search", { params });
    return res.data.data;
};