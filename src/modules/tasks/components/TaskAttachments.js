import {
  Upload, Image, Button, Modal, message,
  Tooltip, Empty, Progress, Typography, Space, Spin,
  Popconfirm,
} from "antd";
import {
  UploadOutlined, DeleteOutlined, DownloadOutlined,
  FileTextOutlined, FilePdfOutlined, FileZipOutlined,
  FileExcelOutlined, FileWordOutlined, PaperClipOutlined,
  VideoCameraOutlined, AudioOutlined, CodeOutlined,
  LoadingOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useState, useEffect, useRef } from "react";
import { getAttachments, uploadAttachment, deleteAttachment } from "../api";
import UserBadge from "../../common/UserBadge";

const { Text } = Typography;
const { Dragger } = Upload;
const { confirm } = Modal;

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const MAX_TOTAL_MB = 200;
const MAX_FILES = 5;
const MAX_FILE_MB = 50;

const getFileConfig = (mimeType) => {
  if (mimeType?.startsWith("image/"))
    return { icon: null, color: "#1677ff", label: "Изображение" };
  if (mimeType?.includes("pdf"))
    return { icon: <FilePdfOutlined />, color: "#ff4d4f", label: "PDF" };
  if (mimeType?.includes("excel") || mimeType?.includes("spreadsheet"))
    return { icon: <FileExcelOutlined />, color: "#52c41a", label: "Excel" };
  if (mimeType?.includes("word") || mimeType?.includes("document"))
    return { icon: <FileWordOutlined />, color: "#1677ff", label: "Word" };
  if (mimeType?.includes("powerpoint") || mimeType?.includes("presentation"))
    return { icon: <FileTextOutlined />, color: "#fa8c16", label: "PowerPoint" };
  if (mimeType?.includes("zip") || mimeType?.includes("rar") || mimeType?.includes("7z") || mimeType?.includes("tar"))
    return { icon: <FileZipOutlined />, color: "#faad14", label: "Архив" };
  if (mimeType?.startsWith("video/"))
    return { icon: <VideoCameraOutlined />, color: "#722ed1", label: "Видео" };
  if (mimeType?.startsWith("audio/"))
    return { icon: <AudioOutlined />, color: "#13c2c2", label: "Аудио" };
  if (mimeType?.includes("json") || mimeType?.includes("javascript") || mimeType?.includes("python") || mimeType?.includes("html"))
    return { icon: <CodeOutlined />, color: "#eb2f96", label: "Код" };
  return { icon: <FileTextOutlined />, color: "#8c8c8c", label: "Файл" };
};

const formatSize = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
};


