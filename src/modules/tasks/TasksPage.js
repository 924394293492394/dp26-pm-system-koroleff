import { useState, useCallback, useRef, useEffect } from "react";
import {
  Typography, Tabs, Space, Input, Select, Spin,
  Empty, Pagination, Segmented, Badge,
} from "antd";
import { CheckSquareOutlined, UserOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getGlobalTasks } from "./api";
import { TASK_STATUS_CONFIG } from "./components/TaskStatusTag";
import { PRIORITY_CONFIG } from "./components/TaskPriorityBadge";
import TaskCard from "./components/TaskCard";
import TaskDetailsDrawer from "./components/TaskDetailsDrawer";
import { getMyMembership } from "../projects/api";
import { useAuth } from "../../context/AuthContext";

const { Title, Text } = Typography;

const useGlobalTasks = (myOnly) => {
  const [tasks, setTasks] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const filtersRef = useRef({ page: 1, limit: 20 });

  const fetch = useCallback(async (params = {}) => {
    const merged = { ...filtersRef.current, ...params, myOnly };
    const cleaned = Object.fromEntries(
      Object.entries(merged).filter(([, v]) => v !== undefined && v !== "")
    );
    filtersRef.current = merged;
    try {
      setLoading(true);
      const data = await getGlobalTasks(cleaned);
      setTasks(data?.data || []);
      setMeta(data?.meta || { total: 0, page: 1, limit: 20, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [myOnly]);

  useEffect(() => {
    filtersRef.current = { page: 1, limit: 20 };
    fetch();
  }, [myOnly]);

  const updateLocal = (taskId, updates) =>
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  const removeLocal = (taskId) =>
    setTasks(prev => prev.filter(t => t.id !== taskId));

  return { tasks, meta, loading, fetch, updateLocal, removeLocal };
};

const useProjectRole = (projectId) => {
  const [role, setRole] = useState(null);
  const prev = useRef(null);
  useEffect(() => {
    if (!projectId || projectId === prev.current) return;
    prev.current = projectId;
    getMyMembership(projectId)
      .then(m => setRole(m?.role || "VIEWER"))
      .catch(() => setRole("VIEWER"));
  }, [projectId]);
  return role;
};

const TasksSection = ({ myOnly }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tasks, meta, loading, fetch, updateLocal, removeLocal } = useGlobalTasks(myOnly);

  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const userRole = useProjectRole(drawerOpen ? selected?.projectId : null);
  const currentUserId = user?.id || user?.userId;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <Input.Search
          placeholder="Поиск задач..."
          allowClear
          style={{ width: 220 }}
          onSearch={v => fetch({ search: v || undefined, page: 1 })}
          onChange={e => !e.target.value && fetch({ search: undefined, page: 1 })}
        />
        <Select
          placeholder="Статус"
          allowClear
          style={{ width: 150 }}
          onChange={v => fetch({ status: v || undefined, page: 1 })}
          options={Object.entries(TASK_STATUS_CONFIG).map(([v, { label }]) => ({ value: v, label }))}
        />
        <Select
          placeholder="Приоритет"
          allowClear
          style={{ width: 140 }}
          onChange={v => fetch({ priority: v || undefined, page: 1 })}
          options={Object.entries(PRIORITY_CONFIG).map(([v, { label }]) => ({ value: v, label }))}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}><Spin size="large" /></div>
      ) : tasks.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Задач не найдено" />
      ) : (
        <>
          {tasks.map(t => (
            <TaskCard
              key={t.id}
              task={{ ...t, project: t.project }}
              onClick={() => { setSelected(t); setDrawerOpen(true); }}
            />
          ))}
          {meta.totalPages > 1 && (
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <Pagination
                current={meta.page}
                total={meta.total}
                pageSize={meta.limit}
                showSizeChanger={false}
                onChange={page => fetch({ page })}
              />
            </div>
          )}
        </>
      )}

      {selected && (
        <TaskDetailsDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          task={selected}
          projectId={selected?.projectId}
          currentUserId={currentUserId}
          currentUserRole={userRole || "VIEWER"}
          onUpdate={updated => {
            updateLocal(updated.id, updated);
            setSelected(p => ({ ...p, ...updated }));
          }}
          onDelete={taskId => {
            removeLocal(taskId);
            setDrawerOpen(false);
            setSelected(null);
          }}
          extraActions={
            selected?.projectId && (
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 12px", background: "#f0f5ff",
                  border: "1px solid #d6e4ff", borderRadius: 6,
                  cursor: "pointer",
                }}
                onClick={() => {
                  setDrawerOpen(false);
                  navigate(`/projects/${selected.projectId}?tab=tasks`);
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#d6e4ff"}
                onMouseLeave={e => e.currentTarget.style.background = "#f0f5ff"}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "#8c8c8c", marginBottom: 1 }}>Проект</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#2f54eb" }}>
                    📁 {selected.project?.name || "Открыть проект"}
                  </div>
                </div>
                <span style={{ color: "#2f54eb", fontSize: 14 }}>→</span>
              </div>
            )
          }
        />
      )}
    </div>
  );
};

const TasksPage = () => (
  <div>
    <div style={{ marginBottom: 20 }}>
      <Title level={3} style={{ margin: 0 }}>
        <CheckSquareOutlined style={{ marginRight: 8 }} />
        Задачи
      </Title>
      <Text type="secondary">Задачи по всем вашим проектам</Text>
    </div>
    <Tabs
      items={[
        { key: "my", label: <Space><UserOutlined />Мои задачи</Space>, children: <TasksSection myOnly={true} /> },
        { key: "all", label: <Space><CheckSquareOutlined />Все задачи</Space>, children: <TasksSection myOnly={false} /> },
      ]}
    />
  </div>
);

export default TasksPage;