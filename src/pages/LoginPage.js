import { Form, Input, Button, Card, message, Typography } from "antd";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "../utils/errorHandler";
import { Link } from "react-router-dom";
import AuthLayout from "../components/layout/AuthLayout";

const { Title, Text } = Typography;

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      await login(values);
      message.success("Успешный вход");
      navigate("/");
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
          <Text type="secondary">Система управления проектами</Text>
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
            label="Пароль"
            name="password"
            rules={[{ required: true, message: "Введите пароль" }]}
          >
            <Input.Password size="large" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large">
            Войти
          </Button>
          <div style={{ marginTop: 12, textAlign: "center" }}>
            <Text type="secondary">
              Нет аккаунта?{" "}
              <Link to="/register">
                Зарегистрироваться
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
    padding: "12px 35px",
    borderRadius: 32,
    zIndex: 1,
    boxShadow: "0 6px 20px rgba(0,0,0,0.85)",
  },

  header: {
    textAlign: "center",
    marginBottom: 14,
  },
};

export default LoginPage;