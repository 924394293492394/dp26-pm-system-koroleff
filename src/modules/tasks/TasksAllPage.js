import {
  Breadcrumb, Segmented, Input, Select, Pagination,
  Spin, Empty, Typography, Tag, Space, Button,
} from "antd";
import { ArrowLeftOutlined, AppstoreOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getTasks } from "./api";
import { getProjectById } from "../projects/api";
import TaskCard from "./components/TaskCard";
import TaskDetailsDrawer from "./components/TaskDetailsDrawer";
import { TASK_STATUS_CONFIG } from "./components/TaskStatusTag";
import { PRIORITY_CONFIG } from "./components/TaskPriorityBadge";
import { useAuth } from "../../context/AuthContext";

const { Title, Text } = Typography;

const TasksAllPage = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 24, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Параметры фильтрации из URL
  const [status, setStatus] = useState(searchParams.get("status") || undefined);
  const [priority, setPriority] = useState(undefined);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Загрузить проект (для роли)
  useEffect(() => {
    getProjectById(projectId).then(setProject).catch(() => { });
  }, [projectId]);

  // Загрузить задачи
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = { page, limit: 24, status, priority, search: search || undefined };
        const data = await getTasks(projectId, params);
        setTasks(data?.data || []);
        setMeta(data?.meta || { total: 0, page: 1, limit: 24, totalPages: 1 });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId, page, status, priority, search]);

  const handleStatusChange = (val) => {
    setStatus(val || undefined);
    setPage(1);
    setSearchParams(val ? { status: val } : {});
  };

  const handleTaskClick = (task) => {
    setSelected(task);
    setDrawerOpen(true);
  };

  const handleUpdate = (updated) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t));
    setSelected(p => ({ ...p, ...updated }));
  };

  const handleDelete = (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setDrawerOpen(false);
  };

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Хлебные крошки */}
      <Breadcrumb style={{ marginBottom: 16 }} items={[
        { title: <span style={{ cursor: "pointer" }} onClick={() => navigate("/projects")}>Проекты</span> },
        { title: <span style={{ cursor: "pointer" }} onClick={() => navigate(`/projects/${projectId}?tab=tasks`)}>{project?.name || "Проект"}</span> },
        { title: "Все задачи" },
      ]} />

      {/* Шапка */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/projects/${projectId}?tab=tasks`)} />
        <div>
          <Title level={4} style={{ margin: 0 }}>
            <AppstoreOutlined style={{ marginRight: 8, color: "#1677ff" }} />
            Все задачи проекта
          </Title>
          {status && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Фильтр по статусу: <Tag color={TASK_STATUS_CONFIG[status]?.color}>{TASK_STATUS_CONFIG[status]?.label}</Tag>
            </Text>
          )}
        </div>
      </div>

      {/* Фильтры */}
      <div style={{
        display: "flex", gap: 10, flexWrap: "wrap",
        marginBottom: 20, padding: "12px 16px",
        background: "#fafafa", borderRadius: 10,
        border: "1px solid #f0f0f0",
      }}>
        <Input.Search
          placeholder="Поиск задач..."
          allowClear
          style={{ width: 220 }}
          value={search}
          onChange={e => setSearch(e.target.value)}
          onSearch={() => setPage(1)}
        />
        <Select
          placeholder="Статус"
          allowClear
          value={status}
          style={{ width: 160 }}
          onChange={handleStatusChange}
          options={Object.entries(TASK_STATUS_CONFIG).map(([v, { label }]) => ({ value: v, label }))}
        />
        <Select
          placeholder="Приоритет"
          allowClear
          style={{ width: 150 }}
          onChange={v => { setPriority(v || undefined); setPage(1); }}
          options={Object.entries(PRIORITY_CONFIG).map(([v, { label }]) => ({ value: v, label }))}
        />
        <Text type="secondary" style={{ alignSelf: "center", marginLeft: "auto", fontSize: 12 }}>
          Найдено: <strong>{meta.total}</strong>
        </Text>
      </div>

      {/* Контент */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}><Spin size="large" /></div>
      ) : tasks.length === 0 ? (
        <Empty description="Задач не найдено" style={{ padding: "60px 0" }} />
      ) : (
        <>
          {/* ── GRID: несколько карточек в ряд ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 12,
          }}>
            {tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                compact
                onClick={() => handleTaskClick(task)}
              />
            ))}
          </div>

          {/* Пагинация */}
          {meta.totalPages > 1 && (
            <div style={{ textAlign: "center", marginTop: 28 }}>
              <Pagination
                current={meta.page}
                total={meta.total}
                pageSize={meta.limit}
                showSizeChanger={false}
                showTotal={(total) => `Всего ${total} задач`}
                onChange={setPage}
              />
            </div>
          )}
        </>
      )}

      {/* Drawer деталей */}
      <TaskDetailsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        task={selected}
        projectId={projectId}
        currentUserId={user?.id || user?.userId}
        currentUserRole={project?.role}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default TasksAllPage;