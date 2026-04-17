import { useEffect, useState } from "react";
import { getMyProjects, getAllProjects } from "../api";

export const useProjects = () => {
  const [mode, setMode] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("createdAt_desc");
  const [isArchived, setIsArchived] = useState(false);
  const [page, setPage] = useState(1);

  const [projects, setProjects] = useState([]);
  const [meta, setMeta] = useState({ total: 0, currentPage: 1, perPage: 10 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const delay = setTimeout(async () => {
      try {
        setLoading(true);
        const apiCall = mode === "mine" ? getMyProjects : getAllProjects;
        const data = await apiCall({ search, isArchived, sort, page });
        if (!cancelled) {
          setProjects(data?.projects || []);
          setMeta(data?.meta || {});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, search ? 400 : 0);

    return () => {
      cancelled = true;
      clearTimeout(delay);
    };
  }, [mode, search, sort, isArchived, page]); // каждое изменение = новый запрос

  return {
    projects, meta, loading,
    setMode, setSearch, setSort,
    setIsArchived,
    setPage,
  };
};