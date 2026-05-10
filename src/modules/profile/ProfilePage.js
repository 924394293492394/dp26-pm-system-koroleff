import { Avatar, Typography, Tag, Space, Spin, Button, Badge, message, Tooltip, Row, Col } from "antd";
import {
  UserOutlined, EditOutlined, MailOutlined, BankOutlined,
  ProjectOutlined, CheckSquareOutlined, CommentOutlined,
  TrophyOutlined, LockOutlined, LoginOutlined,
} from "@ant-design/icons";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { getMyProfile, updateMyProfile, uploadAvatar, deleteAvatar } from "./api";
import { getAvatarSrc, getAvatarColor } from "../../utils/avatar";
import { getRoleConfig } from "../../utils/roles";
import ProfileDrawer from "./ProfileDrawer";

const { Title, Text } = Typography;


const getOnlineStatus = (lastActiveAt) => {
  if (!lastActiveAt) return { label: "Не в сети", color: "#d9d9d9", dot: "default" };
  const diff = (Date.now() - new Date(lastActiveAt).getTime()) / 60000;
  if (diff < 10) return { label: "Сейчас в сети",  color: "#52c41a", dot: "success" };
  if (diff < 60) return { label: "Недавно был(а)", color: "#faad14", dot: "warning" };
  const h = Math.round(diff / 60), d = Math.floor(h / 24);
  return { label: `Был(а) ${d > 0 ? `${d} дн.` : `${h} ч.`} назад`, color: "#8c8c8c", dot: "default" };
};

// ── Карточка статистики ──────────────────────────────────
const StatItem = ({ icon, label, value, color }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 12,
    padding: "12px 0", borderBottom: "1px solid #f0f0f0",
  }}>
    <div style={{
      width: 38, height: 38, borderRadius: 8, flexShrink: 0,
      background: `${color}15`, display: "flex",
      alignItems: "center", justifyContent: "center",
      fontSize: 17, color,
    }}>
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <Text type="secondary" style={{ fontSize: 11, display: "block" }}>{label}</Text>
      <Text style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>{value ?? 0}</Text>
    </div>
  </div>
);

