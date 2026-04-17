import { Table, Button, Tag, Tooltip, Typography, Input, Select, Switch, Tabs } from "antd";
import { useState } from "react";
import { useProjects } from "./hooks/useProjects";
import { useNavigate } from "react-router-dom";
import CreateProjectModal from "./components/CreateProjectModal";

const ProjectsPage = () => {
    const { Link } = Typography;
    const navigate = useNavigate();

    const {
        projects, meta, loading,
        setMode, setSearch, setSort,
        setIsArchived, setPage,
    } = useProjects();

    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState("all");
    const [archived, setArchived] = useState(false); // контролируем переключатель явно

    const formatRelativeDate = (date) => {
        if (!date) return "нет данных";
        const diff = Date.now() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return "только что";
        if (minutes < 60) return `${minutes} мин назад`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} ч назад`;
        const days = Math.floor(hours / 24);
        return `${days} дн назад`;
    };

    const handleTabChange = (key) => {
        setTab(key);
        setMode(key);
        setPage(1);
    };

    const handleSortChange = (value) => {
        setSort(value);
        setPage(1);
    };

    //   const handleArchiveToggle = (checked) => {
    //     setArchived(checked);
    //     // undefined = без фильтра (все), true= только архив, false=только активные
    //     setIsArchived(checked ? true : false);
    //     setPage(1);
    //   };

    const handleArchiveToggle = (checked) => {
        setArchived(checked);
        setIsArchived(checked); // true - архив, false - активные
        setPage(1);
    };

    const handleTableChange = (pagination, _filters, sorter) => {
        if (sorter?.order) {
            const order = sorter.order === "ascend" ? "asc" : "desc";
            setSort(`createdAt_${order}`);
        }
        setPage(pagination.current);
    };

    const columns = [
        {
            title: "Название",
            dataIndex: "name",
            render: (_, record) => (
                <Tooltip
                    title={
                        <div>
                            <div style={{ fontSize: 16 }}>📁 <b>{record.name}</b></div>
                            <div style={{ marginTop: 4 }}>{record.description || "Нет описания"}</div>
                            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
                                Активность: {formatRelativeDate(record.updatedAt || record.createdAt)}
                            </div>
                        </div>
                    }
                >
                    <Link onClick={() => navigate(`/projects/${record.id}`)} style={{ cursor: "pointer" }}>
                        📁 {record.name}
                    </Link>
                </Tooltip>
            ),
        },
        {
            title: "Статус",
            dataIndex: "isArchived",
            render: (val) => val ? <Tag color="default">Архив</Tag> : <Tag color="green">Активный</Tag>,
        },
        {
            title: "Участники",
            dataIndex: "membersCount",
            render: (count) => `${count}/50`,
        },
        {
            title: "Роль",
            dataIndex: "role",
            render: (role) => {
                const config = {
                    OWNER: { color: "red", label: "Owner" },
                    MANAGER: { color: "purple", label: "Manager" },
                    MEMBER: { color: "blue", label: "Member" },
                    VIEWER: { color: "green", label: "Viewer" },
                };
                const r = config[role] || { color: "default", label: role };
                return <Tag color={r.color}>{r.label}</Tag>;
            },
        },
        {
            title: "Задачи",
            dataIndex: "tasksCount",
            render: (count) => count === 0 ? <span style={{ opacity: 0.5 }}>—</span> : count,
        },
        {
            title: "Цели",
            dataIndex: "goalsCount",
            render: (count) => count === 0 ? <span style={{ opacity: 0.5 }}>—</span> : count,
        },
        {
            title: "Дата создания",
            dataIndex: "createdAt",
            render: (value) => value ? new Date(value).toLocaleDateString() : "-",
        },
        {
            title: "Действия",
            render: (_, record) => (
                <Button size="small" onClick={() => navigate(`/projects/${record.id}`)}>
                    Открыть
                </Button>
            ),
        },
    ];

    return (
        <div>
            <Tabs
                activeKey={tab}
                onChange={handleTabChange}
                items={[
                    { key: "all", label: "Все проекты" },
                    { key: "mine", label: "Мои проекты" },
                ]}
            />

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                <Input.Search
                    placeholder="Поиск проектов..."
                    allowClear
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: 300 }}
                />

                <Select
                    defaultValue="createdAt_desc"
                    style={{ width: 230 }}
                    onChange={handleSortChange}
                    options={[
                        { value: "createdAt_desc", label: "Сначала новые (дата создания)" },
                        { value: "createdAt_asc", label: "Сначала старые (дата создания)" },
                        { value: "activity_desc", label: "По активности ↓ (свежие вверху)" },
                        { value: "activity_asc", label: "По активности ↑ (старые вверху)" },
                    ]}
                />

                <Switch
                    checked={archived}
                    checkedChildren="Архив"
                    unCheckedChildren="Активные"
                    onChange={handleArchiveToggle}
                />

                <Button type="primary" onClick={() => setOpen(true)}>
                    Создать проект
                </Button>
            </div>

            <Table
                rowKey="id"
                columns={columns}
                dataSource={projects}
                loading={loading}
                pagination={{
                    total: meta.total,
                    current: meta.currentPage,
                    pageSize: meta.perPage,
                    showSizeChanger: false,
                }}
                onChange={handleTableChange}
            />

            <CreateProjectModal
                open={open}
                onClose={() => setOpen(false)}
                onSuccess={() => {
                    setPage(1);
                    setSort("createdAt_desc");
                }}
            />
        </div>
    );
};

export default ProjectsPage;