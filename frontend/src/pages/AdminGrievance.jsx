import { useState, useEffect, useCallback } from 'react'
import { apiJson } from '../lib/api'
import { usePolling } from '../hooks/usePolling'
import { AlertCircle, ArrowUp, Calendar, UserPlus } from 'lucide-react'

const STATUS_STYLE = {
  Pending:       { color: '#e65100', bg: '#fff3e0' },
  pending:       { color: '#e65100', bg: '#fff3e0' },
  'In Progress': { color: '#1565c0', bg: '#e3f2fd' },
  Resolved:      { color: '#2e7d32', bg: '#e8f5e9' },
  resolved:      { color: '#2e7d32', bg: '#e8f5e9' },
  Rejected:      { color: '#c62828', bg: '#ffebee' },
  rejected:      { color: '#c62828', bg: '#ffebee' },
}
const PRIORITY_STYLE = {
  Low:    { color: '#2e7d32', bg: '#e8f5e9' },
  Medium: { color: '#e65100', bg: '#fff3e0' },
  High:   { color: '#c62828', bg: '#ffebee' },
  Urgent: { color: '#fff',    bg: '#c62828' },
}

const T = {
  primary: '#4a148c', accent: '#6a1b9a', accentLight: '#f3e5f5',
  border: '#e8ecf0', text: '#1a1a2e', textSub: '#5a6a7e', textMuted: '#9aa5b4',
  card: '#fff', success: '#2e7d32', successLight: '#e8f5e9',
}

const Card = ({ children, style = {} }) => (
  <div style={{ background: T.card, borderRadius: 14, padding: '20px 22px', boxShadow: '0 2px 12px rgba(74,20,140,0.07)', border: `1px solid ${T.border}`, ...style }}>{children}</div>
)
const Badge = ({ label, color, bg }) => (
  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: bg, color }}>{label}</span>
)
const Btn = ({ children, onClick, color = T.primary, style = {}, disabled = false }) => (
  <button onClick={onClick} disabled={disabled} style={{ padding: '8px 18px', background: disabled ? '#ccc' : color, color: '#fff', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s', fontFamily: 'inherit', ...style }}>
    {children}
  </button>
)

function isOverdue(item) {
  if (!item.deadline) return false
  const resolved = ['resolved', 'Resolved', 'rejected', 'Rejected']
  if (resolved.includes(item.status)) return false
  return new Date(item.deadline) < new Date()
}

export default function AdminGrievance() {
  const [complaints, setComplaints] = useState([])
  const [assignees, setAssignees] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [reply, setReply] = useState('')
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterPriority, setFilterPriority] = useState('All')
  const [search, setSearch] = useState('')
  const [assignEmail, setAssignEmail] = useState('')
  const [deadline, setDeadline] = useState('')

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [data, users] = await Promise.all([
        apiJson('/grievances'),
        apiJson('/auth/users'),
      ])
      setComplaints(Array.isArray(data) ? data : [])
      setAssignees(Array.isArray(users) ? users.filter(u => ['cr', 'vendor', 'admin'].includes(u.role) && !u.blocked) : [])
    } catch { if (!silent) setComplaints([]) }
    if (!silent) setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])
  usePolling(() => fetchAll(true), 10000)

  const updateStatus = async (id, status) => {
    await apiJson(`/grievances/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
    fetchAll()
    if (selected?._id === id) setSelected(prev => ({ ...prev, status }))
  }

  const sendReply = async (id) => {
    if (!reply.trim()) return alert('Please enter a reply')
    setSaving(true)
    try {
      await apiJson(`/grievances/${id}/reply`, { method: 'PATCH', body: JSON.stringify({ adminReply: reply }) })
      setReply('')
      fetchAll()
    } catch (err) { alert(err.message || 'Error') }
    setSaving(false)
  }

  const assignTo = async (id) => {
    if (!assignEmail) return alert('Select an assignee')
    try {
      await apiJson(`/grievances/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ assigneeEmail: assignEmail }) })
      fetchAll()
      alert('Assigned successfully')
    } catch (err) { alert(err.message) }
  }

  const escalate = async (id) => {
    if (!confirm('Escalate this grievance?')) return
    try {
      await apiJson(`/grievances/${id}/escalate`, { method: 'PATCH' })
      fetchAll()
    } catch (err) { alert(err.message) }
  }

  const submitDeadline = async (id) => {
    if (!deadline) return alert('Select a deadline')
    try {
      await apiJson(`/grievances/${id}/deadline`, { method: 'PATCH', body: JSON.stringify({ deadline }) })
      fetchAll()
    } catch (err) { alert(err.message) }
  }

  const filtered = complaints.filter(c => {
    const matchStatus = filterStatus === 'All' || c.status === filterStatus || (filterStatus === 'Pending' && c.status === 'pending')
    const matchPriority = filterPriority === 'All' || c.priority === filterPriority
    const matchSearch = !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.studentName?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchPriority && matchSearch
  })

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => ['Pending', 'pending'].includes(c.status)).length,
    resolved: complaints.filter(c => ['Resolved', 'resolved'].includes(c.status)).length,
    overdue: complaints.filter(isOverdue).length,
  }

  if (selected) {
    const st = STATUS_STYLE[selected.status] || STATUS_STYLE.Pending
    const pr = PRIORITY_STYLE[selected.priority] || PRIORITY_STYLE.Medium
    const overdue = isOverdue(selected)
    return (
      <div className="space-y-4">
        <button onClick={() => setSelected(null)} className="text-sm text-purple-700 font-medium hover:underline">← Back to list</button>
        <Card>
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge label={selected.status} color={st.color} bg={st.bg} />
            <Badge label={selected.priority} color={pr.color} bg={pr.bg} />
            {overdue && <Badge label="OVERDUE" color="#fff" bg="#c62828" />}
            {selected.escalationLevel > 0 && <Badge label={`Escalated L${selected.escalationLevel}`} color="#e65100" bg="#fff3e0" />}
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">{selected.title || selected.grievanceID}</h2>
          <p className="text-sm text-gray-600 mb-4">{selected.description}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-xs text-gray-500">
            <span>👤 {selected.studentName || selected.studentID}</span>
            <span>📁 {selected.category}</span>
            {selected.assignedToName && <span>🔧 {selected.assignedToName}</span>}
            {selected.deadline && <span className={overdue ? 'text-red-600 font-bold' : ''}>📅 {new Date(selected.deadline).toLocaleDateString()}</span>}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {['Pending', 'In Progress', 'Resolved', 'Rejected'].map(s => (
              <Btn key={s} onClick={() => updateStatus(selected._id, s)} color={T.accent} style={{ fontSize: 11 }}>{s}</Btn>
            ))}
            <Btn onClick={() => escalate(selected._id)} color="#e65100" style={{ fontSize: 11 }}><ArrowUp size={12} /> Escalate</Btn>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 p-3 bg-purple-50/50 rounded-xl">
            <div>
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-1"><UserPlus size={12} /> Assign to CR/Vendor</label>
              <div className="flex gap-2">
                <select className="input text-xs flex-1" value={assignEmail} onChange={e => setAssignEmail(e.target.value)}>
                  <option value="">Select assignee...</option>
                  {assignees.map(a => <option key={a._id} value={a.email}>{a.name} ({a.role})</option>)}
                </select>
                <Btn onClick={() => assignTo(selected._id)} style={{ fontSize: 11, padding: '6px 12px' }}>Assign</Btn>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-1"><Calendar size={12} /> Set Deadline</label>
              <div className="flex gap-2">
                <input type="date" className="input text-xs flex-1" value={deadline} onChange={e => setDeadline(e.target.value)} />
                <Btn onClick={() => submitDeadline(selected._id)} style={{ fontSize: 11, padding: '6px 12px' }}>Set</Btn>
              </div>
            </div>
          </div>

          <textarea className="w-full border rounded-lg p-3 text-sm mb-3" rows={3} placeholder="Admin reply..." value={reply} onChange={e => setReply(e.target.value)} />
          <Btn onClick={() => sendReply(selected._id)} disabled={saving}>Send Reply</Btn>
          {selected.adminReply && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm text-green-800">{selected.adminReply}</div>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="page-title">Grievance Management</h2>
        <p className="text-sm text-gray-500">Review, assign, escalate, and resolve grievances</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[{ label: 'Total', val: stats.total, color: 'purple' }, { label: 'Pending', val: stats.pending, color: 'amber' }, { label: 'Resolved', val: stats.resolved, color: 'green' }, { label: 'Overdue', val: stats.overdue, color: 'red' }].map(s => (
          <Card key={s.label}>
            <div className="text-2xl font-bold text-gray-900">{s.val}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <input className="input flex-1 min-w-[200px]" placeholder="Search grievances..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          {['All', 'Pending', 'In Progress', 'Resolved', 'Rejected'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="input" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          {['All', 'Low', 'Medium', 'High', 'Urgent'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      {loading ? (
        <p className="text-sm text-gray-500 text-center py-10">Loading grievances...</p>
      ) : filtered.length === 0 ? (
        <Card><p className="text-sm text-gray-500 text-center py-6">No grievances found.</p></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => {
            const st = STATUS_STYLE[c.status] || STATUS_STYLE.Pending
            const overdue = isOverdue(c)
            return (
              <div key={c._id} onClick={() => setSelected(c)} className={`bg-white border rounded-xl p-4 cursor-pointer hover:border-purple-300 transition-colors ${overdue ? 'border-red-200 bg-red-50/30' : ''}`}>
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{c.title || c.grievanceID}</span>
                      {overdue && <span className="flex items-center gap-1 text-[10px] font-bold text-red-600"><AlertCircle size={10} /> OVERDUE</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      👤 {c.studentName || c.studentID} • 📁 {c.category}
                      {c.assignedToName && ` • 🔧 ${c.assignedToName}`}
                    </div>
                    <div className="text-sm text-gray-600 mt-2 line-clamp-2">{c.description}</div>
                  </div>
                  <Badge label={c.status} color={st.color} bg={st.bg} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
