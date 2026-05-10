import { Typography, Spin, Empty, Button, Tag, Timeline } from "antd";
import {
  EditOutlined, DeleteOutlined, PlusCircleOutlined,
  CommentOutlined, PaperClipOutlined, CheckSquareOutlined,
  LinkOutlined, SwapOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ru";
import { getActivity } from "../api";
import UserBadge from "../../common/UserBadge";

dayjs.extend(relativeTime);
dayjs.locale("ru");

const ACTION_MAP = {
  CREATED:          { color: "#52c41a", icon: <PlusCircleOutlined />,  label: "создал задачу"           },
  STATUS_CHANGED:   { color: "#1677ff", icon: <SwapOutlined />,        label: "изменил статус"          },
  PRIORITY_CHANGED: { color: "#faad14", icon: <EditOutlined />,        label: "изменил приоритет"       },
  ASSIGNEE_CHANGED: { color: "#722ed1", icon: <EditOutlined />,        label: "изменил исполнителя"     },
  DUEDATE_CHANGED:  { color: "#13c2c2", icon: <EditOutlined />,        label: "изменил дедлайн"         },
  COMMENT_ADDED:    { color: "#1677ff", icon: <CommentOutlined />,     label: "добавил комментарий"     },
  UPLOAD_ATTACHMENTS: { color: "#fa8c16", icon: <PaperClipOutlined />, label: "загрузил вложения"       },
  DELETE_ATTACHMENT:  { color: "#ff4d4f", icon: <DeleteOutlined />,    label: "удалил вложение"         },
};

const READABLE = {
  TODO: "К выполнению", IN_PROGRESS: "В работе",
  REVIEW: "На проверке", DONE: "Готово",
  LOW: "Низкий", MEDIUM: "Средний", HIGH: "Высокий", CRITICAL: "Критический",
};

const ActivityItem = ({ item }) => {
  const cfg   = ACTION_MAP[item.action] || { color: "#d9d9d9", icon: <EditOutlined />, label: item.action };
  const when  = dayjs(item.createdAt).fromNow();
  const exact = dayjs(item.createdAt).format("DD.MM.YYYY HH:mm");

  const oldVal = item.oldValue ? (READABLE[item.oldValue] || item.oldValue) : null;
  const newVal = item.newValue ? (READABLE[item.newValue] || item.newValue) : null;

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0" }}>
      {/* Иконка */}
      <div style={{
        width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
        background: `${cfg.color}18`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: cfg.color, fontSize: 13,
      }}>
        {cfg.icon}
      </div>

      {/* Текст */}
      <div style={{ flex: 1, paddingTop: 4 }}>
        <div style={{ fontSize: 13, lineHeight: "1.5" }}>
          <UserBadge user={item.user} avatarSize={16} fontSize="13px" showLogin />
          {" "}
          <span style={{ color: "#595959" }}>{cfg.label}</span>
          {oldVal && newVal && (
            <span style={{ fontSize: 12, color: "#8c8c8c", marginLeft: 6 }}>
              <Tag style={{ margin: 0, fontSize: 11 }}>{oldVal}</Tag>
              {" → "}
              <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>{newVal}</Tag>
            </span>
          )}
          {newVal && !oldVal && (
            <span style={{ fontSize: 12, color: "#8c8c8c", marginLeft: 6 }}>
              <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>{newVal}</Tag>
            </span>
          )}
        </div>
        <Typography.Text
          type="secondary"
          style={{ fontSize: 11 }}
          title={exact}
        >
          {when}
        </Typography.Text>
      </div>
    </div>
  );
};

const TaskActivity = ({ projectId, taskId }) => {
  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [hasMore,     setHasMore]     = useState(false);
  const [page,        setPage]        = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = async (p = 1, append = false) => {
    p === 1 ? setLoading(true) : setLoadingMore(true);
    try {
      const res  = await getActivity(projectId, taskId, { page: p, limit: 20 });
      const data = res.data || [];
      setItems(prev => append ? [...prev, ...data] : data);
      setHasMore(p < (res.meta?.pages || 1));
      setPage(p);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { load(1); }, [projectId, taskId]);

  if (loading) return (
    <div style={{ textAlign: "center", padding: 32 }}><Spin /></div>
  );

  if (items.length === 0) return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description="История изменений пуста"
      style={{ padding: "24px 0" }}
    />
  );

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", divider: "1px solid #f5f5f5" }}>
        {items.map((item, i) => (
          <div key={item.id} style={{
            borderBottom: i < items.length - 1 ? "1px solid #f5f5f5" : "none",
          }}>
            <ActivityItem item={item} />
          </div>
        ))}
      </div>

      {hasMore && (
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <Button
            type="link" size="small"
            loading={loadingMore}
            onClick={() => load(page + 1, true)}
          >
            Загрузить ещё
          </Button>
        </div>
      )}
    </div>
  );
};

export default TaskActivity;