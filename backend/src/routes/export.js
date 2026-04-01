import { Router } from 'express';
import { exportPdf } from '../controllers/exportController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/pdf', verifyToken, requireRole('manager'), exportPdf);

export default router;
