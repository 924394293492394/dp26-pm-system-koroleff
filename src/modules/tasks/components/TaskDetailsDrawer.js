import {
  Drawer, Form, Input, DatePicker, Select, Button, Space,
  Typography, Popconfirm, message, Tag, Row, Col,
  Alert, Tooltip,
} from "antd";
import {
  SaveOutlined, DeleteOutlined, LockOutlined, ArrowsAltOutlined
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { updateTask, deleteTask } from "../api";
import { getMembers } from "../../projects/api";
import { getGoals } from "../../goals/api";
import TaskStatusTag, { TASK_STATUS_CONFIG } from "./TaskStatusTag";
import TaskPriorityBadge, { PRIORITY_CONFIG } from "./TaskPriorityBadge";
import { useNavigate } from "react-router-dom";

const { Text, Title } = Typography;

const getTaskPermissions = (task, currentUserId, currentUserRole) => {
  const isPrivileged = ["OWNER", "MANAGER"].includes(currentUserRole);
  const isCreator = task?.createdBy === currentUserId;
  const isAssignee = task?.assignedTo === currentUserId;
  const isGoalCreator = task?.goal?.createdBy === currentUserId;
  const isGoalResponsible = task?.goal?.responsibleUserId === currentUserId;
  const isGoalPriv = isGoalCreator || isGoalResponsible;
  const isViewer = currentUserRole === "VIEWER";
  const isOnlyAssignee = isAssignee && !isPrivileged && !isCreator && !isGoalPriv;

  return {
    canEdit: !isViewer && (isPrivileged || isCreator || isAssignee || isGoalPriv),
    canDelete: !isViewer && (isPrivileged || isCreator),
    canChangeAssignee: !isOnlyAssignee && !isViewer,
    canChangeAllFields: isPrivileged || isCreator || isGoalPriv,
    isOnlyAssignee,
    isViewer,
    isGoalPriv,
    isPrivileged,
    isCreator,
  };
};

const TaskDetailsDrawer = ({
  open, onClose, task, projectId,
  currentUserId, currentUserRole,
  onUpdate, onDelete,
  extraActions = null,
}) => {
  const navigate = useNavigate();
  const [formInst] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState([]);
  const [goals, setGoals] = useState([]);

  const perms = task
    ? getTaskPermissions(task, currentUserId, currentUserRole)
    : {
      canEdit: false, canDelete: false, isViewer: true,
      isOnlyAssignee: false, isGoalPriv: false,
      isCreator: false, isPrivileged: false, canChangeAssignee: false,
      canChangeAllFields: false,
    };

  useEffect(() => {
    if (!open || !projectId) return;
    getMembers(projectId, { limit: 100 })
      .then(d => setMembers(d?.members || []))
      .catch(() => { });
    getGoals(projectId, { limit: 100 })
      .then(d => setGoals(d?.data || []))
      .catch(() => { });
  }, [open, projectId]);

  useEffect(() => {
    if (open && task) {
      formInst.setFieldsValue({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignedTo || null,
        goalId: task.goalId || null,
        dueDate: task.dueDate ? dayjs(task.dueDate) : null,
      });
    }
  }, [open, task, formInst]);

  const handleSave = async () => {
    try {
      const values = await formInst.validateFields();
      setSaving(true);

      const payload = {
        title: values.title,
        description: values.description || undefined,
        status: values.status,
        priority: values.priority,
        goalId: values.goalId || null,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
        ...(!perms.isOnlyAssignee && { assignedTo: values.assignedTo || null }),
      };

      const updated = await updateTask(projectId, task.id, payload);
      message.success("Задача обновлена");

      const newAssignee = values.assignedTo
        ? members.find(m => m.userId === values.assignedTo)?.user || task.assignee
        : null;
      const newGoal = values.goalId
        ? goals.find(g => g.id === values.goalId) || task.goal
        : null;

      onUpdate?.({
        ...task,
        ...updated,
        status: values.status,
        priority: values.priority,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
        assignee: perms.isOnlyAssignee ? task.assignee : newAssignee,
        assignedTo: perms.isOnlyAssignee ? task.assignedTo : (values.assignedTo || null),
        goal: newGoal,
        goalId: values.goalId || null,
        creator: updated.creator || task.creator,
        createdBy: task.createdBy,
        _count: updated._count || task._count,
      });
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.response?.data?.error?.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask(projectId, task.id);
      message.success("Задача удалена");
      onDelete?.(task.id);
      onClose();
    } catch (err) {
      message.error(err?.response?.data?.error?.message || "Ошибка удаления");
    }
  };

  if (!task) return null;

  const isOverdue = task.dueDate
    && new Date(task.dueDate) < new Date()
    && task.status !== "DONE";

  const fieldDisabled = !perms.canEdit;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={520}
      styles={{ body: { padding: 0 }, footer: { padding: "12px 24px" } }}
      title={null}
      footer={
        perms.canEdit ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {perms.canDelete && (
              <Popconfirm
                title="Удалить задачу?"
                description="Комментарии к задаче также будут удалены."
                onConfirm={handleDelete}
                okText="Удалить"
                okButtonProps={{ danger: true }}
                cancelText="Отмена"
                placement="topLeft"
              >
                <Tooltip title="Удалить задачу" placement="top">
                  <Button
                    icon={<DeleteOutlined />}
                    style={{
                      width: 40, height: 40, padding: 0, flexShrink: 0,
                      border: "1px solid #ffccc7",
                      background: "#fff2f0",
                      color: "#cf1322",
                    }}
                  />
                </Tooltip>
              </Popconfirm>
            )}
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={handleSave}
              style={{ flex: 1, height: 40, fontWeight: 500 }}
            >
              Сохранить
            </Button>
          </div>
        ) : null
      }
    >
      {/* Шапка */}
      <div style={{
        padding: "20px 24px 16px",
        borderBottom: "1px solid #f0f0f0",
        background: "#fafafa",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <Space size={6} wrap>
            <TaskStatusTag status={task.status} />
            <TaskPriorityBadge priority={task.priority} showLabel />
            {isOverdue && <Tag color="error" style={{ margin: 0 }}>⏰ Просрочена</Tag>}
          </Space>
        </div>

        <Title
          level={4}
          style={{
            margin: "0 0 10px",
            textDecoration: task.status === "DONE" ? "line-through" : "none",
            color: task.status === "DONE" ? "#8c8c8c" : undefined,
          }}
        >
          {task.title}
        </Title>

        {/* Мета-строка шапки: создатель + дата + комментарии + кнопка страницы */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12 }}>
            <Text type="secondary">
              Создал: <Text strong>{task.creator?.login || "—"}</Text>
            </Text>
            <Text type="secondary">
              {new Date(task.createdAt).toLocaleDateString("ru-RU")}
            </Text>
            {task._count?.comments > 0 && (
              <Text type="secondary">
                💬 <Text strong>{task._count.comments}</Text> комм.
              </Text>
            )}
          </div>

          <Tooltip title="Открыть полную страницу задачи">
            <Button
              size="small"
              icon={<ArrowsAltOutlined />}
              onClick={() => {
                onClose();
                navigate(`/projects/${projectId}/tasks/${task.id}`);
              }}
              style={{ fontSize: 12, color: "#1677ff", borderColor: "#91caff" }}
            >
              Открыть страницу
            </Button>
          </Tooltip>
        </div>

        {extraActions && <div style={{ marginTop: 12 }}>{extraActions}</div>}
      </div>

      <div style={{ padding: "0 24px" }}>
        {perms.isViewer && (
          <Alert
            type="info"
            showIcon
            icon={<LockOutlined />}
            message="Режим просмотра — у вас нет прав на редактирование"
            style={{ margin: "14px 0 0" }}
          />
        )}
        {perms.isGoalPriv && !perms.isPrivileged && !perms.isCreator && (
          <Alert
            type="info"
            showIcon
            message="Вы ответственный за цель — полный доступ к задачам этой цели"
            style={{ margin: "14px 0 0" }}
          />
        )}
        {perms.isOnlyAssignee && (
          <Alert
            type="warning"
            showIcon
            message="Вы исполнитель — можете редактировать задачу, но не менять исполнителя"
            style={{ margin: "14px 0 0" }}
          />
        )}
      </div>

      <div style={{ padding: "16px 24px" }}>
        <Form form={formInst} layout="vertical">

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Статус" name="status" style={{ marginBottom: 16 }}>
                <Select disabled={fieldDisabled}>
                  {Object.entries(TASK_STATUS_CONFIG).map(([v, { label }]) => (
                    <Select.Option key={v} value={v}>{label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Приоритет" name="priority" style={{ marginBottom: 16 }}>
                <Select disabled={fieldDisabled}>
                  {Object.entries(PRIORITY_CONFIG).map(([v, { label, icon }]) => (
                    <Select.Option key={v} value={v}>{icon} {label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Название"
            name="title"
            rules={[{ required: true }, { min: 3 }]}
            style={{ marginBottom: 16 }}
          >
            <Input disabled={fieldDisabled} maxLength={200} showCount />
          </Form.Item>

          <Form.Item label="Описание" name="description" style={{ marginBottom: 16 }}>
            <Input.TextArea
              disabled={fieldDisabled}
              rows={4}
              maxLength={2000}
              showCount
              placeholder="Детали задачи..."
            />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                label="Исполнитель"
                name="assignedTo"
                style={{ marginBottom: 16 }}
                extra={
                  perms.isOnlyAssignee
                    ? <span style={{ fontSize: 11, color: "#fa8c16" }}>Нельзя переназначить</span>
                    : undefined
                }
              >
                <Select
                  placeholder="Назначить..."
                  allowClear
                  showSearch
                  disabled={fieldDisabled || !perms.canChangeAssignee}
                  filterOption={(inp, opt) =>
                    opt?.label?.toLowerCase().includes(inp.toLowerCase())
                  }
                >
                  {members.map(m => (
                    <Select.Option
                      key={m.userId}
                      value={m.userId}
                      label={m.user?.login}
                    >
                      {m.user?.login}{" "}
                      <Text type="secondary" style={{ fontSize: 11 }}>({m.role})</Text>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Цель" name="goalId" style={{ marginBottom: 16 }}>
                <Select
                  placeholder="Привязать к цели..."
                  allowClear
                  showSearch
                  disabled={fieldDisabled}
                  filterOption={(inp, opt) =>
                    opt?.label?.toLowerCase().includes(inp.toLowerCase())
                  }
                >
                  {goals.map(g => (
                    <Select.Option key={g.id} value={g.id} label={g.title}>
                      {g.title}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Дедлайн" name="dueDate" style={{ marginBottom: 16 }}>
            <DatePicker
              disabled={fieldDisabled}
              style={{ width: "100%" }}
              format="DD.MM.YYYY"
              placeholder="Срок выполнения"
            />
          </Form.Item>
        </Form>

        {task.dueDate && (
          <div style={{
            background: isOverdue ? "#fff1f0" : "#f6ffed",
            border: `1px solid ${isOverdue ? "#ffccc7" : "#b7eb8f"}`,
            borderRadius: 6,
            padding: "8px 12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <Text style={{ fontSize: 12, color: isOverdue ? "#ff4d4f" : "#52c41a" }}>
              {isOverdue ? "Срок истёк" : "В срок"}
            </Text>
            <Text strong style={{ fontSize: 12, color: isOverdue ? "#ff4d4f" : "#52c41a" }}>
              {new Date(task.dueDate).toLocaleDateString("ru-RU")}
            </Text>
          </div>
        )}
      </div>
    </Drawer>
  );
};

export default TaskDetailsDrawer;