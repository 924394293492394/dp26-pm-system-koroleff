import { Layout, Menu } from "antd";
import {
    DashboardOutlined,
    ProjectOutlined,
    UnorderedListOutlined,
    TeamOutlined,
    SettingOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

const { Sider } = Layout;

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const [collapsed, setCollapsed] = useState(false);

    const isAdmin =
        user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

    const items = [
        {
            key: "/",
            icon: <DashboardOutlined />,
            label: "Dashboard",
        },
        {
            key: "/projects",
            icon: <ProjectOutlined />,
            label: "Projects",
        },
        {
            key: "/tasks",
            icon: <UnorderedListOutlined />,
            label: "Tasks",
        },
        {
            key: "/users",
            icon: <TeamOutlined />,
            label: "Users",
        },
        ...(isAdmin
            ? [
                {
                    key: "/admin",
                    icon: <SettingOutlined />,
                    label: "Admin Panel",
                },
            ]
            : []),
    ];

    return (
        <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={(value) => setCollapsed(value)}
            trigger={null}
            width={220}
            collapsedWidth={80}
            style={{
                background: "#001529",
                height: "100vh",
                position: "sticky",
                top: 0,
                left: 0,
            }}
        >
            <div style={styles.trigger} onClick={() => setCollapsed(!collapsed)}>
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>

            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[location.pathname]}
                items={items}
                onClick={({ key }) => navigate(key)}
            />
        </Sider>
    );
};

const styles = {
    trigger: {
        color: "#fff",
        padding: "16px",
        cursor: "pointer",
        fontSize: 18,
        textAlign: "right",
    },
};

export default Sidebar;