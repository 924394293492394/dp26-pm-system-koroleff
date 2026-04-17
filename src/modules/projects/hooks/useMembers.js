import { useState, useEffect, useCallback } from "react";
import {
  getMembers, addMember, updateMemberRole,
  removeMember, leaveProject,
} from "../api";

export const useMembers = (projectId) => {
  const [members, setMembers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [filters, setFilters] = useState({ page: 1, limit: 10, search: "", role: undefined });

  const fetch = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const merged = { ...filters, ...params };
      const data = await getMembers(projectId, merged);
      setMembers(data?.members || []);
      setMeta(data?.meta || {});
      setFilters(merged);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetch(); }, [projectId]);

  const add = async (data) => {
    setSaving(true);
    try {
      await addMember(projectId, data);
      await fetch();
      return true;
    } catch (err) {
      return err?.response?.data?.error?.message || "Ошибка добавления";
    } finally {
      setSaving(false);
    }
  };

  const updateRole = async (userId, role) => {
    setSaving(true);
    try {
      await updateMemberRole(projectId, userId, { role });
      setMembers((prev) =>
        prev.map((m) => (m.userId === userId ? { ...m, role } : m))
      );
      return true;
    } catch (err) {
      return err?.response?.data?.error?.message || "Ошибка изменения роли";
    } finally {
      setSaving(false);
    }
  };

  const remove = async (userId) => {
    setSaving(true);
    try {
      await removeMember(projectId, userId);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      setMeta((prev) => ({ ...prev, total: prev.total - 1 }));
      return true;
    } catch (err) {
      return err?.response?.data?.error?.message || "Ошибка удаления";
    } finally {
      setSaving(false);
    }
  };

  const leave = async () => {
    await leaveProject(projectId);
  };

  return { members, meta, loading, saving, fetch, add, updateRole, remove, leave };
};