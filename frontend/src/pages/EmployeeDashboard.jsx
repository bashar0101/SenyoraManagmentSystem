import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import QRScanner from '../components/QRScanner.jsx';
import AttendanceTable from '../components/AttendanceTable.jsx';
import LanguageSwitcher from '../components/LanguageSwitcher.jsx';
import api from '../api/axios.js';

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('scan');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [monthFilter, setMonthFilter] = useState('');

  const NAV = [
    {
      id: 'scan',
      label: t('nav.scanQr'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      id: 'attendance',
      label: t('nav.myAttendance'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    }
  ];

  const fetchAttendance = async () => {
    setLoading(true);
    setError('');
    try {
      const params = monthFilter ? `?month=${monthFilter}` : '';
      const res = await api.get(`/api/attendance/me${params}`);
      setRecords(res.data.records);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch attendance records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'attendance') fetchAttendance();
  }, [activeTab]);

  const handleMonthFilter = (e) => { e.preventDefault(); fetchAttendance(); };
  const handleLogout = async () => { await logout(); navigate('/login'); };
  const switchTab = (id) => { setActiveTab(id); setSidebarOpen(false); };

  const completedRecords = records.filter(r => r.status === 'completed');
  const totalHours = completedRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0);
  const totalSalary = completedRecords.reduce((sum, r) => sum + (r.dailySalary || 0), 0);
  const currentNavLabel = NAV.find(n => n.id === activeTab)?.label || '';

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30
        w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{t('app.name')}</p>
              <p className="text-xs text-gray-500">{t('roles.employee')}</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => switchTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                activeTab === item.id
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className={activeTab === item.id ? 'text-green-600' : 'text-gray-400'}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-3">
          <LanguageSwitcher />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name} {user?.lastName}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900 text-sm">{currentNavLabel}</span>
          </div>
          <LanguageSwitcher />
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8">

            {activeTab === 'scan' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6 hidden md:block">{t('nav.scanQr')}</h2>
                <QRScanner />
              </div>
            )}

            {activeTab === 'attendance' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1 hidden md:block">{t('attendance.myTitle')}</h2>
                <p className="text-gray-500 text-sm mb-4 hidden md:block">{t('attendance.mySubtitle')}</p>

                <form onSubmit={handleMonthFilter} className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('attendance.filterMonth')}</label>
                      <input
                        type="month"
                        value={monthFilter}
                        onChange={e => setMonthFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 sm:flex-none px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
                        {t('attendance.apply')}
                      </button>
                      <button type="button" onClick={() => { setMonthFilter(''); setTimeout(fetchAttendance, 50); }}
                        className="flex-1 sm:flex-none px-5 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
                        {t('attendance.clear')}
                      </button>
                    </div>
                  </div>
                </form>

                {records.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm text-center">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{t('attendance.days')}</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">{completedRecords.length}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm text-center">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{t('attendance.hours')}</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">{totalHours.toFixed(1)}h</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm text-center">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{t('attendance.earned')}</p>
                      <p className="text-xl font-bold text-green-600 mt-1">${totalSalary.toFixed(0)}</p>
                    </div>
                  </div>
                )}

                {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700 text-sm">{error}</div>}
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <AttendanceTable records={records} isManager={false} />
                  </div>
                )}
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
