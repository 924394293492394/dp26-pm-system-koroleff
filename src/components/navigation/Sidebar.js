import { Layout, Menu, Tooltip } from "antd";
import {
  DashboardOutlined, ProjectOutlined, TeamOutlined,
  SettingOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  CheckSquareOutlined, AimOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

const { Sider } = Layout;

const getSelectedKey = (pathname) => {
  if (pathname.startsWith("/projects")) return "/projects";
  if (pathname.startsWith("/goals")) return "/goals";
  if (pathname.startsWith("/tasks")) return "/tasks";
  if (pathname.startsWith("/users")) return "/users";
  if (pathname.startsWith("/admin")) return "/admin";
  return "/";
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const items = [
    { key: "/", icon: <DashboardOutlined />, label: "Dashboard" },
    { key: "/projects", icon: <ProjectOutlined />, label: "Проекты" },
    { key: "/goals", icon: <AimOutlined />, label: "Цели" },
    { key: "/tasks", icon: <CheckSquareOutlined />, label: "Задачи" },
    { key: "/users", icon: <TeamOutlined />, label: "Пользователи" },
    ...(isAdmin ? [{ key: "/admin", icon: <SettingOutlined />, label: "Admin" }] : []),
  ];

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      trigger={null}
      width={220}
      collapsedWidth={64}
      style={{ background: "#001529", flexShrink: 0 }}
    >
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

        <div style={{ flex: 1, overflow: "hidden auto" }}>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[getSelectedKey(location.pathname)]}
            items={items}
            onClick={({ key }) => navigate(key)}
            style={{
              background: "transparent",
              border: "none",
              paddingTop: 8,
              paddingBottom: 8,
            }}
          />
        </div>

        <Tooltip title={collapsed ? "Развернуть" : "Свернуть"} placement="right">
          <div
            onClick={() => setCollapsed(!collapsed)}
            style={{
              height: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              borderTop: "1px solid rgba(255,255,255,0.07)",
              color: "rgba(255,255,255,0.40)",
              fontSize: 16,
              transition: "color 0.2s, background 0.2s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = "rgba(255,255,255,0.85)";
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = "rgba(255,255,255,0.40)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
        </Tooltip>

      </div>
    </Sider>
  );
};

export default Sidebar;