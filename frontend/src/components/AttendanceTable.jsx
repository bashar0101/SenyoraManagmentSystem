const formatTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '$0.00';
  return `$${Number(amount).toFixed(2)}`;
};

const StatusBadge = ({ status }) => {
  const styles = {
    active: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    completed: 'bg-green-100 text-green-800 border border-green-200'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status === 'active' ? (
        <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-1.5 animate-pulse"></span>
      ) : (
        <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></span>
      )}
      {status}
    </span>
  );
};

const AttendanceTable = ({ records = [], isManager = false }) => {
  if (!records.length) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-gray-500 font-medium">No attendance records found</p>
        <p className="text-gray-400 text-sm mt-1">Records will appear here once employees check in</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
            {isManager && (
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
            )}
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Start Time</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">End Time</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Hours</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Daily Salary</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {records.map((record, index) => (
            <tr key={record._id || index} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-sm text-gray-900 font-medium whitespace-nowrap">{record.date}</td>
              {isManager && (
                <td className="px-4 py-3 whitespace-nowrap">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{record.employee?.name || '—'}</p>
                    <p className="text-xs text-gray-500">{record.employee?.email || ''}</p>
                  </div>
                </td>
              )}
              <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{formatTime(record.startTime)}</td>
              <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{formatTime(record.endTime)}</td>
              <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                {record.totalHours ? `${Number(record.totalHours).toFixed(2)}h` : '—'}
              </td>
              <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                {record.status === 'completed' ? formatCurrency(record.dailySalary) : '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusBadge status={record.status} />
              </td>
            </tr>
          ))}
        </tbody>
        {records.length > 0 && (
          <tfoot className="bg-gray-50 border-t-2 border-gray-200">
            <tr>
              <td colSpan={isManager ? 4 : 3} className="px-4 py-3 text-sm font-semibold text-gray-700">
                Totals ({records.length} records)
              </td>
              <td className="px-4 py-3 text-sm font-bold text-gray-900">
                {records.reduce((sum, r) => sum + (r.totalHours || 0), 0).toFixed(2)}h
              </td>
              <td className="px-4 py-3 text-sm font-bold text-gray-900">
                {formatCurrency(records.reduce((sum, r) => sum + (r.dailySalary || 0), 0))}
              </td>
              <td className="px-4 py-3"></td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};

export default AttendanceTable;
