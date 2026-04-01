import { Router } from 'express';
import { login, logout } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/logout', verifyToken, logout);

export default router;
