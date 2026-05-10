import {
  Breadcrumb, Tabs, Button, Typography, Tag, Space,
  Spin, message, Popconfirm, Tooltip, Row, Col,
  Form, Input, Select, DatePicker, Alert,
} from "antd";
import {
  ArrowLeftOutlined, EditOutlined, DeleteOutlined,
  SaveOutlined, CloseOutlined, CommentOutlined,
  AimOutlined, CalendarOutlined, LockOutlined,
  PaperClipOutlined, CheckSquareOutlined, LinkOutlined,
} from "@ant-design/icons";
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { getTask, updateTask, deleteTask } from "../api";
import { getMembers, getProjectById } from "../../projects/api";
import { getGoals } from "../../goals/api";
import { useAuth } from "../../../context/AuthContext";
import TaskStatusTag, { TASK_STATUS_CONFIG } from "./TaskStatusTag";
import TaskPriorityBadge, { PRIORITY_CONFIG } from "./TaskPriorityBadge";
import TaskComments from "./TaskComments";
import UserBadge from "../../common/UserBadge";
import TaskChecklist from "./TaskChecklist";
import TaskLinks from "./TaskLinks";
import TaskAttachments from "./TaskAttachments";

const { Title, Text, Paragraph } = Typography;

const getTaskPermissions = (task, currentUserId, currentUserRole) => {
  const isPrivileged      = ["OWNER", "MANAGER"].includes(currentUserRole);
  const isCreator         = task?.createdBy === currentUserId;
  const isAssignee        = task?.assignedTo === currentUserId;
  const isGoalCreator     = task?.goal?.createdBy === currentUserId;
  const isGoalResponsible = task?.goal?.responsibleUserId === currentUserId;
  const isGoalPriv        = isGoalCreator || isGoalResponsible;
  const isViewer          = currentUserRole === "VIEWER";
  const isOnlyAssignee    = isAssignee && !isPrivileged && !isCreator && !isGoalPriv;

  return {
    canEdit:           !isViewer && (isPrivileged || isCreator || isAssignee || isGoalPriv),
    canDelete:         !isViewer && (isPrivileged || isCreator),
    canChangeAssignee: !isOnlyAssignee && !isViewer,
    isOnlyAssignee,
    isViewer,
    isGoalPriv,
    isPrivileged,
    isCreator,
  };
};

