import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import QRDisplay from '../components/QRDisplay.jsx';
import AttendanceTable from '../components/AttendanceTable.jsx';
import api from '../api/axios.js';

const tabs = [
  { id: 'qr', label: 'QR Display', icon: '📱' },
  { id: 'attendance', label: 'Attendance', icon: '📋' },
  { id: 'export', label: 'Export PDF', icon: '📄' }
];

const ManagerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('qr');

  // Attendance state
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState('');
  const [filters, setFilters] = useState({ employeeId: '', month: '', status: '' });

  // Export state
  const [exportEmployee, setExportEmployee] = useState('');
  const [exportMonth, setExportMonth] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/api/attendance/all');
      const allRecords = response.data.records;
      const uniqueEmployees = [];
      const seen = new Set();
      allRecords.forEach((r) => {
        if (r.employee && !seen.has(r.employee._id)) {
          seen.add(r.employee._id);
          uniqueEmployees.push(r.employee);
        }
      });
      setEmployees(uniqueEmployees);
    } catch {
      // ignore
    }
  };

  const fetchAttendance = async () => {
    setAttendanceLoading(true);
    setAttendanceError('');
    try {
      const params = new URLSearchParams();
      if (filters.employeeId) params.append('employeeId', filters.employeeId);
      if (filters.month) params.append('month', filters.month);
      if (filters.status) params.append('status', filters.status);

      const response = await api.get(`/api/attendance/all?${params.toString()}`);
      setRecords(response.data.records);
    } catch (err) {
      setAttendanceError(err.response?.data?.message || 'Failed to fetch attendance records.');
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendance();
      fetchEmployees();
    }
    if (activeTab === 'export') {
      fetchEmployees();
    }
  }, [activeTab]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchAttendance();
  };

  const handleExport = async () => {
    setExporting(true);
    setExportMessage('');
    try {
      const params = new URLSearchParams();
      if (exportEmployee) params.append('employeeId', exportEmployee);
      if (exportMonth) params.append('month', exportMonth);

      const response = await api.get(`/api/export/pdf?${params.toString()}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-${exportEmployee || 'all'}-${exportMonth || 'all'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setExportMessage('PDF downloaded successfully!');
    } catch (err) {
      setExportMessage('Failed to generate PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Senyora Management</h1>
              <p className="text-xs text-gray-500">Manager Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* QR Display Tab */}
        {activeTab === 'qr' && (
          <div className="flex justify-center">
            <QRDisplay />
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Attendance Records</h2>
              <p className="text-gray-500 text-sm">View and filter all employee attendance</p>
            </div>

            {/* Filters */}
            <form onSubmit={handleApplyFilters} className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Employee</label>
                  <select
                    value={filters.employeeId}
                    onChange={(e) => handleFilterChange('employeeId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Employees</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Month</label>
                  <input
                    type="month"
                    value={filters.month}
                    onChange={(e) => handleFilterChange('month', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply Filters
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilters({ employeeId: '', month: '', status: '' });
                    setTimeout(fetchAttendance, 50);
                  }}
                  className="px-5 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear
                </button>
              </div>
            </form>

            {attendanceError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700 text-sm">
                {attendanceError}
              </div>
            )}

            {attendanceLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <AttendanceTable records={records} isManager={true} />
            )}
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Export PDF Report</h2>
              <p className="text-gray-500 text-sm">Generate and download attendance reports as PDF</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm max-w-lg">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Employee</label>
                  <select
                    value={exportEmployee}
                    onChange={(e) => setExportEmployee(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Employees</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>{emp.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Leave empty to export all employees</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Month</label>
                  <input
                    type="month"
                    value={exportMonth}
                    onChange={(e) => setExportMonth(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Leave empty to export all time</p>
                </div>

                {exportMessage && (
                  <div className={`p-3 rounded-lg text-sm ${exportMessage.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {exportMessage}
                  </div>
                )}

                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center justify-center gap-2"
                >
                  {exporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManagerDashboard;
