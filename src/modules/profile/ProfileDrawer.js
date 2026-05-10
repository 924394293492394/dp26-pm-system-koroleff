import { useEffect } from "react";
import { Drawer, Form, Input, Button, Avatar, Typography, Divider, Popconfirm } from "antd";
import { UserOutlined, BankOutlined, DeleteOutlined } from "@ant-design/icons";
import { getAvatarSrc, getAvatarColor, getAvatarInitial } from "../../utils/avatar";

const { Text } = Typography;

const ProfileDrawer = ({
  open,
  onClose,
  profile,
  onSave,
  saving,
  onDeleteAvatar,
  deletingAvatar,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && profile) {
      form.setFieldsValue({
        firstName: profile.firstName || "",
        lastName:  profile.lastName  || "",
        position:  profile.position  || "",
      });
    }
  }, [open, profile, form]);

  const handleSave = async () => {
    const values = await form.validateFields();
    await onSave(values);
  };

  const login   = profile?.login || "?";
  const src     = getAvatarSrc(profile?.avatarUrl);
  const color   = getAvatarColor(login);
  const initial = getAvatarInitial(login);

  return (
    <Drawer
      title="Редактировать профиль"
      placement="right"
      width={420}
      open={open}
      onClose={onClose}
      styles={{ body: { paddingTop: 20 } }}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "4px 0" }}>
          <Button onClick={onClose}>Отмена</Button>
          <Button type="primary" loading={saving} onClick={handleSave}>
            Сохранить
          </Button>
        </div>
      }
    >
      {/* Превью аватара + удаление */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <Avatar
          size={72}
          src={src || undefined}
          style={{
            background: src ? "transparent" : color,
            fontSize: 26,
            fontWeight: 700,
          }}
        >
          {!src && initial}
        </Avatar>

        <div style={{ marginTop: 10 }}>
          {src ? (
            <Popconfirm
              title="Удалить фото профиля?"
              description="Будет установлено изображение по умолчанию."
              okText="Удалить"
              cancelText="Отмена"
              okButtonProps={{ danger: true }}
              onConfirm={onDeleteAvatar}
            >
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                loading={deletingAvatar}
                style={{ fontSize: 12 }}
              >
                Удалить фото
              </Button>
            </Popconfirm>
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Нажмите на аватар в профиле, чтобы загрузить фото
            </Text>
          )}
        </div>
      </div>

      <Divider style={{ margin: "0 0 20px" }} />

      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          label="Имя"
          name="firstName"
          rules={[
            { required: true, message: "Введите имя" },
            { min: 2, message: "Минимум 2 символа" },
          ]}
        >
          <Input
            prefix={<UserOutlined style={{ color: "#bfbfbf" }} />}
            placeholder="Имя"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Фамилия"
          name="lastName"
          rules={[
            { required: true, message: "Введите фамилию" },
            { min: 2, message: "Минимум 2 символа" },
          ]}
        >
          <Input
            prefix={<UserOutlined style={{ color: "#bfbfbf" }} />}
            placeholder="Фамилия"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Должность"
          name="position"
          rules={[{ max: 100, message: "Максимум 100 символов" }]}
        >
          <Input
            prefix={<BankOutlined style={{ color: "#bfbfbf" }} />}
            placeholder="Например: Frontend Developer"
            size="large"
          />
        </Form.Item>

        <div style={{ background: "#f6f8fa", borderRadius: 8, padding: "10px 14px", marginTop: 4 }}>
          <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.6 }}>
            Логин и email изменить нельзя. Смена пароля — в разделе «Безопасность» (Sprint 6).
          </Text>
        </div>
      </Form>
    </Drawer>
  );
};

export default ProfileDrawer;