import {
  Table, Tag, Button, Select, Space, Input,
  Typography, Popconfirm, Avatar, Tooltip, message,
} from "antd";
import {
  UserAddOutlined, LogoutOutlined, DeleteOutlined,
  UserOutlined, CrownOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { useMembers } from "../hooks/useMembers";
import AddMemberModal from "./AddMemberModal";
import { useNavigate } from "react-router-dom";
import { getAvatarSrc, getAvatarColor, getAvatarInitial } from "../../../utils/avatar";

const { Text } = Typography;

const ROLE_CONFIG = {
  OWNER: { color: "red", label: "Owner", icon: <CrownOutlined /> },
  MANAGER: { color: "purple", label: "Manager", icon: null },
  MEMBER: { color: "blue", label: "Member", icon: null },
  VIEWER: { color: "green", label: "Viewer", icon: null },
};

// роли, которые может назначить текущий пользователь
const MANAGEABLE_ROLES = {
  OWNER: ["MANAGER", "MEMBER", "VIEWER"],
  MANAGER: ["MEMBER", "VIEWER"],
  MEMBER: [],
  VIEWER: [],
};

const ROLE_HIERARCHY = { OWNER: 4, MANAGER: 3, MEMBER: 2, VIEWER: 1 };

const MembersTab = ({ projectId, currentUserRole, currentUserId }) => {
  const navigate = useNavigate();

  const {
    members,
    meta,
    loading,
    saving,
    fetch,
    add,
    updateRole,
    remove,
    leave,
  } = useMembers(projectId);

  const [addOpen, setAddOpen] = useState(false);

  const canManage = ["OWNER", "MANAGER"].includes(currentUserRole);
  const manageable = MANAGEABLE_ROLES[currentUserRole] || [];

  // проверка на управление других пользователь (ниже стоящих)
  const canManageMember = (targetRole, targetUserId) => {
    if (targetUserId === currentUserId) return false;
    if (targetRole === "OWNER") return false;

    return ROLE_HIERARCHY[currentUserRole] > ROLE_HIERARCHY[targetRole];
  };

  const handleRoleChange = async (userId, newRole) => {
    const result = await updateRole(userId, newRole);

    if (result === true) {
      message.success("Роль изменена");
    } else {
      message.error(result);
    }
  };

  const handleRemove = async (userId, login) => {
    const result = await remove(userId);

    if (result === true) {
      message.success(`${login} удалён из проекта`);
    } else {
      message.error(result);
    }
  };

  const handleLeave = async () => {
    try {
      await leave();
      message.success("Вы покинули проект");
      navigate("/projects");
    } catch (err) {
      message.error(err?.response?.data?.error?.message || "Ошибка");
    }
  };

  const columns = [
    {
      title: "Участник",
      key: "user",
      render: (_, record) => (
        <Space>
          <Avatar
            size={32}
            src={getAvatarSrc(record.user?.profile?.avatarUrl) || undefined}
            style={{
              background: getAvatarSrc(record.user?.profile?.avatarUrl)
                ? "transparent"
                : getAvatarColor(record.user?.login),
              fontSize: 14,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {!getAvatarSrc(record.user?.profile?.avatarUrl)
              && getAvatarInitial(record.user?.login)}
          </Avatar>

          <div>
            <div>
              <Text strong>{record.user?.login}</Text>

              {record.userId === currentUserId && (
                <Tag color="blue" style={{ marginLeft: 6, fontSize: 11 }}>
                  Вы
                </Tag>
              )}
            </div>

            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.user?.email}
            </Text>
          </div>
        </Space>
      ),
    },

    {
      title: "Роль",
      dataIndex: "role",
      width: 200,

      render: (role, record) => {
        const cfg = ROLE_CONFIG[role] || {
          color: "default",
          label: role,
        };

        const canChange = canManageMember(role, record.userId);

        if (canChange && manageable.length > 0) {
          return (
            <Select
              value={role}
              size="small"
              style={{ width: 130 }}
              loading={saving}
              onChange={(newRole) => handleRoleChange(record.userId, newRole)}
              options={manageable.map((r) => ({
                value: r,
                label: ROLE_CONFIG[r]?.label || r,
              }))}
            />
          );
        }

        return (
          <Tag color={cfg.color} icon={cfg.icon}>
            {cfg.label}
          </Tag>
        );
      },
    },

    {
      title: "Дата вступления",
      dataIndex: "joinedAt",
      width: 160,
      render: (val) => (
        val
          ? new Date(val).toLocaleDateString("ru-RU")
          : "—"
      ),
    },

    {
      title: "Действия",
      key: "actions",
      width: 100,

      render: (_, record) => {
        if (!canManageMember(record.role, record.userId)) {
          return null;
        }

        return (
          <Popconfirm
            title={`Удалить ${record.user?.login} из проекта?`}
            onConfirm={() => handleRemove(record.userId, record.user?.login)}
            okText="Удалить"
            okButtonProps={{ danger: true }}
            cancelText="Отмена"
          >
            <Tooltip title="Удалить из проекта">
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                loading={saving}
              />
            </Tooltip>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <Space wrap>
          <Input.Search
            placeholder="Поиск по логину или email..."
            allowClear
            style={{ width: 260 }}
            onSearch={(value) => fetch({ search: value, page: 1 })}
            onChange={(e) => !e.target.value && fetch({ search: "", page: 1 })}
          />

          <Select
            placeholder="Фильтр по роли"
            allowClear
            style={{ width: 150 }}
            onChange={(val) => fetch({ role: val, page: 1 })}
            options={Object.entries(ROLE_CONFIG).map(([value, { label }]) => ({
              value,
              label,
            }))}
          />
        </Space>

        <Space>
          {currentUserRole !== "OWNER" && (
            <Popconfirm
              title="Покинуть проект?"
              description="Вы потеряете доступ ко всем данным проекта."
              onConfirm={handleLeave}
              okText="Покинуть"
              okButtonProps={{ danger: true }}
              cancelText="Отмена"
            >
              <Button icon={<LogoutOutlined />} danger>
                Покинуть проект
              </Button>
            </Popconfirm>
          )}

          {canManage && (
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => setAddOpen(true)}
            >
              Добавить участника
            </Button>
          )}
        </Space>
      </div>

      <Table
        rowKey={(r) => r.userId}
        columns={columns}
        dataSource={members}
        loading={loading}
        pagination={{
          total: meta.total,
          current: meta.page,
          pageSize: meta.limit,
          showSizeChanger: false,
          onChange: (page) => fetch({ page }),
        }}
        locale={{ emptyText: "Участников пока нет" }}
      />

      <AddMemberModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={add}
        saving={saving}
        currentUserRole={currentUserRole}
      />
    </div>
  );
};

export default MembersTab;