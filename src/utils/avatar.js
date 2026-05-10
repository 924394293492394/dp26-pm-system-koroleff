const BASE_URL = "http://localhost:5000";

const PALETTE = ["#1677ff","#52c41a","#722ed1","#fa8c16","#eb2f96","#13c2c2","#f5222d","#08979c"];

/**
 * Полный URL аватара из относительного пути.
 * null/undefined → null, уже http → без изменений.
 */
export const getAvatarSrc = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BASE_URL}${url}`;
};

/**
 * Цвет фона по умолчанию — всегда от login.
 * Единственный стандарт во всём приложении.
 */
export const getAvatarColor = (login) =>
  PALETTE[((login || "?").charCodeAt(0) || 0) % PALETTE.length];

/**
 * Первая буква инициала — всегда от login.
 */
export const getAvatarInitial = (login) =>
  (login || "?")[0].toUpperCase();