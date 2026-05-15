import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import {
  Button, Tag, Typography, Space, Skeleton,
  Row, Col, Card, Statistic, Tooltip,
  Breadcrumb, Divider, Result, Tabs,
} from "antd";
import {
  SettingOutlined, ArrowLeftOutlined,
  TeamOutlined, CheckSquareOutlined,
  AimOutlined, ClockCircleOutlined,
  CalendarOutlined, UserOutlined,
} from "@ant-design/icons";
import { useProject } from "./hooks/useProject";
import { useAuth } from "../../context/AuthContext";
import ProjectSettingsDrawer from "./components/ProjectSettingsDrawer";
import MembersTab from "./components/MembersTab";
import GoalsTab from "../goals/components/GoalsTab";
import TasksTab from "../tasks/components/TasksTab";

const { Title, Text, Paragraph } = Typography;

const formatDate = (d) => d ? new Date(d).toLocaleDateString("ru-RU") : "—";
const formatRelativeDate = (d) => {
  if (!d) return "нет данных";
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "только что";
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  return `${Math.floor(h / 24)} дн назад`;
};

const ROLE_CONFIG = {
  OWNER: { color: "red", label: "Owner", hint: "Полный доступ к настройкам" },
  MANAGER: { color: "purple", label: "Manager", hint: "Управление задачами и участниками" },
  MEMBER: { color: "blue", label: "Member", hint: "Участник проекта" },
  VIEWER: { color: "green", label: "Viewer", hint: "Только просмотр" },
};

const ProjectDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "overview"
  );

  const { project, loading, saving, update, toggleArchive, remove, refetch } = useProject(id);

  if (loading) {
    return <div style={{ padding: "24px 0" }}><Skeleton active paragraph={{ rows: 8 }} /></div>;
  }

  if (!project) {
    return (
      <Result
        status="404"
        title="Проект не найден"
        subTitle="Возможно, он был удалён или у вас нет доступа"
        extra={<Button type="primary" onClick={() => navigate("/projects")}>К списку проектов</Button>}
      />
    );
  }

  const role = ROLE_CONFIG[project.role] || ROLE_CONFIG.VIEWER;
  const isOwner = project.role === "OWNER";

  const handleDelete = async () => {
    await remove();
    navigate("/projects");
  };

  // вкладка "Обзор"
  const OverviewTab = (
    <div>
      {/* статистика */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        {[
          { title: "Участники", value: `${project.membersCount}/50`, icon: <TeamOutlined style={{ color: "#1677ff" }} />, bg: "#e6f4ff" },
          { title: "Задачи", value: project.tasksCount || "—", icon: <CheckSquareOutlined style={{ color: "#52c41a" }} />, bg: "#f6ffed" },
          { title: "Цели", value: project.goalsCount || "—", icon: <AimOutlined style={{ color: "#fa8c16" }} />, bg: "#fff7e6" },
        ].map((s) => (
          <Col xs={24} sm={8} key={s.title}>
            <Card size="small" style={{ background: s.bg, border: "none" }} bodyStyle={{ padding: "16px 20px" }}>
              <Statistic
                title={<Space size={4}>{s.icon}<span>{s.title}</span></Space>}
                value={s.value}
                valueStyle={{ fontSize: 22, fontWeight: 600 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Описание */}
      <Card title="О проекте" size="small" style={{ marginBottom: 16 }} bodyStyle={{ padding: "16px 20px" }}>
        {project.description
          ? <Paragraph style={{ margin: 0, whiteSpace: "pre-wrap" }}>{project.description}</Paragraph>
          : <Text type="secondary">Описание не добавлено</Text>
        }
      </Card>

      {/* Мета */}
      <Card size="small" bodyStyle={{ padding: "12px 20px" }}>
        <Row gutter={24} wrap>
          {[
            { icon: <CalendarOutlined />, label: "Создан", value: formatDate(project.createdAt) },
            { icon: <ClockCircleOutlined />, label: "Последняя активность", value: formatRelativeDate(project.updatedAt || project.createdAt) },
            { icon: <UserOutlined />, label: "Ваша роль", value: <Tag color={role.color}>{role.label}</Tag> },
          ].map((item) => (
            <Col key={item.label} xs={24} sm={8}>
              <Space size={6} style={{ padding: "4px 0" }}>
                <Text type="secondary">{item.icon}</Text>
                <Text type="secondary">{item.label}:</Text>
                <Text strong>{item.value}</Text>
              </Space>
            </Col>
          ))}
        </Row>
      </Card>

      <Divider style={{ margin: "24px 0 0" }} />
    </div>
  );

  const tabs = [
    {
      key: "overview",
      label: <Space><AimOutlined />Обзор</Space>,
      children: OverviewTab,
    },
    {
      key: "members",
      label: (
        <Space>
          <TeamOutlined />
          Участники
          <Tag style={{ marginLeft: 2 }}>{project.membersCount}</Tag>
        </Space>
      ),
      children: (
        <MembersTab
          projectId={id}
          currentUserRole={project.role}
          currentUserId={user?.id || user?.userId}
        />
      ),
    },
    {
      key: "goals",
      label: (
        <Space>
          <AimOutlined />
          Цели
          {project.goalsCount > 0 && <Tag style={{ marginLeft: 2 }}>{project.goalsCount}</Tag>}
        </Space>
      ),
      children: (
        <GoalsTab
          projectId={id}
          currentUserRole={project.role}
          currentUserId={user?.id || user?.userId}
          onGoalCountChange={refetch}
        />
      ),
    },
    {
      key: "tasks",
      label: (
        <Space>
          <CheckSquareOutlined />
          Задачи
          {project.tasksCount > 0 && <Tag style={{ marginLeft: 2 }}>{project.tasksCount}</Tag>}
        </Space>
      ),
      children: (
        <TasksTab
          projectId={id}
          currentUserRole={project.role}
          currentUserId={user?.id || user?.userId}
          onTaskCountChange={refetch}
        />
      ),
    },
  ];

  return (
    <div style={{ maxWidth: "100%" }}>
      {/* хлеб крошки */}
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <span style={{ cursor: "pointer" }} onClick={() => navigate("/projects")}>Проекты</span> },
          { title: project.name },
        ]}
      />

      {/* шапка */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
        <Space align="start" size={12} style={{ flex: 1, minWidth: 0 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/projects")} />
          <div>
            <Space wrap size={8} style={{ marginBottom: 4 }}>
              <Title level={3} style={{ margin: 0, lineHeight: 1.3 }}>
                {project.name}
              </Title>
              <Tag color={project.isArchived ? "default" : "success"}>
                {project.isArchived ? "Архив" : "Активный"}
              </Tag>
              <Tooltip title={role.hint}>
                <Tag color={role.color}>{role.label}</Tag>
              </Tooltip>
            </Space>
          </div>
        </Space>

        <Tooltip title={isOwner ? "Настройки проекта" : "Только для владельца"}>
          <Button icon={<SettingOutlined />} onClick={() => setSettingsOpen(true)}>
            Настройки
          </Button>
        </Tooltip>
      </div>

      {/* вкладки */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabs}
        style={{ marginTop: 4 }}
      />

      {/* дровер настроек */}
      <ProjectSettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        project={project}
        saving={saving}
        onUpdate={update}
        onToggleArchive={toggleArchive}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default ProjectDetailsPage;