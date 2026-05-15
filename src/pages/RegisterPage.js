import { useState, useEffect } from "react";
import { Form, Input, Button, Card, Typography, Spin, Result, message } from "antd";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";
import { resendVerificationRequest, getSystemStatusRequest } from "../api/authApi";
import AuthLayout from "../components/layout/AuthLayout";
import { MailOutlined } from "@ant-design/icons";
import useResendCooldown from "../hooks/useResendCooldown";
import { authStyles } from "../styles/authStyles";

const { Title, Text } = Typography;

const RegisterPage = () => {
  const { register } = useAuth();
  const cooldown     = useResendCooldown(60, "resend_register_cooldown");

  const [loading,      setLoading]      = useState(false);
  const [registered,   setRegistered]   = useState("");
  const [resending,    setResending]    = useState(false);
  const [systemStatus, setSystemStatus] = useState(null);

  useEffect(() => {
    getSystemStatusRequest()
      .then((res) => setSystemStatus(res?.data ?? res))
      .catch(()  => setSystemStatus({ registrationEnabled: true }));
  }, []);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await register({
        login:     values.login,
        email:     values.email,
        firstName: values.firstName,
        lastName:  values.lastName,
        password:  values.password,
      });
      setRegistered(values.email);
    } catch (err) {
      message.error(
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        "Ошибка регистрации"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown.isActive) return;
    setResending(true);
    try {
      await resendVerificationRequest(registered);
      message.success("Письмо отправлено — проверьте почту");
    } catch (err) {
      message.warning(err?.response?.data?.error?.message || "Попробуйте позже");
    } finally {
      setResending(false);
      cooldown.start();
    }
  };

  if (!systemStatus) return (
    <AuthLayout><Spin size="large" /></AuthLayout>
  );

  if (registered) return (
    <AuthLayout>
      <Card style={authStyles.compactCard}>
        <Result
          icon={<MailOutlined style={{ color: "#1677ff", fontSize: authStyles.resultIcon.fontSize }} />}
          title="Подтвердите email"
          subTitle={
            <Text style={authStyles.successText}>
              Письмо отправлено на <b>{registered}</b>.<br />
              Перейдите по ссылке для завершения регистрации.
            </Text>
          }
          extra={
            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
              <Button icon={<MailOutlined />} loading={resending}
                disabled={cooldown.isActive} onClick={handleResend}
                style={authStyles.secondaryButton}>
                {cooldown.isActive ? `Повтор через ${cooldown.seconds}с` : "Отправить повторно"}
              </Button>
              <Link to="/login"><Button type="link">Вернуться ко входу</Button></Link>
            </div>
          }
        />
      </Card>
    </AuthLayout>
  );

  if (!systemStatus.registrationEnabled) return (
    <AuthLayout>
      <Card style={authStyles.card}>
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🚫</div>
          <Title level={3} style={{ marginBottom: 8 }}>Регистрация закрыта</Title>
          <Text type="secondary">Регистрация новых пользователей временно отключена.</Text>
          <div style={{ marginTop: 18 }}>
            <Link to="/login">
              <Button type="primary" block style={authStyles.primaryButton}>Войти</Button>
            </Link>
          </div>
        </div>
      </Card>
    </AuthLayout>
  );

  return (
    <AuthLayout>
      <Card style={authStyles.card}>
        <div style={authStyles.header}>
          <Title level={2} style={authStyles.title}>PMS-26</Title>
          <Text style={authStyles.subtitle}>Создание аккаунта</Text>
        </div>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="Логин" name="login"
            rules={[{ required: true, message: "Введите логин" }]}>
            <Input size="large" style={authStyles.input} />
          </Form.Item>

          <Form.Item label="Email" name="email"
            rules={[{ required: true, message: "Введите email" }, { type: "email", message: "Некорректный email" }]}>
            <Input size="large" style={authStyles.input} />
          </Form.Item>

          <Form.Item label="Имя" name="firstName"
            rules={[{ required: true, message: "Введите имя" }]}>
            <Input size="large" style={authStyles.input} />
          </Form.Item>

          <Form.Item label="Фамилия" name="lastName"
            rules={[{ required: true, message: "Введите фамилию" }]}>
            <Input size="large" style={authStyles.input} />
          </Form.Item>

          <Form.Item label="Пароль" name="password" hasFeedback
            rules={[{ required: true, message: "Введите пароль" }, { min: 6, message: "Минимум 6 символов" }]}>
            <Input.Password size="large" style={authStyles.input} />
          </Form.Item>

          <Form.Item label="Повторите пароль" name="confirmPassword"
            dependencies={["password"]} hasFeedback
            rules={[
              { required: true, message: "Подтвердите пароль" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) return Promise.resolve();
                  return Promise.reject(new Error("Пароли не совпадают"));
                },
              }),
            ]}>
            <Input.Password size="large" style={authStyles.input} />
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large"
            loading={loading} style={authStyles.primaryButton}>
            Зарегистрироваться
          </Button>

          <div style={authStyles.footer}>
            <Text type="secondary">
              Уже есть аккаунт? <Link to="/login">Войти</Link>
            </Text>
          </div>
        </Form>
      </Card>
    </AuthLayout>
  );
};

export default RegisterPage;