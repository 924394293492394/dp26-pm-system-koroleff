import { Tag } from "antd";

export const STATUS_CONFIG = {
  PLANNED: { color: "default", label: "Запланирована", dot: "🔵" },
  IN_PROGRESS: { color: "processing", label: "В процессе", dot: "🟡" },
  COMPLETED: { color: "success", label: "Завершена", dot: "🟢" },
  CANCELLED: { color: "error", label: "Отменена", dot: "🔴" },
};

const GoalStatusTag = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { color: "default", label: status };
  return <Tag color={cfg.color}>{cfg.label}</Tag>;
};

export default GoalStatusTag;

// export const STATUS_CONFIG = {
//   PLANNED:     { color: "default",    label: "Запланирована",  next: ["IN_PROGRESS", "CANCELLED"] },
//   IN_PROGRESS: { color: "processing", label: "В процессе",    next: ["COMPLETED", "CANCELLED", "PLANNED"] },
//   COMPLETED:   { color: "success",    label: "Завершена",      next: ["IN_PROGRESS"] },
//   CANCELLED:   { color: "error",      label: "Отменена",       next: ["PLANNED"] },
// };
