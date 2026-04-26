import { Modal, Form, Input, Select, DatePicker, Space, message, Row, Col } from "antd";
import { CheckSquareOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { createTask } from "../api";
import { getMembers } from "../../projects/api";
import { getGoals } from "../../goals/api";
import { TASK_STATUS_CONFIG } from "./TaskStatusTag";
import { PRIORITY_CONFIG } from "./TaskPriorityBadge";

const CreateTaskModal = ({ open, onClose, projectId, initialGoalId, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [goals, setGoals] = useState([]);

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
    if (open && initialGoalId) {
      form.setFieldValue("goalId", initialGoalId);
    }
  }, [open, initialGoalId, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const task = await createTask(projectId, {
        title: values.title,
        description: values.description || undefined,
        status: values.status || "TODO",
        priority: values.priority || "MEDIUM",
        goalId: values.goalId || undefined,
        assignedTo: values.assignedTo || undefined,
        dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
      });
      message.success("Задача создана");
      form.resetFields();
      onSuccess?.(task);
      onClose();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.response?.data?.error?.message || "Ошибка создания");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<Space><CheckSquareOutlined /><span>Создать задачу</span></Space>}
      open={open}
      onCancel={() => { form.resetFields(); onClose(); }}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="Создать"
      cancelText="Отмена"
      width={560}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          label="Название"
          name="title"
          rules={[
            { required: true, message: "Введите название" },
            { min: 3, message: "Минимум 3 символа" },
          ]}
        >
          <Input placeholder="Коротко опишите задачу..." maxLength={200} showCount />
        </Form.Item>

        <Form.Item label="Описание" name="description">
          <Input.TextArea rows={3} placeholder="Детали задачи..." maxLength={2000} showCount />
        </Form.Item>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item label="Статус" name="status" initialValue="TODO">
              <Select>
                {Object.entries(TASK_STATUS_CONFIG).map(([v, { label }]) => (
                  <Select.Option key={v} value={v}>{label}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Приоритет" name="priority" initialValue="MEDIUM">
              <Select>
                {Object.entries(PRIORITY_CONFIG).map(([v, { label, icon }]) => (
                  <Select.Option key={v} value={v}>{icon} {label}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item label="Исполнитель" name="assignedTo">
              <Select placeholder="Назначить..." allowClear showSearch
                filterOption={(inp, opt) => opt?.label?.toLowerCase().includes(inp.toLowerCase())}
              >
                {members.map(m => (
                  <Select.Option key={m.userId} value={m.userId} label={m.user?.login}>
                    {m.user?.login} <span style={{ color: "#8c8c8c", fontSize: 11 }}>({m.role})</span>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Цель" name="goalId">
              <Select placeholder="Привязать к цели..." allowClear showSearch
                filterOption={(inp, opt) => opt?.label?.toLowerCase().includes(inp.toLowerCase())}
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
          <DatePicker
            style={{ width: "100%" }}
            format="DD.MM.YYYY"
            placeholder="Срок выполнения"
            disabledDate={d => d && d < dayjs().startOf("day")}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateTaskModal;