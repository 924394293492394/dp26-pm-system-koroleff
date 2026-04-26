import { Tag, Typography, Space, Button, Tooltip, Avatar } from "antd";
import {
  CalendarOutlined, UserOutlined, CheckSquareOutlined,
  StarFilled, StarOutlined,
} from "@ant-design/icons";
import GoalStatusTag from "./GoalStatusTag";
import UserBadge from "../../common/UserBadge";

const { Text } = Typography;

const BORDER_COLOR = {
  COMPLETED: "#52c41a",
  CANCELLED: "#bfbfbf",
  IN_PROGRESS: "#1677ff",
  PLANNED: "#faad14",
};

const getAvatarProps = (user) => {
  if (!user) return { label: "?", color: "#d9d9d9" };
  const name = user.profile?.firstName
    ? `${user.profile.firstName} ${user.profile.lastName || ""}`.trim()
    : user.login;
  const palette = ["#1677ff", "#52c41a", "#722ed1", "#fa8c16", "#eb2f96", "#13c2c2", "#f5222d"];
  const color = palette[(name.charCodeAt(0) || 0) % palette.length];
  return { label: name[0].toUpperCase(), fullName: name, color };
};

const CancelledOverlay = () => (
  <svg style={{
    position: "absolute", inset: 0,
    width: "100%", height: "100%",
    borderRadius: 8, pointerEvents: "none", opacity: 0.07,
  }} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="diag" width="10" height="10"
        patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="10" stroke="#666" strokeWidth="3" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#diag)" />
  </svg>
);

const GoalCard = ({ goal, onClick, onPin, showProject = false }) => {
  const isOverdue = goal.dueDate
    && new Date(goal.dueDate) < new Date()
    && !["COMPLETED", "CANCELLED"].includes(goal.status);

  const borderColor = BORDER_COLOR[goal.status] || "#d9d9d9";
  const isCancelled = goal.status === "CANCELLED";
  const hasResponsible = !!goal.responsible;
  const avatarProps = getAvatarProps(goal.responsible);
  const deadlineLabel = goal.dueDate
    ? new Date(goal.dueDate).toLocaleDateString("ru-RU")
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
        opacity: isCancelled ? 0.75 : 1,
        minHeight: 120,
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.09)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      {isCancelled && <CancelledOverlay />}

      {/* Строка 1: статус + теги + pin */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <Space size={6} wrap>
          <GoalStatusTag status={goal.status} />
          {isOverdue && <Tag color="error" style={{ margin: 0, fontSize: 11 }}>⏰ Просрочена</Tag>}
          {showProject && goal.project && (
            <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>📁 {goal.project.name}</Tag>
          )}
        </Space>
        <Tooltip title={goal.isPinned ? "Открепить" : "Закрепить"}>
          <Button
            type="text"
            size="small"
            icon={goal.isPinned
              ? <StarFilled style={{ color: "#faad14", fontSize: 14 }} />
              : <StarOutlined style={{ color: "#d9d9d9", fontSize: 14 }} />
            }
            onClick={e => { e.stopPropagation(); onPin?.(goal.id, goal.isPinned); }}
            style={{ padding: "0 4px", height: 24 }}
          />
        </Tooltip>
      </div>

      {/* Строка 2: заголовок */}
      <Text strong style={{
        fontSize: 14,
        display: "block",
        marginBottom: goal.description ? 4 : 12,
        textDecoration: isCancelled ? "line-through" : "none",
        color: isCancelled ? "#8c8c8c" : undefined,
      }}>
        {goal.title}
      </Text>

      {/* Строка 3: описание */}
      {goal.description && (
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 12 }}
          ellipsis={{ tooltip: goal.description }}>
          {goal.description}
        </Text>
      )}

      {/* Строка 4: мета */}
      <div style={{
        marginTop: "auto",
        paddingTop: 8,
        borderTop: "1px solid #f5f5f5",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 6,
      }}>

        {/* ответственный + дедлайн*/}
        <Space size={14} wrap style={{ fontSize: 12 }}>

          <UserBadge
            user={goal.responsible}
            avatarSize={18}
            fontSize="12px"
            emptyLabel="Не назначен"
          />

          <Space size={4}>
            <CalendarOutlined style={{
              fontSize: 12,
              color: isOverdue ? "#ff4d4f" : deadlineLabel ? "#8c8c8c" : "#d9d9d9",
            }} />
            <Text
              type={isOverdue ? "danger" : "secondary"}
              style={{ fontStyle: !deadlineLabel ? "italic" : "normal", fontSize: 12 }}
            >
              {deadlineLabel || "Дедлайн не указан"}
            </Text>
          </Space>

        </Space>

        {/* кол-во задач */}
        <Space size={4} style={{ fontSize: 12 }}>
          <CheckSquareOutlined style={{
            color: (goal.tasksCount ?? 0) > 0 ? "#52c41a" : "#d9d9d9"
          }} />
          <Text type="secondary">{goal.tasksCount ?? 0} задач</Text>
        </Space>

      </div>
    </div>
  );
};

export default GoalCard;