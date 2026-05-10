import { Layout, Button, Space, Typography, Avatar, Dropdown, Badge, Tooltip } from "antd";
import {
  UserOutlined, LogoutOutlined, BellOutlined,
  DashboardOutlined, CrownOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getAvatarSrc, getAvatarColor, getAvatarInitial } from "../utils/avatar";

const { Header } = Layout;
const { Text } = Typography;

const Navbar = ({ notifCount = 0 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  // Отображаемое имя+фамилия из профиля, иначе логин
  const displayName = user?.profile?.firstName
    ? `${user.profile.firstName} ${user.profile.lastName || ""}`.trim()
    : user?.login || "";

  const avatarInitial = getAvatarInitial(user?.login);
  const avatarColor = getAvatarColor(user?.login);
  const avatarUrl = getAvatarSrc(user?.profile?.avatarUrl);

  const profileMenu = {
    items: [
      {
        key: "name",
        label: (
          <div style={{ padding: "2px 0" }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{displayName}</div>
            <div style={{ color: "#8c8c8c", fontSize: 11 }}>{user?.email}</div>
          </div>
        ),
        disabled: true,
      },
      { type: "divider" },
      {
        key: "profile",
        icon: <UserOutlined />,
        label: "Мой профиль",
        onClick: () => navigate("/profile"),
      },
      {
        key: "dashboard",
        icon: <DashboardOutlined />,
        label: "Dashboard",
        onClick: () => navigate("/"),
      },
      ...(isAdmin ? [{
        key: "admin",
        icon: <CrownOutlined />,
        label: isSuperAdmin ? "Супер-Администрирование" : "Администрирование",
        onClick: () => navigate("/admin"),
      }] : []),
      { type: "divider" },
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Выйти из системы",
        danger: true,
        onClick: logout,
      },
    ],
  };

  return (
    <Header style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "#001529",
      padding: "0 24px",
      height: 56,
      lineHeight: "56px",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      flexShrink: 0,
    }}>

      {/* ── лого ── */}
      <div
        onClick={() => navigate("/")}
        style={{
          color: "#fff",
          fontWeight: 700,
          fontSize: 17,
          letterSpacing: "0.3px",
          display: "flex",
          alignItems: "center",
          gap: 9,
          userSelect: "none",
          cursor: "pointer",
        }}
      >
        <div style={{
          width: 30,
          height: 30,
          background: "linear-gradient(135deg, #1677ff 0%, #0958d9 100%)",
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 800,
          color: "#fff",
          flexShrink: 0,
          boxShadow: "0 2px 8px rgba(22,119,255,0.4)",
        }}>
          P
        </div>
        <span>PMS<span style={{ color: "#1677ff" }}>-26</span></span>
      </div>

      <Space size={6} align="center">

        {/* след фикс*/}
        <Tooltip title="Уведомления" placement="bottom">
          <Badge
            count={notifCount}
            offset={[-3, 3]}
            style={{ fontSize: 10, minWidth: 16, height: 16, lineHeight: "16px", padding: "0 4px" }}
          >
            <Button
              type="text"
              icon={<BellOutlined style={{ fontSize: 18, color: "rgba(255,255,255,0.65)" }} />}
              onClick={() => navigate("/notifications")}
              style={{
                width: 38,
                height: 38,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            />
          </Badge>
        </Tooltip>

        <div style={{
          width: 1,
          height: 20,
          background: "rgba(255,255,255,0.12)",
          margin: "0 4px",
        }} />

        <Dropdown
          menu={profileMenu}
          placement="bottomRight"
          trigger={["click"]}
          overlayStyle={{ minWidth: 200 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              padding: "4px 8px 4px 4px",
              borderRadius: 8,
              transition: "background 0.15s",
              userSelect: "none",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <Avatar
              size={30}
              src={avatarUrl || undefined}
              style={{
                background: avatarUrl ? "transparent" : avatarColor,
                fontSize: 13,
                fontWeight: 600,
                flexShrink: 0,
              }}
              icon={!avatarUrl && !displayName ? <UserOutlined /> : undefined}
            >
              {!avatarUrl && avatarInitial}
            </Avatar>

            <div style={{ lineHeight: 1.3 }}>
              <Text style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 13,
                fontWeight: 500,
                display: "block",
              }}>
                {displayName}
              </Text>
              {isAdmin && (
                <Text style={{ color: "#faad14", fontSize: 10, display: "block" }}>
                  {isSuperAdmin ? "Супер-Администратор" : "Администратор"}
                </Text>
              )}
            </div>
          </div>
        </Dropdown>
      </Space>
    </Header>
  );
};

export default Navbar;