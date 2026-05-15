import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button, Input, Card, Typography, Form } from "antd";
import { MailOutlined, ArrowLeftOutlined, CheckCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { forgotPasswordRequest } from "../api/authApi";
import AuthLayout from "../components/layout/AuthLayout";
import { authStyles } from "../styles/authStyles";

const { Title, Text } = Typography;

const STORAGE_KEY_UNTIL = "forgot_pw_until";
const STORAGE_KEY_EMAIL = "forgot_pw_email";
const COOLDOWN_SEC      = 60;

const getSavedState = () => {
  const until = localStorage.getItem(STORAGE_KEY_UNTIL);
  const email = localStorage.getItem(STORAGE_KEY_EMAIL);
  if (!until || !email) return null;
  const remaining = Math.ceil((parseInt(until) - Date.now()) / 1000);
  return remaining > 0 ? { email, remaining } : null;
};

const ForgotPasswordPage = () => {
  const [form]    = Form.useForm();
  const savedRef  = useRef(getSavedState());

  const [sentEmail, setSentEmail] = useState(savedRef.current?.email    || "");
  const [seconds,   setSeconds]   = useState(savedRef.current?.remaining || 0);
  const [loading,   setLoading]   = useState(false);
  const timer = useRef(null);

  const startTimer = (sec) => {
    clearInterval(timer.current);
    setSeconds(sec);
    timer.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) { clearInterval(timer.current); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (savedRef.current?.remaining > 0) startTimer(savedRef.current.remaining);
    return () => clearInterval(timer.current);
  }, []);

  const saveAndStart = (email) => {
    localStorage.setItem(STORAGE_KEY_EMAIL, email);
    localStorage.setItem(STORAGE_KEY_UNTIL, String(Date.now() + COOLDOWN_SEC * 1000));
    setSentEmail(email);
    startTimer(COOLDOWN_SEC);
  };

  const handleSubmit = async ({ email }) => {
    setLoading(true);
    try     { await forgotPasswordRequest(email); }
    catch   {   }
    finally { saveAndStart(email); setLoading(false); }
  };

  const handleResend = async () => {
    if (seconds > 0) return;
    setLoading(true);
    try     { await forgotPasswordRequest(sentEmail); }
    catch   {   }
    finally {
      localStorage.setItem(STORAGE_KEY_UNTIL, String(Date.now() + COOLDOWN_SEC * 1000));
      startTimer(COOLDOWN_SEC);
      setLoading(false);
    }
  };

  const handleReset = () => {
    clearInterval(timer.current);
    localStorage.removeItem(STORAGE_KEY_EMAIL);
    localStorage.removeItem(STORAGE_KEY_UNTIL);
    setSentEmail(""); setSeconds(0);
    form.resetFields();
  };

  const progress = Math.round(((COOLDOWN_SEC - seconds) / COOLDOWN_SEC) * 100);

  return (
    <AuthLayout>
      <Card style={authStyles.card}>
        <div style={authStyles.header}>
          <Title level={2} style={authStyles.title}>PMS-26</Title>
          <Text style={authStyles.subtitle}>Восстановление пароля</Text>
        </div>

        {!sentEmail && (
          <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
            <Form.Item name="email" label="Email"
              rules={[{ required: true, message: "Введите email" }, { type: "email", message: "Некорректный email" }]}>
              <Input prefix={<MailOutlined style={{ color: "#bfbfbf" }} />}
                size="large" placeholder="email@example.com" style={authStyles.input} />
            </Form.Item>
            <Button type="primary" htmlType="submit" block size="large"
              loading={loading} style={authStyles.primaryButton}>
              Отправить ссылку
            </Button>
          </Form>
        )}

        {sentEmail && (
          <div style={{ textAlign: "center" }}>
            <CheckCircleOutlined style={{ fontSize: 48, color: "#52c41a", marginBottom: 14 }} />

            <div style={{ marginBottom: 14 }}>
              <Text type="secondary">Ссылка отправлена на:</Text>
              <div style={{ fontWeight: 600, marginTop: 4 }}>{sentEmail}</div>
            </div>

            <Text style={authStyles.successText}>
              Проверьте почту и папку «Спам». Ссылка активна <strong>1 час</strong>.
            </Text>

            <Button block size="large" disabled={seconds > 0} loading={loading}
              icon={seconds > 0 ? <ClockCircleOutlined /> : <MailOutlined />}
              onClick={handleResend}
              style={{ ...authStyles.secondaryButton, marginTop: 18, marginBottom: 10 }}>
              {seconds > 0 ? `Повтор через ${seconds}с` : "Отправить повторно"}
            </Button>

            {seconds > 0 && (
              <div style={{ height: 4, background: "#f0f0f0", borderRadius: 999, overflow: "hidden", marginBottom: 14 }}>
                <div style={{
                  width: `${progress}%`, height: "100%",
                  background: "#1677ff", transition: "width 1s linear",
                }} />
              </div>
            )}

            <Button type="link" onClick={handleReset} style={{ color: "#8c8c8c", fontSize: 13 }}>
              Использовать другой email
            </Button>
          </div>
        )}

        <div style={authStyles.backLinkWrapper}>
          <Link to="/login" style={authStyles.backLink}>
            <ArrowLeftOutlined style={{ marginRight: 6, fontSize: 12 }} />
            Вернуться ко входу
          </Link>
        </div>
      </Card>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;