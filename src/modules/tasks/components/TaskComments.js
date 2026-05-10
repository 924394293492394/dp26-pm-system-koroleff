import {
  Input, Button, Space, Typography, Avatar,
  Popconfirm, message, Spin, Empty, Pagination,
  Tooltip, Popover,
} from "antd";
import {
  SendOutlined, EditOutlined, DeleteOutlined,
  CheckOutlined, CloseOutlined, SmileOutlined,
} from "@ant-design/icons";
import { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ru";
import EmojiPicker from "emoji-picker-react";
import { getComments, createComment, updateComment, deleteComment } from "../api";
import { getUserColor, getUserInitial } from "../../common/UserBadge";
import { getAvatarSrc } from "../../../utils/avatar";

dayjs.extend(relativeTime);
dayjs.locale("ru");

const { Text, Paragraph } = Typography;

const COMMENTS_PER_PAGE = 15;

const CommentItem = ({
  comment, currentUserId, currentUserRole,
  projectId, taskId, onUpdate, onDelete,
}) => {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [saving, setSaving] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const editRef = useRef(null);

  const isOwn = comment.userId === currentUserId;
  const isPrivileged = ["OWNER", "MANAGER", "ADMIN"].includes(currentUserRole);
  const canEdit = isOwn;
  const canDelete = isOwn || isPrivileged;

  const userColor = getUserColor(comment.user);
  const userInitial = getUserInitial(comment.user);
  const avatarSrc = getAvatarSrc(comment.user?.profile?.avatarUrl);

  const handleSave = async () => {
    if (!editText.trim() || editText.trim() === comment.text) {
      setEditing(false);
      return;
    }

    setSaving(true);

    try {
      const updated = await updateComment(projectId, taskId, comment.id, {
        text: editText.trim(),
      });

      onUpdate({
        ...comment,
        text: editText.trim(),
        updatedAt: updated.updatedAt,
      });

      setEditing(false);
    } catch {
      message.error("Не удалось обновить комментарий");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteComment(projectId, taskId, comment.id);
      onDelete(comment.id);
    } catch {
      message.error("Не удалось удалить комментарий");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }

    if (e.key === "Escape") {
      setEditing(false);
      setEditText(comment.text);
    }
  };

  const insertEmoji = (native) => {
    const ta = editRef?.current?.resizableTextArea?.textArea;

    if (!ta) {
      setEditText(prev => prev + native);
      setEmojiOpen(false);
      return;
    }

    const start = ta.selectionStart;
    const end = ta.selectionEnd;

    setEditText(prev =>
      prev.slice(0, start) + native + prev.slice(end),
    );

    setEmojiOpen(false);

    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(
        start + native.length,
        start + native.length,
      );
    }, 10);
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        padding: "10px 0",
        borderBottom: "1px solid #f5f5f5",
        alignItems: "flex-start",
      }}
    >
      <Avatar
        size={32}
        src={avatarSrc || undefined}
        style={{
          background: avatarSrc ? "transparent" : userColor,
          fontSize: 13,
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {!avatarSrc && userInitial}
      </Avatar>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Шапка: имя + время + кнопки */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 4,
          }}
        >
          <Space size={6}>
            <Text strong style={{ fontSize: 13 }}>
              @{comment.user?.login}
            </Text>

            {comment.updatedAt !== comment.createdAt && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                (ред.)
              </Text>
            )}
          </Space>

          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Tooltip
              title={dayjs(comment.createdAt).format("DD.MM.YYYY HH:mm")}
            >
              <Text
                type="secondary"
                style={{ fontSize: 11, cursor: "default" }}
              >
                {dayjs(comment.createdAt).fromNow()}
              </Text>
            </Tooltip>

            {canEdit && !editing && (
              <Tooltip title="Редактировать">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined style={{ fontSize: 12 }} />}
                  onClick={() => {
                    setEditing(true);
                    setEditText(comment.text);
                  }}
                  style={{
                    width: 24,
                    height: 24,
                    padding: 0,
                    color: "#bfbfbf",
                  }}
                />
              </Tooltip>
            )}

            {canDelete && !editing && (
              <Popconfirm
                title="Удалить комментарий?"
                onConfirm={handleDelete}
                okText="Удалить"
                okButtonProps={{ danger: true }}
                cancelText="Отмена"
                placement="topRight"
              >
                <Tooltip title="Удалить">
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined style={{ fontSize: 12 }} />}
                    style={{
                      width: 24,
                      height: 24,
                      padding: 0,
                      color: "#bfbfbf",
                    }}
                  />
                </Tooltip>
              </Popconfirm>
            )}
          </div>
        </div>

        {editing ? (
          <div>
            <div style={{ position: "relative" }}>
              <Input.TextArea
                ref={editRef}
                value={editText}
                onChange={e => setEditText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                autoFocus
                style={{
                  marginBottom: 6,
                  fontSize: 13,
                  paddingRight: 36,
                }}
              />

              <Popover
                trigger="click"
                open={emojiOpen}
                onOpenChange={setEmojiOpen}
                content={
                  <EmojiPicker
                    onEmojiClick={(emojiData) =>
                      insertEmoji(emojiData.emoji)
                    }
                    lazyLoadEmojis
                    searchPlaceholder="Поиск..."
                    skinTonesDisabled
                    previewConfig={{ showPreview: false }}
                    height={380}
                    width={320}
                  />
                }
                placement="topRight"
              >
                <Button
                  type="text"
                  size="small"
                  icon={<SmileOutlined />}
                  style={{
                    position: "absolute",
                    right: 4,
                    bottom: 14,
                    color: emojiOpen ? "#1677ff" : "#bfbfbf",
                    zIndex: 1,
                  }}
                />
              </Popover>
            </div>

            <Space size={6}>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                loading={saving}
                onClick={handleSave}
                disabled={!editText.trim()}
              >
                Сохранить
              </Button>

              <Button
                size="small"
                icon={<CloseOutlined />}
                onClick={() => {
                  setEditing(false);
                  setEditText(comment.text);
                }}
              >
                Отмена
              </Button>

              <Text type="secondary" style={{ fontSize: 11 }}>
                Ctrl+Enter
              </Text>
            </Space>
          </div>
        ) : (
          <Paragraph
            style={{
              margin: 0,
              fontSize: 13,
              lineHeight: "1.6",
              whiteSpace: "pre-wrap",
            }}
          >
            {comment.text}
          </Paragraph>
        )}
      </div>
    </div>
  );
};

