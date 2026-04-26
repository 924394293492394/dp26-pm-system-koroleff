import { Tag } from "antd";

export const TASK_STATUS_CONFIG = {
  TODO: { color: "default", label: "К выполнению", short: "К выполн." },
  IN_PROGRESS: { color: "processing", label: "В работе", short: "В работе" },
  REVIEW: { color: "warning", label: "На проверке", short: "На провер." },
  DONE: { color: "success", label: "Готово", short: "Готово" },
};

const TaskStatusTag = ({ status, short = false }) => {
  const cfg = TASK_STATUS_CONFIG[status] || { color: "default", label: status };
  return <Tag color={cfg.color}>{short ? cfg.short : cfg.label}</Tag>;
};

export default TaskStatusTag;