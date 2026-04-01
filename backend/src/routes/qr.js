import { Router } from 'express';
import { getCurrent, scan } from '../controllers/qrController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/current', verifyToken, requireRole('manager'), getCurrent);
router.post('/scan', verifyToken, requireRole('employee'), scan);

export default router;
