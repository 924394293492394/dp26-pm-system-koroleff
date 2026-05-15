import {
  Drawer, Form, Input, DatePicker, Select, Button, Space,
  Typography, Popconfirm, message, Tag, Row, Col,
  Alert, Tooltip,
} from "antd";
import {
  SaveOutlined, DeleteOutlined,
  StarOutlined, StarFilled,
  LockOutlined, LoadingOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { updateGoal, deleteGoal, pinGoal, unpinGoal } from "../api";
import { getMembers } from "../../projects/api";
import GoalStatusTag, { STATUS_CONFIG } from "./GoalStatusTag";

const { Text, Title } = Typography;

const getPermissions = (goal, currentUserId, currentUserRole) => {
  const isOwnerOrManager = ["OWNER", "MANAGER"].includes(currentUserRole);
  const isCreator = goal?.creator?.id === currentUserId;
  const isResponsible = goal?.responsible?.id === currentUserId;
  const isViewer = currentUserRole === "VIEWER";
  const isOnlyResponsible = isResponsible && !isOwnerOrManager && !isCreator;

  return {
    canEdit: !isViewer && (isOwnerOrManager || isCreator || isResponsible),
    canDelete: !isViewer && (isOwnerOrManager || isCreator),
    canChangeResponsible: !isOnlyResponsible && !isViewer,
    isViewer,
    isResponsible,
    isOnlyResponsible,
    isCreator,
    isOwnerOrManager,
  };
};

const GoalDetailsDrawer = ({
  open, onClose, goal, projectId,
  currentUserId, currentUserRole,
  roleLoading = false,
  extraActions = null,
  onUpdate, onDelete, onPin,
}) => {
  const [formInst] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [members, setMembers] = useState([]);

  const perms = currentUserRole
    ? getPermissions(goal, currentUserId, currentUserRole)
    : {
      canEdit: false, canDelete: false, isViewer: true,
      isResponsible: false, isCreator: false, isOwnerOrManager: false,
      isOnlyResponsible: false, canChangeResponsible: false,
    };

  useEffect(() => {
    if (open && projectId) {
      getMembers(projectId, { limit: 100 })
        .then(d => setMembers((d?.members || []).filter(m => m.role !== "VIEWER")))
        .catch(() => { });
    }
  }, [open, projectId]);

  useEffect(() => {
    if (open && goal) {
      formInst.setFieldsValue({
        title: goal.title,
        description: goal.description || "",
        status: goal.status,
        dueDate: goal.dueDate ? dayjs(goal.dueDate) : null,
        responsibleUserId: goal.responsible?.id || null,
      });
    }
  }, [open, goal, formInst]);

  const handleSave = async () => {
    try {
      const values = await formInst.validateFields();
      setSaving(true);

      // Ответственный без прав manager/owner/creator — не отправляем responsibleUserId
      const payload = {
        title: values.title,
        description: values.description || undefined,
        status: values.status,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
        ...(!perms.isOnlyResponsible && {
          responsibleUserId: values.responsibleUserId || null,
        }),
      };

      const updated = await updateGoal(projectId, goal.id, payload);
      message.success("Цель обновлена");

      const newResponsible = values.responsibleUserId
        ? members.find(m => m.userId === values.responsibleUserId)?.user || null
        : null;

      onUpdate?.({
        ...goal,
        ...updated,
        status: values.status,
        responsible: perms.isOnlyResponsible ? goal.responsible : newResponsible,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
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
      await deleteGoal(projectId, goal.id);
      message.success("Цель удалена");
      onDelete?.(goal.id);
      onClose();
    } catch (err) {
      message.error(err?.response?.data?.error?.message || "Ошибка удаления");
    }
  };

  const handlePin = async () => {
    try {
      setPinLoading(true);
      goal.isPinned
        ? await unpinGoal(projectId, goal.id)
        : await pinGoal(projectId, goal.id);
      onPin?.(goal.id, goal.isPinned);
      message.success(goal.isPinned ? "Откреплено" : "Закреплено");
    } catch {
      message.error("Ошибка");
    } finally {
      setPinLoading(false);
    }
  };

  if (!goal) return null;

  const isOverdue = goal.dueDate
    && new Date(goal.dueDate) < new Date()
    && !["COMPLETED", "CANCELLED"].includes(goal.status);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={520}
      styles={{ body: { padding: 0 }, footer: { padding: "12px 24px" } }}
      title={null}
      footer={
        perms.canEdit ? (
          <div style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}>
            {perms.canDelete && (
              <Popconfirm
                title="Удалить цель?"
                description="Задачи цели потеряют привязку к ней."
                onConfirm={handleDelete}
                okText="Удалить"
                okButtonProps={{ danger: true }}
                cancelText="Отмена"
                placement="topLeft"
              >
                <Tooltip title="Удалить цель" placement="top">
                  <Button
                    icon={<DeleteOutlined />}
                    style={{
                      width: 40,
                      height: 40,
                      padding: 0,
                      flexShrink: 0,
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
              Сохранить изменения
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
        {/* Строка: статус +pin + загрузка роли */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}>
          <Space size={6} wrap>
            <GoalStatusTag status={goal.status} />
            {isOverdue && <Tag color="error" style={{ margin: 0 }}>⏰ Просрочена</Tag>}
          </Space>

          <Space size={8}>
            {roleLoading && (
              <LoadingOutlined style={{ color: "#1677ff", fontSize: 14 }} />
            )}
            <Button
              type="text"
              size="small"
              loading={pinLoading}
              icon={goal.isPinned
                ? <StarFilled style={{ color: "#faad14", fontSize: 16 }} />
                : <StarOutlined style={{ color: "#bfbfbf", fontSize: 16 }} />
              }
              onClick={handlePin}
            />
          </Space>
        </div>

        {/* Заголовок */}
        <Title
          level={4}
          style={{
            margin: "0 0 10px",
            textDecoration: goal.status === "CANCELLED" ? "line-through" : "none",
            color: goal.status === "CANCELLED" ? "#8c8c8c" : undefined,
          }}
        >
          {goal.title}
        </Title>

        {/* Мета-строка */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12 }}>
          <Text type="secondary">
            Создал: <Text strong>{goal.creator?.login || "—"}</Text>
          </Text>
          <Text type="secondary">
            {new Date(goal.createdAt).toLocaleDateString("ru-RU")}
          </Text>
          <Text type="secondary">
            Задач:{" "}
            <Text strong style={{ color: goal.tasksCount > 0 ? "#1677ff" : undefined }}>
              {goal.tasksCount ?? 0}
            </Text>
          </Text>
        </div>

        {extraActions && (
          <div style={{ marginTop: 12 }}>
            {extraActions}
          </div>
        )}
      </div>

      {/* Уведомления о правах участника */}
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
        {!perms.isViewer && perms.isOnlyResponsible && (
          <Alert
            type="warning"
            showIcon
            message="Вы ответственный — можете редактировать цель, но не удалять и не переназначать ответственного"
            style={{ margin: "14px 0 0" }}
          />
        )}
      </div>

      {/* осн. форма */}
      <div style={{ padding: "16px 24px" }}>
        <Form form={formInst} layout="vertical" disabled={!perms.canEdit}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Статус" name="status" style={{ marginBottom: 16 }}>
                <Select>
                  {Object.entries(STATUS_CONFIG).map(([value, { label, color }]) => (
                    <Select.Option key={value} value={value}>
                      <Tag color={color}>{label}</Tag>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Срок выполнения" name="dueDate" style={{ marginBottom: 16 }}>
                <DatePicker style={{ width: "100%" }} format="DD.MM.YYYY" placeholder="Выбрать дату" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Название"
            name="title"
            rules={[
              { required: true, message: "Введите название" },
              { min: 3, message: "Минимум 3 символа" },
            ]}
            style={{ marginBottom: 16 }}
          >
            <Input maxLength={255} showCount />
          </Form.Item>

          <Form.Item label="Описание" name="description" style={{ marginBottom: 16 }}>
            <Input.TextArea
              rows={4}
              maxLength={1000}
              showCount
              placeholder="Контекст и детали цели..."
            />
          </Form.Item>

          <Form.Item
            label="Ответственный"
            name="responsibleUserId"
            style={{ marginBottom: 16 }}
            extra={
              perms.isOnlyResponsible
                ? <span style={{ fontSize: 11, color: "#fa8c16" }}>Нельзя переназначить</span>
                : <span style={{ fontSize: 11, color: "#8c8c8c" }}>VIEWER нельзя назначить</span>
            }
          >
            <Select
              placeholder="Назначить..."
              allowClear
              showSearch
              disabled={!perms.canEdit || !perms.canChangeResponsible}
              filterOption={(inp, opt) =>
                opt?.label?.toLowerCase().includes(inp.toLowerCase())
              }
            >
              {members.map(m => (
                <Select.Option key={m.userId} value={m.userId} label={m.user?.login}>
                  <Space size={4}>
                    <span>{m.user?.login}</span>
                    <Text type="secondary" style={{ fontSize: 11 }}>({m.role})</Text>
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>

        {/* Дедлайн-индикатор */}
        {goal.dueDate && (
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
              {isOverdue ? "⚠️ Срок истёк" : "✅ В срок"}
            </Text>
            <Text strong style={{ fontSize: 12, color: isOverdue ? "#ff4d4f" : "#52c41a" }}>
              {new Date(goal.dueDate).toLocaleDateString("ru-RU")}
            </Text>
          </div>
        )}
      </div>
    </Drawer>
  );
};

export default GoalDetailsDrawer;