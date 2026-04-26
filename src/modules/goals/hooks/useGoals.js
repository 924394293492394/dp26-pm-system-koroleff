import { useState, useEffect, useRef, useCallback } from "react";
import { getGoals, getMyProjectGoals } from "../api";

export const useGoals = (projectId) => {
  const [goals, setGoals] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("all");

  const filtersRef = useRef({ page: 1, limit: 20 });

  const fetchAll = useCallback(async (params = {}) => {
    const merged = { ...filtersRef.current, ...params };
    const cleaned = Object.fromEntries(
      Object.entries(merged).filter(([, v]) => v !== undefined && v !== "")
    );
    filtersRef.current = merged;
    try {
      setLoading(true);
      const data = await getGoals(projectId, cleaned);
      setGoals(data?.data || []);
      setMeta(data?.meta || { total: 0, page: 1, limit: 20, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchMy = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyProjectGoals(projectId);
      setGoals(Array.isArray(data) ? data : []);
      setMeta({ total: 0, page: 1, limit: 20, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Единая точка обновления при смене режима или projectId
  const refetch = useCallback((params = {}) => {
    filtersRef.current = { page: 1, limit: 20 };
    if (viewMode === "my") {
      fetchMy();
    } else {
      fetchAll(params);
    }
  }, [viewMode, fetchAll, fetchMy]);

  useEffect(() => {
    filtersRef.current = { page: 1, limit: 20 };
    if (viewMode === "my") fetchMy();
    else fetchAll();
  }, [projectId, viewMode]);

  const updateLocal = (goalId, updates) =>
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, ...updates } : g));

  const removeLocal = (goalId) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
    setMeta(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
  };

  const addLocal = (goal) => {
    setGoals(prev => [goal, ...prev]);
    setMeta(prev => ({ ...prev, total: prev.total + 1 }));
  };

  return {
    goals, meta, loading,
    viewMode, setViewMode,
    fetch: fetchAll, refetch,
    updateLocal, removeLocal, addLocal,
  };
};