import { Modal, Form, Select, message, Typography, Space, Spin } from "antd";
import { UserAddOutlined } from "@ant-design/icons";
import { useState, useCallback } from "react";
import { searchUsers } from "../api";
import { debounce } from "lodash";

const { Text } = Typography;

const ROLE_OPTIONS = [
    { value: "MANAGER", label: "Manager", desc: "Управление целями, задачами и участниками [lvl*3]" },
    { value: "MEMBER", label: "Member", desc: "Работа с целями и задачами [lvl2]" },
    { value: "VIEWER", label: "Viewer", desc: "Только просмотр [lvl1]" },
];

// роли, которые может назначить текущий пользователь
const ASSIGNABLE_ROLES = {
    OWNER: ["MANAGER", "MEMBER", "VIEWER"],
    MANAGER: ["MEMBER", "VIEWER"],
    MEMBER: [],
    VIEWER: [],
};

const AddMemberModal = ({ open, onClose, onAdd, saving, currentUserRole }) => {
    const [form] = Form.useForm();
    const [userOptions, setUserOptions] = useState([]);
    const [searching, setSearching] = useState(false);

    const assignable = ASSIGNABLE_ROLES[currentUserRole] || [];

    const handleSearch = useCallback(
        debounce(async (value) => {
            if (!value || value.length < 2) {
                setUserOptions([]);
                return;
            }
            try {
                setSearching(true);
                const data = await searchUsers({ search: value, limit: 10 });
                setUserOptions(
                    (data?.users || []).map((u) => ({
                        value: u.id,
                        label: u.login,
                        email: u.email,
                        firstName: u.firstName,
                        lastName: u.lastName,
                        position: u.position,
                    }))
                );
            } catch {
                setUserOptions([]);
            } finally {
                setSearching(false);
            }
        }, 400),
        []
    );

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const result = await onAdd({ userId: values.userId, role: values.role });
            if (result === true) {
                message.success("Участник добавлен");
                form.resetFields();
                setUserOptions([]);
                onClose();
            } else {
                message.error(result);
            }
        } catch {
            // позже реализовать валидацию
        }
    };

    const handleClose = () => {
        form.resetFields();
        setUserOptions([]);
        onClose();
    };

    return (
        <Modal
            title={
                <Space>
                    <UserAddOutlined />
                    <span>Добавить участника</span>
                </Space>
            }
            open={open}
            onCancel={handleClose}
            onOk={handleSubmit}
            confirmLoading={saving}
            okText="Добавить"
            cancelText="Отмена"
            width={480}
        >
            <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                <Form.Item
                    label="Пользователь"
                    name="userId"
                    rules={[{ required: true, message: "Выберите пользователя" }]}
                    extra="Начните вводить логин или email"
                >
                    <Select
                        showSearch
                        filterOption={false}
                        onSearch={handleSearch}
                        placeholder="Поиск по логину или email..."
                        notFoundContent={
                            searching
                                ? <Spin size="small" />
                                : userOptions.length === 0
                                    ? <Text type="secondary">Введите минимум 2 символа</Text>
                                    : null
                        }
                        options={userOptions.map((u) => ({
                            value: u.value,
                            label: (
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span>
                                        <Text strong>{u.label}</Text>
                                        {(u.firstName || u.lastName) && (
                                            <Text type="secondary" style={{ marginLeft: 6, fontSize: 12 }}>
                                                {[u.firstName, u.lastName].filter(Boolean).join(" ")}
                                            </Text>
                                        )}
                                    </span>
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                        {u.position || u.email}
                                    </Text>
                                </div>
                            ),
                        }))}
                    />
                </Form.Item>

                <Form.Item
                    label="Роль"
                    name="role"
                    initialValue="MEMBER"
                    rules={[{ required: true }]}
                >
                    <Select>
                        {ROLE_OPTIONS.filter((r) => assignable.includes(r.value)).map((r) => (
                            <Select.Option key={r.value} value={r.value}>
                                <div>
                                    <Text strong>{r.label}</Text>
                                    <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                                        — {r.desc}
                                    </Text>
                                </div>
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default AddMemberModal;