import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from 'recharts'
import {
  AlertTriangle, FileWarning, Clock, CheckCircle, Users,
  TrendingUp, AlertCircle, BarChart3, X
} from 'lucide-react'
import { apiJson } from '../../lib/api'
import StatCard from '../../components/admin/StatCard'
import LoadingState from '../../components/admin/LoadingState'
import AssignedClassSelect, { EMPTY_CLASS } from '../../components/admin/AssignedClassSelect'

const PIE_COLORS = ['#7c3aed', '#2563eb', '#059669', '#d97706']

function DetailsModal({ isOpen, onClose, title, type, data }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-fade-in-up">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-900">{title} <span className="text-sm font-medium text-gray-500 ml-2">({data?.length || 0})</span></h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {!data || data.length === 0 ? (
            <div className="text-center py-10 text-gray-500">No records found.</div>
          ) : (
            <div className="space-y-3">
              {data.map((item, idx) => (
                <div key={item._id || idx} className="p-4 rounded-xl border border-gray-100 bg-white hover:border-purple-200 hover:shadow-sm transition-all text-sm">
                  {type === 'users' ? (
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-gray-900">{item.name || item.email}</div>
                        <div className="text-gray-500 text-xs mt-1">{item.email}</div>
                      </div>
                      <span className="badge bg-purple-50 text-purple-700">{item.role}</span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold text-gray-900">{item.title || item.subject || item.category || 'Issue'}</div>
                        <span className={`badge ${item.status?.toLowerCase() === 'resolved' ? 'bg-green-50 text-green-700' : item.status?.toLowerCase() === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-gray-600 text-xs line-clamp-2 mb-2">{item.description}</p>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>By: {item.studentID || item.studentName || 'Unknown'}</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard({ onNavigate }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [classFilter, setClassFilter] = useState(EMPTY_CLASS)
  const [classData, setClassData] = useState(null)
  const [classLoading, setClassLoading] = useState(false)

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalType, setModalType] = useState('issues')
  const [modalData, setModalData] = useState([])

  useEffect(() => {
    apiJson('/analytics/overview')
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const hasFilter = classFilter.course || classFilter.branch || classFilter.semester || classFilter.section
    if (!hasFilter) {
      setClassData(null)
      return
    }
    setClassLoading(true)
    const params = new URLSearchParams()
    if (classFilter.course) params.set('course', classFilter.course)
    if (classFilter.branch) params.set('branch', classFilter.branch)
    if (classFilter.semester) params.set('semester', classFilter.semester)
    if (classFilter.section) params.set('section', classFilter.section)
    apiJson(`/class/assigned?${params}`)
      .then(setClassData)
      .catch(() => setClassData(null))
      .finally(() => setClassLoading(false))
  }, [classFilter])

  if (loading) return <LoadingState message="Loading dashboard analytics..." />
  if (!data) return (
    <div className="text-center py-20 text-sm text-gray-500">Unable to load dashboard data. Please try again.</div>
  )

  const { totals, complaints, monthlyTrends, categoryAnalytics, resolutionRate, commonIssues, lists } = data

  const openModal = (title, type, listData) => {
    setModalTitle(title)
    setModalType(type)
    setModalData(listData || [])
    setModalOpen(true)
  }

  const allIssues = [...(lists?.complaints || [])]
  const pendingStatuses = ['pending', 'Pending', 'reviewing', 'In Progress']
  const resolvedStatuses = ['resolved', 'Resolved']
  
  const pendingIssues = allIssues.filter(x => pendingStatuses.includes(x.status))
  const resolvedIssues = allIssues.filter(x => resolvedStatuses.includes(x.status))
  const inProgressIssues = allIssues.filter(x => x.status === 'In Progress' || x.status === 'reviewing')
  
  // A naive overdue check for the modal list (same logic as backend roughly)
  const isOverdue = (item) => {
    const days = (new Date() - new Date(item.createdAt)) / (1000 * 60 * 60 * 24)
    return days > 7 && !resolvedStatuses.includes(item.status) && item.status !== 'rejected'
  }
  const overdueIssues = allIssues.filter(isOverdue)

  return (
    <div className="space-y-6">
      <DetailsModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={modalTitle} 
        type={modalType} 
        data={modalData} 
      />

      {/* Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-900 via-purple-700 to-indigo-600 p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-purple-200 text-xs font-medium uppercase tracking-wider">Grievance Management Portal</p>
            <h2 className="text-xl sm:text-2xl font-bold mt-1">Admin Command Center</h2>
            <p className="text-purple-200 text-sm mt-1">Monitor complaints, grievances, and campus operations in real time.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => onNavigate?.('complaints')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors border border-white/20">
              View Complaints
            </button>
            <button onClick={() => onNavigate?.('cr-management')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors border border-white/20">
              CR Management
            </button>
          </div>
        </div>
      </div>

      <AssignedClassSelect value={classFilter} onChange={setClassFilter} />

      {(classFilter.course || classFilter.branch || classFilter.semester || classFilter.section) && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Class Overview</h3>
          {classLoading ? (
            <p className="text-sm text-gray-400">Loading class data...</p>
          ) : classData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Students in Class" value={classData.counts?.students ?? 0} icon={Users} color="blue" onClick={() => openModal('Class Students', 'users', classData.students)} />
                <StatCard label="CRs in Class" value={classData.counts?.crs ?? 0} icon={Users} color="green" onClick={() => openModal('Class CRs', 'users', classData.crs)} />
              </div>
              {classData.students?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">Registered Students</p>
                  <div className="flex flex-wrap gap-2">
                    {classData.students.slice(0, 8).map(s => (
                      <span key={s.email} className="badge bg-blue-50 text-blue-700 text-xs">{s.name}</span>
                    ))}
                    {classData.students.length > 8 && (
                      <span className="text-xs text-gray-400">+{classData.students.length - 8} more</span>
                    )}
                  </div>
                </div>
              )}
              <button
                onClick={() => onNavigate?.('admin-chat')}
                className="text-sm text-purple-600 font-medium hover:underline"
              >
                Open Admin Chat for this class →
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No students found for the selected class.</p>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="stats-grid">
        <StatCard label="Total Complaints" value={complaints.total} icon={AlertTriangle} color="amber" onClick={() => openModal('All Complaints', 'issues', lists?.complaints)} />
        <StatCard label="Pending" value={complaints.pending} icon={Clock} color="blue" subtitle={`${complaints.pending} pending complaints`} onClick={() => openModal('Pending Issues', 'issues', pendingIssues)} />
        <StatCard label="Resolved" value={complaints.resolved} icon={CheckCircle} color="green" onClick={() => openModal('Resolved Issues', 'issues', resolvedIssues)} />
        <StatCard label="Overdue" value={complaints.overdue} icon={AlertCircle} color="red" onClick={() => openModal('Overdue Issues', 'issues', overdueIssues)} />
        <StatCard label="Resolution Rate" value={`${resolutionRate}%`} icon={TrendingUp} color="purple" onClick={() => openModal('Resolved Issues', 'issues', resolvedIssues)} />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Students" value={totals.students} icon={Users} color="blue" onClick={() => openModal('Registered Students', 'users', lists?.users?.filter(u => u.role === 'student'))} />
        <StatCard label="Class Reps" value={totals.crs} icon={Users} color="green" onClick={() => openModal('Class Representatives', 'users', lists?.users?.filter(u => u.role === 'cr'))} />
        <StatCard label="Vendors" value={totals.vendors} icon={Users} color="amber" onClick={() => openModal('Vendors', 'users', lists?.users?.filter(u => u.role === 'vendor'))} />
        <StatCard label="In Progress" value={complaints.inProgress} icon={BarChart3} color="purple" onClick={() => openModal('In Progress Issues', 'issues', inProgressIssues)} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Monthly Trends</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyTrends} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="complaints" fill="#7c3aed" name="Complaints" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">User Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.roleDistribution} dataKey="count" nameKey="role" cx="50%" cy="50%" outerRadius={80} label={({ role, count }) => `${role}: ${count}`} labelLine={false} fontSize={10}>
                {data.roleDistribution.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category + Common Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Category-wise Analytics</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryAnalytics.slice(0, 6)} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} width={90} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Most Common Issues</h3>
          <div className="space-y-2">
            {commonIssues.map((item, i) => (
              <div key={item.issue} className="flex items-center gap-3">
                <span className="text-xs font-bold text-purple-600 w-5">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{item.issue}</span>
                    <span className="text-gray-400">{item.count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full transition-all"
                      style={{ width: `${(item.count / (commonIssues[0]?.count || 1)) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
            {commonIssues.length === 0 && <p className="text-xs text-gray-400 text-center py-6">No issue data yet</p>}
          </div>
        </div>
      </div>

      {/* Resolution trend line */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Complaint Trend</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={monthlyTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="complaints" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} name="Complaints" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
