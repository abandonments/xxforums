import { Router } from 'express';
import * as forumController from '../controllers/forumController.js';
import { body, query } from 'express-validator'; // Import query for validation of query parameters
import { authenticateFirebaseToken } from '../middleware/authMiddleware.js'; // Import authentication middleware
const router = Router();
// Category Routes
router.post('/categories', authenticateFirebaseToken, // Apply authentication middleware
[
    body('name').isString().trim().notEmpty().withMessage('Category name is required'),
    body('description').isString().trim().optional(),
], forumController.createCategory);
router.get('/categories', authenticateFirebaseToken, forumController.getAllCategories); // Apply authentication middleware
router.get('/categories/:id', authenticateFirebaseToken, forumController.getCategoryById); // Apply authentication middleware
router.put('/categories/:id', authenticateFirebaseToken, // Apply authentication middleware
[
    body('name').isString().trim().notEmpty().withMessage('Category name is required').optional(),
    body('description').isString().trim().optional(),
], forumController.updateCategory);
router.delete('/categories/:id', authenticateFirebaseToken, forumController.deleteCategory); // Apply authentication middleware
// Thread Routes
router.post('/threads', authenticateFirebaseToken, // Apply authentication middleware
[
    body('category_id').isInt({ gt: 0 }).withMessage('Category ID must be a positive integer'),
    body('title').isString().trim().notEmpty().withMessage('Thread title is required'),
    body('content').isString().trim().notEmpty().withMessage('Thread content is required'),
], forumController.createThread);
router.get('/threads', authenticateFirebaseToken, // Apply authentication middleware
[
    query('categoryId').optional().isInt({ gt: 0 }).withMessage('Category ID must be a positive integer'),
], forumController.getAllThreads);
router.get('/threads/:id', authenticateFirebaseToken, forumController.getThreadById); // Apply authentication middleware
router.put('/threads/:id', authenticateFirebaseToken, // Apply authentication middleware
[
    body('category_id').isInt({ gt: 0 }).withMessage('Category ID must be a positive integer').optional(),
    body('title').isString().trim().notEmpty().withMessage('Thread title is required').optional(),
    body('content').isString().trim().notEmpty().withMessage('Thread content is required').optional(),
], forumController.updateThread);
router.delete('/threads/:id', authenticateFirebaseToken, forumController.deleteThread); // Apply authentication middleware
// Post Routes
router.post('/threads/:threadId/posts', authenticateFirebaseToken, forumController.createPost); // Apply authentication middleware
router.get('/threads/:threadId/posts', authenticateFirebaseToken, forumController.getPostsByThreadId); // Apply authentication middleware
router.get('/posts/:id', authenticateFirebaseToken, forumController.getPostById); // Apply authentication middleware
router.put('/posts/:id', authenticateFirebaseToken, forumController.updatePost); // Apply authentication middleware
router.delete('/posts/:id', authenticateFirebaseToken, forumController.deletePost); // Apply authentication middleware
export default router;
//# sourceMappingURL=forumRoutes.js.map