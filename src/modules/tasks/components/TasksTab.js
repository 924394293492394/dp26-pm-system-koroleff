import { Button, Input, Select, Space, Spin, Empty, Segmented, Badge, Tooltip } from "antd";
import {
  PlusOutlined, AppstoreOutlined, UnorderedListOutlined,
  UserOutlined, CheckSquareOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { useTasks } from "../hooks/useTasks";
import { TASK_STATUS_CONFIG } from "./TaskStatusTag";
import { PRIORITY_CONFIG } from "./TaskPriorityBadge";
import TaskCard from "./TaskCard";
import TaskBoard from "./TaskBoard";
import CreateTaskModal from "./CreateTaskModal";
import TaskDetailsDrawer from "./TaskDetailsDrawer";

const TasksTab = ({ projectId, currentUserRole, currentUserId, onTaskCountChange }) => {
  const { tasks, loading, fetch, updateLocal, removeLocal, addLocal } = useTasks(projectId);

  const [view, setView] = useState("board");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const canCreate = ["OWNER", "MANAGER", "MEMBER"].includes(currentUserRole);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  };

  const handleUpdate = (updated) => {
    updateLocal(updated.id, updated);
    setSelectedTask(p => ({ ...p, ...updated }));
  };

  const handleDelete = (taskId) => {
    removeLocal(taskId);
    setDrawerOpen(false);
    setSelectedTask(null);
    onTaskCountChange?.();
  };

  return (
    <div>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap",
      }}>
        <Space wrap>
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: "board", icon: <AppstoreOutlined />, label: "Доска" },
              { value: "list", icon: <UnorderedListOutlined />, label: "Список" },
            ]}
          />

          <Input.Search
            placeholder="Поиск задач..."
            allowClear
            style={{ width: 200 }}
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
        </Space>

        {canCreate && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateOpen(true)}
          >
            Создать задачу
          </Button>
        )}
      </div>
      
      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}><Spin size="large" /></div>
      ) : tasks.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Задач пока нет"
          style={{ padding: "40px 0" }}
        >
          {canCreate && (
            <Button type="primary" onClick={() => setCreateOpen(true)}>
              Создать первую задачу
            </Button>
          )}
        </Empty>
      ) : view === "board" ? (
        <TaskBoard tasks={tasks} onTaskClick={handleTaskClick} />
      ) : (
        <div>
          {tasks.map(t => (
            <TaskCard
              key={t.id}
              task={t}
              projectId={projectId}
              onClick={() => handleTaskClick(t)}
            />
          ))}
        </div>
      )}

      <CreateTaskModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        projectId={projectId}
        onSuccess={task => {
          addLocal(task);
          setCreateOpen(false);
          onTaskCountChange?.();
        }}
      />

      <TaskDetailsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        task={selectedTask}
        projectId={projectId}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default TasksTab;