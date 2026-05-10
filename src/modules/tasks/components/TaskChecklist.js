import { Checkbox, Input, Button, Progress, Tooltip, Popconfirm, message, Spin, Empty } from "antd";
import { PlusOutlined, DeleteOutlined, CheckSquareOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import { getChecklist, createChecklistItem, updateChecklistItem, deleteChecklistItem } from "../api";

const TaskChecklist = ({ projectId, taskId, currentUserRole, onCountChange }) => {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState("");
  const [adding,  setAdding]  = useState(false);
  const [inputVisible, setInputVisible] = useState(false);

  const isViewer   = currentUserRole === "VIEWER";
  const doneCount  = items.filter(i => i.isDone).length;
  const totalCount = items.length;
  const percent    = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  useEffect(() => {
    load();
  }, [projectId, taskId]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getChecklist(projectId, taskId);
      setItems(data || []);
      onCountChange?.(data?.length || 0);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (item) => {
    const updated = { ...item, isDone: !item.isDone };
    setItems(prev => prev.map(i => i.id === item.id ? updated : i));
    try {
      await updateChecklistItem(projectId, taskId, item.id, { isDone: !item.isDone });
    } catch {
      setItems(prev => prev.map(i => i.id === item.id ? item : i));
      message.error("Ошибка обновления");
    }
  };

  const handleAdd = async () => {
    if (!newText.trim()) return;
    setAdding(true);
    try {
      const item = await createChecklistItem(projectId, taskId, newText.trim());
      setItems(prev => [...prev, item]);
      setNewText("");
      setInputVisible(false);
      onCountChange?.(items.length + 1);
    } catch {
      message.error("Ошибка создания");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (itemId) => {
    try {
      await deleteChecklistItem(projectId, taskId, itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
      onCountChange?.(items.length - 1);
    } catch {
      message.error("Ошибка удаления");
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 24 }}><Spin /></div>;

  return (
    <div>
      {/* Заголовок + прогресс */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <CheckSquareOutlined style={{ color: "#52c41a", fontSize: 15 }} />
        <span style={{ fontWeight: 600, fontSize: 15 }}>Чеклист</span>
        {totalCount > 0 && (
          <span style={{
            background: percent === 100 ? "#f6ffed" : "#f5f5f5",
            color: percent === 100 ? "#52c41a" : "#8c8c8c",
            borderRadius: 10, padding: "1px 8px", fontSize: 12, fontWeight: 500,
          }}>
            {doneCount}/{totalCount}
          </span>
        )}
      </div>

      {totalCount > 0 && (
        <Progress
          percent={percent}
          size="small"
          strokeColor={percent === 100 ? "#52c41a" : "#1677ff"}
          style={{ marginBottom: 12 }}
          format={p => `${p}%`}
        />
      )}

      {/* Список */}
      {items.length === 0 && !inputVisible ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Нет пунктов чеклиста"
          style={{ padding: "16px 0" }}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
          {items.map(item => (
            <div
              key={item.id}
              style={{
                display:      "flex",
                alignItems:   "center",
                gap:          8,
                padding:      "6px 8px",
                borderRadius: 6,
                background:   item.isDone ? "#f6ffed" : "#fafafa",
                border:       `1px solid ${item.isDone ? "#b7eb8f" : "#f0f0f0"}`,
                transition:   "all 0.15s",
              }}
            >
              <Checkbox
                checked={item.isDone}
                disabled={isViewer}
                onChange={() => handleToggle(item)}
              />
              <span style={{
                flex:           1,
                fontSize:       13,
                textDecoration: item.isDone ? "line-through" : "none",
                color:          item.isDone ? "#8c8c8c" : "#262626",
              }}>
                {item.text}
              </span>
              {!isViewer && (
                <Popconfirm
                  title="Удалить пункт?"
                  onConfirm={() => handleDelete(item.id)}
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
          ))}
        </div>
      )}

      {/* Форма добавления */}
      {!isViewer && (
        inputVisible ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Input
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setInputVisible(false); setNewText(""); } }}
              placeholder="Текст пункта..."
              autoFocus
              style={{ flex: 1, borderRadius: 6 }}
              maxLength={300}
            />
            <Button type="primary" size="small" loading={adding} onClick={handleAdd} disabled={!newText.trim()}>
              Добавить
            </Button>
            <Button size="small" onClick={() => { setInputVisible(false); setNewText(""); }}>
              Отмена
            </Button>
          </div>
        ) : (
          <Button
            type="dashed" icon={<PlusOutlined />} size="small"
            onClick={() => setInputVisible(true)}
            style={{ width: "100%", borderRadius: 6, color: "#8c8c8c" }}
          >
            Добавить пункт
          </Button>
        )
      )}
    </div>
  );
};

export default TaskChecklist;