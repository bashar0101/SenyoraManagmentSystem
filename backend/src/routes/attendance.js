import { Router } from 'express';
import {
  getMyAttendance,
  getAllAttendance,
  getEmployeeAttendance
} from '../controllers/attendanceController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/me', verifyToken, requireRole('employee'), getMyAttendance);
router.get('/all', verifyToken, requireRole('manager'), getAllAttendance);
router.get('/:employeeId', verifyToken, requireRole('manager'), getEmployeeAttendance);

export default router;
