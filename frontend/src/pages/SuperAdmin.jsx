import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Trash2, Eye, EyeOff, LogOut, Search, RefreshCw, Lock, UserX, UserCheck, Edit2, X, AlertTriangle, MessageSquare, Package, Megaphone, Download, Clock, Star, ShoppingBag, BookOpen, Send } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts'
import { useAuth } from '../context/AuthContext'
import { apiJson, apiFetch } from '../lib/api'
const ROLES = ['student', 'cr', 'vendor', 'admin']
const ROLE_COLORS = {
  student: 'bg-blue-100 text-blue-700',
  cr: 'bg-green-100 text-green-700',
  vendor: 'bg-orange-100 text-orange-700',
  admin: 'bg-purple-100 text-purple-700',
}
const PIE_COLORS = ['#3b82f6', '#22c55e', '#f97316', '#a855f7']

export default function SuperAdmin() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [activeTab, setActiveTab] = useState('dashboard')
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'admin' })
  const [editUser, setEditUser] = useState(null)
  const [editUserData, setEditUserData] = useState({ name: '', email: '' })
  const [resetPass, setResetPass] = useState({ id: null, password: '' })
  const [complaints, setComplaints] = useState([])
  const [feedbacks, setFeedbacks] = useState([])
  const [lostitems, setLostitems] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [timetables, setTimetables] = useState([])
  const [ratings, setRatings] = useState([])
  const [vendors, setVendors] = useState([])
  const [skillResources, setSkillResources] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', category: 'general' })
  const [selectedItem, setSelectedItem] = useState(null)
  const [postingAnn, setPostingAnn] = useState(false)

  useEffect(() => { fetchUsers(); fetchStats() }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const fetchUsers = () => apiJson('/auth/users').then(data => { if (Array.isArray(data)) setUsers(data) }).catch(() => {})

  const fetchStats = async () => {
    try {
      const endpoints = ['complaints', 'feedbacks', 'announcements', 'lostitems', 'ratings', 'vendors', 'skillresources']
      const results = await Promise.allSettled(endpoints.map(e => apiJson(`/${e}`)))
      const [c, f, a, l, r, v, s] = results.map(res => res.status === 'fulfilled' && Array.isArray(res.value) ? res.value : [])
      setComplaints(c); setFeedbacks(f); setAnnouncements(a); setLostitems(l); setRatings(r); setVendors(v); setSkillResources(s)
    } catch (e) { console.log(e) }
  }

  const applyDateFilter = (items) => {
    if (dateFilter === 'all') return items
    const now = new Date()
    return items.filter(item => {
      const d = new Date(item.createdAt)
      if (dateFilter === 'today') return d.toDateString() === now.toDateString()
      if (dateFilter === 'week') return (now - d) < 7 * 24 * 60 * 60 * 1000
      if (dateFilter === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      return true
    })
  }

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) return
    try {
      await apiJson('/auth/users', { method: 'POST', body: JSON.stringify(newUser) })
      fetchUsers(); setNewUser({ name: '', email: '', password: '', role: 'admin' }); setActiveTab('users'); alert('Account created!')
    } catch (err) { alert(err.message || 'Error') }
  }

  const handleDeleteUser = async (id) => {
    if (!confirm('Delete this user?')) return
    try { await apiFetch(`/auth/users/${id}`, { method: 'DELETE' }); setUsers(users.filter(u => u._id !== id)) } catch { alert('Error') }
  }

  const handleRoleChange = async (id, newRole) => {
    try {
      const data = await apiJson(`/auth/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role: newRole }) })
      setUsers(users.map(u => u._id === id ? { ...u, role: data.role } : u)); setEditUser(null)
    } catch (err) { alert(err.message || 'Error') }
  }

  const handleEditProfile = async (id) => {
    if (!editUserData.name || !editUserData.email) return
    try {
      const data = await apiJson(`/auth/users/${id}/profile`, { method: 'PATCH', body: JSON.stringify(editUserData) })
      setUsers(users.map(u => u._id === id ? { ...u, name: data.name, email: data.email } : u)); setEditUser(null); alert('Profile updated!')
    } catch (err) { alert(err.message || 'Error') }
  }

  const handleResetPassword = async () => {
    if (!resetPass.password || resetPass.password.length < 8) { alert('Password must be at least 8 characters'); return }
    try {
      await apiJson(`/auth/users/${resetPass.id}/password`, { method: 'PATCH', body: JSON.stringify({ password: resetPass.password }) })
      setResetPass({ id: null, password: '' }); alert('Password reset!')
    } catch (err) { alert(err.message || 'Error') }
  }

  const handleBlock = async (id, blocked) => {
    try {
      const data = await apiJson(`/auth/users/${id}/block`, { method: 'PATCH', body: JSON.stringify({ blocked }) })
      setUsers(users.map(u => u._id === id ? { ...u, blocked: data.blocked } : u))
    } catch (err) { alert(err.message || 'Error') }
  }

  const handleDeleteItem = async (endpoint, id, setter, list) => {
    if (!confirm('Delete?')) return
    try { await apiFetch(`/${endpoint}/${id}`, { method: 'DELETE' }); setter(list.filter(i => i._id !== id)) } catch { alert('Error') }
  }

  const handlePostAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) return
    setPostingAnn(true)
    try {
      await apiJson('/announcements', { method: 'POST', body: JSON.stringify(newAnnouncement) })
      setNewAnnouncement({ title: '', content: '', category: 'general' }); fetchStats(); alert('Announcement posted!')
    } catch (err) { alert(err.message || 'Error') }
    setPostingAnn(false)
  }

  const exportCSV = (data, filename) => {
    if (!data.length) return
    const keys = Object.keys(data[0]).filter(k => k !== '__v')
    const csv = [keys.join(','), ...data.map(row => keys.map(k => `"${String(row[k] || '').replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${filename}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  const getMonthlyData = () => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((month, i) => ({
    month,
    complaints: complaints.filter(c => new Date(c.createdAt).getMonth() === i).length,
    feedbacks: feedbacks.filter(f => new Date(f.createdAt).getMonth() === i).length,
    lostitems: lostitems.filter(l => new Date(l.createdAt).getMonth() === i).length,
    users: users.filter(u => new Date(u.createdAt).getMonth() === i).length,
  }))

  const getRoleData = () => ROLES.map(role => ({ name: role.charAt(0).toUpperCase() + role.slice(1), value: users.filter(u => u.role === role).length })).filter(d => d.value > 0)

  const getComplaintCategoryData = () => {
    const cats = {}; complaints.forEach(c => { cats[c.category] = (cats[c.category] || 0) + 1 })
    return Object.entries(cats).map(([name, value]) => ({ name, value }))
  }

  const getMostActiveUsers = () => users.map(u => ({
    ...u, activityCount: complaints.filter(c => c.studentID === u.email).length + feedbacks.filter(f => f.studentID === u.email).length + lostitems.filter(l => l.studentID === u.email).length
  })).sort((a, b) => b.activityCount - a.activityCount).slice(0, 10)

  const getComplaintResolutionRate = () => !complaints.length ? 0 : Math.round((complaints.filter(c => c.status === 'resolved').length / complaints.length) * 100)

  const getUserActivity = (user) => ({
    complaints: complaints.filter(c => c.studentID === user.email),
    feedbacks: feedbacks.filter(f => f.studentID === user.email),
    lostitems: lostitems.filter(l => l.studentID === user.email),
    announcements: announcements.filter(a => a.postedBy === user.name),
  })

  const filteredUsers = users.filter(u => {
    const matchRole = filterRole === 'all' || u.role === filterRole
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  if (selectedUser) {
    const activity = getUserActivity(selectedUser)
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"><Shield size={16} className="text-white" /></div>
            <div><h1 className="text-sm font-bold text-gray-900">User Activity</h1><p className="text-xs text-gray-400">SuperAdmin Portal</p></div>
          </div>
          <button onClick={() => setSelectedUser(null)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 font-medium"><X size={16} /> Back to Users</button>
        </header>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold text-white">{selectedUser.name?.charAt(0).toUpperCase()}</div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedUser.name}</h2>
                <p className="text-gray-500 text-sm">{selectedUser.email}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${ROLE_COLORS[selectedUser.role] || 'bg-gray-100 text-gray-700'}`}>{selectedUser.role}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${selectedUser.blocked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{selectedUser.blocked ? 'Blocked' : 'Active'}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Complaints', count: activity.complaints.length, color: 'text-red-500', bg: 'bg-red-50' },
              { label: 'Feedbacks', count: activity.feedbacks.length, color: 'text-yellow-500', bg: 'bg-yellow-50' },
              { label: 'Lost Items', count: activity.lostitems.length, color: 'text-pink-500', bg: 'bg-pink-50' },
              { label: 'Announcements', count: activity.announcements.length, color: 'text-blue-500', bg: 'bg-blue-50' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          {activity.complaints.length === 0 && activity.feedbacks.length === 0 && activity.lostitems.length === 0 && (
            <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200"><p className="text-sm">No activity found for this user</p></div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow"><Shield size={18} className="text-white" /></div>
          <div><h1 className="text-sm font-bold text-gray-900">SuperAdmin Portal</h1><p className="text-xs text-gray-400">UniCampus Platform Control</p></div>
        </div>
        <div className="flex items-center gap-3">
          <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 bg-white focus:outline-none">
            <option value="all">All Time</option><option value="today">Today</option><option value="week">This Week</option><option value="month">This Month</option>
          </select>
          <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-gray-500 hover:text-red-500 font-medium border border-gray-200 px-3 py-1.5 rounded-lg">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      <div className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {[
            { label: 'Students', count: users.filter(u => u.role === 'student').length, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', tab: 'users', filter: 'student' },
            { label: 'Admins', count: users.filter(u => u.role === 'admin').length, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', tab: 'users', filter: 'admin' },
            { label: 'CRs', count: users.filter(u => u.role === 'cr').length, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', tab: 'users', filter: 'cr' },
            { label: 'Vendors', count: users.filter(u => u.role === 'vendor').length, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', tab: 'users', filter: 'vendor' },
            { label: 'Complaints', count: applyDateFilter(complaints).length, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', tab: 'complaints' },
            { label: 'Feedbacks', count: applyDateFilter(feedbacks).length, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100', tab: 'feedbacks' },
            { label: 'Lost Items', count: applyDateFilter(lostitems).length, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-100', tab: 'lostitems' },
          ].map(s => (
            <div key={s.label} onClick={() => { setActiveTab(s.tab); if (s.filter) setFilterRole(s.filter) }}
              className={`${s.bg} rounded-xl p-3 border ${s.border} text-center cursor-pointer hover:shadow-md transition-all`}>
              <p className={`text-xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {['dashboard','analytics','users','create','post-announcement','complaints','feedbacks','lostitems','announcements','timetables','ratings','vendors','skillresources'].map(id => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === id ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {id === 'post-announcement' ? 'Post Announcement' : id === 'skillresources' ? 'Skill Resources' : id.charAt(0).toUpperCase() + id.slice(1)}
            </button>
          ))}
          <button onClick={() => { fetchUsers(); fetchStats() }} className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"><RefreshCw size={14} /></button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Monthly Activity</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={getMonthlyData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} /><YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} /><Tooltip /><Legend />
                  <Bar dataKey="complaints" fill="#ef4444" name="Complaints" radius={[4,4,0,0]} />
                  <Bar dataKey="feedbacks" fill="#eab308" name="Feedbacks" radius={[4,4,0,0]} />
                  <Bar dataKey="lostitems" fill="#ec4899" name="Lost Items" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">User Role Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={getRoleData()} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {getRoleData().map((_, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Resolution Rate', value: `${getComplaintResolutionRate()}%`, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Total Users', value: users.length, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Avg Rating', value: ratings.length ? (ratings.reduce((a, r) => a + (r.rating || 0), 0) / ratings.length).toFixed(1) + 'star' : 'N/A', color: 'text-yellow-600', bg: 'bg-yellow-50' },
                { label: 'Active Vendors', value: vendors.length, color: 'text-orange-600', bg: 'bg-orange-50' },
              ].map(k => (
                <div key={k.label} className={`${k.bg} rounded-xl p-4`}>
                  <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                  <p className="text-xs font-semibold text-gray-700 mt-1">{k.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50"><h3 className="text-sm font-semibold text-gray-900">Most Active Users (Top 10)</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>{['Rank','Name','Email','Role','Activity'].map(h => <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {getMostActiveUsers().map((u, i) => (
                      <tr key={u._id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500 text-xs font-bold">#{i+1}</td>
                        <td className="px-4 py-3 text-gray-900 font-medium text-xs">{u.name}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-700'}`}>{u.role}</span></td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">{u.activityCount}</span></td>
                      </tr>
                    ))}
                    {getMostActiveUsers().length === 0 && <tr><td colSpan={5} className="text-center py-10 text-gray-400">No data</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="flex gap-2 flex-wrap">
                {['all', ...ROLES].map(role => (
                  <button key={role} onClick={() => setFilterRole(role)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${filterRole === role ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
                    {role}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>{['Name','Email','Role','Status','Joined','Activity','Actions'].map(h => <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u._id} className={`border-t border-gray-100 hover:bg-gray-50 ${u.blocked ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3 text-gray-900 font-medium text-sm">
                          {editUser === u._id ? <input className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none" value={editUserData.name} onChange={e => setEditUserData({ ...editUserData, name: e.target.value })} /> : u.name}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {editUser === u._id ? <input className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none" value={editUserData.email} onChange={e => setEditUserData({ ...editUserData, email: e.target.value })} /> : u.email}
                        </td>
                        <td className="px-4 py-3">
                          <select className="bg-white border border-gray-200 rounded text-xs px-2 py-1 focus:outline-none" value={u.role} onChange={e => handleRoleChange(u._id, e.target.value)}>
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.blocked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{u.blocked ? 'Blocked' : 'Active'}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => setSelectedUser(u)} className="px-2 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-600 font-medium">View Activity</button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {editUser === u._id ? (
                              <>
                                <button onClick={() => handleEditProfile(u._id)} className="p-1.5 bg-green-50 rounded-lg border border-green-100"><Send size={12} className="text-green-500" /></button>
                                <button onClick={() => setEditUser(null)} className="p-1.5 bg-gray-100 rounded-lg border border-gray-200"><X size={12} className="text-gray-500" /></button>
                              </>
                            ) : (
                              <button onClick={() => { setEditUser(u._id); setEditUserData({ name: u.name, email: u.email }) }} className="p-1.5 bg-blue-50 rounded-lg border border-blue-100"><Edit2 size={12} className="text-blue-500" /></button>
                            )}
                            <button onClick={() => setResetPass({ id: u._id, password: '' })} className="p-1.5 bg-yellow-50 rounded-lg border border-yellow-100"><Lock size={12} className="text-yellow-500" /></button>
                            <button onClick={() => handleBlock(u._id, !u.blocked)} className={`p-1.5 rounded-lg border ${u.blocked ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
                              {u.blocked ? <UserCheck size={12} className="text-green-500" /> : <UserX size={12} className="text-orange-500" />}
                            </button>
                            <button onClick={() => handleDeleteUser(u._id)} className="p-1.5 bg-red-50 rounded-lg border border-red-100"><Trash2 size={12} className="text-red-500" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">No users found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'create' && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm max-w-md">
            <h3 className="text-sm font-semibold text-gray-900 mb-5">Create Account</h3>
            <div className="space-y-4">
              {[{ label: 'Full Name', key: 'name', type: 'text', placeholder: 'e.g. Ramesh Kumar' }, { label: 'Email', key: 'email', type: 'email', placeholder: 'admin@university.edu' }, { label: 'Password', key: 'password', type: 'password', placeholder: 'Set password' }].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">{f.label}</label>
                  <input className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    type={f.type} placeholder={f.placeholder} value={newUser[f.key]} onChange={e => setNewUser({ ...newUser, [f.key]: e.target.value })} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role</label>
                <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                  <option value="admin">Admin</option><option value="cr">CR</option><option value="vendor">Vendor</option>
                </select>
              </div>
              <button onClick={handleCreateUser} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors">Create Account</button>
            </div>
          </div>
        )}

        {activeTab === 'post-announcement' && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm max-w-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-5">Post Announcement</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Title</label>
                <input className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none" placeholder="Announcement title..." value={newAnnouncement.title} onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category</label>
                <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none" value={newAnnouncement.category} onChange={e => setNewAnnouncement({ ...newAnnouncement, category: e.target.value })}>
                  <option value="general">General</option><option value="academic">Academic</option><option value="event">Event</option><option value="holiday">Holiday</option><option value="maintenance">Maintenance</option><option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Content</label>
                <textarea className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none resize-none" rows={5} placeholder="Write announcement content..." value={newAnnouncement.content} onChange={e => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })} />
              </div>
              <button onClick={handlePostAnnouncement} disabled={postingAnn} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
                <Send size={15} /> {postingAnn ? 'Posting...' : 'Post Announcement'}
              </button>
            </div>
          </div>
        )}

        {['complaints','feedbacks','lostitems','announcements','timetables','ratings','vendors','skillresources'].includes(activeTab) && (() => {
          const configs = {
            complaints: { data: applyDateFilter(complaints), setter: setComplaints, list: complaints, endpoint: 'complaints', icon: <AlertTriangle size={16} className="text-red-500" />, label: 'Complaints', columns: ['ID','Category','Description','Student','Status','Date','Action'], row: c => [c.complaintID, c.category, <span className="max-w-xs truncate block">{c.description}</span>, c.studentID, <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>{c.status}</span>, new Date(c.createdAt).toLocaleDateString()] },
            feedbacks: { data: applyDateFilter(feedbacks), setter: setFeedbacks, list: feedbacks, endpoint: 'feedbacks', icon: <MessageSquare size={16} className="text-yellow-500" />, label: 'Feedbacks', columns: ['ID','Subject','Teacher','Rating','Comments','Student','Date','Action'], row: f => [f.feedbackID, f.subject, f.teacher, <span className="text-yellow-500 font-bold">{f.rating}star</span>, <span className="max-w-xs truncate block">{f.comments}</span>, f.studentID, new Date(f.createdAt).toLocaleDateString()] },
            lostitems: { data: applyDateFilter(lostitems), setter: setLostitems, list: lostitems, endpoint: 'lostitems', icon: <Package size={16} className="text-pink-500" />, label: 'Lost Items', columns: ['Item','Description','Status','Student','Date','Action'], row: i => [i.itemName, <span className="max-w-xs truncate block">{i.description}</span>, <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${i.status === 'found' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{i.status}</span>, i.studentID, new Date(i.createdAt).toLocaleDateString()] },
            announcements: { data: applyDateFilter(announcements), setter: setAnnouncements, list: announcements, endpoint: 'announcements', icon: <Megaphone size={16} className="text-blue-500" />, label: 'Announcements', columns: ['Title','Category','Content','Posted By','Date','Action'], row: a => [a.title, <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-600 capitalize">{a.category}</span>, <span className="max-w-xs truncate block">{a.content}</span>, a.postedBy, new Date(a.createdAt).toLocaleDateString()] },
            timetables: { data: timetables, setter: setTimetables, list: timetables, endpoint: 'timetables', icon: <Clock size={16} className="text-indigo-500" />, label: 'Timetables', columns: ['Title','Department','Semester','Posted By','Date','Action'], row: t => [t.title||'N/A', t.department||'N/A', t.semester||'N/A', t.postedBy||'N/A', new Date(t.createdAt).toLocaleDateString()] },
            ratings: { data: ratings, setter: setRatings, list: ratings, endpoint: 'ratings', icon: <Star size={16} className="text-yellow-500" />, label: 'Ratings', columns: ['Vendor','Rating','Comment','Student','Date','Action'], row: r => [r.vendorName||r.vendor||'N/A', <span className="text-yellow-500 font-bold">{r.rating}star</span>, <span className="max-w-xs truncate block">{r.comment||'N/A'}</span>, r.studentID||'N/A', new Date(r.createdAt).toLocaleDateString()] },
            vendors: { data: vendors, setter: setVendors, list: vendors, endpoint: 'vendors', icon: <ShoppingBag size={16} className="text-orange-500" />, label: 'Vendors', columns: ['Shop','Owner','Email','Category','Date','Action'], row: v => [v.shop||v.shopName||'N/A', v.name||'N/A', v.email||'N/A', v.category||'N/A', new Date(v.createdAt).toLocaleDateString()] },
            skillresources: { data: skillResources, setter: setSkillResources, list: skillResources, endpoint: 'skillresources', icon: <BookOpen size={16} className="text-teal-500" />, label: 'Skill Resources', columns: ['Title','Category','Posted By','Date','Action'], row: s => [s.title||'N/A', s.category||'N/A', s.postedBy||'N/A', new Date(s.createdAt).toLocaleDateString()] },
          }
          const cfg = configs[activeTab]; if (!cfg) return null
          return (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">{cfg.icon}<h3 className="text-sm font-semibold text-gray-900">{cfg.data.length} {cfg.label}</h3></div>
                <button onClick={() => exportCSV(cfg.data, activeTab)} className="flex items-center gap-1 text-xs text-blue-600 font-medium"><Download size={12} /> Export CSV</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100"><tr>{cfg.columns.map(h => <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>)}</tr></thead>
                  <tbody>
                    {cfg.data.map(item => (
                      <tr key={item._id} className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedItem(item)}>
                        {cfg.row(item).map((cell, i) => <td key={i} className="px-4 py-3 text-gray-700 text-xs">{cell}</td>)}
                        <td className="px-4 py-3"><button onClick={(e) => { e.stopPropagation(); handleDeleteItem(cfg.endpoint, item._id, cfg.setter, cfg.list) }} className="p-1.5 bg-red-50 rounded-lg border border-red-100"><Trash2 size={12} className="text-red-500" /></button></td>
                      </tr>
                    ))}
                    {cfg.data.length === 0 && <tr><td colSpan={cfg.columns.length} className="text-center py-10 text-gray-400">No data found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })()}

        {resetPass.id && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-xl w-full max-w-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Reset Password</h3>
              <input className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none mb-3"
                type="password" placeholder="New password" value={resetPass.password} onChange={e => setResetPass({ ...resetPass, password: e.target.value })} />
              <div className="flex gap-2">
                <button onClick={() => setResetPass({ id: null, password: '' })} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">Cancel</button>
                <button onClick={handleResetPassword} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Reset</button>
              </div>
            </div>
          </div>
        )}

        {selectedItem && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900">Item Details</h3>
                <button onClick={() => setSelectedItem(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"><X size={18} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {Object.entries(selectedItem).filter(([k]) => !['__v', '_id'].includes(k)).map(([key, value]) => (
                    <div key={key} className="border-b border-gray-50 pb-3">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{key}</div>
                      {key === 'proof' && Array.isArray(value) && value.length > 0 ? (
                        <div className="flex gap-3 flex-wrap">
                          {value.map((file, i) => (
                            file.data && (file.type?.startsWith('image/') || file.data?.startsWith('data:image/')) ? (
                              <img key={i} src={file.data} alt={file.name || 'proof'} className="w-24 h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80" onClick={() => window.open(file.data)} />
                            ) : (
                              <a key={i} href={file.data} download={file.name} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100">
                                📄 {file.name || `File ${i+1}`}
                              </a>
                            )
                          ))}
                        </div>
                      ) : key === 'photo' && typeof value === 'string' && value.startsWith('data:image') ? (
                        <img src={value} alt="Photo" className="w-40 h-40 object-cover rounded-lg border border-gray-200" />
                      ) : typeof value === 'object' && value !== null ? (
                        <pre className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg overflow-auto max-h-40">{JSON.stringify(value, null, 2)}</pre>
                      ) : (
                        <div className="text-sm text-gray-800">{String(value ?? '-')}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}