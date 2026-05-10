import { Tag, Typography, Space, Tooltip } from "antd";
import { CalendarOutlined, CommentOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { ArrowsAltOutlined } from "@ant-design/icons";
import { Button } from "antd";
import TaskStatusTag from "./TaskStatusTag";
import TaskPriorityBadge from "./TaskPriorityBadge";
import UserBadge from "../../common/UserBadge";

const { Text } = Typography;

const BORDER_BY_STATUS = {
  TODO: "#d9d9d9",
  IN_PROGRESS: "#1677ff",
  REVIEW: "#faad14",
  DONE: "#52c41a",
};

const DoneOverlay = () => (
  <svg style={{
    position: "absolute", inset: 0, width: "100%", height: "100%",
    borderRadius: 8, pointerEvents: "none", opacity: 0.05,
  }} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="diag-task" width="10" height="10"
        patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="10" stroke="#666" strokeWidth="3" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#diag-task)" />
  </svg>
);

const TaskCardCompact = ({ task, onClick }) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
  const isDone = task.status === "DONE";
  const borderColor = BORDER_BY_STATUS[task.status] || "#d9d9d9";
  const commentsCount = task._count?.comments ?? 0;
  const deadlineLabel = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString("ru-RU")
    : null;

  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff",
        border: "1px solid #f0f0f0",
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: 8,
        padding: "12px 14px 10px",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        opacity: isDone ? 0.8 : 1,
        minHeight: 110,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        transition: "box-shadow 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.09)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      {isDone && <DoneOverlay />}

      {/* Строка 1: статус + overdue | приоритет — без align*/}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Space size={6} wrap>
          <TaskStatusTag status={task.status} short />
          {isOverdue && (
            <Tag color="error" style={{ margin: 0, fontSize: 10, padding: "0 5px" }}>⏰ Просрочена</Tag>
          )}
        </Space>
        <TaskPriorityBadge priority={task.priority} />
      </div>

      {/* Название — макс 2 строки */}
      <Text strong style={{
        fontSize: 13,
        lineHeight: "1.45",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        textDecoration: isDone ? "line-through" : "none",
        color: isDone ? "#8c8c8c" : "#262626",
      }}>
        {task.title}
      </Text>

      {/* Цель тег */}
      {task.goal && (
        <Text type="secondary" style={{
          fontSize: 11,
          display: "block",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          🎯 {task.goal.title}
        </Text>
      )}

      <div style={{
        marginTop: "auto",
        paddingTop: 6,
        borderTop: "1px solid #f5f5f5",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 4,
      }}>
        {/* Дедлайн — слева */}
        <Space size={4}>
          <CalendarOutlined style={{
            fontSize: 11,
            color: isOverdue ? "#ff4d4f" : deadlineLabel ? "#8c8c8c" : "#d9d9d9",
          }} />
          <Text style={{
            fontSize: 11,
            color: isOverdue ? "#ff4d4f" : "#8c8c8c",
            fontStyle: !deadlineLabel ? "italic" : "normal",
          }}>
            {deadlineLabel || "Дедлайн не указан"}
          </Text>
        </Space>

        {/* Аватарка + комментарии — справа */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {commentsCount > 0 && (
            <Space size={3} style={{ fontSize: 11 }}>
              <CommentOutlined style={{ color: "#1677ff", fontSize: 11 }} />
              <Text type="secondary" style={{ fontSize: 11 }}>{commentsCount}</Text>
            </Space>
          )}
          <UserBadge user={task.assignee} showLogin={false} avatarSize={22} emptyLabel="" />
        </div>
      </div>
    </div>
  );
};

const TaskCardStandard = ({ task, onClick, isBoard = false, projectId }) => {
  const navigate = useNavigate();
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
  const isDone = task.status === "DONE";
  const borderColor = BORDER_BY_STATUS[task.status] || "#d9d9d9";
  const commentsCount = task._count?.comments ?? 0;
  const deadlineLabel = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString("ru-RU")
    : null;

  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff",
        border: "1px solid #f0f0f0",
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: 8,
        padding: "12px 14px 11px",
        marginBottom: 8,
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        opacity: isDone ? 0.82 : 1,
        minHeight: 120,
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.09)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      {isDone && <DoneOverlay />}

{/* Строка 1: статус + overdue + цель | кнопка страницы + приоритет */}
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
  <Space size={6} wrap>
    <TaskStatusTag status={task.status} />
    {isOverdue && (
      <Tag color="error" style={{ margin: 0, fontSize: 11 }}>⏰ Просрочена</Tag>
    )}
    {task.goal && (
      <Tag
        color="blue"
        style={{
          margin: 0, fontSize: 11, maxWidth: 130,
          overflow: "hidden", textOverflow: "ellipsis",
          whiteSpace: "nowrap", verticalAlign: "middle",
        }}
        title={task.goal.title}
      >
        🎯 {task.goal.title}
      </Tag>
    )}
  </Space>

  {/* Правая часть: кнопка открытия страницы + приоритет */}
  <Space size={4} style={{ flexShrink: 0 }}>
    {projectId && (
      <Tooltip title="Открыть страницу задачи">
        <Button
          type="text"
          size="small"
          icon={<ArrowsAltOutlined style={{ fontSize: 11 }} />}
          onClick={e => {
            e.stopPropagation();
            navigate(`/projects/${projectId}/tasks/${task.id}`);
          }}
          style={{
            width: 22, height: 22, padding: 0,
            color: "#d9d9d9",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#1677ff"}
          onMouseLeave={e => e.currentTarget.style.color = "#d9d9d9"}
        />
      </Tooltip>
    )}
    <TaskPriorityBadge priority={task.priority} />
  </Space>
</div>

      {/* Строка 2: название — макс 2 строки */}
      <Text strong style={{
        fontSize: 13,
        lineHeight: "1.5",
        marginBottom: task.description ? 5 : 0,
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        textDecoration: isDone ? "line-through" : "none",
        color: isDone ? "#8c8c8c" : "#262626",
      }}>
        {task.title}
      </Text>

      {/* Строка 3: описание — макс 2 строки */}
      {task.description && (
        <Text type="secondary" style={{
          fontSize: 12,
          lineHeight: "1.45",
          marginBottom: 0,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {task.description}
        </Text>
      )}

      {/* Строка 4: мета — зависит от isBoard */}
      <div style={{
        marginTop: "auto",
        paddingTop: 8,
        borderTop: "1px solid #f5f5f5",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 6,
      }}>
        {isBoard ? (
          <>
            <UserBadge
              user={task.assignee}
              avatarSize={18}
              fontSize="12px"
              emptyLabel="Не назначен"
            />
            <Space size={8} style={{ flexShrink: 0 }}>
              <Space size={4}>
                <CalendarOutlined style={{
                  fontSize: 11,
                  color: isOverdue ? "#ff4d4f" : deadlineLabel ? "#8c8c8c" : "#d9d9d9",
                }} />
                <Text style={{
                  fontSize: 11,
                  color: isOverdue ? "#ff4d4f" : "#8c8c8c",
                  fontStyle: !deadlineLabel ? "italic" : "normal",
                }}>
                  {deadlineLabel || "Не указан"}
                </Text>
              </Space>
              <Space size={3}>
                <CommentOutlined style={{
                  color: commentsCount > 0 ? "#1677ff" : "#d9d9d9", fontSize: 11,
                }} />
                <Text type="secondary" style={{ fontSize: 11 }}>{commentsCount}</Text>
              </Space>
            </Space>
          </>
        ) : (
          <>
            <Space size={14} wrap>
              <UserBadge
                user={task.assignee}
                avatarSize={18}
                fontSize="12px"
                emptyLabel="Не назначен"
              />
              <Space size={4}>
                <CalendarOutlined style={{
                  fontSize: 11,
                  color: isOverdue ? "#ff4d4f" : deadlineLabel ? "#8c8c8c" : "#d9d9d9",
                }} />
                <Text style={{
                  fontSize: 11,
                  color: isOverdue ? "#ff4d4f" : "#8c8c8c",
                  fontStyle: !deadlineLabel ? "italic" : "normal",
                }}>
                  {deadlineLabel || "Дедлайн не указан"}
                </Text>
              </Space>
            </Space>
            <Space size={3} style={{ flexShrink: 0 }}>
              <CommentOutlined style={{
                color: commentsCount > 0 ? "#1677ff" : "#d9d9d9", fontSize: 11,
              }} />
              <Text type="secondary" style={{ fontSize: 11 }}>{commentsCount}</Text>
            </Space>
          </>
        )}
      </div>
    </div>
  );
};

const TaskCard = ({ task, onClick, compact = false, isBoard = false, projectId }) => {
  if (compact) return <TaskCardCompact task={task} onClick={onClick} />;
  return <TaskCardStandard task={task} onClick={onClick} isBoard={isBoard} projectId={projectId} />;
};

export default TaskCard;