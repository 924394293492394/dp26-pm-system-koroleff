import { useState, useEffect, useRef, useCallback } from "react";
import { getTasks } from "../api";

export const useTasks = (projectId) => {
  const [tasks, setTasks] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 50, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const filtersRef = useRef({ page: 1, limit: 50 });

  const fetch = useCallback(async (params = {}) => {
    const merged = { ...filtersRef.current, ...params };
    const cleaned = Object.fromEntries(
      Object.entries(merged).filter(([, v]) => v !== undefined && v !== "")
    );
    filtersRef.current = merged;
    try {
      setLoading(true);
      const data = await getTasks(projectId, cleaned);
      setTasks(data?.data || []);
      setMeta(data?.meta || { total: 0, page: 1, limit: 50, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    filtersRef.current = { page: 1, limit: 50 };
    fetch();
  }, [projectId]);

  const updateLocal = (taskId, updates) =>
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));

  const removeLocal = (taskId) =>
    setTasks(prev => prev.filter(t => t.id !== taskId));

  const addLocal = (task) =>
    setTasks(prev => [task, ...prev]);

  return { tasks, meta, loading, fetch, updateLocal, removeLocal, addLocal };
};