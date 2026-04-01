import AttendanceRecord from '../models/AttendanceRecord.js';

export const getMyAttendance = async (req, res) => {
  const { month } = req.query;
  const query = { employee: req.user.userId };

  if (month) {
    query.date = { $regex: `^${month}` };
  }

  const records = await AttendanceRecord.find(query)
    .populate('employee', 'name email hourlyRate')
    .sort({ date: -1, startTime: -1 });

  return res.status(200).json({ records });
};

export const getAllAttendance = async (req, res) => {
  const { employeeId, month, status } = req.query;
  const query = {};

  if (employeeId) {
    query.employee = employeeId;
  }

  if (month) {
    query.date = { $regex: `^${month}` };
  }

  if (status) {
    query.status = status;
  }

  const records = await AttendanceRecord.find(query)
    .populate('employee', 'name email hourlyRate')
    .sort({ date: -1, startTime: -1 });

  return res.status(200).json({ records });
};

export const getEmployeeAttendance = async (req, res) => {
  const { employeeId } = req.params;
  const { month, status } = req.query;
  const query = { employee: employeeId };

  if (month) {
    query.date = { $regex: `^${month}` };
  }

  if (status) {
    query.status = status;
  }

  const records = await AttendanceRecord.find(query)
    .populate('employee', 'name email hourlyRate')
    .sort({ date: -1, startTime: -1 });

  return res.status(200).json({ records });
};
