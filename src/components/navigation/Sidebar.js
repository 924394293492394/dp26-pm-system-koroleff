import { Layout, Menu, Tooltip } from "antd";
import {
  DashboardOutlined, ProjectOutlined, TeamOutlined,
  SettingOutlined, CheckSquareOutlined, AimOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
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

const SIDEBAR_BG = "#0d1f35";
const SIDEBAR_HOVER = "rgba(255,255,255,0.06)";
const SIDEBAR_ITEM_ACTIVE = "rgba(22, 119, 255, 0.15)";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const selectedKey = getSelectedKey(location.pathname);

  const menuItems = [
    {
      key: "/",
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },
    {
      key: "/projects",
      icon: <ProjectOutlined />,
      label: "Проекты",
    },
    {
      key: "/goals",
      icon: <AimOutlined />,
      label: "Цели",
    },
    {
      key: "/tasks",
      icon: <CheckSquareOutlined />,
      label: "Задачи",
    },
    {
      key: "/users",
      icon: <TeamOutlined />,
      label: "Пользователи",
    },
    ...(isAdmin ? [{
      key: "/admin",
      icon: <SettingOutlined />,
      label: "Администрирование",
    }] : []),
  ];

  return (
    <div style={{
      paddingTop: 10,
      paddingBottom: 10,
      paddingLeft: 10,
      background: "#001529",
      flexShrink: 0,
    }}>
      <Sider
        width={200}
        style={{
          background: SIDEBAR_BG,
          borderRadius: 12,
          overflow: "hidden",
          height: "100%",
          boxShadow: "0 2px 16px rgba(0,0,0,0.25)",
        }}
      >
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => navigate(key)}
          style={{
            background: "transparent",
            border: "none",
            paddingTop: 10,
            paddingBottom: 10,
            height: "100%",
          }}
          items={menuItems.map(item => ({
            key: item.key,
            label: item.label,
            icon: (
              <Tooltip
                title={item.label}
                placement="right"
                mouseEnterDelay={0.8}
              >
                {item.icon}
              </Tooltip>
            ),
            style: {
              borderRadius: 8,
              marginBottom: 2,
            },
          }))}
        />
      </Sider>
    </div>
  );
};

export default Sidebar;