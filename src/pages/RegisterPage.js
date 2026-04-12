import {
    Form,
    Input,
    Button,
    Card,
    message,
    Typography
} from "antd";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "../utils/errorHandler";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";
import AuthLayout from "../components/layout/AuthLayout";

const { Title, Text } = Typography;

const RegisterPage = () => {
    const { register } = useAuth();
    const navigate = useNavigate();

    const onFinish = async (values) => {
        try {

            await register({
                login: values.login,
                email: values.email,
                firstName: values.firstName,
                lastName: values.lastName,
                password: values.password,
            });

            message.success("Регистрация успешна");
            navigate("/login");
        } catch (err) {
            message.error(getErrorMessage(err));
        }
    };

    return (
        <AuthLayout>
                <Card style={styles.card}>
                    <div style={styles.header}>
                        <Title level={2} style={{ marginBottom: 4 }}>
                            PMS-26
                        </Title>
                        <Text type="secondary">
                            Регистрация в системе
                        </Text>
                    </div>

                    <Form layout="vertical" onFinish={onFinish}>
                        <Form.Item
                            label="Логин"
                            name="login"
                            rules={[{ required: true, message: "Введите логин" }]}
                        >
                            <Input size="large" />
                        </Form.Item>

                        <Form.Item
                            label="Email"
                            name="email"
                            rules={[
                                { required: true, message: "Введите email" },
                                { type: "email", message: "Некорректный email" },
                            ]}
                        >
                            <Input size="large" />
                        </Form.Item>

                        <Form.Item
                            label="Имя"
                            name="firstName"
                            rules={[{ required: true, message: "Введите имя" }]}
                        >
                            <Input size="large" />
                        </Form.Item>

                        <Form.Item
                            label="Фамилия"
                            name="lastName"
                            rules={[{ required: true, message: "Введите фамилию" }]}
                        >
                            <Input size="large" />
                        </Form.Item>

                        <Form.Item
                            label="Пароль"
                            name="password"
                            rules={[
                                { required: true, message: "Введите пароль" },
                                { min: 6, message: "Минимум 6 символов" },
                            ]}
                            hasFeedback
                        >
                            <Input.Password size="large" />
                        </Form.Item>

                        <Form.Item
                            label="Повторите пароль"
                            name="confirmPassword"
                            dependencies={["password"]}
                            hasFeedback
                            rules={[
                                { required: true, message: "Подтвердите пароль" },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue("password") === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(
                                            new Error("Пароли не совпадают")
                                        );
                                    },
                                }),
                            ]}
                        >
                            <Input.Password size="large" />
                        </Form.Item>

                        <Button type="primary" htmlType="submit" block size="large">
                            Зарегистрироваться
                        </Button>

                        <div style={styles.footer}>
                            <Text type="secondary">
                                Уже есть аккаунт?{" "}
                                <Link to="/login">
                                    Войти в систему
                                </Link>
                            </Text>
                        </div>
                    </Form>
                </Card>
        </AuthLayout>
    );
};

const styles = {

    card: {
        width: 530,
        padding: "16px 35px",
        borderRadius: 32,
        zIndex: 1,
        boxShadow: "0 6px 20px rgba(0,0,0,0.85)",
    },

    header: {
        textAlign: "center",
        marginBottom: 12,
    },

    footer: {
        marginTop: 16,
        textAlign: "center",
    },
};

export default RegisterPage;