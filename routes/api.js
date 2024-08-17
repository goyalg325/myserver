import { Router } from 'express';
import AuthController from '../controllers/AuthController.js';
import authMiddleware from '../middleware/Authenticate.js';
import PageController from '../controllers/PageController.js';
import validateContentType from '../middleware/validateContentType.js';
import express from 'express';

const router = Router();

router.post('/auth/register', authMiddleware,AuthController.register);
router.post('/auth/login', AuthController.login);


router.post('/pages', authMiddleware, validateContentType, PageController.createPage);
router.get('/pages/:title', PageController.getPage);
router.get('/admin/pages', authMiddleware, PageController.getAllPages);
router.put('/pages/:title', authMiddleware, validateContentType, PageController.updatePage);
router.delete('/pages/:title', authMiddleware, PageController.deletePage);
// router.get('/pages/category/:category', authMiddleware, PageController.getPagesByCategory);

router.get('/users', authMiddleware, AuthController.getAllUsers);
router.delete('/users/:username', authMiddleware, AuthController.deleteUser);
router.get('/pagesByCategory',PageController.pagesByCategory)

export default router;