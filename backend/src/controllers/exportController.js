import AttendanceRecord from '../models/AttendanceRecord.js';
import User from '../models/User.js';
import { generatePDF } from '../utils/pdfGenerator.js';

export const exportPdf = async (req, res) => {
  const { employeeId, month } = req.query;
  const query = {};

  if (employeeId) {
    query.employee = employeeId;
  }

  if (month) {
    query.date = { $regex: `^${month}` };
  }

  const records = await AttendanceRecord.find(query)
    .populate('employee', 'name email hourlyRate')
    .sort({ date: 1, startTime: 1 });

  let employeeInfo = null;
  if (employeeId) {
    const employee = await User.findById(employeeId).select('name email hourlyRate');
    employeeInfo = employee;
  }

  const pdfBuffer = await generatePDF(records, employeeInfo, month);

  const filename = `attendance-${employeeId || 'all'}-${month || 'all'}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', pdfBuffer.length);

  return res.end(pdfBuffer);
};
