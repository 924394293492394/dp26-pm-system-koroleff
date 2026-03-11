# IT PM System (Backend, pms_backend: dp26)
Backend сервер для системы управления IT-проектами (пока что монолит, дальше будет разбит на микросервисы).  
Проект разрабатывается как серверная часть дипломной системы (dp26, Korolev E.V.) — аналога Jira, Bitrix and etc.

---

# Stack
Основные технологии проекта:
- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
- Zod
- JWT Authentication
- REST API
- RBAC

---

# Architecture
Проект реализован по модульной архитектуре.
Каждый модуль содержит 4 файла: controller, service, schema, routes.
# Roles
Система использует ролевую модель доступа.
1. USER - обычный участник проекта
2. ADMIN - администратор системы
3. SUPER_ADMIN - полный доступ к системе

---

# Implemented Modules
## Auth
Модуль авторизации и регистрации.
### Endpoints

- `POST /auth/register`  
  Регистрация пользователя  
  **Access:** Public

- `POST /auth/login`  
  Авторизация пользователя  
  **Access:** Public

- `GET /auth/me`  
  Получение информации о текущем пользователе  
  **Access:** Authenticated

---

# Profile v2
Модуль профилей пользователей.
### Endpoints

- `GET /profile`  
  Получить свой профиль (полная информация)  
  **Access:** Authenticated

- `GET /users/:userId`  
  Получить публичный профиль пользователя  
  **Access:** Authenticated

- `PATCH /profile`  
  Редактировать свой профиль  
  **Access:** Authenticated

- `GET /admin/users`  
  Получить список пользователей + поиск  
  **Access:** ADMIN, SUPER_ADMIN

- `PATCH /admin/users/:userId`  
  Редактировать профиль пользователя  
  **Access:** ADMIN, SUPER_ADMIN

---

# Projects
Модуль управления проектами.
### Endpoints

- `GET /projects/my`  
  Получить список своих созданных проектов 
  **Access:** Authenticated

- `GET /projects`  
  Получить список проектов (свои + как участник)
  **Access:** Authenticated

- `GET /projects/:projectId`  
  Получить проект  
  **Access:** Project Member`s

- `POST /projects`  
  Создание проекта  
  **Access:** Authenticated

- `PATCH /projects/:projectId`  
  Редактировать проект  
  **Access:** Project Owner (r4)

- `PATCH /projects/:projectId/archive`  
  Занести проект в архив  
  **Access:** Project Owner (r4)

- `PATCH /projects/:projectId/unarchive`  
  Достать проект с архива 
  **Access:** Project Owner (r4)

- `DELETE /projects/:projectId`  
  Удалить проект  
  **Access:** Project Owner (r4)

---

# Project Members
Модуль участников проекта.
### Endpoints

- `GET /projects/:projectId/members/me`  
  Получить информацию о себе (роль внутри проджекта) 
  **Access:** Project Member`s

- `POST /projects/:projectId/members`  
  Добавить участника в проект  
  **Access:** Project Owner, Manager (r43)

- `GET /projects/:projectId/members`  
  Получить список участников проекта  
  **Access:** Project Member`s

- `GET /projects/:projectId/members/:userId`  
  Получить информацию об участнике проекта  
  **Access:** Project Member`s

- `PATCH /projects/:projectId/members/:userId`  
  Изменить данные в том числе и роль (возможности) участника проекта 
  **Access:** Project Owner, Manager (r43)

- `DELETE /projects/:projectId/members/:userId`  
  Удалить участника  
  **Access:** Project Owner, Manager (r43)

- `POST /projects/:projectId/members/leave`  
  Покинуть текущий проект  
  **Access:** Project Member`s

---

# Goals
Модуль целей проекта.
### Endpoints

- `GET /projects/:projectId/goals/my`  
  Получить свои цели где пользователь является отвественным за их выполнение  
  **Access:** Project Member`s

- `GET /projects/:projectId/goals`  
  Получить список целей проекта  
  **Access:** Project Member`s

- `GET /projects/:projectId/goals/:goalId`  
  Получить цель  
  **Access:** Project Member`s

- `POST /projects/:projectId/goals`  
  Создать цель  
  **Access:** Project Member`s (r432)

- `PATCH /projects/:projectId/goals/:goalId`  
  Редактировать цель  
  **Access:** Goal Creator, r43

- `PATCH /projects/:projectId/goals/:goalId/status`  
  Изменить статус цели 
  **Access:** Goal Creator, r43

- `PATCH /projects/:projectId/goals/:goalId/responsible`  
  Изменить/назначить ответственного цели  
  **Access:** Goal Creator, r43

- `DELETE /projects/:projectId/goals/:goalId`  
  Удалить цель  
  **Access:** Goal Creator, r43

---

# Tasks
Модуль задач.
### Endpoints

- `GET /projects/:projectId/tasks/my`  
  Получить список своих задач  
  **Access:** Project Member`s

- `POST /projects/:projectId/tasks`  
  Создать задачу  
  **Access:** Project Member`s (r432)

- `GET /projects/:projectId/tasks`  
  Получить список задач  
  **Access:** Project Member`s

- `GET /projects/:projectId/tasks/:taskId`  
  Получить задачу  
  **Access:** Project Member`s

- `PATCH /projects/:projectId/tasks/:taskId`  
  Редактировать задачу  
  **Access:** Task Creator, Assigned User, r43

- `DELETE /projects/:projectId/tasks/:taskId`  
  Удалить задачу  
  **Access:** Task Creator, r43

---

# Comments
Модуль комментариев задач.
### Endpoints

- `POST /tasks/:taskId/comments`  
  Создать комментарий  
  **Access:** Project Member

- `GET /tasks/:taskId/comments`  
  Получить комментарии задачи  
  **Access:** Project Member

- `PATCH /comments/:commentId`  
  Редактировать комментарий  
  **Access:** Comment Author

- `DELETE /comments/:commentId`  
  Удалить комментарий  
  **Access:** Comment Author, Task Creator, Assigned User

---

# Current Status
На текущем этапе backend реализует:

- авторизацию
- управление профилями
- управление проектами (v2)
- управление над участниками проектов (v2)
- управление целями (v2)
- управление задачами (v2)
- управление комментариями (v2)
- *логирование действий, которые напрямую связанны с данными в БД

---

# Future Development
Планируется реализация:

- уведомлений
- file attachments
- advanced search
- project analytics