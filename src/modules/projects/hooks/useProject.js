import { useState, useEffect, useCallback } from "react";
import {
  getProjectById,
  updateProject,
  archiveProject,
  unarchiveProject,
  deleteProject,
} from "../api";

export const useProject = (id) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setProject(await getProjectById(id));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  const update = async (data) => {
    setSaving(true);
    try {
      const updated = await updateProject(id, data);
      setProject((p) => ({ ...p, ...updated }));
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  };

  const toggleArchive = async () => {
    setSaving(true);
    try {
      const updated = project.isArchived
        ? await unarchiveProject(id)
        : await archiveProject(id);
      setProject((p) => ({ ...p, ...updated }));
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    await deleteProject(id);
  };

  return { project, loading, saving, refetch: fetch, update, toggleArchive, remove };
};