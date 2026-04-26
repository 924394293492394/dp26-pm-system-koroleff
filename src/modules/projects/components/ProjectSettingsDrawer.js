import {
  Drawer, Form, Input, Button, Divider, Popconfirm,
  Typography, Space, Tag, Alert, message, Tooltip,
} from "antd";
import {
  SaveOutlined, InboxOutlined, RollbackOutlined,
  DeleteOutlined, InfoCircleOutlined,
} from "@ant-design/icons";
import { useEffect } from "react";

const { Title, Text } = Typography;

const Section = ({ title, hint, children }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ marginBottom: 12 }}>
      <Text strong style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", color: "#8c8c8c" }}>
        {title}
      </Text>
      {hint && (
        <Tooltip title={hint}>
          <InfoCircleOutlined style={{ marginLeft: 6, color: "#bfbfbf", fontSize: 12 }} />
        </Tooltip>
      )}
    </div>
    {children}
  </div>
);

const ProjectSettingsDrawer = ({ open, onClose, project, saving, onUpdate, onToggleArchive, onDelete }) => {
  const [form] = Form.useForm();
  const isOwner = project?.role === "OWNER";

  useEffect(() => {
    if (open && project) {
      form.setFieldsValue({ name: project.name, description: project.description });
    }
  }, [open, project, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const ok = await onUpdate(values);
      if (ok) message.success("Изменения сохранены");
      else message.error("Не удалось сохранить изменения");
    } catch {
      // ошибки формы — antd сам покажет
    }
  };

  const handleToggleArchive = async () => {
    const ok = await onToggleArchive();
    if (ok) message.success(project.isArchived ? "Проект разархивирован" : "Проект архивирован");
    else message.error("Ошибка при изменении статуса");
  };

  const handleDelete = async () => {
    try {
      await onDelete();
      message.success("Проект удалён");
      onClose();
    } catch {
      message.error("Не удалось удалить проект");
    }
  };

  return (
    <Drawer
      title={
        <Space>
          <span>⚙️ Настройки проекта</span>
          {project?.isArchived && <Tag color="default">Архив</Tag>}
        </Space>
      }
      open={open}
      onClose={onClose}
      width={420}
      footer={null}
    >
      {!isOwner && (
        <Alert
          type="info"
          showIcon
          message="Только владелец проекта может изменять настройки"
          style={{ marginBottom: 24 }}
        />
      )}

      <Section title="Основная информация" hint="Название и описание отображаются во всех представлениях проекта">
        <Form form={form} layout="vertical" disabled={!isOwner}>
          <Form.Item
            label="Название проекта"
            name="name"
            rules={[
              { required: true, message: "Введите название" },
              { min: 3, message: "Минимум 3 символа" },
            ]}
          >
            <Input placeholder="Название проекта" maxLength={100} showCount />
          </Form.Item>

          <Form.Item label="Описание" name="description">
            <Input.TextArea
              rows={4}
              placeholder="Коротко опишите цель проекта..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          {isOwner && (
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={handleSave}
              block
            >
              Сохранить изменения
            </Button>
          )}
        </Form>
      </Section>

      <Divider />

      <Section
        title="Видимость"
        hint="Архивированные проекты скрыты из основного списка, но остаются доступны по прямой ссылке"
      >
        {isOwner ? (
          <Popconfirm
            title={project?.isArchived ? "Разархивировать проект?" : "Архивировать проект?"}
            description={
              project?.isArchived
                ? "Проект снова появится в активных проектах."
                : "Проект будет скрыт из основного списка."
            }
            onConfirm={handleToggleArchive}
            okText="Да"
            cancelText="Отмена"
          >
            <Button
              icon={project?.isArchived ? <RollbackOutlined /> : <InboxOutlined />}
              block
              loading={saving}
            >
              {project?.isArchived ? "Разархивировать проект" : "Архивировать проект"}
            </Button>
          </Popconfirm>
        ) : (
          <Button icon={<InboxOutlined />} block disabled>
            {project?.isArchived ? "Разархивировать проект" : "Архивировать проект"}
          </Button>
        )}
      </Section>

      {isOwner && (
        <>
          <Divider />
          <Section title="Опасная зона" hint="Необратимые действия — будьте внимательны">
            <Alert
              type="error"
              showIcon
              message="Удаление проекта"
              description="Все задачи, цели и данные проекта будут безвозвратно удалены. Это действие нельзя отменить."
              style={{ marginBottom: 12 }}
            />
            <Popconfirm
              title="Удалить проект?"
              description={`Введите название «${project?.name}» для подтверждения`}
              onConfirm={handleDelete}
              okText="Удалить"
              okButtonProps={{ danger: true }}
              cancelText="Отмена"
            >
              <Button danger icon={<DeleteOutlined />} block>
                Удалить проект
              </Button>
            </Popconfirm>
          </Section>
        </>
      )}
    </Drawer>
  );
};

export default ProjectSettingsDrawer;