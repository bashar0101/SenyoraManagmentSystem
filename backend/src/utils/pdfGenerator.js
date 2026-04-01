import PDFDocument from 'pdfkit';

export const generatePDF = (records, employeeInfo, month) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('Senyora Management System', { align: 'center' });
    doc.fontSize(14).font('Helvetica').text('Attendance Report', { align: 'center' });
    doc.moveDown(0.5);

    // Employee and month info
    if (employeeInfo) {
      doc.fontSize(11).font('Helvetica-Bold').text(`Employee: `, { continued: true }).font('Helvetica').text(employeeInfo.name || 'All Employees');
      doc.font('Helvetica-Bold').text('Email: ', { continued: true }).font('Helvetica').text(employeeInfo.email || '—');
    } else {
      doc.fontSize(11).font('Helvetica-Bold').text('Employees: ', { continued: true }).font('Helvetica').text('All Employees');
    }
    doc.font('Helvetica-Bold').text('Month: ', { continued: true }).font('Helvetica').text(month || 'All Time');
    doc.moveDown(1);

    // Table setup
    const tableTop = doc.y;
    const colWidths = [80, 120, 90, 90, 80, 90, 75];
    const colHeaders = ['Date', 'Employee', 'Start Time', 'End Time', 'Total Hours', 'Daily Salary', 'Status'];
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const startX = doc.page.margins.left;
    const rowHeight = 22;

    const drawRow = (y, values, isHeader = false, isTotal = false) => {
      let x = startX;

      if (isHeader) {
        doc.rect(startX, y, pageWidth, rowHeight).fill('#2563eb');
      } else if (isTotal) {
        doc.rect(startX, y, pageWidth, rowHeight).fill('#dbeafe');
      } else {
        const rowIndex = records.indexOf(values.__record);
        const bg = rowIndex % 2 === 0 ? '#f9fafb' : '#ffffff';
        doc.rect(startX, y, pageWidth, rowHeight).fill(bg);
      }

      doc.strokeColor('#d1d5db').lineWidth(0.5);
      x = startX;
      for (let i = 0; i < colWidths.length; i++) {
        doc.rect(x, y, colWidths[i], rowHeight).stroke();
        x += colWidths[i];
      }

      x = startX;
      values.forEach((val, i) => {
        const textColor = isHeader ? '#ffffff' : '#111827';
        const font = isHeader || isTotal ? 'Helvetica-Bold' : 'Helvetica';
        doc
          .fillColor(textColor)
          .font(font)
          .fontSize(9)
          .text(String(val), x + 4, y + 6, { width: colWidths[i] - 8, lineBreak: false });
        x += colWidths[i];
      });
    };

    drawRow(tableTop, colHeaders, true);

    let y = tableTop + rowHeight;
    let totalHours = 0;
    let totalSalary = 0;

    records.forEach((record) => {
      const startTime = record.startTime ? new Date(record.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';
      const endTime = record.endTime ? new Date(record.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';
      const hours = record.totalHours ? record.totalHours.toFixed(2) : '0.00';
      const salary = record.dailySalary ? `$${record.dailySalary.toFixed(2)}` : '$0.00';
      const employeeName = record.employee?.name || (employeeInfo?.name) || '—';

      const rowValues = [
        record.date,
        employeeName,
        startTime,
        endTime,
        hours,
        salary,
        record.status
      ];
      rowValues.__record = record;

      drawRow(y, rowValues);

      totalHours += record.totalHours || 0;
      totalSalary += record.dailySalary || 0;
      y += rowHeight;

      if (y > doc.page.height - doc.page.margins.bottom - rowHeight * 2) {
        doc.addPage();
        y = doc.page.margins.top;
        drawRow(y, colHeaders, true);
        y += rowHeight;
      }
    });

    // Totals row
    const totalValues = [
      'TOTALS', '', '', '',
      totalHours.toFixed(2),
      `$${totalSalary.toFixed(2)}`,
      ''
    ];
    totalValues.__record = null;
    drawRow(y, totalValues, false, true);

    doc.end();
  });
};
