import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button, Form, Input, Card, Typography, Result, message } from "antd";
import { LockOutlined, CheckCircleOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { resetPasswordRequest } from "../api/authApi";
import AuthLayout from "../components/layout/AuthLayout";
import { authStyles } from "../styles/authStyles";

const { Title, Text } = Typography;

const ResetPasswordPage = () => {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const token     = params.get("token");

  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  if (!token) return (
    <AuthLayout>
      <Card style={authStyles.compactCard}>
        <Result status="error" title="Ссылка недействительна"
          subTitle="Запросите новую ссылку для сброса пароля."
          extra={<Link to="/forgot-password">
            <Button type="primary" style={authStyles.primaryButton}>Запросить снова</Button>
          </Link>}
        />
      </Card>
    </AuthLayout>
  );

  if (done) return (
    <AuthLayout>
      <Card style={authStyles.compactCard}>
        <Result
          icon={<CheckCircleOutlined style={{ color: "#52c41a", fontSize: authStyles.resultIcon.fontSize }} />}
          title="Пароль изменён!"
          subTitle={<Text style={authStyles.successText}>Войдите с новым паролем.</Text>}
          extra={
            <Button type="primary" size="large" onClick={() => navigate("/login")}
              style={authStyles.primaryButton}>
              Войти
            </Button>
          }
        />
      </Card>
    </AuthLayout>
  );

  const onFinish = async ({ password }) => {
    setLoading(true);
    try {
      await resetPasswordRequest(token, password);
      setDone(true);
    } catch (err) {
      message.error(
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        "Ошибка. Возможно, ссылка истекла."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card style={authStyles.card}>
        <div style={authStyles.header}>
          <Title level={2} style={authStyles.title}>PMS-26</Title>
          <Text style={authStyles.subtitle}>Установка нового пароля</Text>
        </div>

        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item label="Новый пароль" name="password"
            rules={[{ required: true, message: "Введите пароль" }, { min: 6, message: "Минимум 6 символов" }]}>
            <Input.Password prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
              size="large" placeholder="Минимум 6 символов" style={authStyles.input} />
          </Form.Item>

          <Form.Item label="Повторите пароль" name="confirm" dependencies={["password"]}
            rules={[
              { required: true, message: "Подтвердите пароль" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) return Promise.resolve();
                  return Promise.reject(new Error("Пароли не совпадают"));
                },
              }),
            ]}>
            <Input.Password prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
              size="large" placeholder="Повторите пароль" style={authStyles.input} />
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large"
            loading={loading} style={authStyles.primaryButton}>
            Сохранить пароль
          </Button>
        </Form>

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

export default ResetPasswordPage;