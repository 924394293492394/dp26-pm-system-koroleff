import { Router } from 'express';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware.js';
import { ProjectController } from './project.controller.js';

const projectRouter = Router();

projectRouter.use(authMiddleware);

projectRouter.get('/my', ProjectController.getMyProjects);
projectRouter.get('/', ProjectController.getAll);
projectRouter.get('/:id', ProjectController.getById);
projectRouter.post('/', ProjectController.create);
projectRouter.patch('/:id', ProjectController.update);
projectRouter.patch('/:id/archive', ProjectController.archive);
projectRouter.patch('/:id/unarchive', ProjectController.unarchive);
projectRouter.delete('/:id', ProjectController.delete);

export { projectRouter };

//              cm-08/03/2026 Korolev E.V.
// *(не сильно влияет) если owner покидает проект то проект все равно показывается в списке хотя он уже не учавствует в проекте