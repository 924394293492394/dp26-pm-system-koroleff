import api from "../../utils/api";

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

export const seargetGoalschUsers = async (projectId, params) => {
    const res = await api.get(`/projects/${projectId}/goals`, { params });
    return res.data.data;
};

export const getGoals = async (projectId, params) => {
    const res = await api.get(`/projects/${projectId}/goals`, { params });
    return res.data.data;
};

export const getGoal = async (projectId, goalId) => {
    const res = await api.get(`/projects/${projectId}/goals/${goalId}`);
    return res.data.data;
};

export const getMyProjectGoals = async (projectId) => {
    const res = await api.get(`/projects/${projectId}/goals/my`);
    return res.data.data;
};

export const createGoal = async (projectId, data) => {
    const res = await api.post(`/projects/${projectId}/goals`, data);
    return res.data.data;
};

export const updateGoal = async (projectId, goalId, data) => {
    const res = await api.patch(`/projects/${projectId}/goals/${goalId}`, data);
    return res.data.data;
};

export const deleteGoal = async (projectId, goalId) => {
    await api.delete(`/projects/${projectId}/goals/${goalId}`);
};

export const pinGoal = async (projectId, goalId) => {
    const res = await api.post(`/projects/${projectId}/goals/${goalId}/pin`);
    return res.data.data;
};

export const unpinGoal = async (projectId, goalId) => {
    await api.delete(`/projects/${projectId}/goals/${goalId}/pin`);
};

export const getGlobalGoals = async (params) => {
    const res = await api.get("/goals", { params });
    return res.data.data;
};