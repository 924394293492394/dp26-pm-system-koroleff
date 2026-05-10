import {
  Avatar, Typography, Tag, Space, Spin, Button,
  Row, Col, Tooltip, Badge,
} from "antd";
import {
  UserOutlined, ArrowLeftOutlined, CrownOutlined,
  CalendarOutlined, MailOutlined, BankOutlined,
  ProjectOutlined, CheckSquareOutlined, CommentOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserProfile } from "./api";
import { useAuth } from "../../context/AuthContext";
import { getAvatarSrc, getAvatarColor } from "../../utils/avatar";
import { getRoleConfig } from "../../utils/roles";

const { Title, Text } = Typography;


const getOnlineStatus = (lastActiveAt) => {
  if (!lastActiveAt) return { label: "Не в сети", color: "#d9d9d9", bg: "#f5f5f5", dot: "default" };
  const diffMin = (Date.now() - new Date(lastActiveAt).getTime()) / 60000;
  if (diffMin < 10) return { label: "Сейчас в сети", color: "#52c41a", bg: "#f6ffed", dot: "success" };
  if (diffMin < 60) return { label: "Недавно был(а)", color: "#faad14", bg: "#fffbe6", dot: "warning" };
  const diffH = Math.round(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  const ago = diffD > 0
    ? `${diffD} дн. назад`
    : `${diffH} ч. назад`;
  return { label: `Был(а) ${ago}`, color: "#8c8c8c", bg: "#fafafa", dot: "default" };
};

// Карточка статистики
const StatCard = ({ icon, label, value, color = "#1677ff", hint }) => (
  <Tooltip title={hint || undefined}>
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "20px 16px",
      background: "#fafafa",
      borderRadius: 12,
      border: "1px solid #f0f0f0",
      flex: 1,
      minWidth: 120,
      cursor: hint ? "help" : "default",
      transition: "box-shadow 0.15s",
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.08)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      <div style={{
        fontSize: 26,
        color,
        marginBottom: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 48,
        height: 48,
        borderRadius: 12,
        background: `${color}12`,
      }}>
        {icon}
      </div>
      <Text style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1, color: "#262626" }}>
        {value ?? 0}
      </Text>
      <Text type="secondary" style={{ fontSize: 12, marginTop: 6, textAlign: "center", lineHeight: 1.4 }}>
        {label}
      </Text>
    </div>
  </Tooltip>
);

const UserProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = me?.role === "ADMIN" || me?.role === "SUPER_ADMIN";
  const isOwnPage = me?.id === userId || me?.userId === userId;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getUserProfile(userId);
        setProfile(data?.data || data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  if (loading) return (
    <div style={{ textAlign: "center", paddingTop: 80 }}><Spin size="large" /></div>
  );

  if (!profile) return (
    <div style={{ textAlign: "center", paddingTop: 40 }}>
      <Text type="secondary">Профиль не найден</Text>
    </div>
  );

  const displayName = profile.firstName
    ? `${profile.firstName} ${profile.lastName || ""}`.trim()
    : profile.login;

  const initial = (profile.login || "?")[0].toUpperCase();
  const avatarColor = getAvatarColor(profile.login);
  const roleCfg = getRoleConfig(profile.role);
  const status = getOnlineStatus(profile.lastActiveAt);
  const stats = profile.stats || {};

  // Процент выполнения задач
  const completionRate = stats.tasksAssignedCount
    ? Math.round((stats.tasksCompletedCount / stats.tasksAssignedCount) * 100)
    : 0;

  return (
    <div>

      {/* Навигация */}
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/users")}
        style={{ marginBottom: 20 }}
      >
        К списку пользователей
      </Button>

      {/* Основная карточка */}
      <div style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #f0f0f0",
        overflow: "hidden",
        marginBottom: 16,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}>
        {/* Шапка с градиентом */}
        <div style={{
          background: "linear-gradient(135deg, #0d1f35 0%, #1a3a5c 60%, #0d2740 100%)",
          padding: "36px 40px 28px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Декоративные круги */}
          <div style={{
            position: "absolute", right: -60, top: -60,
            width: 200, height: 200,
            borderRadius: "50%",
            background: "rgba(22,119,255,0.08)",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", right: 40, bottom: -80,
            width: 150, height: 150,
            borderRadius: "50%",
            background: "rgba(22,119,255,0.05)",
            pointerEvents: "none",
          }} />

          <div style={{ display: "flex", alignItems: "flex-end", gap: 24, position: "relative" }}>
            {/* Аватар с Badge онлайн-статуса */}
            <Badge dot status={status.dot} offset={[-8, 88]}>
              <Avatar
                size={90}
                src={getAvatarSrc(profile.avatarUrl) || undefined}
                style={{
                  background: profile.avatarUrl ? "transparent" : avatarColor,
                  fontSize: 34,
                  fontWeight: 700,
                  flexShrink: 0,
                  border: "3px solid rgba(255,255,255,0.15)",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
                }}
              >
                {!profile.avatarUrl && initial}
              </Avatar>
            </Badge>

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                <Title level={2} style={{ color: "#fff", margin: 0, fontSize: 26 }}>
                  {displayName}
                </Title>
                {isOwnPage && <Tag color="blue" style={{ fontSize: 11 }}>Это вы</Tag>}
              </div>

              <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, display: "block", marginBottom: 10 }}>
                @{profile.login}
              </Text>

              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <Tag
                  color={roleCfg.color}
                  icon={roleCfg.icon}
                  style={{ fontSize: 12 }}
                >
                  {roleCfg.label}
                </Tag>

                {/* Онлайн-статус в шапке */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: 20,
                  padding: "3px 10px",
                }}>
                  <span style={{
                    width: 7, height: 7,
                    borderRadius: "50%",
                    background: status.color,
                    display: "inline-block",
                    flexShrink: 0,
                  }} />
                  <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>
                    {status.label}
                  </Text>
                </div>
              </div>
            </div>

            {/* Кнопка редактирования — только для своего профиля */}
            {isOwnPage && (
              <Button
                type="primary"
                icon={<UserOutlined />}
                onClick={() => navigate("/profile")}
                style={{ flexShrink: 0 }}
              >
                Редактировать
              </Button>
            )}
          </div>
        </div>

        {/* Детали профиля */}
        <div style={{ padding: "24px 40px" }}>
          <Row gutter={[32, 16]}>

            {/* Должность — видят все */}
            {profile.position && (
              <Col xs={24} sm={12}>
                <Space size={8}>
                  <BankOutlined style={{ color: "#8c8c8c", fontSize: 15 }} />
                  <div>
                    <Text type="secondary" style={{ fontSize: 11, display: "block" }}>Должность</Text>
                    <Text style={{ fontSize: 14 }}>{profile.position}</Text>
                  </div>
                </Space>
              </Col>
            )}

            {/* Email — Admin или сам пользователь */}
            {(isAdmin || isOwnPage) && profile.email && (
              <Col xs={24} sm={12}>
                <Space size={8}>
                  <MailOutlined style={{ color: "#8c8c8c", fontSize: 15 }} />
                  <div>
                    <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                      Email
                      {isOwnPage && !isAdmin && (
                        <Tag style={{ marginLeft: 6, fontSize: 10 }} color="default">
                          Только для вас
                        </Tag>
                      )}
                    </Text>
                    <Text style={{ fontSize: 14 }}>{profile.email}</Text>
                  </div>
                </Space>
              </Col>
            )}

            {/* Дата регистрации — Admin или сам пользователь */}
            {(isAdmin || isOwnPage) && profile.createdAt && (
              <Col xs={24} sm={12}>
                <Space size={8}>
                  <CalendarOutlined style={{ color: "#8c8c8c", fontSize: 15 }} />
                  <div>
                    <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                      В системе с
                    </Text>
                    <Text style={{ fontSize: 14 }}>
                      {new Date(profile.createdAt).toLocaleDateString("ru-RU", {
                        day: "2-digit", month: "long", year: "numeric"
                      })}
                    </Text>
                  </div>
                </Space>
              </Col>
            )}

          </Row>
        </div>
      </div>

      {/* Статистика */}
      <div style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #f0f0f0",
        padding: "24px 40px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <TrophyOutlined style={{ color: "#faad14", fontSize: 18 }} />
          <Text strong style={{ fontSize: 16 }}>Статистика участия</Text>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <StatCard
            icon={<ProjectOutlined />}
            label="Участие в проектах"
            value={stats.projectsCount}
            color="#1677ff"
            hint="Количество проектов в которых участвует пользователь"
          />
          <StatCard
            icon={<CheckSquareOutlined />}
            label="Назначено задач"
            value={stats.tasksAssignedCount}
            color="#722ed1"
            hint="Всего задач назначено на пользователя"
          />
          <StatCard
            icon={<TrophyOutlined />}
            label="Задач выполнено"
            value={stats.tasksCompletedCount}
            color="#52c41a"
            hint={`Выполнено ${completionRate}% от назначенных задач`}
          />
          <StatCard
            icon={<CommentOutlined />}
            label="Комментариев"
            value={stats.commentsCount}
            color="#13c2c2"
            hint="Количество оставленных комментариев"
          />
        </div>

        {/* Процент выполнения — если есть назначенные задачи */}
        {stats.tasksAssignedCount > 0 && (
          <div style={{
            marginTop: 20,
            padding: "12px 16px",
            background: "#f6ffed",
            borderRadius: 8,
            border: "1px solid #b7eb8f",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
            <TrophyOutlined style={{ color: "#52c41a" }} />
            <Text style={{ fontSize: 13 }}>
              Процент выполнения задач:{" "}
              <Text strong style={{ color: "#52c41a" }}>{completionRate}%</Text>
              {" "}({stats.tasksCompletedCount} из {stats.tasksAssignedCount})
            </Text>
          </div>
        )}
      </div>

    </div>
  );
};

export default UserProfilePage;