const TaskComments = ({
  projectId,
  taskId,
  currentUserId,
  currentUserRole,
}) => {
  const [comments, setComments] = useState([]);
  const [meta, setMeta] = useState({
    total: 0,
    pages: 1,
    currentPage: 1,
  });

  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [newText, setNewText] = useState("");
  const [page, setPage] = useState(1);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const inputRef = useRef(null);

  const isViewer = currentUserRole === "VIEWER";

  const loadComments = async (p = 1) => {
    setLoading(true);

    try {
      const res = await getComments(projectId, taskId, {
        page: p,
        limit: COMMENTS_PER_PAGE,
      });

      setComments(res.data || []);
      setMeta(res.meta || {
        total: 0,
        pages: 1,
        currentPage: p,
      });
    } catch {
      message.error("Не удалось загрузить комментарии");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId && taskId) {
      loadComments(page);
    }
  }, [projectId, taskId, page]);

  const insertEmojiNew = (native) => {
    const ta = inputRef?.current?.resizableTextArea?.textArea;

    if (!ta) {
      setNewText(prev => prev + native);
      setEmojiOpen(false);
      return;
    }

    const start = ta.selectionStart;
    const end = ta.selectionEnd;

    setNewText(prev =>
      prev.slice(0, start) + native + prev.slice(end),
    );

    setEmojiOpen(false);

    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(
        start + native.length,
        start + native.length,
      );
    }, 10);
  };

  const handleSend = async () => {
    if (!newText.trim() || sending) return;

    setSending(true);

    try {
      await createComment(projectId, taskId, {
        text: newText.trim(),
      });

      setNewText("");

      const newTotal = meta.total + 1;
      const lastPage = Math.ceil(newTotal / COMMENTS_PER_PAGE);

      setPage(lastPage);

      await loadComments(lastPage);

      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      message.error(
        err?.response?.data?.error?.message || "Ошибка отправки",
      );
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSend();
    }
  };

  const handleUpdate = (updated) => {
    setComments(prev =>
      prev.map(c => (c.id === updated.id ? updated : c)),
    );
  };

  const handleDelete = (commentId) => {
    setComments(prev =>
      prev.filter(c => c.id !== commentId),
    );

    setMeta(prev => ({
      ...prev,
      total: Math.max(0, prev.total - 1),
    }));
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
          paddingBottom: 10,
          borderBottom: "2px solid #f0f0f0",
        }}
      >
        <Text strong style={{ fontSize: 15 }}>
          💬 Комментарии
        </Text>

        {meta.total > 0 && (
          <span
            style={{
              background: "#e6f4ff",
              color: "#1677ff",
              borderRadius: 10,
              padding: "1px 8px",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {meta.total}
          </span>
        )}
      </div>

      {!isViewer && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ position: "relative" }}>
            <Input.TextArea
              ref={inputRef}
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Написать комментарий... (Ctrl+Enter для отправки)"
              autoSize={{ minRows: 2, maxRows: 5 }}
              style={{
                fontSize: 13,
                borderRadius: 8,
                paddingRight: 42,
              }}
              maxLength={2000}
            />

            <Popover
              trigger="click"
              open={emojiOpen}
              onOpenChange={setEmojiOpen}
              content={
                <EmojiPicker
                  onEmojiClick={(emojiData) =>
                    insertEmojiNew(emojiData.emoji)
                  }
                  lazyLoadEmojis
                  searchPlaceholder="Поиск..."
                  skinTonesDisabled
                  previewConfig={{ showPreview: false }}
                  height={380}
                  width={320}
                />
              }
              placement="topRight"
            >
              <Button
                type="text"
                icon={<SmileOutlined style={{ fontSize: 17 }} />}
                style={{
                  position: "absolute",
                  right: 8,
                  bottom: 8,
                  color: emojiOpen ? "#1677ff" : "#bfbfbf",
                  zIndex: 1,
                  transition: "color 0.15s",
                }}
              />
            </Popover>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 8,
              gap: 8,
            }}
          >
            <Text
              type="secondary"
              style={{
                fontSize: 11,
                alignSelf: "center",
              }}
            >
              {newText.length}/2000 · Ctrl+Enter для отправки
            </Text>

            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={sending}
              disabled={!newText.trim()}
              onClick={handleSend}
              style={{ borderRadius: 8 }}
            >
              Отправить
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "30px 0" }}>
          <Spin />
        </div>
      ) : comments.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Text type="secondary" style={{ fontSize: 13 }}>
              {isViewer
                ? "Комментариев пока нет"
                : "Будьте первым — оставьте комментарий"}
            </Text>
          }
          style={{ padding: "20px 0" }}
        />
      ) : (
        <>
          <div>
            {comments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                projectId={projectId}
                taskId={taskId}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {meta.pages > 1 && (
            <div
              style={{
                textAlign: "center",
                marginTop: 16,
                paddingTop: 16,
                borderTop: "1px solid #f0f0f0",
              }}
            >
              <Pagination
                current={meta.currentPage}
                total={meta.total}
                pageSize={COMMENTS_PER_PAGE}
                showSizeChanger={false}
                showTotal={(total, range) =>
                  `${range[0]}–${range[1]} из ${total}`
                }
                size="small"
                onChange={(p) => {
                  setPage(p);
                  loadComments(p);
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TaskComments;