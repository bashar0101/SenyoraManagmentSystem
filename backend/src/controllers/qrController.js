import { getToken, validateAndRotate } from '../utils/qrManager.js';
import AttendanceRecord from '../models/AttendanceRecord.js';
import User from '../models/User.js';

export const getCurrent = async (req, res) => {
  const token = getToken();
  return res.status(200).json({ token });
};

export const scan = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'QR token is required' });
  }

  const isValid = validateAndRotate(token);
  if (!isValid) {
    return res.status(400).json({ message: 'Invalid or expired QR code. Please scan the latest code.' });
  }

  const employeeId = req.user.userId;

  const today = new Date().toISOString().split('T')[0];

  // Check if a completed record already exists for today
  const completedRecord = await AttendanceRecord.findOne({
    employee: employeeId,
    date: today,
    status: 'completed'
  });

  if (completedRecord) {
    return res.status(400).json({ message: 'You have already completed your attendance for today.' });
  }

  // Check if there is an active (check-in) record for today
  const activeRecord = await AttendanceRecord.findOne({
    employee: employeeId,
    date: today,
    status: 'active'
  });

  if (!activeRecord) {
    // Check-in
    const newRecord = await AttendanceRecord.create({
      employee: employeeId,
      date: today,
      startTime: new Date(),
      status: 'active'
    });

    return res.status(201).json({
      message: 'Check-in successful',
      action: 'check-in',
      record: newRecord
    });
  } else {
    // Check-out
    const endTime = new Date();
    const totalHours = (endTime - activeRecord.startTime) / (1000 * 60 * 60);

    const employee = await User.findById(employeeId);
    const hourlyRate = employee?.hourlyRate || 0;
    const dailySalary = Math.round(totalHours * hourlyRate * 100) / 100;

    activeRecord.endTime = endTime;
    activeRecord.totalHours = Math.round(totalHours * 100) / 100;
    activeRecord.dailySalary = dailySalary;
    activeRecord.status = 'completed';
    await activeRecord.save();

    return res.status(200).json({
      message: 'Check-out successful',
      action: 'check-out',
      record: activeRecord
    });
  }
};
