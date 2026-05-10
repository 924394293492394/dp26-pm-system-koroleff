import {
  Table, Input, Select, Avatar, Tag, Typography,
  Space, Tooltip, Badge,
} from "antd";
import {
  SearchOutlined, UserOutlined, CrownOutlined, TeamOutlined,
} from "@ant-design/icons";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers } from "./api";
import { useAuth } from "../../context/AuthContext";
import { getAvatarSrc, getAvatarColor } from "../../utils/avatar";
import { getRoleConfig } from "../../utils/roles";

const { Text, Title } = Typography;


// Онлайн-статус по lastActiveAt
const getOnlineStatus = (lastActiveAt) => {
  if (!lastActiveAt) return { label: "Не в сети",  color: "#d9d9d9", dot: "default" };
  const diffMin = (Date.now() - new Date(lastActiveAt).getTime()) / 60000;
  if (diffMin < 10)  return { label: "В сети",      color: "#52c41a", dot: "success"   };
  if (diffMin < 60)  return { label: "Недавно",     color: "#faad14", dot: "warning"   };
  return                   { label: "Не в сети",    color: "#d9d9d9", dot: "default"   };
};

const UsersPage = () => {
  const navigate      = useNavigate();
  const { user: me }  = useAuth();

  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [role,    setRole]    = useState(undefined);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const limit = 20;

  const isAdmin = me?.role === "ADMIN" || me?.role === "SUPER_ADMIN";

  const load = useCallback(async (p = 1, s = search, r = role) => {
    setLoading(true);
    try {
      const params = { page: p, limit, search: s || undefined, role: r || undefined };
      const res    = await getUsers(params);
      setUsers(res?.data  || []);
      setTotal(res?.meta?.total || 0);
    } catch {

    } finally {
      setLoading(false);
    }
  }, [search, role]);

  useEffect(() => { load(1); }, []);

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
    load(1, val, role);
  };

  const handleRoleFilter = (val) => {
    setRole(val);
    setPage(1);
    load(1, search, val);
  };

  const columns = [
    {
      title:  "Пользователь",
      key:    "user",
      render: (_, record) => {
        const name      = record.profile?.firstName
          ? `${record.profile.firstName} ${record.profile.lastName || ""}`.trim()
          : null;
        const initial   = (record.login || "?")[0].toUpperCase();
        const color     = getAvatarColor(record.login);
        const avatarUrl = getAvatarSrc(record.profile?.avatarUrl);
        const status    = getOnlineStatus(record.lastActiveAt);

        return (
          <Space size={12}>
            {/* Аватарка с Badge онлайн-статуса */}
            <Badge dot status={status.dot} offset={[-4, 34]}>
              <Avatar
                size={40}
                src={avatarUrl || undefined}
                style={{
                  background: avatarUrl ? "transparent" : color,
                  fontSize:   16,
                  fontWeight: 600,
                }}
              >
                {!avatarUrl && initial}
              </Avatar>
            </Badge>

            <div style={{ lineHeight: 1.4 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                @{record.login}
              </div>
              {name && (
                <div style={{ fontSize: 12, color: "#595959" }}>{name}</div>
              )}
              {record.profile?.position && (
                <div style={{ fontSize: 11, color: "#bfbfbf" }}>
                  {record.profile.position}
                </div>
              )}
            </div>
          </Space>
        );
      },
    },

    // почта — только для админов
    ...(isAdmin ? [{
      title:  "Email",
      key:    "email",
      render: (_, record) => (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {record.email || "—"}
        </Text>
      ),
    }] : []),

    {
      title:  "Роль",
      key:    "role",
      width:  140,
      render: (_, record) => {
        const cfg = getRoleConfig(record.role);
        return (
          <Tag color={cfg.color} style={{ margin: 0 }}>
            {cfg.label}
          </Tag>
        );
      },
    },

    {
      title:  "Активность",
      key:    "lastActiveAt",
      width:  160,
      render: (_, record) => {
        const status = getOnlineStatus(record.lastActiveAt);
        return (
          <Space size={6}>
            <span style={{
              width:        8,
              height:       8,
              borderRadius: "50%",
              background:   status.color,
              display:      "inline-block",
              flexShrink:   0,
            }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {status.label}
              {record.lastActiveAt && status.dot !== "success" && (
                <span style={{ marginLeft: 4, color: "#bfbfbf" }}>
                  · {new Date(record.lastActiveAt).toLocaleDateString("ru-RU", {
                    day: "2-digit", month: "2-digit"
                  })}
                </span>
              )}
            </Text>
          </Space>
        );
      },
    },

    // Дата регистрации — только админов
    ...(isAdmin ? [{
      title:  "Регистрация",
      key:    "createdAt",
      width:  130,
      render: (_, record) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {record.createdAt
            ? new Date(record.createdAt).toLocaleDateString("ru-RU")
            : "—"
          }
        </Text>
      ),
    }] : []),
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Title level={4} style={{ margin: "0 0 4px" }}>
          <TeamOutlined style={{ marginRight: 8, color: "#1677ff" }} />
          Пользователи
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          {total} {
            total % 10 === 1 && total % 100 !== 11 ? "пользователь" :
            [2,3,4].includes(total % 10) && ![12,13,14].includes(total % 100) ? "пользователя" :
            "пользователей"
          } в системе
        </Text>
      </div>

      <div style={{
        display:      "flex",
        gap:          12,
        flexWrap:     "wrap",
        marginBottom: 16,
        padding:      "14px 18px",
        background:   "#fff",
        borderRadius: 10,
        border:       "1px solid #f0f0f0",
        boxShadow:    "0 1px 4px rgba(0,0,0,0.04)",
      }}>
        <Input.Search
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          placeholder="Поиск по логину, имени..."
          allowClear
          style={{ width: 280 }}
          onSearch={handleSearch}
          onChange={e => !e.target.value && handleSearch("")}
        />
        {/* Фильтр по роли — только для админов*/}
        {isAdmin && (
          <Select
            placeholder="Фильтр по роли"
            allowClear
            style={{ width: 180 }}
            value={role}
            onChange={handleRoleFilter}
            options={[
              { value: "USER",        label: "Участник"             },
              { value: "ADMIN",       label: "Администратор"        },
              { value: "SUPER_ADMIN", label: "Супер-Администратор"  },
            ]}
          />
        )}

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
          {/* Легенда онлайн-статусов */}
          <Space size={12}>
            {[
              { color: "#52c41a", label: "В сети (< 10 мин)"  },
              { color: "#faad14", label: "Недавно (< 1 ч)"    },
              { color: "#d9d9d9", label: "Не в сети"          },
            ].map(({ color, label }) => (
              <Space key={label} size={5}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: color, display: "inline-block",
                }} />
                <Text type="secondary" style={{ fontSize: 11 }}>{label}</Text>
              </Space>
            ))}
          </Space>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        loading={loading}
        rowKey="id"
        size="middle"
        pagination={{
          current:         page,
          total,
          pageSize:        limit,
          showSizeChanger: false,
          showTotal:       (t) => `Всего ${t} пользователей`,
          onChange:        (p) => { setPage(p); load(p); },
        }}
        onRow={(record) => ({
          onClick:      () => navigate(`/users/${record.id}`),
          style:        { cursor: "pointer" },
          onMouseEnter: e => e.currentTarget.style.background = "#f5f9ff",
          onMouseLeave: e => e.currentTarget.style.background = "",
        })}
        locale={{ emptyText: "Пользователей не найдено" }}
        style={{
          background:   "#fff",
          borderRadius: 12,
          border:       "1px solid #f0f0f0",
          overflow:     "hidden",
          boxShadow:    "0 1px 4px rgba(0,0,0,0.04)",
        }}
      />
    </div>
  );
};

export default UsersPage;