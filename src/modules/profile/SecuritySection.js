import { useState, useRef } from "react";
import { Button, Form, Input, Typography, message, Divider, Tag, Alert } from "antd";
import {
  LockOutlined, MailOutlined, KeyOutlined, CheckCircleOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../context/AuthContext";
import { requestPasswordOtp, changePassword } from "./api";
import { resendVerificationRequest } from "../../api/authApi";

const { Text } = Typography;

// ── 6-значный OTP-ввод ────────────────────────────────

const OtpInput = ({ value = "", onChange }) => {
  const refs   = useRef([]);
  const digits = Array(6).fill("");
  value.split("").forEach((d, i) => { digits[i] = d; });

  const update = (idx, val) => {
    const next = [...digits];
    next[idx] = val.replace(/\D/g, "").slice(-1);
    onChange(next.join(""));
    if (next[idx] && idx < 5) refs.current[idx + 1]?.focus();
  };

  const onKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0)
      refs.current[idx - 1]?.focus();
  };

  const onPaste = (e) => {
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (p.length === 6) { onChange(p); refs.current[5]?.focus(); }
    e.preventDefault();
  };

  return (
    <div style={{ display:"flex", gap:8 }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={d}
          maxLength={1}
          inputMode="numeric"
          onChange={(e) => update(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(e, i)}
          onPaste={onPaste}
          style={{
            width:44, height:50, textAlign:"center",
            fontSize:22, fontWeight:700,
            border: d ? "1.5px solid #1677ff" : "1.5px solid #d9d9d9",
            borderRadius:8, outline:"none",
            background: d ? "#f0f5ff" : "#fafafa",
            transition:"border-color .15s",
          }}
        />
      ))}
    </div>
  );
};

// ── SecuritySection ────────────────────────────────────

