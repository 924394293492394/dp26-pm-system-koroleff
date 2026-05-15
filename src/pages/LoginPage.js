import { useState, useEffect } from "react";
import { Form, Input, Button, Card, Typography, Spin, message } from "antd";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { resendVerificationRequest, getSystemStatusRequest } from "../api/authApi";
import AuthLayout from "../components/layout/AuthLayout";
import useResendCooldown from "../hooks/useResendCooldown";
import { authStyles } from "../styles/authStyles";

const { Title, Text } = Typography;

const LoginPage = () => {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const cooldown   = useResendCooldown(60, "resend_verify_cooldown");

  const [loading,         setLoading]         = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resending,       setResending]       = useState(false);
  const [systemStatus,    setSystemStatus]    = useState(null);

  useEffect(() => {
    getSystemStatusRequest()
      .then((res) => setSystemStatus(res?.data ?? res))
      .catch(()  => setSystemStatus({ userLoginEnabled: true }));
  }, []);

  const onFinish = async (values) => {
    setLoading(true);
    setUnverifiedEmail("");
    try {
      await login(values);
      navigate("/");
    } catch (err) {
      const code = err?.response?.data?.error?.code;
      const msg  = err?.response?.data?.error?.message || "Неверный логин или пароль";
      if      (code === "EMAIL_NOT_VERIFIED")   setUnverifiedEmail(err?.response?.data?.error?.data?.email || "");
      else if (code === "USER_LOGIN_DISABLED")  setSystemStatus({ userLoginEnabled: false });
      else                                      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!unverifiedEmail || cooldown.isActive) return;
    setResending(true);
    try {
      await resendVerificationRequest(unverifiedEmail);
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

  if (!systemStatus.userLoginEnabled) return (
    <AuthLayout>
      <Card style={authStyles.card}>
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🔒</div>
          <Title level={3} style={{ marginBottom: 6 }}>Вход недоступен</Title>
          <Text type="secondary">Доступ временно ограничен администрацией системы.</Text>
        </div>
      </Card>
    </AuthLayout>
  );

  return (
    <AuthLayout>
      <Card style={authStyles.card}>
        <div style={authStyles.header}>
          <Title level={2} style={authStyles.title}>PMS-26</Title>
          <Text style={authStyles.subtitle}>Система управления проектами</Text>
        </div>

        {unverifiedEmail && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 12px", borderRadius: 10,
            background: "#fffbe6", border: "1px solid #ffe58f",
            marginBottom: 14, fontSize: 13,
          }}>
            <span>⚠️</span>
            <span style={{ flex: 1, color: "#614700" }}>Email не подтверждён</span>
            <Button
              type="link" size="small"
              loading={resending} disabled={cooldown.isActive}
              onClick={handleResend}
              style={{ padding: 0, fontSize: 13, color: cooldown.isActive ? "#8c8c8c" : "#1677ff" }}
            >
              {cooldown.isActive ? `Повтор ${cooldown.seconds}с` : "Отправить"}
            </Button>
          </div>
        )}

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="Логин" name="login"
            rules={[{ required: true, message: "Введите логин" }]}>
            <Input size="large" style={authStyles.input} />
          </Form.Item>

          <Form.Item label="Пароль" name="password"
            rules={[{ required: true, message: "Введите пароль" }]}>
            <Input.Password size="large" style={authStyles.input} />
          </Form.Item>

          <div style={{ textAlign: "right", marginTop: -8, marginBottom: 14 }}>
            <Link to="/forgot-password" style={{ fontSize: 13 }}>Забыли пароль?</Link>
          </div>

          <Button type="primary" htmlType="submit" block size="large"
            loading={loading} style={authStyles.primaryButton}>
            Войти
          </Button>

          <div style={authStyles.footer}>
            <Text type="secondary">
              Нет аккаунта? <Link to="/register">Регистрация</Link>
            </Text>
          </div>
        </Form>
      </Card>
    </AuthLayout>
  );
};

export default LoginPage;