import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button, Spin, Typography, Result, Card, message } from "antd";
import { CheckCircleOutlined, MailOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { verifyEmailRequest, resendVerificationRequest } from "../api/authApi";
import AuthLayout from "../components/layout/AuthLayout";
import { authStyles } from "../styles/authStyles";

const { Text } = Typography;

const VerifyEmailPage = () => {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const token     = params.get("token");

  const [status,    setStatus]    = useState("loading");
  const [errorMsg,  setErrorMsg]  = useState("");
  const [resending, setResending] = useState(false);
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    if (!token) {
      setStatus("error");
      setErrorMsg("Токен не передан. Используйте ссылку из письма.");
      return;
    }
    verifyEmailRequest(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setErrorMsg(
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          "Ссылка недействительна или истекла"
        );
      });
  }, [token]);

  const handleResend = async () => {
    const email = prompt("Введите ваш email для повторной отправки:");
    if (!email) return;
    setResending(true);
    try {
      await resendVerificationRequest(email);
      message.success("Письмо отправлено — проверьте почту");
    } catch (err) {
      message.warning(err?.response?.data?.error?.message || "Попробуйте позже");
    } finally {
      setResending(false);
    }
  };

  if (status === "loading") return (
    <AuthLayout><Spin size="large" /></AuthLayout>
  );

  return (
    <AuthLayout>
      <Card style={authStyles.compactCard}>
        {status === "success" ? (
          <Result
            icon={<CheckCircleOutlined style={{ color: "#52c41a", fontSize: authStyles.resultIcon.fontSize }} />}
            title="Email подтверждён!"
            subTitle={<Text style={authStyles.successText}>Теперь вы можете войти в систему.</Text>}
            extra={
              <Button type="primary" size="large" onClick={() => navigate("/login")}
                style={authStyles.primaryButton}>
                Войти
              </Button>
            }
          />
        ) : (
          <Result
            status="error"
            title="Ошибка подтверждения"
            subTitle={<Text style={authStyles.successText}>{errorMsg}</Text>}
            extra={
              <Button icon={<MailOutlined />} loading={resending}
                onClick={handleResend} style={authStyles.secondaryButton}>
                Отправить повторно
              </Button>
            }
          />
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

export default VerifyEmailPage;