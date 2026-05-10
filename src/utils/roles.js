export const ROLE_CONFIG = {
  SUPER_ADMIN: { label: "Супер-Администратор", color: "gold"   },
  ADMIN:       { label: "Администратор",        color: "orange" },
  USER:        { label: "Участник",             color: "blue"   },
};

export const getRoleConfig = (role) => ROLE_CONFIG[role] || ROLE_CONFIG.USER;