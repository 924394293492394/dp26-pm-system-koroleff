import { Modal, Form, Input, DatePicker, Select, Space, message } from "antd";
import { AimOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { createGoal } from "../api";
import { getMembers } from "../../projects/api";

const CreateGoalModal = ({ open, onClose, projectId, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (open && projectId) {
      getMembers(projectId, { limit: 100 })
        .then(d => setMembers(
          (d?.members || []).filter(m => m.role !== "VIEWER")
        ))
        .catch(() => { });
    }
  }, [open, projectId]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const goal = await createGoal(projectId, {
        title: values.title,
        description: values.description || undefined,
        dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
        responsibleUserId: values.responsibleUserId || undefined,
      });
      message.success("Цель создана");
      form.resetFields();
      onSuccess?.(goal);
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
      title={<Space><AimOutlined /><span>Создать цель</span></Space>}
      open={open}
      onCancel={() => { form.resetFields(); onClose(); }}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="Создать"
      cancelText="Отмена"
      width={520}
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
          <Input placeholder="Например: Запустить MVP к концу квартала" maxLength={255} showCount />
        </Form.Item>

        <Form.Item label="Описание" name="description">
          <Input.TextArea rows={3} placeholder="Детали и контекст цели..." maxLength={1000} showCount />
        </Form.Item>

        <Form.Item label="Срок выполнения" name="dueDate">
          <DatePicker
            style={{ width: "100%" }}
            format="DD.MM.YYYY"
            placeholder="Выберите дату"
            disabledDate={d => d && d < dayjs().startOf("day")}
          />
        </Form.Item>

        <Form.Item label="Ответственный" name="responsibleUserId">
          <Select placeholder="Назначить ответственного..." allowClear showSearch
            filterOption={(input, opt) => opt?.label?.toLowerCase().includes(input.toLowerCase())}
          >
            {members.map(m => (
              <Select.Option key={m.userId} value={m.userId} label={m.user?.login}>
                <Space size={4}>
                  <span>{m.user?.login}</span>
                  <span style={{ color: "#8c8c8c", fontSize: 11 }}>({m.role})</span>
                </Space>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateGoalModal;