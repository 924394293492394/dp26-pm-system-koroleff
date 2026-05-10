import {
  Typography, Row, Col, Card, Tag, Space, Avatar,
  Tooltip, Progress, Skeleton, Badge, Empty, Button,
} from "antd";
import {
  CheckSquareOutlined, AimOutlined, ProjectOutlined,
  ClockCircleOutlined, FireOutlined, RiseOutlined,
  TrophyOutlined, CalendarOutlined, ArrowRightOutlined,
  ExclamationCircleOutlined, TeamOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardSummary } from "../modules/dashboard/api";
import { useAuth } from "../context/AuthContext";

const { Title, Text } = Typography;

const PRIORITY_COLOR = {
  CRITICAL: "#ff4d4f",
  HIGH: "#fa8c16",
  MEDIUM: "#1677ff",
  LOW: "#8c8c8c",
};

const PRIORITY_LABEL = {
  CRITICAL: "Критический",
  HIGH: "Высокий",
  MEDIUM: "Средний",
  LOW: "Низкий",
};

const STATUS_COLOR = {
  TODO: "#d9d9d9",
  IN_PROGRESS: "#1677ff",
  REVIEW: "#faad14",
  DONE: "#52c41a",
};

const STATUS_LABEL = {
  TODO: "К выполнению",
  IN_PROGRESS: "В работе",
  REVIEW: "На проверке",
  DONE: "Готово",
};

const GOAL_STATUS_COLOR = {
  PLANNED: "#faad14",
  IN_PROGRESS: "#1677ff",
  COMPLETED: "#52c41a",
  CANCELLED: "#d9d9d9",
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 6) return "Доброй ночи";
  if (h < 12) return "Доброе утро";
  if (h < 18) return "Добрый день";
  return "Добрый вечер";
};

const StatWidget = ({ icon, label, value, color, sub, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: "#fff",
      borderRadius: 14,
      border: "1px solid #f0f0f0",
      padding: "18px 20px",
      cursor: onClick ? "pointer" : "default",
      transition: "all 0.2s",
      flex: 1,
      minWidth: 130,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    }}
    onMouseEnter={e => onClick && (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)")}
    onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)")}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>{label}</Text>
        <Text style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, color: color || "#262626" }}>
          {value ?? 0}
        </Text>
        {sub && <Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 4 }}>{sub}</Text>}
      </div>
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: `${color || "#1677ff"}15`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 20,
        color: color || "#1677ff",
        flexShrink: 0,
      }}>
        {icon}
      </div>
    </div>
  </div>
);

const TaskItem = ({ task, onClick }) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 0",
        borderBottom: "1px solid #f5f5f5",
        cursor: "pointer",
        transition: "background 0.15s",
        borderRadius: 4,
      }}
      onMouseEnter={e => e.currentTarget.style.background = "#f9fbff"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      {/* Индикатор приоритета */}
      <div style={{
        width: 4,
        height: 36,
        borderRadius: 2,
        background: PRIORITY_COLOR[task.priority] || "#d9d9d9",
        flexShrink: 0,
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <Text strong style={{
          fontSize: 13,
          display: "block",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {task.title}
        </Text>
        <Space size={6} style={{ marginTop: 2 }}>
          <Tag
            color={STATUS_COLOR[task.status]}
            style={{ margin: 0, fontSize: 10, lineHeight: "16px", padding: "0 5px" }}
          >
            {STATUS_LABEL[task.status]}
          </Tag>
          {task.project && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              📁 {task.project.name}
            </Text>
          )}
        </Space>
      </div>

      <div style={{ flexShrink: 0, textAlign: "right" }}>
        {task.dueDate ? (
          <Text style={{
            fontSize: 11,
            color: isOverdue ? "#ff4d4f" : "#8c8c8c",
            display: "block",
          }}>
            {isOverdue ? "⚠ " : ""}
            {new Date(task.dueDate).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}
          </Text>
        ) : (
          <Text type="secondary" style={{ fontSize: 11 }}>Без срока</Text>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const displayName = user?.profile?.firstName || user?.login || "пользователь";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getDashboardSummary();
        setData(res);
      } catch {

      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const today = new Date().toLocaleDateString("ru-RU", {
    weekday: "long", day: "numeric", month: "long"
  });

  return (
    <div>

      <div style={{
        background: "linear-gradient(135deg, #0d1f35 0%, #1a3a5c 60%, #0d2740 100%)",
        borderRadius: 16,
        padding: "28px 32px",
        marginBottom: 24,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      }}>
        <div style={{
          position: "absolute", right: -40, top: -40,
          width: 200, height: 200, borderRadius: "50%",
          background: "rgba(22,119,255,0.08)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", right: 120, bottom: -60,
          width: 150, height: 150, borderRadius: "50%",
          background: "rgba(22,119,255,0.05)", pointerEvents: "none",
        }} />

        <div style={{ position: "relative" }}>
          <Title level={3} style={{ color: "#fff", margin: 0 }}>
            {getGreeting()}, {displayName}! 👋
          </Title>
          <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, display: "block", marginTop: 4 }}>
            {today.charAt(0).toUpperCase() + today.slice(1)}
          </Text>
          {data?.overdueCount > 0 && (
            <div style={{
              marginTop: 10,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,77,79,0.15)",
              border: "1px solid rgba(255,77,79,0.3)",
              borderRadius: 20,
              padding: "4px 12px",
            }}>
              <ExclamationCircleOutlined style={{ color: "#ff7875", fontSize: 13 }} />
              <Text style={{ color: "#ff7875", fontSize: 12 }}>
                {data.overdueCount} просроченных задач
              </Text>
            </div>
          )}
        </div>

        {/* Мини-статистика в шапке */}
        {data && (
          <div style={{ display: "flex", gap: 20, position: "relative" }}>
            {[
              { label: "Выполнено за месяц", value: data.completedLast30, color: "#52c41a" },
              { label: "Активных задач", value: data.totalActive, color: "#1677ff" },
              { label: "Активных целей", value: data.myActiveGoals?.length, color: "#faad14" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <Text style={{ color, fontSize: 28, fontWeight: 800, display: "block", lineHeight: 1 }}>
                  {value ?? 0}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, display: "block", marginTop: 4 }}>
                  {label}
                </Text>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Системная статистика (только Admin) ── */}
      {isAdmin && data?.systemStats && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <TeamOutlined style={{ color: "#722ed1" }} />
            <Text strong style={{ fontSize: 14, color: "#722ed1" }}>Системная статистика</Text>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <StatWidget icon={<TeamOutlined />} label="Пользователей" value={data.systemStats.usersCount} color="#722ed1" />
            <StatWidget icon={<ProjectOutlined />} label="Проектов" value={data.systemStats.projectsCount} color="#1677ff" />
            <StatWidget icon={<CheckSquareOutlined />} label="Задач" value={data.systemStats.tasksCount} color="#13c2c2" />
            <StatWidget icon={<AimOutlined />} label="Целей" value={data.systemStats.goalsCount} color="#fa8c16" />
          </div>
        </div>
      )}

      <Row gutter={[16, 16]}>

        {/* ── Мои задачи ── */}
        <Col xs={24} lg={14}>
          <div style={{
            background: "#fff", borderRadius: 14,
            border: "1px solid #f0f0f0", overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)", height: "100%",
          }}>
            {/* Заголовок */}
            <div style={{
              padding: "16px 20px 12px",
              borderBottom: "1px solid #f5f5f5",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <Space size={8}>
                <CheckSquareOutlined style={{ color: "#1677ff", fontSize: 16 }} />
                <Text strong style={{ fontSize: 15 }}>Мои активные задачи</Text>
                {data && (
                  <Badge
                    count={data.totalActive}
                    style={{ background: "#1677ff", fontSize: 10 }}
                  />
                )}
              </Space>
              <Button
                type="link"
                size="small"
                icon={<ArrowRightOutlined />}
                onClick={() => navigate("/tasks")}
                style={{ padding: 0 }}
              >
                Все задачи
              </Button>
            </div>

            {/* Счётчики по статусам */}
            {data && (
              <div style={{
                display: "flex",
                padding: "10px 20px",
                gap: 8,
                borderBottom: "1px solid #f5f5f5",
              }}>
                {[
                  { key: "TODO", label: "К выполнению", color: "#d9d9d9" },
                  { key: "IN_PROGRESS", label: "В работе", color: "#1677ff" },
                  { key: "REVIEW", label: "На проверке", color: "#faad14" },
                ].map(({ key, label, color }) => (
                  <div key={key} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "4px 10px",
                    background: `${color}10`,
                    borderRadius: 20,
                    border: `1px solid ${color}40`,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block" }} />
                    <Text style={{ fontSize: 11, color }}>{label}</Text>
                    <Text style={{ fontSize: 12, fontWeight: 700, color }}>{data.tasksByStatus[key] || 0}</Text>
                  </div>
                ))}
              </div>
            )}

            {/* Список задач */}
            <div style={{ padding: "4px 20px 8px" }}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 5 }} style={{ padding: "12px 0" }} />
              ) : !data?.myActiveTasks?.length ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Нет активных задач"
                  style={{ padding: "24px 0" }}
                >
                  <Button type="primary" onClick={() => navigate("/projects")}>
                    К проектам
                  </Button>
                </Empty>
              ) : (
                data.myActiveTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onClick={() => navigate(`/projects/${task.projectId}/tasks/${task.id}`)}
                  />
                ))
              )}
            </div>
          </div>
        </Col>

        {/* ── Правая колонка ── */}
        <Col xs={24} lg={10}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Ближайшие дедлайны */}
            <div style={{
              background: "#fff", borderRadius: 14,
              border: "1px solid #f0f0f0",
              overflow: "hidden",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}>
              <div style={{
                padding: "16px 20px 12px",
                borderBottom: "1px solid #f5f5f5",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <Space size={8}>
                  <CalendarOutlined style={{ color: "#fa8c16", fontSize: 16 }} />
                  <Text strong style={{ fontSize: 15 }}>Дедлайны · 7 дней</Text>
                </Space>
              </div>

              <div style={{ padding: "8px 20px 12px" }}>
                {loading ? (
                  <Skeleton active paragraph={{ rows: 3 }} />
                ) : !data?.upcomingDeadlines?.length ? (
                  <div style={{ textAlign: "center", padding: "16px 0" }}>
                    <Text type="secondary" style={{ fontSize: 13 }}>✅ Дедлайнов в ближайшую неделю нет</Text>
                  </div>
                ) : (
                  data.upcomingDeadlines.map(task => {
                    const daysLeft = Math.ceil(
                      (new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    );
                    const urgentColor = daysLeft <= 1 ? "#ff4d4f" : daysLeft <= 3 ? "#fa8c16" : "#52c41a";
                    return (
                      <div
                        key={task.id}
                        onClick={() => navigate(`/projects/${task.projectId}/tasks/${task.id}`)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "9px 0",
                          borderBottom: "1px solid #f5f5f5",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: `${urgentColor}12`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 700, color: urgentColor, flexShrink: 0,
                        }}>
                          {daysLeft === 0 ? "!" : `${daysLeft}д`}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text strong style={{
                            fontSize: 13, display: "block",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {task.title}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            📁 {task.project?.name}
                          </Text>
                        </div>
                        <Text style={{ fontSize: 11, color: urgentColor, flexShrink: 0 }}>
                          {new Date(task.dueDate).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}
                        </Text>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Мои цели */}
            <div style={{
              background: "#fff", borderRadius: 14,
              border: "1px solid #f0f0f0", overflow: "hidden",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}>
              <div style={{
                padding: "16px 20px 12px",
                borderBottom: "1px solid #f5f5f5",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <Space size={8}>
                  <AimOutlined style={{ color: "#52c41a", fontSize: 16 }} />
                  <Text strong style={{ fontSize: 15 }}>Мои цели</Text>
                </Space>
                <Button
                  type="link" size="small"
                  icon={<ArrowRightOutlined />}
                  onClick={() => navigate("/goals")}
                  style={{ padding: 0 }}
                >
                  Все цели
                </Button>
              </div>

              <div style={{ padding: "8px 20px 12px" }}>
                {loading ? (
                  <Skeleton active paragraph={{ rows: 3 }} />
                ) : !data?.myActiveGoals?.length ? (
                  <div style={{ textAlign: "center", padding: "16px 0" }}>
                    <Text type="secondary" style={{ fontSize: 13 }}>Активных целей нет</Text>
                  </div>
                ) : (
                  data.myActiveGoals.map(goal => (
                    <div
                      key={goal.id}
                      onClick={() => navigate(`/projects/${goal.project?.id}`)}
                      style={{
                        padding: "10px 0",
                        borderBottom: "1px solid #f5f5f5",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <Text strong style={{
                          fontSize: 13, flex: 1,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          paddingRight: 8,
                        }}>
                          {goal.title}
                        </Text>
                        <Text style={{ fontSize: 11, color: GOAL_STATUS_COLOR[goal.status], flexShrink: 0, fontWeight: 600 }}>
                          {goal.progress}%
                        </Text>
                      </div>
                      <Progress
                        percent={goal.progress}
                        strokeColor={GOAL_STATUS_COLOR[goal.status]}
                        showInfo={false}
                        size="small"
                        style={{ margin: 0 }}
                      />
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          📁 {goal.project?.name}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {goal.doneTasks}/{goal.totalTasks} задач
                        </Text>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </Col>
      </Row>

      {/* ── Мои проекты ── */}
      <div style={{ marginTop: 16 }}>
        <div style={{
          background: "#fff", borderRadius: 14,
          border: "1px solid #f0f0f0", overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          <div style={{
            padding: "16px 20px 12px",
            borderBottom: "1px solid #f5f5f5",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <Space size={8}>
              <ProjectOutlined style={{ color: "#722ed1", fontSize: 16 }} />
              <Text strong style={{ fontSize: 15 }}>Мои проекты</Text>
            </Space>
            <Button
              type="link" size="small"
              icon={<ArrowRightOutlined />}
              onClick={() => navigate("/projects")}
              style={{ padding: 0 }}
            >
              Все проекты
            </Button>
          </div>

          <div style={{ padding: "12px 20px" }}>
            {loading ? (
              <Skeleton active paragraph={{ rows: 2 }} />
            ) : !data?.myProjects?.length ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Проектов нет" style={{ padding: "16px 0" }}>
                <Button type="primary" onClick={() => navigate("/projects")}>Перейти к проектам</Button>
              </Empty>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 12,
              }}>
                {data.myProjects.map(project => (
                  <div
                    key={project.id}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    style={{
                      padding: "14px 16px",
                      borderRadius: 10,
                      border: "1px solid #f0f0f0",
                      background: "#fafafa",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "#f0f7ff";
                      e.currentTarget.style.borderColor = "#91caff";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "#fafafa";
                      e.currentTarget.style.borderColor = "#f0f0f0";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <Text strong style={{ fontSize: 14, flex: 1, paddingRight: 8 }}>
                        {project.name}
                      </Text>
                      <Tag
                        style={{
                          margin: 0, fontSize: 10,
                          background: "#e6f4ff", color: "#1677ff",
                          border: "none",
                        }}
                      >
                        {project.role === "OWNER" ? "Владелец" :
                          project.role === "MANAGER" ? "Менеджер" :
                            project.role === "MEMBER" ? "Участник" : "Наблюдатель"}
                      </Tag>
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <CheckSquareOutlined style={{ marginRight: 4 }} />
                        {project.tasksCount} задач
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <AimOutlined style={{ marginRight: 4 }} />
                        {project.goalsCount} целей
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;