const TaskAttachments = ({ projectId, taskId, currentUserId, currentUserRole, onCountChange }) => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("active");
  const [downloading, setDownloading] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const uploadLockRef = useRef(false);

  const isViewer = currentUserRole === "VIEWER";
  const images = attachments.filter(a => a.mimeType?.startsWith("image/"));
  const files = attachments.filter(a => !a.mimeType?.startsWith("image/"));

  // Суммарный размер для индикатора
  const totalBytes = attachments.reduce((sum, a) => sum + (a.fileSize || 0), 0);
  const totalMB = totalBytes / (1024 * 1024);
  const usedPct = Math.min(100, Math.round((totalMB / MAX_TOTAL_MB) * 100));
  const progressColor = usedPct >= 90 ? "#ff4d4f" : usedPct >= 70 ? "#faad14" : "#52c41a";

  useEffect(() => {
    load();
  }, [projectId, taskId]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAttachments(projectId, taskId);
      setAttachments(data || []);
      onCountChange?.(data?.length || 0);
    } catch {
      message.error("Не удалось загрузить вложения");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (fileList) => {
    const fls = Array.from(fileList);
    if (!fls.length || uploading || uploadLockRef.current) return;

    uploadLockRef.current = true;
    setUploading(true);
    setProgress(0);
    setUploadStatus("active");

    const formData = new FormData();
    fls.forEach(f => formData.append("files", f));

    try {
      const created = await uploadAttachment(projectId, taskId, formData, (pct) => {
        setProgress(pct < 95 ? pct : 95);
      });

      const list = Array.isArray(created) ? created : [created];
      setProgress(100);
      setUploadStatus("success");
      setAttachments(prev => {
        const updated = [...prev, ...list];
        onCountChange?.(updated.length);
        return updated;
      });

      const names = list.map(f => f.fileName).join(", ");
      message.success({
        icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
        content: (
          <span>
            {list.length > 1 ? `Загружено ${list.length} файла` : "Файл загружен"}:{" "}
            <strong>{names}</strong>
          </span>
        ),
        duration: 4,
      });

      setTimeout(() => {
        setUploading(false);
        setProgress(0);
        setUploadStatus("active");
        uploadLockRef.current = false;
      }, 1200);

    } catch (err) {
      setUploadStatus("exception");
      setProgress(100);
      message.error(err?.response?.data?.error?.message || "Ошибка загрузки файлов");
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
        setUploadStatus("active");
        uploadLockRef.current = false;
      }, 2000);
    }
  };

  const handleDownload = async (attachment) => {
    setDownloading(attachment.id);
    try {
      const token = localStorage.getItem("token");
      const url = `${API_URL}/projects/${projectId}/tasks/${taskId}/attachments/${attachment.id}/download`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = attachment.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      message.error("Не удалось скачать файл");
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = async (attachmentId, fileName) => {
    try {
      await deleteAttachment(projectId, taskId, attachmentId);
      setAttachments(prev => {
        const updated = prev.filter(a => a.id !== attachmentId);
        onCountChange?.(updated.length);
        return updated;
      });
      message.success(`Удалено: ${fileName}`);
    } catch {
      message.error("Ошибка удаления");
    }
  };

  const handleDeleteFromPreview = (attachment) => {
    confirm({
      title: "Удалить изображение?",
      icon: <ExclamationCircleOutlined />,
      content: `"${attachment.fileName}" будет удалён безвозвратно.`,
      okText: "Удалить",
      okType: "danger",
      cancelText: "Отмена",
      zIndex: 1100,
      onOk: () => handleDelete(attachment.id, attachment.fileName),
    });
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: 32 }}><Spin /></div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <PaperClipOutlined style={{ color: "#fa8c16", fontSize: 15 }} />
        <span style={{ fontWeight: 600, fontSize: 15 }}>Вложения</span>
        {attachments.length > 0 && (
          <span style={{
            background: "#fff7e6", color: "#fa8c16",
            borderRadius: 10, padding: "1px 8px", fontSize: 12,
          }}>
            {attachments.length}
          </span>
        )}
      </div>

      {attachments.length > 0 && (
        <div style={{
          padding: "10px 14px",
          background: "#fafafa",
          borderRadius: 8,
          border: "1px solid #f0f0f0",
          marginBottom: 14,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Хранилище задачи
            </Text>
            <Text style={{
              fontSize: 12,
              fontWeight: 500,
              color: progressColor,
            }}>
              {totalMB < 0.1
                ? `${Math.round(totalBytes / 1024)} КБ`
                : `${totalMB.toFixed(1)} МБ`
              } / {MAX_TOTAL_MB} МБ
            </Text>
          </div>
          <Progress
            percent={usedPct}
            strokeColor={progressColor}
            showInfo={false}
            size="small"
            style={{ margin: 0 }}
          />
          {usedPct >= 90 && (
            <Text type="danger" style={{ fontSize: 11, marginTop: 4, display: "block" }}>
              ⚠ Хранилище почти заполнено
            </Text>
          )}
        </div>
      )}

      {!isViewer && (
        <Dragger
          multiple
          showUploadList={false}
          disabled={uploading}
          beforeUpload={(file, fileList) => {
            if (file === fileList[0]) handleUpload(fileList);
            return false;
          }}
          style={{
            marginBottom: 16,
            borderRadius: 10,
            borderColor: dragOver ? "#1677ff" : undefined,
            background: dragOver ? "#f0f7ff" : undefined,
            transition: "all 0.2s",
          }}
          onDragEnter={() => setDragOver(true)}
          onDragLeave={() => setDragOver(false)}
          onDrop={() => setDragOver(false)}
        >
          <div style={{ padding: "14px 0" }}>
            {uploading ? (
              <div style={{ padding: "0 24px" }}>
                <LoadingOutlined style={{ fontSize: 28, color: "#1677ff", marginBottom: 8, display: "block" }} />
                <p style={{ margin: "0 0 10px", fontSize: 13, color: "#1677ff", fontWeight: 500 }}>
                  {uploadStatus === "success" ? "✅ Успешно загружено!" : "Загружаем файлы..."}
                </p>
                <Progress
                  percent={progress}
                  status={uploadStatus}
                  strokeColor={uploadStatus === "success" ? "#52c41a" : { from: "#108ee9", to: "#1677ff" }}
                  style={{ maxWidth: 280, margin: "0 auto" }}
                />
              </div>
            ) : (
              <>
                <UploadOutlined style={{
                  fontSize: 26,
                  color: dragOver ? "#1677ff" : "#bfbfbf",
                  marginBottom: 8,
                  display: "block",
                  transition: "color 0.2s",
                }} />
                <p style={{ margin: 0, fontSize: 13, color: "#595959" }}>
                  Перетащите файлы или{" "}
                  <span style={{ color: "#1677ff" }}>нажмите для выбора</span>
                </p>
                <p style={{ margin: "5px 0 0", fontSize: 11, color: "#bfbfbf" }}>
                  Любые форматы · до {MAX_FILES} файлов за раз · {MAX_FILE_MB} МБ/файл · лимит {MAX_TOTAL_MB} МБ
                </p>
              </>
            )}
          </div>
        </Dragger>
      )}

      {attachments.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Вложений пока нет"
          style={{ padding: "16px 0" }}
        />
      ) : (
        <>
          {images.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
                Изображения ({images.length})
              </Text>
              <Image.PreviewGroup
                preview={{
                  toolbarRender: (_, { current }) => {
                    const img = images[current];
                    if (!img) return null;
                    return (
                      <Space
                        size={4}
                        style={{
                          padding: "6px 12px",
                          background: "rgba(0,0,0,0.5)",
                          borderRadius: 8,
                        }}
                      >
                        <Tooltip title="Скачать" placement="top">
                          <Button
                            type="text"
                            icon={<DownloadOutlined style={{ color: "#fff", fontSize: 16 }} />}
                            loading={downloading === img.id}
                            onClick={() => handleDownload(img)}
                            style={{ border: "none", background: "transparent" }}
                          />
                        </Tooltip>
                        {!isViewer && (
                          <Tooltip title="Удалить" placement="top">
                            <Button
                              type="text"
                              icon={<DeleteOutlined style={{ color: "#ff7875", fontSize: 16 }} />}
                              onClick={() => handleDeleteFromPreview(img)}
                              style={{ border: "none", background: "transparent" }}
                            />
                          </Tooltip>
                        )}
                      </Space>
                    );
                  },
                }}
              >
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(82px, 1fr))",
                  gap: 8,
                  maxWidth: 440,
                }}>
                  {images.map(img => (
                    <div key={img.id}>
                      <Image
                        crossOrigin="anonymous"
                        src={`${API_URL}${img.url}`}
                        width="100%"
                        height={82}
                        style={{
                          objectFit: "cover",
                          borderRadius: 8,
                          border: "1px solid #f0f0f0",
                          display: "block",
                          cursor: "pointer",
                        }}
                        fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODIiIGhlaWdodD0iODIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgyIiBoZWlnaHQ9IjgyIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNDEiIHk9IjQ3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjI0IiBmaWxsPSIjY2RjZGNkIj7wn5KXPC90ZXh0Pjwvc3ZnPg=="
                      />
                      <Tooltip title={img.fileName}>
                        <Text style={{
                          display: "block",
                          fontSize: 10,
                          color: "#8c8c8c",
                          marginTop: 4,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          textAlign: "center",
                        }}>
                          {img.fileName}
                        </Text>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              </Image.PreviewGroup>
            </div>
          )}

          {files.length > 0 && (
            <div>
              {images.length > 0 && (
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
                  Файлы ({files.length})
                </Text>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {files.map(file => {
                  const cfg = getFileConfig(file.mimeType);
                  const fileName = file.fileName;
                  return (
                    <div
                      key={file.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: "1px solid #f0f0f0",
                        background: "#fafafa",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f0f7ff"}
                      onMouseLeave={e => e.currentTarget.style.background = "#fafafa"}
                    >
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: `${cfg.color}18`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        color: cfg.color,
                        flexShrink: 0,
                      }}>
                        {cfg.icon || <FileTextOutlined />}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Tooltip title={fileName}>
                          <Text strong style={{
                            display: "block",
                            fontSize: 13,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                            {fileName}
                          </Text>
                        </Tooltip>
                        <Space size={8} style={{ marginTop: 2 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>{cfg.label}</Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>{formatSize(file.fileSize)}</Text>
                          <UserBadge user={file.uploader} showLogin avatarSize={14} fontSize="11px" />
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {new Date(file.createdAt).toLocaleDateString("ru-RU")}
                          </Text>
                        </Space>
                      </div>

                      <Space size={4}>
                        <Tooltip title="Скачать">
                          <Button
                            type="text"
                            size="small"
                            icon={downloading === file.id ? <LoadingOutlined /> : <DownloadOutlined />}
                            disabled={downloading === file.id}
                            onClick={() => handleDownload(file)}
                            style={{ color: "#1677ff" }}
                          />
                        </Tooltip>
                        {!isViewer && (
                          <Popconfirm
                            title="Удалить файл?"
                            description={`"${fileName}" будет удалён безвозвратно.`}
                            onConfirm={() => handleDelete(file.id, file.fileName)}
                            okText="Удалить"
                            okButtonProps={{ danger: true }}
                            cancelText="Отмена"
                            placement="left"
                          >
                            <Button
                              type="text"
                              size="small"
                              icon={<DeleteOutlined />}
                              style={{ color: "#d9d9d9" }}
                              onMouseEnter={e => e.currentTarget.style.color = "#ff4d4f"}
                              onMouseLeave={e => e.currentTarget.style.color = "#d9d9d9"}
                            />
                          </Popconfirm>
                        )}
                      </Space>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TaskAttachments;