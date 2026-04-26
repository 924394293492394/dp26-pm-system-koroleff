import { Tooltip } from "antd";

export const PRIORITY_CONFIG = {
  LOW: { color: "#8c8c8c", bg: "#f5f5f5", label: "Низкий", icon: "▽" },
  MEDIUM: { color: "#1677ff", bg: "#e6f4ff", label: "Средний", icon: "◇" },
  HIGH: { color: "#fa8c16", bg: "#fff7e6", label: "Высокий", icon: "△" },
  CRITICAL: { color: "#ff4d4f", bg: "#fff1f0", label: "Критичный", icon: "▲" },
};

const TaskPriorityBadge = ({ priority, showLabel = false }) => {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM;
  return (
    <Tooltip title={cfg.label}>
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 4,
        background: cfg.bg,
        color: cfg.color,
        fontSize: 11,
        fontWeight: 600,
        lineHeight: "18px",
      }}>
        {cfg.icon}
        {showLabel && <span style={{ marginLeft: 2 }}>{cfg.label}</span>}
      </span>
    </Tooltip>
  );
};

export default TaskPriorityBadge;