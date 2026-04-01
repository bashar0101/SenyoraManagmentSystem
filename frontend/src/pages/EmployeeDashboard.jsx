import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import QRScanner from '../components/QRScanner.jsx';
import AttendanceTable from '../components/AttendanceTable.jsx';
import api from '../api/axios.js';

const tabs = [
  { id: 'scan', label: 'Scan QR', icon: '📷' },
  { id: 'attendance', label: 'My Attendance', icon: '📋' }
];

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('scan');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [monthFilter, setMonthFilter] = useState('');

  const fetchAttendance = async () => {
    setLoading(true);
    setError('');
    try {
      const params = monthFilter ? `?month=${monthFilter}` : '';
      const response = await api.get(`/api/attendance/me${params}`);
      setRecords(response.data.records);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch attendance records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendance();
    }
  }, [activeTab]);

  const handleMonthFilter = (e) => {
    e.preventDefault();
    fetchAttendance();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Calculate summary stats
  const completedRecords = records.filter((r) => r.status === 'completed');
  const totalHours = completedRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0);
  const totalSalary = completedRecords.reduce((sum, r) => sum + (r.dailySalary || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Senyora Management</h1>
              <p className="text-xs text-gray-500">Employee Dashboard</p>
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
        <div className="max-w-4xl mx-auto px-4">
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-600 text-green-600'
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
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Scan QR Tab */}
        {activeTab === 'scan' && (
          <div className="flex justify-center">
            <QRScanner />
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">My Attendance</h2>
              <p className="text-gray-500 text-sm">View your attendance history and earnings</p>
            </div>

            {/* Month Filter */}
            <form onSubmit={handleMonthFilter} className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Filter by Month</label>
                  <input
                    type="month"
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMonthFilter('');
                    setTimeout(fetchAttendance, 50);
                  }}
                  className="px-5 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear
                </button>
              </div>
            </form>

            {/* Stats Cards */}
            {records.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Days</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{completedRecords.length}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Hours</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{totalHours.toFixed(2)}h</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Earnings</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">${totalSalary.toFixed(2)}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700 text-sm">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
              </div>
            ) : (
              <AttendanceTable records={records} isManager={false} />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default EmployeeDashboard;
