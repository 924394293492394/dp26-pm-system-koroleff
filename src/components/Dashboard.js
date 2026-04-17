import { Card, Typography } from "antd";

const { Title } = Typography;

const Dashboard = () => {
  return (
    <div>
      <Title level={3}>Dashboard</Title>

      <Card>
        Добро пожаловать в PMS-26
      </Card>
    </div>
  );
};

export default Dashboard;