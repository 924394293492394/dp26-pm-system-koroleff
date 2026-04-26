import { Avatar, Tooltip, Space } from "antd";
import { UserOutlined, MailOutlined } from "@ant-design/icons";

// Палитра цветов аватарок — стабильна по первой букве логина
const PALETTE = ["#1677ff", "#52c41a", "#722ed1", "#fa8c16", "#eb2f96", "#13c2c2", "#f5222d", "#08979c"];

export const getUserColor = (user) => {
  const key = user?.login || user?.email || "?";
  return PALETTE[(key.charCodeAt(0) || 0) % PALETTE.length];
};

export const getUserInitial = (user) => {
  return (user?.login || user?.email || "?")[0].toUpperCase();
};

// Tooltip-контент — логин + email + имя если есть
const UserTooltipContent = ({ user }) => (
  <div style={{ fontSize: 12, lineHeight: 1.6 }}>
    <div style={{ fontWeight: 600, marginBottom: 2 }}>@{user.login}</div>
    {(user.profile?.firstName || user.profile?.lastName) && (
      <div style={{ color: "rgba(255,255,255,0.75)" }}>
        {[user.profile.firstName, user.profile.lastName].filter(Boolean).join(" ")}
      </div>
    )}
    {user.email && (
      <div style={{ color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: 4 }}>
        <MailOutlined style={{ fontSize: 10 }} />
        {user.email}
      </div>
    )}
  </div>
);

/**
 * UserBadge — единый компонент отображения пользователя
 *
 * @param {object}  user        — объект пользователя (login, email, profile)
 * @param {string}  emptyLabel  — текст если user=null (по умолчанию "Не назначен")
 * @param {number}  avatarSize  — размер аватарки (по умолчанию 18)
 * @param {boolean} showLogin   — показывать логин рядом с аватаркой (по умолчанию true)
 * @param {string}  fontSize    — размер текста логина (по умолчанию "12px")
 */
const UserBadge = ({
  user,
  emptyLabel = "Не назначен",
  avatarSize = 18,
  showLogin = true,
  fontSize = "12px",
}) => {
  if (!user) {
    return (
      <Space size={5} style={{ fontSize }}>
        <Avatar
          size={avatarSize}
          style={{
            background: "#f0f0f0",
            border: "1px dashed #d9d9d9",
            color: "#bfbfbf",
            fontSize: avatarSize * 0.55,
            flexShrink: 0,
          }}
          icon={<UserOutlined style={{ fontSize: avatarSize * 0.55 }} />}
        />
        {showLogin && (
          <span style={{ color: "#bfbfbf", fontStyle: "italic", fontSize }}>
            {emptyLabel}
          </span>
        )}
      </Space>
    );
  }

  const color = getUserColor(user);
  const initial = getUserInitial(user);

  return (
    <Tooltip
      title={<UserTooltipContent user={user} />}
      placement="top"
    >
      <Space size={5} style={{ cursor: "default", fontSize }}>
        <Avatar
          size={avatarSize}
          style={{
            background: color,
            color: "#fff",
            fontSize: avatarSize * 0.55,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {initial}
        </Avatar>
        {showLogin && (
          <span style={{ color: "#595959", fontSize }}>
            {user.login}
          </span>
        )}
      </Space>
    </Tooltip>
  );
};

export default UserBadge;