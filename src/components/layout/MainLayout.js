import { Layout } from "antd";
import { Outlet } from "react-router-dom";
import Navbar from "../Navbar";
import Sidebar from "../navigation/Sidebar";

const { Content } = Layout;

const MainLayout = () => {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      
      {/* верхняя панель */}
      <Navbar />

      <Layout>
        <Sidebar />

        {/* контент */}
        <Content style={{ padding: "24px" }}>
          <Outlet />
        </Content>
      </Layout>

    </Layout>
  );
};

export default MainLayout;