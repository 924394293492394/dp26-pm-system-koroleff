import { useState, useCallback, useRef, useEffect } from "react";
import {
    Typography, Tabs, Space, Input, Select,
    Spin, Empty, Pagination, Segmented, Badge,
} from "antd";
import {
    AimOutlined, StarFilled, UserOutlined,
    ArrowRightOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getGlobalGoals, pinGoal, unpinGoal } from "./api";
import { getMyMembership } from "../projects/api";
import { STATUS_CONFIG } from "./components/GoalStatusTag";
import GoalCard from "./components/GoalCard";
import GoalDetailsDrawer from "./components/GoalDetailsDrawer";
import { useAuth } from "../../context/AuthContext";

const { Title, Text } = Typography;

// ── Хук данных ───
const useGlobalGoals = (myOnly) => {
    const [goals, setGoals] = useState([]);
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
            const data = await getGlobalGoals(cleaned);
            setGoals(data?.data || []);
            setMeta(data?.meta || { total: 0, page: 1, limit: 20, totalPages: 1 });
        } finally {
            setLoading(false);
        }
    }, [myOnly]);

    useEffect(() => {
        filtersRef.current = { page: 1, limit: 20 };
        fetch();
    }, [myOnly]);

    const updateLocal = (goalId, updates) =>
        setGoals(prev => prev.map(g => g.id === goalId ? { ...g, ...updates } : g));

    const removeLocal = (goalId) =>
        setGoals(prev => prev.filter(g => g.id !== goalId));

    return { goals, meta, loading, fetch, updateLocal, removeLocal };
};

const useProjectRole = (projectId) => {
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(false);
    const prevProjectId = useRef(null);

    useEffect(() => {
        if (!projectId || projectId === prevProjectId.current) return;
        prevProjectId.current = projectId;

        setLoading(true);
        setRole(null);

        getMyMembership(projectId)
            .then(m => setRole(m?.role || "VIEWER"))
            .catch(() => setRole("VIEWER"))
            .finally(() => setLoading(false));
    }, [projectId]);

    return { role, loading };
};

const GoalsSection = ({ myOnly }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { goals, meta, loading, fetch, updateLocal, removeLocal } = useGlobalGoals(myOnly);

    const [viewMode, setViewMode] = useState("all");
    const [selected, setSelected] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Реальная роль текущего пользователя в проекте выбранной цели
    const { role: userRoleInProject, loading: roleLoading } = useProjectRole(
        drawerOpen ? selected?.project?.id : null
    );

    const displayGoals = viewMode === "pinned" ? goals.filter(g => g.isPinned) : goals;
    const pinnedCount = goals.filter(g => g.isPinned).length;

    const currentUserId = user?.id || user?.userId;

    const handlePin = async (goalId, isPinned) => {
        updateLocal(goalId, { isPinned: !isPinned });
        if (selected?.id === goalId) setSelected(p => ({ ...p, isPinned: !isPinned }));
        const targetGoal = goals.find(g => g.id === goalId);
        try {
            if (targetGoal?.project?.id) {
                isPinned
                    ? await unpinGoal(targetGoal.project.id, goalId)
                    : await pinGoal(targetGoal.project.id, goalId);
            }
        } catch {
            updateLocal(goalId, { isPinned });
            if (selected?.id === goalId) setSelected(p => ({ ...p, isPinned }));
        }
    };

    const handleGoalClick = (goal) => {
        setSelected(goal);
        setDrawerOpen(true);
    };

    return (
        <div>
            {/* Фильтры */}
            <div style={{
                display: "flex", justifyContent: "space-between",
                marginBottom: 16, flexWrap: "wrap", gap: 10,
            }}>
                <Segmented
                    value={viewMode}
                    onChange={setViewMode}
                    options={[
                        { value: "all", label: "Все", icon: <AimOutlined /> },
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
                <Space wrap>
                    <Input.Search
                        placeholder="Поиск целей..."
                        allowClear
                        style={{ width: 220 }}
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
                </Space>
            </div>

            {/* Контент */}
            {loading ? (
                <div style={{ textAlign: "center", padding: 60 }}><Spin size="large" /></div>
            ) : displayGoals.length === 0 ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                        viewMode === "pinned" ? "Нет закреплённых целей"
                            : myOnly ? "У вас нет целей"
                                : "Целей не найдено"
                    }
                />
            ) : (
                <>
                    {displayGoals.map(g => (
                        <GoalCard
                            key={g.id}
                            goal={g}
                            showProject
                            onClick={() => handleGoalClick(g)}
                            onPin={handlePin}
                        />
                    ))}
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

            {/* Drawer с реальными правами */}
            {selected && (
                <GoalDetailsDrawer
                    open={drawerOpen}
                    onClose={() => { setDrawerOpen(false); }}
                    goal={selected}
                    projectId={selected?.project?.id}
                    currentUserId={currentUserId}
                    currentUserRole={roleLoading ? null : (userRoleInProject || "VIEWER")}
                    roleLoading={roleLoading}
                    extraActions={
                        selected?.project?.id && (
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "8px 12px",
                                background: "#f0f5ff",
                                border: "1px solid #d6e4ff",
                                borderRadius: 6,
                                cursor: "pointer",
                                transition: "background 0.15s",
                            }}
                                onClick={() => {
                                    setDrawerOpen(false);
                                    navigate(`/projects/${selected.project.id}?tab=goals`);
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "#d6e4ff"}
                                onMouseLeave={e => e.currentTarget.style.background = "#f0f5ff"}
                            >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 11, color: "#8c8c8c", marginBottom: 1 }}>
                                        Проект
                                    </div>
                                    <div style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: "#2f54eb",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}>
                                        📁 {selected.project?.name}
                                    </div>
                                </div>
                                <ArrowRightOutlined style={{ color: "#2f54eb", fontSize: 14, flexShrink: 0 }} />
                            </div>
                        )
                    }
                    onUpdate={updated => {
                        updateLocal(updated.id, updated);
                        setSelected(p => ({ ...p, ...updated }));
                    }}
                    onDelete={goalId => {
                        removeLocal(goalId);
                        setDrawerOpen(false);
                        setSelected(null);
                    }}
                    onPin={handlePin}
                />
            )}
        </div>
    );
};

const GoalsPage = () => (
    <div>
        <div style={{ marginBottom: 20 }}>
            <Title level={3} style={{ margin: 0 }}>
                <AimOutlined style={{ marginRight: 8 }} />
                Цели
            </Title>
            <Text type="secondary">Цели по всем вашим проектам</Text>
        </div>
        <Tabs
            items={[
                {
                    key: "my",
                    label: <Space><UserOutlined />Мои цели</Space>,
                    children: <GoalsSection myOnly={true} />,
                },
                {
                    key: "all",
                    label: <Space><AimOutlined />Все цели</Space>,
                    children: <GoalsSection myOnly={false} />,
                },
            ]}
        />
    </div>
);

export default GoalsPage;