import {
  Button, Input, Select, Empty, Spin, Typography,
  Pagination, Segmented, Badge,
} from "antd";
import { PlusOutlined, StarFilled, AimOutlined, UserOutlined } from "@ant-design/icons";
import { useState } from "react";
import { pinGoal, unpinGoal } from "../api";
import { useGoals } from "../hooks/useGoals";
import { STATUS_CONFIG } from "./GoalStatusTag";
import GoalCard from "./GoalCard";
import CreateGoalModal from "./CreateGoalModal";
import GoalDetailsDrawer from "./GoalDetailsDrawer";

const { Text } = Typography;

const GoalsTab = ({ projectId, currentUserRole, currentUserId, onGoalCountChange }) => {
  const {
    goals, meta, loading,
    viewMode, setViewMode,
    fetch, updateLocal, removeLocal, addLocal,
  } = useGoals(projectId);

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const canCreate = ["OWNER", "MANAGER", "MEMBER"].includes(currentUserRole);

  // Фильтрация на клиенте для "закреплённые"
  const displayGoals = viewMode === "pinned"
    ? goals.filter(g => g.isPinned)
    : goals;

  const pinnedCount = goals.filter(g => g.isPinned).length;

  const handlePin = async (goalId, isPinned) => {
    updateLocal(goalId, { isPinned: !isPinned });
    if (selectedGoal?.id === goalId) {
      setSelectedGoal(p => ({ ...p, isPinned: !isPinned }));
    }
    try {
      isPinned
        ? await unpinGoal(projectId, goalId)
        : await pinGoal(projectId, goalId);
    } catch {
      updateLocal(goalId, { isPinned });
      if (selectedGoal?.id === goalId) setSelectedGoal(p => ({ ...p, isPinned }));
    }
  };

  const handleGoalClick = (goal) => {
    setSelectedGoal(goal);
    setDrawerOpen(true);
  };

  const handleUpdate = (updated) => {
    updateLocal(updated.id, updated);
    setSelectedGoal(p => ({ ...p, ...updated }));
  };

  const handleDelete = (goalId) => {
    removeLocal(goalId);
    setDrawerOpen(false);
    setSelectedGoal(null);
    onGoalCountChange?.();
  };

  return (
    <div>
      {/* Toolbar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        gap: 12,
        flexWrap: "wrap",
      }}>
        {/* Вкладки-фильтры */}
        <Segmented
          value={viewMode}
          onChange={v => setViewMode(v)}
          options={[
            {
              value: "all",
              label: "Все",
              icon: <AimOutlined />,
            },
            {
              value: "my",
              label: "Мои",
              icon: <UserOutlined />,
            },
            {
              value: "pinned",
              label: (
                <span>
                  <StarFilled style={{ color: "#faad14", marginRight: 4 }} />
                  Закреплённые
                  {pinnedCount > 0 && (
                    <Badge
                      count={pinnedCount}
                      size="small"
                      style={{ marginLeft: 4, background: "#faad14" }}
                    />
                  )}
                </span>
              ),
            },
          ]}
        />

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Input.Search
            placeholder="Поиск..."
            allowClear
            style={{ width: 200 }}
            onSearch={v => fetch({ search: v || undefined, page: 1 })}
            onChange={e => !e.target.value && fetch({ search: undefined, page: 1 })}
          />
          <Select
            placeholder="Статус"
            allowClear
            style={{ width: 160 }}
            onChange={v => fetch({ status: v || undefined, page: 1 })}
            options={Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({
              value, label,
            }))}
          />
          {canCreate && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateOpen(true)}
            >
              Создать цель
            </Button>
          )}
        </div>
      </div>

      {/* Контент */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <Spin size="large" />
        </div>
      ) : displayGoals.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            viewMode === "pinned"
              ? "Нет закреплённых целей — нажмите ⭐ на карточке"
              : viewMode === "my"
                ? "Нет ваших целей (созданных или назначенных)"
                : "Целей пока нет"
          }
          style={{ padding: "40px 0" }}
        >
          {viewMode === "all" && canCreate && (
            <Button type="primary" onClick={() => setCreateOpen(true)}>
              Создать первую цель
            </Button>
          )}
        </Empty>
      ) : (
        <>
          {viewMode === "all" && goals.some(g => g.isPinned) && (
            <>
              <Text type="secondary" style={{
                fontSize: 11, fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.06em",
                display: "block", marginBottom: 8,
              }}>
                ⭐ Закреплённые
              </Text>
              {goals.filter(g => g.isPinned).map(g => (
                <GoalCard
                  key={g.id}
                  goal={g}
                  onClick={() => handleGoalClick(g)}
                  onPin={handlePin}
                />
              ))}
              <Text type="secondary" style={{
                fontSize: 11, fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.06em",
                display: "block", margin: "16px 0 8px",
              }}>
                Остальные
              </Text>
              {goals.filter(g => !g.isPinned).map(g => (
                <GoalCard
                  key={g.id}
                  goal={g}
                  onClick={() => handleGoalClick(g)}
                  onPin={handlePin}
                />
              ))}
            </>
          )}

          {(viewMode !== "all" || !goals.some(g => g.isPinned)) &&
            displayGoals.map(g => (
              <GoalCard
                key={g.id}
                goal={g}
                onClick={() => handleGoalClick(g)}
                onPin={handlePin}
              />
            ))
          }

          {viewMode !== "pinned" && meta.totalPages > 1 && (
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

      {/* Модалы */}
      <CreateGoalModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        projectId={projectId}
        onSuccess={goal => {
          addLocal(goal);
          setCreateOpen(false);
          onGoalCountChange?.();
        }}
      />

      <GoalDetailsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        goal={selectedGoal}
        projectId={projectId}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onPin={handlePin}
      />
    </div>
  );
};

export default GoalsTab;