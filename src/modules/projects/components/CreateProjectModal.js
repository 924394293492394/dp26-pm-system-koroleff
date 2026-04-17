import { Modal, Form, Input, message } from "antd";
import { useState } from "react";
import { createProject } from "../api";

const CreateProjectModal = ({ open, onClose, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            setLoading(true);

            await createProject({
                name: values.name,
                description: values.description,
            });

            message.success("Проект успешно создан");

            form.resetFields();
            onClose();
            onSuccess({ page: 1 }); // рефетч списка

        } catch (err) {
            if (err?.errorFields) {
                // ошибки формы — игнорируем (antd сам покажет)
                return;
            }

            console.error("Ошибка создания проекта:", err);
            message.error("Не удалось создать проект");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Создать проект"
            open={open}
            onCancel={onClose}
            onOk={handleSubmit}
            confirmLoading={loading}
            okText="Создать"
            cancelText="Отмена"
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    label="Название проекта"
                    name="name"
                    rules={[
                        { required: true, message: "Введите название проекта" },
                        { min: 3, message: "Минимум 3 символа" },
                    ]}
                >
                    <Input placeholder="Введите название..." />
                </Form.Item>

                <Form.Item
                    label="Описание"
                    name="description"
                >
                    <Input.TextArea rows={4} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default CreateProjectModal;