const SecuritySection = ({ profile }) => {
  const { user } = useAuth();
  const isUser   = user?.role === "USER";

  const [step,       setStep]       = useState("idle"); // idle | otp_sent | form
  const [otpValue,   setOtpValue]   = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [pwLoading,  setPwLoading]  = useState(false);
  const [form]                      = Form.useForm();

  const reset = () => { setStep("idle"); setOtpValue(""); form.resetFields(); };

  const handleStart = async () => {
    if (!isUser) { setStep("form"); return; }
    setOtpLoading(true);
    try {
      await requestPasswordOtp();
      setStep("otp_sent");
      message.success("Код отправлен на email");
    } catch (err) {
      message.error(err?.response?.data?.error?.message || "Ошибка отправки кода");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSave = async (values) => {
    setPwLoading(true);
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword:     values.newPassword,
        otp: isUser ? otpValue : undefined,
      });
      message.success("Пароль успешно изменён");
      reset();
    } catch (err) {
      message.error(err?.response?.data?.error?.message || "Ошибка смены пароля");
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

      {/* ── Смена пароля ── */}
      <div style={block}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:12,
          marginBottom: step !== "idle" ? 16 : 0 }}>
          <div style={iconWrap("#f0f5ff")}>
            <LockOutlined style={{ color:"#1677ff", fontSize:15 }} />
          </div>
          <div style={{ flex:1 }}>
            <Text strong style={{ fontSize:13, display:"block" }}>Изменение пароля</Text>
            <Text type="secondary" style={{ fontSize:12 }}>
              {isUser
                ? "Подтверждение через одноразовый код на email"
                : "Текущий и новый пароль без дополнительного подтверждения"}
            </Text>
          </div>
          {step === "idle" && (
            <Button size="small" icon={<KeyOutlined />}
              onClick={handleStart} loading={otpLoading}>
              Изменить
            </Button>
          )}
        </div>

        {/* OTP ввод */}
        {step === "otp_sent" && (
          <>
            <Alert type="info" showIcon
              message="Код подтверждения отправлен на ваш email"
              style={{ marginBottom:12, borderRadius:8, fontSize:12 }}
            />
            <Text style={{ fontSize:12, display:"block", marginBottom:10 }}>
              Введите 6-значный код из письма:
            </Text>
            <OtpInput value={otpValue} onChange={setOtpValue} />
            <div style={{ display:"flex", gap:8, marginTop:14 }}>
              <Button type="primary" disabled={otpValue.length !== 6}
                onClick={() => setStep("form")}>
                Подтвердить код
              </Button>
              <Button onClick={reset}>Отмена</Button>
            </div>
          </>
        )}

        {/* Форма нового пароля */}
        {step === "form" && (
          <Form form={form} layout="vertical" onFinish={handleSave} requiredMark={false}>
            {isUser && (
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14,
                background:"#f6ffed", borderRadius:8, padding:"8px 12px", border:"1px solid #b7eb8f" }}>
                <CheckCircleOutlined style={{ color:"#52c41a" }} />
                <Text style={{ fontSize:12 }}>Код подтверждён</Text>
              </div>
            )}
            <Form.Item label="Текущий пароль" name="currentPassword"
              rules={[{ required:true, message:"Введите текущий пароль" }]}>
              <Input.Password prefix={<LockOutlined style={{ color:"#bfbfbf" }} />}
                size="large" placeholder="Текущий пароль" />
            </Form.Item>
            <Form.Item label="Новый пароль" name="newPassword"
              rules={[
                { required:true, message:"Введите новый пароль" },
                { min:6, message:"Минимум 6 символов" },
              ]}>
              <Input.Password prefix={<LockOutlined style={{ color:"#bfbfbf" }} />}
                size="large" placeholder="Минимум 6 символов" />
            </Form.Item>
            <Form.Item label="Повторите пароль" name="confirmPassword"
              dependencies={["newPassword"]}
              rules={[
                { required:true, message:"Подтвердите пароль" },
                ({ getFieldValue }) => ({
                  validator(_, v) {
                    if (!v || getFieldValue("newPassword") === v) return Promise.resolve();
                    return Promise.reject("Пароли не совпадают");
                  },
                }),
              ]}>
              <Input.Password prefix={<LockOutlined style={{ color:"#bfbfbf" }} />}
                size="large" placeholder="Повторите новый пароль" />
            </Form.Item>
            <div style={{ display:"flex", gap:8 }}>
              <Button type="primary" htmlType="submit" loading={pwLoading}>Сохранить</Button>
              <Button onClick={reset}>Отмена</Button>
            </div>
          </Form>
        )}
      </div>

      <Divider style={{ margin:"4px 0" }} />

      {/* Статус email */}
      <div style={block}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={iconWrap(profile?.isEmailVerified ? "#f6ffed" : "#fffbe6")}>
            <MailOutlined style={{
              color: profile?.isEmailVerified ? "#52c41a" : "#faad14",
              fontSize:15
            }} />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
              <Text strong style={{ fontSize:13 }}>Email</Text>
              {profile?.isEmailVerified
                ? <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontSize:11 }}>Подтверждён</Tag>
                : <Tag color="warning" style={{ fontSize:11 }}>Не подтверждён</Tag>}
            </div>
            <Text type="secondary" style={{ fontSize:12 }}>{profile?.email}</Text>
          </div>
          {!profile?.isEmailVerified && <ResendBtn email={profile?.email} />}
        </div>
      </div>

    </div>
  );
};

const ResendBtn = ({ email }) => {
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const handle = async () => {
    setLoading(true);
    try { await resendVerificationRequest(email); } catch {}
    finally { setLoading(false); setDone(true); }
  };
  if (done) return <Text style={{ fontSize:12, color:"#52c41a" }}>✓ Отправлено</Text>;
  return (
    <Button size="small" icon={<MailOutlined />} loading={loading} onClick={handle}>
      Подтвердить
    </Button>
  );
};

const block    = { background:"#fafafa", borderRadius:10, padding:"14px 16px", border:"1px solid #f0f0f0" };
const iconWrap = (bg) => ({
  width:36, height:36, borderRadius:8, background:bg, flexShrink:0,
  display:"flex", alignItems:"center", justifyContent:"center",
});

export default SecuritySection;