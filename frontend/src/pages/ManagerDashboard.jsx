import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import QRDisplay from '../components/QRDisplay.jsx';
import AttendanceTable from '../components/AttendanceTable.jsx';
import api from '../api/axios.js';

const DEFAULT_MANAGER_EMAIL = 'basharhas1999@gmail.com';

const NAV = [
  {
    id: 'qr',
    label: 'QR Display',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
    )
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    )
  },
  {
    id: 'export',
    label: 'Export PDF',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    )
  },
  {
    id: 'users',
    label: 'Users',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  }
];

const emptyCreateForm = { name: '', lastName: '', email: '', password: '', role: 'employee', hourlyRate: '' };

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

  // Users state
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [usersSuccess, setUsersSuccess] = useState('');

  // Create form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit modal
  const [editUser, setEditUser] = useState(null); // user being edited
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/api/users');
      setEmployees(res.data.users.filter(u => u.role === 'employee'));
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
      const res = await api.get(`/api/attendance/all?${params.toString()}`);
      setRecords(res.data.records);
    } catch (err) {
      setAttendanceError(err.response?.data?.message || 'Failed to fetch attendance records.');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    setUsersLoading(true);
    setUsersError('');
    try {
      const res = await api.get('/api/users');
      setAllUsers(res.data.users);
    } catch (err) {
      setUsersError(err.response?.data?.message || 'Failed to fetch users.');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'attendance') { fetchAttendance(); fetchEmployees(); }
    if (activeTab === 'export') { fetchEmployees(); }
    if (activeTab === 'users') { fetchAllUsers(); }
  }, [activeTab]);

  const handleFilterChange = (field, value) => setFilters(prev => ({ ...prev, [field]: value }));
  const handleApplyFilters = (e) => { e.preventDefault(); fetchAttendance(); };

  const handleExport = async () => {
    setExporting(true);
    setExportMessage('');
    try {
      const params = new URLSearchParams();
      if (exportEmployee) params.append('employeeId', exportEmployee);
      if (exportMonth) params.append('month', exportMonth);
      const res = await api.get(`/api/export/pdf?${params.toString()}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-${exportEmployee || 'all'}-${exportMonth || 'all'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setExportMessage('PDF downloaded successfully!');
    } catch {
      setExportMessage('Failed to generate PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // --- Create ---
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');
    try {
      await api.post('/api/users', { ...createForm, hourlyRate: Number(createForm.hourlyRate) || 0 });
      setUsersSuccess(`User ${createForm.name} ${createForm.lastName} created successfully.`);
      setCreateForm(emptyCreateForm);
      setShowCreateForm(false);
      fetchAllUsers();
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setCreateLoading(false);
    }
  };

  // --- Edit ---
  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({ name: u.name, lastName: u.lastName, email: u.email, password: '', role: u.role, hourlyRate: u.hourlyRate });
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    try {
      const payload = { ...editForm, hourlyRate: Number(editForm.hourlyRate) || 0 };
      if (!payload.password) delete payload.password; // only send if changed
      await api.put(`/api/users/${editUser._id}`, payload);
      setUsersSuccess(`User ${editForm.name} ${editForm.lastName} updated successfully.`);
      setEditUser(null);
      fetchAllUsers();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update user.');
    } finally {
      setEditLoading(false);
    }
  };

  // --- Delete ---
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/api/users/${deleteTarget._id}`);
      setUsersSuccess(`User ${deleteTarget.name} ${deleteTarget.lastName} deleted.`);
      setDeleteTarget(null);
      fetchAllUsers();
    } catch (err) {
      setUsersError(err.response?.data?.message || 'Failed to delete user.');
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const isDefaultManager = (u) => u.email === DEFAULT_MANAGER_EMAIL;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">Senyora</p>
              <p className="text-xs text-gray-500">Manager</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                activeTab === item.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className={activeTab === item.id ? 'text-blue-600' : 'text-gray-400'}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="mb-3 min-w-0">
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
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">

          {/* QR Display */}
          {activeTab === 'qr' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">QR Display</h2>
              <div className="flex justify-center"><QRDisplay /></div>
            </div>
          )}

          {/* Attendance */}
          {activeTab === 'attendance' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Attendance Records</h2>
              <p className="text-gray-500 text-sm mb-6">View and filter all employee attendance</p>
              <form onSubmit={handleApplyFilters} className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Employee</label>
                    <select value={filters.employeeId} onChange={e => handleFilterChange('employeeId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">All Employees</option>
                      {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name} {emp.lastName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Month</label>
                    <input type="month" value={filters.month} onChange={e => handleFilterChange('month', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                    <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <button type="submit" className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">Apply Filters</button>
                  <button type="button" onClick={() => { setFilters({ employeeId: '', month: '', status: '' }); setTimeout(fetchAttendance, 50); }}
                    className="px-5 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">Clear</button>
                </div>
              </form>
              {attendanceError && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700 text-sm">{attendanceError}</div>}
              {attendanceLoading ? (
                <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
              ) : (
                <AttendanceTable records={records} isManager={true} />
              )}
            </div>
          )}

          {/* Export PDF */}
          {activeTab === 'export' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Export PDF Report</h2>
              <p className="text-gray-500 text-sm mb-6">Generate and download attendance reports as PDF</p>
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm max-w-lg">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Employee</label>
                    <select value={exportEmployee} onChange={e => setExportEmployee(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">All Employees</option>
                      {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name} {emp.lastName}</option>)}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Leave empty to export all employees</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Month</label>
                    <input type="month" value={exportMonth} onChange={e => setExportMonth(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <p className="text-xs text-gray-400 mt-1">Leave empty to export all time</p>
                  </div>
                  {exportMessage && (
                    <div className={`p-3 rounded-lg text-sm ${exportMessage.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {exportMessage}
                    </div>
                  )}
                  <button onClick={handleExport} disabled={exporting}
                    className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center justify-center gap-2">
                    {exporting ? (
                      <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Generating PDF...</>
                    ) : (
                      <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Download PDF</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Users */}
          {activeTab === 'users' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Users</h2>
                  <p className="text-gray-500 text-sm">Manage employees and managers</p>
                </div>
                <button
                  onClick={() => { setShowCreateForm(true); setCreateError(''); setUsersSuccess(''); }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add User
                </button>
              </div>

              {usersSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-green-700 text-sm flex items-center justify-between">
                  {usersSuccess}
                  <button onClick={() => setUsersSuccess('')} className="text-green-500 hover:text-green-700">✕</button>
                </div>
              )}
              {usersError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700 text-sm flex items-center justify-between">
                  {usersError}
                  <button onClick={() => setUsersError('')} className="text-red-500 hover:text-red-700">✕</button>
                </div>
              )}

              {/* Create Form */}
              {showCreateForm && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">New User</h3>
                  <form onSubmit={handleCreateUser}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                        <input type="text" required value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                        <input type="text" required value={createForm.lastName} onChange={e => setCreateForm(p => ({ ...p, lastName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                        <input type="email" required value={createForm.email} onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                        <input type="password" required value={createForm.password} onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                        <select value={createForm.role} onChange={e => setCreateForm(p => ({ ...p, role: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="employee">Employee</option>
                          <option value="manager">Manager</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Hourly Rate ($)</label>
                        <input type="number" min="0" step="0.01" value={createForm.hourlyRate} onChange={e => setCreateForm(p => ({ ...p, hourlyRate: e.target.value }))}
                          placeholder="0.00" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                    {createError && <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">{createError}</div>}
                    <div className="flex gap-3">
                      <button type="submit" disabled={createLoading}
                        className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors">
                        {createLoading ? 'Creating...' : 'Create User'}
                      </button>
                      <button type="button" onClick={() => setShowCreateForm(false)}
                        className="px-5 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Users Table */}
              {usersLoading ? (
                <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Name</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Email</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Role</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Hourly Rate</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {allUsers.length === 0 ? (
                        <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">No users found</td></tr>
                      ) : allUsers.map(u => (
                        <tr key={u._id} className="hover:bg-gray-50">
                          <td className="px-5 py-3 font-medium text-gray-900">
                            {u.name} {u.lastName}
                            {isDefaultManager(u) && (
                              <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium">Default</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-gray-600">{u.email}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.role === 'manager' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-gray-600">${u.hourlyRate}/hr</td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEdit(u)}
                                className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                              >
                                Edit
                              </button>
                              {!isDefaultManager(u) && (
                                <button
                                  onClick={() => setDeleteTarget(u)}
                                  className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Edit User</h3>
              <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                  <input type="text" required value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                  <input type="text" required value={editForm.lastName} onChange={e => setEditForm(p => ({ ...p, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input type="email" required value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    New Password <span className="text-gray-400 font-normal">(leave blank to keep)</span>
                  </label>
                  <input type="password" value={editForm.password} onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                  {isDefaultManager(editUser) ? (
                    <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 flex items-center gap-2">
                      Manager
                      <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">Protected</span>
                    </div>
                  ) : (
                    <select value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Hourly Rate ($)</label>
                  <input type="number" min="0" step="0.01" value={editForm.hourlyRate} onChange={e => setEditForm(p => ({ ...p, hourlyRate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              {editError && <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">{editError}</div>}
              <div className="flex gap-3">
                <button type="submit" disabled={editLoading}
                  className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors">
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditUser(null)}
                  className="px-5 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Delete User</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-6">
              Are you sure you want to delete <strong>{deleteTarget.name} {deleteTarget.lastName}</strong>?
            </p>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={deleteLoading}
                className="flex-1 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-colors">
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
