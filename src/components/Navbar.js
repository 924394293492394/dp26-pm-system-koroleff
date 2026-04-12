import { Layout, Button, Space, Typography } from "antd";
import { useAuth } from "../hooks/useAuth";

const { Header } = Layout;
const { Text } = Typography;

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <Header style={styles.header}>
      <div style={styles.logo}>PMS-26</div>

      <Space size="middle">
        <Text style={styles.user}>{user?.login}</Text>

        <Button type="default" onClick={logout}>
          Выйти
        </Button>
      </Space>
    </Header>
  );
};

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#001529",
    padding: "0 24px",
  },

  logo: {
    color: "#fff",
    fontWeight: 600,
    fontSize: 16,
    letterSpacing: 0.5,
  },

  user: {
    color: "#fff",
    opacity: 0.85,
  },
};

export default Navbar;