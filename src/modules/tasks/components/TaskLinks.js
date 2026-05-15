import { Button, Input, Select, Popconfirm, message, Empty } from "antd";
import {
  PlusOutlined, DeleteOutlined, LinkOutlined,
  BranchesOutlined, MergeCellsOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import { getLinks, createLink, deleteLink } from "../api";

const LINK_TYPES = {
  GIT_BRANCH:   { label: "Git Branch",   icon: <BranchesOutlined />,   color: "#262626" },
  PULL_REQUEST: { label: "Pull Request", icon: <MergeCellsOutlined />, color: "#1677ff" },
  EXTERNAL_URL: { label: "Ссылка",       icon: <LinkOutlined />,       color: "#8c8c8c" },
  FIGMA:        { label: "Figma",        icon: "🎨",                   color: "#a259ff" },
  NOTION:       { label: "Notion",       icon: "📝",                   color: "#262626" },
  JIRA:         { label: "Jira",         icon: "🔵",                   color: "#0052cc" },
};

const TaskLinks = ({ projectId, taskId, currentUserRole, onCountChange }) => {
  const [links,    setLinks]    = useState([]);
  const [,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({ url: "", label: "", type: "EXTERNAL_URL" });
  const [saving,   setSaving]   = useState(false);

  const isViewer = currentUserRole === "VIEWER";

  useEffect(() => { load(); }, [projectId, taskId]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getLinks(projectId, taskId);
      setLinks(data || []);
      onCountChange?.(data?.length || 0);
    } catch {
      message.error("Не удалось загрузить ссылки");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!form.url.trim()) return;
    setSaving(true);
    try {
      const link = await createLink(projectId, taskId, form);
      const updated = [...links, link];
      setLinks(updated);
      onCountChange?.(updated.length);
      setForm({ url: "", label: "", type: "EXTERNAL_URL" });
      setShowForm(false);
    } catch {
      message.error("Ошибка добавления ссылки");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (linkId) => {
    try {
      await deleteLink(projectId, taskId, linkId);
      const updated = links.filter(l => l.id !== linkId);
      setLinks(updated);
      onCountChange?.(updated.length);
    } catch {
      message.error("Ошибка удаления");
    }
  };

  return (
    <div>
      {/* Заголовок */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LinkOutlined style={{ color: "#1677ff", fontSize: 15 }} />
          <span style={{ fontWeight: 600, fontSize: 15 }}>Ссылки</span>
          {links.length > 0 && (
            <span style={{
              background: "#e6f4ff", color: "#1677ff",
              borderRadius: 10, padding: "1px 8px", fontSize: 12,
            }}>
              {links.length}
            </span>
          )}
        </div>
        {!isViewer && !showForm && (
          <Button size="small" icon={<PlusOutlined />} onClick={() => setShowForm(true)}>
            Добавить
          </Button>
        )}
      </div>

      {links.length === 0 && !showForm ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Ссылок нет"
          style={{ padding: "12px 0" }}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: showForm ? 12 : 0 }}>
          {links.map(link => {
            const cfg = LINK_TYPES[link.type] || LINK_TYPES.EXTERNAL_URL;
            return (
              <div key={link.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 10px", borderRadius: 6,
                border: "1px solid #f0f0f0", background: "#fafafa",
              }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{cfg.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 13, color: "#1677ff",
                      display: "block", overflow: "hidden",
                      textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}
                  >
                    {link.label || link.url}
                  </a>
                  <span style={{ fontSize: 11, color: "#8c8c8c" }}>{cfg.label}</span>
                </div>
                {!isViewer && (
                  <Popconfirm
                    title="Удалить ссылку?"
                    onConfirm={() => handleDelete(link.id)}
                    okText="Да" cancelText="Нет"
                    placement="left"
                  >
                    <Button
                      type="text" size="small"
                      icon={<DeleteOutlined style={{ fontSize: 11 }} />}
                      style={{ color: "#d9d9d9", width: 22, height: 22, padding: 0 }}
                      onMouseEnter={e => e.currentTarget.style.color = "#ff4d4f"}
                      onMouseLeave={e => e.currentTarget.style.color = "#d9d9d9"}
                    />
                  </Popconfirm>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div style={{
          padding: "12px 14px", borderRadius: 8,
          background: "#f8f9ff", border: "1px solid #d6e4ff",
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          <div style={{ display: "flex", gap: 8 }}>
            <Select
              value={form.type}
              onChange={v => setForm(p => ({ ...p, type: v }))}
              style={{ width: 160 }}
              options={Object.entries(LINK_TYPES).map(([v, { label }]) => ({ value: v, label }))}
            />
            <Input
              value={form.label}
              onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
              placeholder="Название (необязательно)"
              style={{ flex: 1 }}
            />
          </div>
          <Input
            value={form.url}
            onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
            placeholder="URL или название ветки..."
            onKeyDown={e => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") {
                setShowForm(false);
                setForm({ url: "", label: "", type: "EXTERNAL_URL" });
              }
            }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              type="primary" size="small" loading={saving}
              onClick={handleAdd} disabled={!form.url.trim()}
            >
              Добавить
            </Button>
            <Button size="small" onClick={() => {
              setShowForm(false);
              setForm({ url: "", label: "", type: "EXTERNAL_URL" });
            }}>
              Отмена
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskLinks;