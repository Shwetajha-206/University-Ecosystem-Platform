import { useState, useEffect } from 'react'
import { Shield, Search, Activity, Lock, Clock } from 'lucide-react'
import { apiJson } from '../../lib/api'
import LoadingState from '../../components/admin/LoadingState'
import EmptyState from '../../components/admin/EmptyState'

const ACTION_COLORS = {
  BLOCK_USER: 'bg-red-100 text-red-700',
  UNBLOCK_USER: 'bg-green-100 text-green-700',
  CREATE_USER: 'bg-blue-100 text-blue-700',
  DELETE_USER: 'bg-red-100 text-red-700',
  CHANGE_ROLE: 'bg-purple-100 text-purple-700',
  ASSIGN: 'bg-indigo-100 text-indigo-700',
  ESCALATE: 'bg-amber-100 text-amber-700',
  UPDATE_STATUS: 'bg-blue-100 text-blue-700',
  BROADCAST: 'bg-purple-100 text-purple-700',
  EMERGENCY_ALERT: 'bg-red-100 text-red-700',
  EXPORT_REPORT: 'bg-gray-100 text-gray-700',
  FLAG_SUSPICIOUS: 'bg-amber-100 text-amber-700',
}

export default function AdminSecurity() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState('All')

  useEffect(() => {
    apiJson('/audit')
      .then(data => setLogs(Array.isArray(data) ? data : []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [])

  const actions = ['All', ...new Set(logs.map(l => l.action))]

  const filtered = logs.filter(l => {
    const matchAction = filterAction === 'All' || l.action === filterAction
    const q = search.toLowerCase()
    const matchSearch = !q ||
      l.adminName?.toLowerCase().includes(q) ||
      l.action?.toLowerCase().includes(q) ||
      l.target?.toLowerCase().includes(q) ||
      l.details?.toLowerCase().includes(q)
    return matchAction && matchSearch
  })

  if (loading) return <LoadingState message="Loading audit logs..." />

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Security & Administration</h2>
        <p className="text-sm text-gray-500 mt-0.5">Audit logs, activity tracking, and admin action history</p>
      </div>

      {/* Security overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
            <Shield size={18} className="text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Role-Based Access</p>
            <p className="text-sm font-semibold text-gray-900">Active — JWT + RBAC</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <Lock size={18} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Authentication</p>
            <p className="text-sm font-semibold text-gray-900">Secure — HttpOnly Cookies</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Activity size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Audit Events</p>
            <p className="text-sm font-semibold text-gray-900">{logs.length} logged actions</p>
          </div>
        </div>
      </div>

      {/* RBAC Info */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Role-Based Access Control</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { role: 'Admin', perms: 'Full access — users, complaints, grievances, reports, security' },
            { role: 'CR', perms: 'Complaints management, announcements, class-level access' },
            { role: 'Vendor', perms: 'Vendor portal, ratings, assigned complaints' },
            { role: 'Student', perms: 'Submit complaints/grievances, view own submissions' },
          ].map(r => (
            <div key={r.role} className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs font-bold text-purple-700">{r.role}</p>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{r.perms}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Logs */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Clock size={16} className="text-purple-600" /> Admin Action History
        </h3>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search audit logs..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1 flex-wrap">
            {actions.slice(0, 6).map(a => (
              <button key={a} onClick={() => setFilterAction(a)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterAction === a ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {a === 'All' ? 'All' : a.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Admin', 'Action', 'Target', 'Details', 'Time'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-400 px-4 py-3">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filtered.map(log => (
                  <tr key={log._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-gray-900">{log.adminName}</p>
                      <p className="text-[10px] text-gray-400">{log.adminEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{log.target} {log.targetId && <span className="text-gray-400">· {log.targetId}</span>}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{log.details || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5}><EmptyState title="No audit logs" description="Admin actions will appear here as they occur." icon={Activity} /></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
