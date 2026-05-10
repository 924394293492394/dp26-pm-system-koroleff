import { useNavigate, useParams } from "react-router-dom";
import { Button, Badge } from "antd";
import { RightOutlined } from "@ant-design/icons";
import TaskCard from "./TaskCard";
import TaskStatusTag, { TASK_STATUS_CONFIG } from "./TaskStatusTag";

const COLUMN_LIMIT = 10;

const TaskBoard = ({ tasks, onTaskClick }) => {
  const navigate = useNavigate();
  const { id: projectId } = useParams();

  const columns = Object.keys(TASK_STATUS_CONFIG).map(status => ({
    status,
    tasks: tasks.filter(t => t.status === status),
  }));

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 16,
      alignItems: "start",
    }}>
      {columns.map(({ status, tasks: colTasks }) => {
        const visible = colTasks.slice(0, COLUMN_LIMIT);
        const overflow = colTasks.length - COLUMN_LIMIT;
        const cfg = TASK_STATUS_CONFIG[status];

        return (
          <div key={status} style={{
            background: "#fafafa",
            borderRadius: 12,
            padding: "12px 10px",
            minHeight: 120,
          }}>
            {/* Заголовок колонки */}
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 12, paddingBottom: 8,
              borderBottom: "2px solid #f0f0f0",
            }}>
              <TaskStatusTag status={status} />
              <Badge
                count={colTasks.length}
                style={{ background: colTasks.length > 0 ? "#1677ff" : "#d9d9d9" }}
              />
            </div>

            {/* Карточки (макс. 10) */}
            {visible.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                isBoard
                projectId={projectId}
                onClick={() => onTaskClick(task)}
              />
            ))}

            {/* Кнопка "ещё N карточек" */}
            {overflow > 0 && (
              <Button
                type="dashed"
                size="small"
                icon={<RightOutlined />}
                style={{
                  width: "100%", marginTop: 4,
                  fontSize: 12, color: "#1677ff",
                  borderColor: "#91caff",
                }}
                onClick={() => navigate(
                  `/projects/${projectId}/tasks/all?status=${status}`
                )}
              >
                Ещё {overflow} задач →
              </Button>
            )}

            {colTasks.length === 0 && (
              <div style={{
                textAlign: "center", padding: "20px 0",
                color: "#bfbfbf", fontSize: 12,
              }}>
                Нет задач
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TaskBoard;