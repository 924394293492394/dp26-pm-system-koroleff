import { Layout } from "antd";
import { Outlet } from "react-router-dom";
import Navbar from "../Navbar";
import Sidebar from "../navigation/Sidebar";

const { Content } = Layout;

const MainLayout = () => {
  return (
    <Layout style={{ height: "100vh", overflow: "hidden", flexDirection: "column" }}>

      <Navbar />

      <Layout style={{
        flex: 1,
        overflow: "hidden",
        flexDirection: "row",
        background: "#001529",
      }}>

        <Sidebar />
        
        <Content style={{
          overflow: "auto",
          padding: "28px 32px",
          background: "#f4f6f9",
          flex: 1,
          minWidth: 0,
          borderTopLeftRadius: 16,
          marginTop: 10,
        }}>
          <Outlet />
        </Content>

      </Layout>
    </Layout>
  );
};

export default MainLayout;