// ── Основной компонент ───────────────────────────────────
const ProfilePage = () => {
  const { refreshUser } = useAuth();
  const [profile,       setProfile]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [hoverAvatar,   setHoverAvatar]   = useState(false);
  const fileInputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const res  = await getMyProfile();
      setProfile(res?.data ?? res);
    } catch {
      message.error("Не удалось загрузить профиль");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  // ── Сохранение данных профиля ──
  const handleSave = async (values) => {
    setSaving(true);
    try {
      await updateMyProfile(values);
      message.success("Профиль обновлён");
      setDrawerOpen(false);
      await load();
      await refreshUser();
    } catch (err) {
      message.error(err?.response?.data?.error?.message || "Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  // ── Загрузка нового аватара ──
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024)  { message.error("Файл больше 5 МБ"); return; }
    if (!file.type.startsWith("image/")) { message.error("Только изображения"); return; }

    setAvatarLoading(true);
    try {
      await uploadAvatar(file);
      message.success("Аватар обновлён");
      await load();
      await refreshUser();
    } catch {
      message.error("Ошибка загрузки аватара");
    } finally {
      setAvatarLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Удаление аватара ──
  const handleAvatarDelete = async () => {
    setAvatarLoading(true);
    try {
      await deleteAvatar();
      message.success("Аватар удалён");
      await load();
      await refreshUser();
    } catch {
      message.error("Ошибка при удалении аватара");
    } finally {
      setAvatarLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: "center", paddingTop: 80 }}><Spin size="large" /></div>;
  if (!profile) return <div style={{ textAlign: "center", paddingTop: 40 }}><Text type="secondary">Профиль не найден</Text></div>;

  const displayName = profile.firstName
    ? `${profile.firstName} ${profile.lastName || ""}`.trim()
    : profile.login;
  const initial    = (profile.login || "?")[0].toUpperCase();
  const color      = getAvatarColor(profile.login);
  const roleCfg    = getRoleConfig(profile.role);
  const status     = getOnlineStatus(profile.lastActiveAt);
  const avatarSrc  = getAvatarSrc(profile.avatarUrl);
  const stats      = profile.stats || {};
  const completion = stats.tasksAssignedCount
    ? Math.round((stats.tasksCompletedCount / stats.tasksAssignedCount) * 100)
    : 0;

  return (
    <div>

      <div style={{
        background: "linear-gradient(135deg, #0d1f35 0%, #1a3a5c 60%, #0d2740 100%)",
        borderRadius: 16, overflow: "hidden", marginBottom: 20,
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        position: "relative",
      }}>
        {/* Декоративные круги */}
        <div style={{ position:"absolute", right:-60, top:-60, width:200, height:200, borderRadius:"50%", background:"rgba(22,119,255,0.08)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", right:40, bottom:-80, width:150, height:150, borderRadius:"50%", background:"rgba(22,119,255,0.05)", pointerEvents:"none" }} />

        <div style={{ padding: "32px 36px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>

            <div style={{ position: "relative", flexShrink: 0 }}>
              <Tooltip title={avatarSrc ? "Нажмите, чтобы изменить фото" : "Нажмите, чтобы загрузить фото"} placement="bottom">
                <div
                  onClick={() => !avatarLoading && fileInputRef.current?.click()}
                  onMouseEnter={() => setHoverAvatar(true)}
                  onMouseLeave={() => setHoverAvatar(false)}
                  style={{ position: "relative", cursor: avatarLoading ? "not-allowed" : "pointer", display: "inline-block" }}
                >
                  <Badge dot status={status.dot} offset={[-6, 86]}>
                    <Avatar
                      size={92}
                      src={avatarSrc || undefined}
                      style={{
                        background: avatarSrc ? "transparent" : color,
                        fontSize:   34,
                        fontWeight: 700,
                        lineHeight: "92px",
                        border:     "3px solid rgba(255,255,255,0.15)",
                        boxShadow:  "0 6px 20px rgba(0,0,0,0.3)",
                        flexShrink: 0,
                      }}
                    >
                      {!avatarSrc && initial}
                    </Avatar>
                  </Badge>

                  {(hoverAvatar || avatarLoading) && (
                    <div style={{
                      position: "absolute", inset: 0, borderRadius: "50%",
                      background: "rgba(0,0,0,0.45)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "opacity 0.15s",
                    }}>
                      {avatarLoading
                        ? <Spin size="small" style={{ filter: "invert(1)" }} />
                        : <EditOutlined style={{ color: "#fff", fontSize: 20 }} />}
                    </div>
                  )}
                </div>
              </Tooltip>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarUpload}
              />
            </div>

            {/* ── Имя, роль, статус ── */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                <Title level={2} style={{ color: "#fff", margin: 0, fontSize: 26 }}>
                  {displayName}
                </Title>
                <Tag color="blue" style={{ fontSize: 11 }}>Это вы</Tag>
              </div>

              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, display: "block", marginBottom: 10 }}>
                @{profile.login}
              </Text>

              <Space size={8} wrap>
                <Tag color={roleCfg.color} style={{ fontSize: 12 }}>{roleCfg.label}</Tag>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: "3px 10px",
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: status.color, display: "inline-block" }} />
                  <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>{status.label}</Text>
                </div>
              </Space>
            </div>

            <Button icon={<EditOutlined />} type="primary" onClick={() => setDrawerOpen(true)}>
              Редактировать
            </Button>
          </div>
        </div>
      </div>

      {/* ОСНОВНОЙ КОНТЕНТ: 2 колонки */}
      <Row gutter={16} align="top">

        {/* Левая колонка — детали + безопасность */}
        <Col xs={24} lg={16}>

          {/* Информация о профиле */}
          <div style={{
            background: "#fff", borderRadius: 14, border: "1px solid #f0f0f0",
            padding: "22px 28px", marginBottom: 16,
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          }}>
            <Text strong style={{ fontSize: 14, display: "block", marginBottom: 16, color: "#262626" }}>
              Личные данные
            </Text>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {profile.position ? (
                <Space size={10}>
                  <BankOutlined style={{ color: "#8c8c8c", fontSize: 15 }} />
                  <div>
                    <Text type="secondary" style={{ fontSize: 11, display: "block" }}>Должность</Text>
                    <Text style={{ fontSize: 14 }}>{profile.position}</Text>
                  </div>
                </Space>
              ) : (
                <div style={{ background: "#fffbe6", border: "1px solid #ffe58f", borderRadius: 8, padding: "10px 14px" }}>
                  <Text style={{ fontSize: 13 }}>
                    <EditOutlined style={{ marginRight: 6, color: "#faad14" }} />
                    Должность не указана.{" "}
                    <a onClick={() => setDrawerOpen(true)} style={{ cursor: "pointer" }}>Добавить</a>
                  </Text>
                </div>
              )}

              <Space size={10}>
                <MailOutlined style={{ color: "#8c8c8c", fontSize: 15 }} />
                <div>
                  <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                    Email <Tag style={{ marginLeft: 4, fontSize: 10 }} color="default">Только для вас</Tag>
                  </Text>
                  <Text style={{ fontSize: 14 }}>{profile.email}</Text>
                </div>
              </Space>

              {profile.createdAt && (
                <Space size={10}>
                  <LoginOutlined style={{ color: "#8c8c8c", fontSize: 15 }} />
                  <div>
                    <Text type="secondary" style={{ fontSize: 11, display: "block" }}>В системе с</Text>
                    <Text style={{ fontSize: 14 }}>
                      {new Date(profile.createdAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" })}
                    </Text>
                  </div>
                </Space>
              )}
            </div>
          </div>

          {/* Безопасность */}
          <div style={{
            background: "#fff", borderRadius: 14, border: "1px solid #f0f0f0",
            padding: "22px 28px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <LockOutlined style={{ color: "#1677ff", fontSize: 16 }} />
              <Text strong style={{ fontSize: 14 }}>Безопасность</Text>
            </div>

            {[
              { title: "Изменение пароля", desc: "Для обычных пользователей — через код на email. Для администраторов — без подтверждения.", sprint: "Sprint 6" },
              { title: "Подтверждение Email", desc: "Обязательная верификация адреса после регистрации. Используется для восстановления доступа.", sprint: "Sprint 6" },
            ].map(({ title, desc, sprint }) => (
              <div key={title} style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                padding: "14px 0", borderBottom: "1px solid #f5f5f5",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, background: "#f0f5ff", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <LockOutlined style={{ color: "#1677ff", fontSize: 15 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <Text strong style={{ fontSize: 13, display: "block" }}>{title}</Text>
                  <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.5 }}>{desc}</Text>
                </div>
                <Tag color="default" style={{ flexShrink: 0 }}>{sprint}</Tag>
              </div>
            ))}
          </div>
        </Col>

        {/* Правая колонка — статистика */}
        <Col xs={24} lg={8}>
          <div style={{
            background: "#fff", borderRadius: 14, border: "1px solid #f0f0f0",
            padding: "22px 24px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            position: "sticky", top: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <TrophyOutlined style={{ color: "#faad14", fontSize: 16 }} />
              <Text strong style={{ fontSize: 14 }}>Статистика</Text>
            </div>

            <StatItem icon={<ProjectOutlined />}       label="Участие в проектах"  value={stats.projectsCount}        color="#1677ff" />
            <StatItem icon={<CheckSquareOutlined />}   label="Задач назначено"      value={stats.tasksAssignedCount}   color="#722ed1" />
            <StatItem icon={<TrophyOutlined />}        label="Задач выполнено"      value={stats.tasksCompletedCount}  color="#52c41a" />
            <StatItem icon={<CommentOutlined />}       label="Комментариев"         value={stats.commentsCount}        color="#13c2c2" />

            {/* Прогресс */}
            {stats.tasksAssignedCount > 0 && (
              <div style={{ marginTop: 16, padding: "12px 14px", background: "#f6ffed", borderRadius: 8, border: "1px solid #b7eb8f" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <Text style={{ fontSize: 12 }}>Выполнение задач</Text>
                  <Text strong style={{ fontSize: 12, color: "#52c41a" }}>{completion}%</Text>
                </div>
                <div style={{ height: 6, background: "#d9f7be", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${completion}%`, background: "#52c41a", borderRadius: 4, transition: "width 0.4s" }} />
                </div>
              </div>
            )}
          </div>
        </Col>
      </Row>

      <ProfileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        profile={profile}
        onSave={handleSave}
        saving={saving}
        onDeleteAvatar={handleAvatarDelete}
        deletingAvatar={avatarLoading}
      />
    </div>
  );
};

export default ProfilePage;