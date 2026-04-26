import { Layout, Button, Space, Typography, Avatar, Dropdown, Badge, Tooltip } from "antd";
import {
    UserOutlined, LogoutOutlined, BellOutlined, SettingOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const { Header } = Layout;
const { Text } = Typography;

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const userLabel = user?.profile?.firstName
        ? `${user.profile.firstName} ${user.profile.lastName || ""}`.trim()
        : user?.login || "";

    const avatarInitial = userLabel[0]?.toUpperCase() || "U";

    const palette = ["#1677ff", "#52c41a", "#722ed1", "#fa8c16", "#eb2f96", "#13c2c2"];
    const avatarColor = palette[(userLabel.charCodeAt(0) || 0) % palette.length];

    const profileMenu = {
        items: [
            {
                key: "profile",
                icon: <UserOutlined />,
                label: "Мой профиль",
                onClick: () => navigate("/profile"),
            },
            {
                key: "settings",
                icon: <SettingOutlined />,
                label: "Настройки",
                disabled: true,
            },
            { type: "divider" },
            {
                key: "logout",
                icon: <LogoutOutlined />,
                label: "Выйти",
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
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
        }}>

            <div style={{
                color: "#fff",
                fontWeight: 700,
                fontSize: 17,
                letterSpacing: "0.4px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                userSelect: "none",
            }}>
                <div style={{
                    width: 28,
                    height: 28,
                    background: "linear-gradient(135deg, #1677ff 0%, #0958d9 100%)",
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#fff",
                    flexShrink: 0,
                }}>
                    P
                </div>
                PMS-26
            </div>

            <Space size={4} align="center">

                <Tooltip title="Уведомления" placement="bottom">
                    <Badge count={0} showZero={false} offset={[-2, 2]}>
                        <Button
                            type="text"
                            icon={<BellOutlined style={{ fontSize: 17, color: "rgba(255,255,255,0.65)" }} />}
                            onClick={() => navigate("/notifications")}
                            style={{
                                width: 38,
                                height: 38,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: 8,
                            }}
                        />
                    </Badge>
                </Tooltip>

                <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.12)", margin: "0 6px" }} />

                <Dropdown
                    menu={profileMenu}
                    placement="bottomRight"
                    trigger={["click"]}
                    overlayStyle={{ minWidth: 180 }}
                >
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        cursor: "pointer",
                        padding: "5px 10px 5px 6px",
                        borderRadius: 8,
                        transition: "background 0.15s",
                        userSelect: "none",
                    }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                        <Avatar
                            size={30}
                            style={{ background: avatarColor, fontSize: 13, fontWeight: 600, flexShrink: 0 }}
                        >
                            {avatarInitial}
                        </Avatar>
                        <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 500 }}>
                            {userLabel}
                        </Text>
                    </div>
                </Dropdown>
            </Space>
        </Header>
    );
};

export default Navbar;