const TaskDetailPage = () => {
  const { id: projectId, taskId } = useParams();
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const currentUserId = user?.id || user?.userId;

  const [task,      setTask]      = useState(null);
  const [project,   setProject]   = useState(null);
  const [members,   setMembers]   = useState([]);
  const [goals,     setGoals]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [editing,   setEditing]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const [checklistCount,  setChecklistCount]  = useState(0);
  const [attachmentCount, setAttachmentCount] = useState(0);
  const [linkCount,       setLinkCount]       = useState(0);

  const [formInst] = Form.useForm();

  const currentUserRole = project?.role;
  const perms = task && currentUserRole
    ? getTaskPermissions(task, currentUserId, currentUserRole)
    : {
        canEdit: false, canDelete: false, isViewer: true,
        isOnlyAssignee: false, isGoalPriv: false,
        isPrivileged: false, isCreator: false, canChangeAssignee: false,
      };

  const loadTask = useCallback(async () => {
    try {
      const data = await getTask(projectId, taskId);
      setTask(data);
      setChecklistCount(data?._count?.checklists  || 0);
      setAttachmentCount(data?._count?.attachments || 0);
      setLinkCount(data?._count?.links             || 0);
    } catch {
      message.error("Задача не найдена");
      navigate(`/projects/${projectId}`);
    }
  }, [projectId, taskId, navigate]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [proj] = await Promise.all([
          getProjectById(projectId),
          loadTask(),
        ]);
        setProject(proj);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [projectId, taskId]);

  // Загружаем members + goals только при открытии редактора
  useEffect(() => {
    if (!editing || !projectId) return;
    getMembers(projectId, { limit: 100 }).then(d => setMembers(d?.members || [])).catch(() => {});
    getGoals(projectId, { limit: 100 }).then(d => setGoals(d?.data || [])).catch(() => {});
  }, [editing, projectId]);

  useEffect(() => {
    if (editing && task) {
      formInst.setFieldsValue({
        title:       task.title,
        description: task.description || "",
        status:      task.status,
        priority:    task.priority,
        assignedTo:  task.assignedTo || null,
        goalId:      task.goalId     || null,
        dueDate:     task.dueDate ? dayjs(task.dueDate) : null,
      });
    }
  }, [editing, task, formInst]);

  const handleSave = async () => {
    try {
      const values = await formInst.validateFields();
      setSaving(true);

      const payload = {
        title:       values.title,
        description: values.description || undefined,
        status:      values.status,
        priority:    values.priority,
        goalId:      values.goalId  || null,
        dueDate:     values.dueDate ? values.dueDate.toISOString() : null,
        ...(!perms.isOnlyAssignee && { assignedTo: values.assignedTo || null }),
      };

      const updated     = await updateTask(projectId, task.id, payload);
      const newAssignee = values.assignedTo
        ? members.find(m => m.userId === values.assignedTo)?.user || task.assignee
        : null;
      const newGoal = values.goalId
        ? goals.find(g => g.id === values.goalId) || task.goal
        : null;

      setTask(prev => ({
        ...prev, ...updated,
        status:    values.status,
        priority:  values.priority,
        dueDate:   values.dueDate ? values.dueDate.toISOString() : null,
        assignee:  perms.isOnlyAssignee ? prev.assignee : newAssignee,
        goal:      newGoal,
        creator:   prev.creator,
      }));

      message.success("Задача обновлена");
      setEditing(false);
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
      navigate(`/projects/${projectId}?tab=tasks`);
    } catch (err) {
      message.error(err?.response?.data?.error?.message || "Ошибка удаления");
    }
  };

  if (loading) return (
    <div style={{ textAlign: "center", paddingTop: 80 }}>
      <Spin size="large" />
    </div>
  );

  if (!task) return null;

  const isOverdue = task.dueDate
    && new Date(task.dueDate) < new Date()
    && task.status !== "DONE";

  const deadlineLabel = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString("ru-RU")
    : null;

  return (
    <div>
      {/* ── Хлебные крошки ── */}
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <span onClick={() => navigate("/projects")} style={{ cursor: "pointer" }}>Проекты</span> },
          { title: <span onClick={() => navigate(`/projects/${projectId}`)} style={{ cursor: "pointer" }}>{project?.name || "Проект"}</span> },
          ...(task.goal ? [{ title: <span style={{ color: "#1677ff" }}>🎯 {task.goal.title}</span> }] : []),
          { title: task.title },
        ]}
      />

      {/* ── Шапка ── */}
      <div style={{
        background:   "#fff",
        borderRadius: 12,
        padding:      "20px 24px",
        marginBottom: 16,
        border:       "1px solid #f0f0f0",
        boxShadow:    "0 1px 4px rgba(0,0,0,0.04)",
      }}>
        {/* Кнопки управления — только на вкладке "Детали" */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/projects/${projectId}?tab=tasks`)}
          >
            К задачам
          </Button>

          {activeTab === "details" && (
            <Space>
              {perms.canEdit && !editing && (
                <Button type="primary" icon={<EditOutlined />} onClick={() => setEditing(true)}>
                  Редактировать
                </Button>
              )}
              {editing && (
                <>
                  <Button icon={<CloseOutlined />} onClick={() => setEditing(false)}>
                    Отмена
                  </Button>
                  <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
                    Сохранить
                  </Button>
                </>
              )}
              {perms.canDelete && !editing && (
                <Popconfirm
                  title="Удалить задачу?"
                  description="Все комментарии и вложения также будут удалены."
                  onConfirm={handleDelete}
                  okText="Удалить"
                  okButtonProps={{ danger: true }}
                  cancelText="Отмена"
                >
                  <Tooltip title="Удалить задачу">
                    <Button danger icon={<DeleteOutlined />} />
                  </Tooltip>
                </Popconfirm>
              )}
            </Space>
          )}
        </div>

        {/* Статус + приоритет + теги */}
        <Space size={8} wrap style={{ marginBottom: 12 }}>
          <TaskStatusTag status={task.status} />
          <TaskPriorityBadge priority={task.priority} showLabel />
          {isOverdue && <Tag color="error">⏰ Просрочена</Tag>}
          {task.goal && (
            <Tag color="blue">
              <AimOutlined style={{ marginRight: 4 }} />
              {task.goal.title}
            </Tag>
          )}
        </Space>

        {/* Заголовок задачи */}
        <Title
          level={3}
          style={{
            margin:         "0 0 16px",
            textDecoration: task.status === "DONE" ? "line-through" : "none",
            color:          task.status === "DONE" ? "#8c8c8c" : undefined,
          }}
        >
          {task.title}
        </Title>

        {/* Мета-инфо */}
        <Row gutter={[24, 10]}>
          <Col>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 2 }}>Создатель</Text>
            <UserBadge user={task.creator} avatarSize={20} fontSize="13px" emptyLabel="—" />
          </Col>
          <Col>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 2 }}>Исполнитель</Text>
            <UserBadge user={task.assignee} avatarSize={20} fontSize="13px" emptyLabel="Не назначен" />
          </Col>
          <Col>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 2 }}>Дедлайн</Text>
            <Space size={4}>
              <CalendarOutlined style={{
                color: isOverdue ? "#ff4d4f" : deadlineLabel ? "#595959" : "#d9d9d9",
                fontSize: 13,
              }} />
              <Text style={{
                fontSize:  13,
                color:     isOverdue ? "#ff4d4f" : "#595959",
                fontStyle: !deadlineLabel ? "italic" : "normal",
              }}>
                {deadlineLabel || "Не указан"}
              </Text>
            </Space>
          </Col>
          <Col>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 2 }}>Создано</Text>
            <Text style={{ fontSize: 13 }}>
              {new Date(task.createdAt).toLocaleDateString("ru-RU")}
            </Text>
          </Col>
          <Col>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 2 }}>Комментарии</Text>
            <Button
              type="link" size="small" icon={<CommentOutlined />}
              onClick={() => setActiveTab("comments")}
              style={{ padding: 0, fontSize: 13, height: "auto" }}
            >
              {task._count?.comments > 0
                ? `${task._count.comments} комментариев`
                : "Добавить комментарий"
              }
            </Button>
          </Col>
        </Row>
        {perms.isOnlyAssignee && (
          <Alert
            type="warning" showIcon
            message="Вы исполнитель — можете редактировать задачу, но не менять исполнителя"
            style={{ marginTop: 12 }}
          />
        )}
        {perms.isGoalPriv && !perms.isPrivileged && !perms.isCreator && (
          <Alert
            type="info" showIcon
            message="Вы ответственный за цель — полный доступ к задачам этой цели"
            style={{ marginTop: 12 }}
          />
        )}
        {perms.isViewer && (
          <Alert
            type="info" showIcon icon={<LockOutlined />}
            message="Режим просмотра — редактирование недоступно"
            style={{ marginTop: 12 }}
          />
        )}
      </div>
      <div style={{
        background:   "#fff",
        borderRadius: 12,
        border:       "1px solid #f0f0f0",
        boxShadow:    "0 1px 4px rgba(0,0,0,0.04)",
        overflow:     "hidden",
      }}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {

            if (activeTab === "details" && editing) setEditing(false);
            setActiveTab(key);
          }}
          style={{ padding: "0 24px" }}
          items={[
            {
              key:   "details",
              label: "Детали",
              children: (
                <div style={{ padding: "0 0 24px" }}>
                  {editing ? (
                    <Form form={formInst} layout="vertical">
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item label="Статус" name="status">
                            <Select>
                              {Object.entries(TASK_STATUS_CONFIG).map(([v, { label }]) => (
                                <Select.Option key={v} value={v}>{label}</Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label="Приоритет" name="priority">
                            <Select>
                              {Object.entries(PRIORITY_CONFIG).map(([v, { label, icon }]) => (
                                <Select.Option key={v} value={v}>{icon} {label}</Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        label="Название" name="title"
                        rules={[{ required: true, message: "Введите название" }, { min: 3 }]}
                      >
                        <Input maxLength={200} showCount />
                      </Form.Item>

                      <Form.Item label="Описание" name="description">
                        <Input.TextArea
                          rows={5} maxLength={2000} showCount
                          placeholder="Подробное описание задачи..."
                        />
                      </Form.Item>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label="Исполнитель" name="assignedTo"
                            extra={perms.isOnlyAssignee
                              ? <span style={{ color: "#fa8c16", fontSize: 11 }}>Нельзя переназначить</span>
                              : undefined
                            }
                          >
                            <Select
                              placeholder="Назначить..." allowClear showSearch
                              disabled={!perms.canChangeAssignee}
                              filterOption={(i, o) => o?.label?.toLowerCase().includes(i.toLowerCase())}
                            >
                              {members.map(m => (
                                <Select.Option key={m.userId} value={m.userId} label={m.user?.login}>
                                  {m.user?.login}{" "}
                                  <Text type="secondary" style={{ fontSize: 11 }}>({m.role})</Text>
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label="Цель" name="goalId">
                            <Select
                              placeholder="Привязать к цели..." allowClear showSearch
                              filterOption={(i, o) => o?.label?.toLowerCase().includes(i.toLowerCase())}
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

                      <Form.Item label="Дедлайн" name="dueDate">
                        <DatePicker style={{ width: "100%" }} format="DD.MM.YYYY" placeholder="Срок выполнения" />
                      </Form.Item>
                    </Form>
                  ) : (
                    <div>
                      {task.description ? (
                        <div style={{ marginBottom: 20 }}>
                          <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
                            Описание
                          </Text>
                          <Paragraph style={{ fontSize: 14, lineHeight: "1.7", whiteSpace: "pre-wrap", margin: 0 }}>
                            {task.description}
                          </Paragraph>
                        </div>
                      ) : (
                        <div style={{ color: "#bfbfbf", fontStyle: "italic", fontSize: 13, marginBottom: 20 }}>
                          Описание не добавлено
                          {perms.canEdit && (
                            <Button type="link" size="small" style={{ padding: "0 6px" }}
                              onClick={() => setEditing(true)}>
                              Добавить
                            </Button>
                          )}
                        </div>
                      )}

                      <div style={{
                        background: "#fafafa", borderRadius: 8,
                        padding: "12px 16px", border: "1px solid #f0f0f0",
                      }}>
                        <Row gutter={[16, 12]}>
                          <Col span={12}>
                            <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Статус</Text>
                            <TaskStatusTag status={task.status} />
                          </Col>
                          <Col span={12}>
                            <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Приоритет</Text>
                            <TaskPriorityBadge priority={task.priority} showLabel />
                          </Col>
                          <Col span={12}>
                            <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Дедлайн</Text>
                            <Text style={{ fontSize: 13, color: isOverdue ? "#ff4d4f" : undefined }}>
                              {deadlineLabel || <span style={{ color: "#bfbfbf", fontStyle: "italic" }}>Не указан</span>}
                            </Text>
                          </Col>
                          <Col span={12}>
                            <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Обновлено</Text>
                            <Text style={{ fontSize: 13 }}>
                              {task.updatedAt ? new Date(task.updatedAt).toLocaleDateString("ru-RU") : "—"}
                            </Text>
                          </Col>
                        </Row>
                      </div>
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: "checklist",
              label: (
                <span>
                  <CheckSquareOutlined />
                  {" "}Чеклист
                  {checklistCount > 0 && (
                    <span style={{
                      marginLeft: 5, background: "#f6ffed", color: "#52c41a",
                      borderRadius: 8, padding: "0 5px", fontSize: 11,
                    }}>
                      {checklistCount}
                    </span>
                  )}
                </span>
              ),
              children: (
                <div style={{ padding: "0 0 24px" }}>
                  <TaskChecklist
                    projectId={projectId}
                    taskId={taskId}
                    currentUserRole={currentUserRole}
                    onCountChange={setChecklistCount}
                  />
                </div>
              ),
            },
            {
              key: "comments",
              label: (
                <span>
                  <CommentOutlined />
                  {" "}Комментарии
                  {task._count?.comments > 0 && (
                    <span style={{
                      marginLeft: 5, background: "#e6f4ff", color: "#1677ff",
                      borderRadius: 8, padding: "0 5px", fontSize: 11,
                    }}>
                      {task._count.comments}
                    </span>
                  )}
                </span>
              ),
              children: (
                <div style={{ padding: "0 0 24px" }}>
                  <TaskComments
                    projectId={projectId}
                    taskId={taskId}
                    currentUserId={currentUserId}
                    currentUserRole={currentUserRole}
                  />
                </div>
              ),
            },
            {
              key: "attachments",
              label: (
                <span>
                  <PaperClipOutlined />
                  {" "}Вложения
                  {attachmentCount > 0 && (
                    <span style={{
                      marginLeft: 5, background: "#fff7e6", color: "#fa8c16",
                      borderRadius: 8, padding: "0 5px", fontSize: 11,
                    }}>
                      {attachmentCount}
                    </span>
                  )}
                </span>
              ),
              children: (
                <div style={{ padding: "0 0 24px" }}>
                  <TaskAttachments
                    projectId={projectId}
                    taskId={taskId}
                    currentUserId={currentUserId}
                    currentUserRole={currentUserRole}
                    onCountChange={setAttachmentCount}
                  />
                </div>
              ),
            },
            {
              key: "links",
              label: (
                <span>
                  <LinkOutlined />
                  {" "}Ссылки
                  {linkCount > 0 && (
                    <span style={{
                      marginLeft: 5, background: "#f9f0ff", color: "#722ed1",
                      borderRadius: 8, padding: "0 5px", fontSize: 11,
                    }}>
                      {linkCount}
                    </span>
                  )}
                </span>
              ),
              children: (
                <div style={{ padding: "0 0 24px" }}>
                  <TaskLinks
                    projectId={projectId}
                    taskId={taskId}
                    currentUserRole={currentUserRole}
                    onCountChange={setLinkCount}
                  />
                </div>
              ),
            },

          ]}
        />
      </div>
    </div>
  );
};

export default TaskDetailPage;