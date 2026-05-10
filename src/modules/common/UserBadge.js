import { Avatar, Tooltip, Space } from "antd";
import { UserOutlined, MailOutlined } from "@ant-design/icons";
import { getAvatarSrc, getAvatarColor, getAvatarInitial } from "../../utils/avatar";

// экспортируем для обратной совместимости (taskComments импортирует напрямую)
export const getUserColor   = (user) => getAvatarColor(user?.login || user?.email);
export const getUserInitial = (user) => getAvatarInitial(user?.login || user?.email);

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

const UserBadge = ({
  user,
  emptyLabel = "Не назначен",
  avatarSize = 18,
  showLogin  = true,
  fontSize   = "12px",
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

  const login   = user?.login || user?.email;
  const color   = getAvatarColor(login);
  const initial = getAvatarInitial(login);
  const src     = getAvatarSrc(user?.profile?.avatarUrl);

  return (
    <Tooltip title={<UserTooltipContent user={user} />} placement="top">
      <Space size={5} style={{ cursor: "default", fontSize }}>
        <Avatar
          size={avatarSize}
          src={src || undefined}
          style={{
            background: src ? "transparent" : color,
            color: "#fff",
            fontSize: avatarSize * 0.55,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {!src && initial}
        </Avatar>
        {showLogin && (
          <span style={{ color: "#595959", fontSize }}>{user.login}</span>
        )}
      </Space>
    </Tooltip>
  );
};

export default UserBadge;