import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Search, AlertTriangle, X, Check, XCircle, Clock, UserPlus, ArrowUp, Calendar, AlertCircle, Eye } from 'lucide-react'
import { apiJson } from '../lib/api'
import { usePolling } from '../hooks/usePolling'
import { useToast } from '../hooks/useToast'

const STUDENT_CATEGORIES = ['All', 'Ragging', 'Infrastructure', 'Academic', 'Hostel', 'Safety', 'Other']
const CR_CATEGORIES = ['All', 'Academic', 'Infrastructure', 'Canteen', 'Sports', 'Finance', 'Other']

const BADGE_STYLES = {
  pending: 'bg-amber-100 text-amber-700',
  Pending: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
  Resolved: 'bg-green-100 text-green-700',
  reviewing: 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
  Rejected: 'bg-red-100 text-red-700',
}

function isOverdue(c) {
  if (!c.deadline) return false
  if (['resolved', 'Resolved', 'rejected', 'Rejected'].includes(c.status)) return false
  return new Date(c.deadline) < new Date()
}

export default function Complaints({ user }) {
  const isAdmin = user?.role === 'admin'
  const isCR = user?.role === 'cr'
  const isVendor = user?.role === 'vendor'
  const canManage = isAdmin || isCR || isVendor
  const CATEGORIES = isCR ? CR_CATEGORIES : STUDENT_CATEGORIES
  const { success, error: showError } = useToast()

  const [complaints, setComplaints] = useState([])
  const [assignees, setAssignees] = useState([])
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [detail, setDetail] = useState(null)
  const [assignEmail, setAssignEmail] = useState('')
  const [deadline, setDeadline] = useState('')
  const [adminReply, setAdminReply] = useState('')
  const [forwardEmail, setForwardEmail] = useState('')
  const [priorityRec, setPriorityRec] = useState('High')
  const [submitting, setSubmitting] = useState(false)
  const detailRef = useRef(null)
  detailRef.current = detail
  const [form, setForm] = useState({
    category: CATEGORIES[1], description: '', proof: '',
    studentID: user?.email || user?.name || 'STU001'
  })

  const fetchAll = useCallback(async () => {
    try {
      const data = await apiJson('/complaints')
      if (Array.isArray(data)) {
        setComplaints(data)
        if (detailRef.current) {
          const updated = data.find(c => c._id === detailRef.current._id)
          if (updated) setDetail(updated)
        }
      }
      if (isAdmin) {
        const users = await apiJson('/auth/users')
        setAssignees(Array.isArray(users) ? users.filter(u => ['cr', 'vendor'].includes(u.role) && !u.blocked) : [])
      }
    } catch { /* silent */ }
  }, [isAdmin])

  useEffect(() => { fetchAll() }, [fetchAll])
  usePolling(fetchAll, 10000, canManage || isCR)

  const filtered = complaints.filter(c => {
    const matchCat = filterCat === 'All' || c.category === filterCat
    const matchStatus = filterStatus === 'All' || c.status === filterStatus
    const matchSearch = c.description?.toLowerCase().includes(search.toLowerCase()) ||
      c.category?.toLowerCase().includes(search.toLowerCase()) ||
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.complaintID?.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchStatus && matchSearch
  })

  const handleSubmit = async () => {
    if (!form.description.trim()) return
    setSubmitting(true)
    try {
      const data = await apiJson('/complaints', {
        method: 'POST',
        body: JSON.stringify({ category: form.category, description: form.description, proof: form.proof || '' }),
      })
      setComplaints([data, ...complaints])
      setForm({ category: CATEGORIES[1], description: '', proof: '', studentID: user?.email || '' })
      setShowForm(false)
      success('Complaint submitted successfully!')
    } catch (err) { 
      showError(err.message || 'Failed to submit complaint')
    }
    finally { setSubmitting(false) }
  }

  const updateStatus = async (id, newStatus) => {
    try {
      const data = await apiJson(`/complaints/${id}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) })
      setComplaints(complaints.map(c => c._id === id ? data : c))
      if (detail?._id === id) setDetail(data)
      success(`Status updated to ${newStatus}`)
    } catch (err) { showError(err.message || 'Failed to update status') }
  }

  const assignTo = async (id) => {
    if (!assignEmail) return showError('Please select an assignee')
    try {
      const data = await apiJson(`/complaints/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ assigneeEmail: assignEmail }) })
      setComplaints(complaints.map(c => c._id === id ? data : c))
      if (detail?._id === id) setDetail(data)
      success('Complaint assigned successfully')
    } catch (err) { showError(err.message || 'Failed to assign complaint') }
  }

  const escalate = async (id) => {
    if (!confirm('Escalate this complaint?')) return
    try {
      const data = await apiJson(`/complaints/${id}/escalate`, { method: 'PATCH' })
      setComplaints(complaints.map(c => c._id === id ? data : c))
      if (detail?._id === id) setDetail(data)
      success('Complaint escalated successfully')
    } catch (err) { showError(err.message || 'Failed to escalate') }
  }

  const setDeadlineDate = async (id) => {
    if (!deadline) return showError('Please select a deadline date')
    try {
      const data = await apiJson(`/complaints/${id}/deadline`, { method: 'PATCH', body: JSON.stringify({ deadline }) })
      setComplaints(complaints.map(c => c._id === id ? data : c))
      if (detail?._id === id) setDetail(data)
      success('Deadline set successfully')
    } catch (err) { showError(err.message || 'Failed to set deadline') }
  }

  const sendReply = async (id) => {
    if (!adminReply.trim()) return
    try {
      const data = await apiJson(`/complaints/${id}/reply`, { method: 'PATCH', body: JSON.stringify({ adminReply }) })
      setComplaints(complaints.map(c => c._id === id ? data : c))
      setAdminReply('')
      if (detail?._id === id) setDetail(data)
      success('Reply sent successfully')
    } catch (err) { showError(err.message || 'Failed to send reply') }
  }

  const crAction = async (id, path, body) => {
    try {
      const data = await apiJson(`/complaints/${id}/${path}`, { method: 'PATCH', body: JSON.stringify(body || {}) })
      setComplaints(complaints.map(c => c._id === id ? data : c))
      if (detail?._id === id) setDetail(data)
      success('Action completed successfully')
    } catch (err) { showError(err.message || 'Action failed') }
  }

  const overdueCount = complaints.filter(isOverdue).length

  if (detail && canManage) {
    const overdue = isOverdue(detail)
    const backLinkClass = 'text-[#0A3A6A]'
    const btnClass = 'bg-[#0A3A6A] hover:bg-[#072a4f]'
    return (
      <div className="space-y-4">
        <button onClick={() => setDetail(null)} className={`text-sm ${backLinkClass} font-medium hover:underline`}>← Back to complaints</button>
        <div className="card p-6">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`badge ${BADGE_STYLES[detail.status] || 'bg-gray-100 text-gray-700'}`}>{detail.status}</span>
            {detail.priority && <span className="badge bg-purple-100 text-purple-700">{detail.priority}</span>}
            {overdue && <span className="badge bg-red-100 text-red-700 flex items-center gap-1"><AlertCircle size={10} /> Overdue</span>}
            {detail.escalationLevel > 0 && <span className="badge bg-amber-100 text-amber-700">Escalated L{detail.escalationLevel}</span>}
            {detail.crVerified && <span className="badge bg-green-100 text-green-700">Verified</span>}
            {detail.markedImportant && <span className="badge bg-red-100 text-red-700">Important</span>}
            {detail.priorityRecommendation && <span className="badge bg-blue-100 text-blue-700">Rec: {detail.priorityRecommendation}</span>}
          </div>
          <h2 className="text-lg font-bold text-gray-900">{detail.title || detail.complaintID}</h2>
          <p className="text-sm text-gray-600 mt-2">{detail.description}</p>
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
            <span>ID: {detail.complaintID}</span>
            <span>Category: {detail.category}</span>
            <span>Student: {detail.studentID}</span>
            {detail.assignedToName && <span>Assigned: {detail.assignedToName}</span>}
            {detail.deadline && <span className={overdue ? 'text-red-600 font-bold' : ''}>Deadline: {new Date(detail.deadline).toLocaleDateString()}</span>}
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {(isVendor ? ['In Progress', 'resolved'] : ['pending', 'In Progress', 'resolved', 'rejected']).map(s => (
              <button key={s} onClick={() => updateStatus(detail._id, s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium text-white capitalize ${btnClass}`}>{s}</button>
            ))}
            {isAdmin && (
              <button onClick={() => escalate(detail._id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600 text-white hover:bg-amber-700">
                <ArrowUp size={12} /> Escalate
              </button>
            )}
            {isCR && (
              <>
                {!detail.crVerified && <button onClick={() => crAction(detail._id, 'verify')} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0A3A6A] text-white">Verify</button>}
                <button onClick={() => crAction(detail._id, 'important', { markedImportant: !detail.markedImportant })} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#B10428] text-white">
                  {detail.markedImportant ? 'Unmark' : 'Mark Important'}
                </button>
                <button onClick={() => crAction(detail._id, 'cr-escalate')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600 text-white">
                  <ArrowUp size={12} /> Escalate to Admin
                </button>
              </>
            )}
          </div>

          {isCR && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 p-4 bg-blue-50/50 rounded-xl">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Priority Recommendation</label>
                <div className="flex gap-2">
                  <select className="input text-xs flex-1" value={priorityRec} onChange={e => setPriorityRec(e.target.value)}>
                    {['Low', 'Medium', 'High', 'Urgent'].map(p => <option key={p}>{p}</option>)}
                  </select>
                  <button onClick={() => crAction(detail._id, 'priority-recommendation', { priorityRecommendation: priorityRec })} className="px-3 py-2 bg-[#0A3A6A] text-white rounded-lg text-xs font-medium">Recommend</button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Forward to Vendor/Admin</label>
                <div className="flex gap-2">
                  <input className="input text-xs flex-1" placeholder="email@..." value={forwardEmail} onChange={e => setForwardEmail(e.target.value)} />
                  <button onClick={() => forwardEmail && crAction(detail._id, 'forward', { assigneeEmail: forwardEmail })} className="px-3 py-2 bg-[#0A3A6A] text-white rounded-lg text-xs font-medium">Forward</button>
                </div>
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 p-4 bg-blue-50/50 rounded-xl">
              <div>
                <label className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-1"><UserPlus size={12} /> Assign</label>
                <div className="flex gap-2">
                  <select className="input text-xs flex-1" value={assignEmail} onChange={e => setAssignEmail(e.target.value)}>
                    <option value="">Select CR/Vendor...</option>
                    {assignees.map(a => <option key={a._id} value={a.email}>{a.name} ({a.role})</option>)}
                  </select>
                  <button onClick={() => assignTo(detail._id)} className="px-3 py-2 bg-[#0A3A6A] text-white rounded-lg text-xs font-medium">Assign</button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-1"><Calendar size={12} /> Deadline</label>
                <div className="flex gap-2">
                  <input type="date" className="input text-xs flex-1" value={deadline} onChange={e => setDeadline(e.target.value)} />
                  <button onClick={() => setDeadlineDate(detail._id)} className="px-3 py-2 bg-[#0A3A6A] text-white rounded-lg text-xs font-medium">Set</button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4">
            <textarea className="input resize-none" rows={3}
              placeholder={isVendor ? 'Post progress update...' : isCR ? 'CR response...' : 'Admin reply...'}
              value={adminReply} onChange={e => setAdminReply(e.target.value)} />
            <button onClick={() => sendReply(detail._id)} className={`mt-2 btn-primary ${btnClass}`}>
              {isVendor ? 'Send Progress Update' : 'Send Reply'}
            </button>
            {detail.adminReply && <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">{detail.adminReply}</div>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-[#0f172a] via-[#0A3A6A] to-[#B10428] rounded-xl p-8 text-white shadow-xl mb-6">
        <h1 className="text-3xl font-bold font-plus-jakarta mb-2">{isAdmin ? 'Complaint Management' : isCR ? 'Class Complaints' : isVendor ? 'Assigned Complaints' : 'Complaints'}</h1>
        <p className="text-blue-100">
          {isAdmin ? `${complaints.length} total · ${overdueCount} overdue` : isCR ? `Class complaints · ${user?.course || ''} Year ${user?.semester || ''} Sec ${user?.section || ''}` : isVendor ? 'Complaints assigned to you' : `${complaints.length} total complaints registered`}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {!isAdmin && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 sm:ml-auto px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#B10428] hover:bg-[#900320] transition-colors">
            <Plus size={16} /> {isCR ? 'Register Complaint' : 'New Complaint'}
          </button>
        )}
        {isAdmin && (
          <div className="sm:ml-auto flex gap-2 text-xs flex-wrap">
            <span className="badge bg-amber-100 text-amber-700">{complaints.filter(c => ['pending', 'Pending'].includes(c.status)).length} Pending</span>
            <span className="badge bg-blue-100 text-blue-700">{complaints.filter(c => c.status === 'In Progress').length} In Progress</span>
            <span className="badge bg-green-100 text-green-700">{complaints.filter(c => ['resolved', 'Resolved'].includes(c.status)).length} Resolved</span>
            {overdueCount > 0 && <span className="badge bg-red-100 text-red-700">{overdueCount} Overdue</span>}
          </div>
        )}
      </div>

      {showForm && !isAdmin && (
        <div className="card p-5 border-blue-200 bg-blue-50/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              {isCR ? 'Register Class Complaint' : 'File a New Complaint'}
            </h3>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X size={16} className="text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Student ID</label>
              <input className="input" value={form.studentID} onChange={e => setForm({ ...form, studentID: e.target.value })} placeholder="Your ID" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea className="input resize-none" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the complaint in detail..." />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowForm(false)} disabled={submitting} className="btn-secondary disabled:opacity-50">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary disabled:opacity-60">
              {submitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search complaints..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterCat === cat ? 'bg-[#0A3A6A] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {isAdmin && (
        <div className="flex gap-2 flex-wrap">
          {['All', 'pending', 'In Progress', 'resolved', 'rejected'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${filterStatus === s ? 'bg-[#0A3A6A] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['ID', 'Category', 'Description', 'Student', 'Status', 'Assigned', 'Deadline', (isAdmin || isCR || isVendor) ? 'Actions' : 'Date'].filter(Boolean).map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-400 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const overdue = isOverdue(c)
                return (
                  <tr key={c._id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${overdue ? 'bg-red-50/40' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.complaintID}</td>
                    <td className="px-4 py-3"><span className="badge bg-gray-100 text-gray-700">{c.category}</span></td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{c.description}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{c.studentID}</td>
                    <td className="px-4 py-3"><span className={`badge ${BADGE_STYLES[c.status] || 'bg-gray-100 text-gray-700'}`}>{c.status}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{c.assignedToName || '—'}</td>
                    <td className="px-4 py-3 text-xs">
                      {c.deadline ? (
                        <span className={overdue ? 'text-red-600 font-bold' : 'text-gray-500'}>
                          {new Date(c.deadline).toLocaleDateString()}
                          {overdue && ' ⚠'}
                        </span>
                      ) : '—'}
                    </td>
                    {(isAdmin || isCR || isVendor) ? (
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                        {!detail && (
                          <button onClick={() => setDetail(c)} title="View & Manage" className={`p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600`}><Eye size={13} /></button>
                        )}
                        {isAdmin && (
                          <>
                            <button onClick={() => updateStatus(c._id, 'In Progress')} disabled={c.status === 'In Progress'} title="In Progress" className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-30"><Clock size={13} /></button>
                            <button onClick={() => updateStatus(c._id, 'resolved')} disabled={c.status === 'resolved'} title="Resolve" className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-30"><Check size={13} /></button>
                            <button onClick={() => updateStatus(c._id, 'rejected')} disabled={c.status === 'rejected'} title="Reject" className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-30"><XCircle size={13} /></button>
                          </>
                        )}
                        </div>
                      </td>
                    ) : (
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                    )}
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={28} className="text-gray-400" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2">
                        {search || filterCat !== 'All' || filterStatus !== 'All' 
                          ? 'No matching complaints found' 
                          : 'No complaints yet'}
                      </h3>
                      <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">
                        {search || filterCat !== 'All' || filterStatus !== 'All'
                          ? 'Try adjusting your filters or search terms'
                          : !isAdmin && !isVendor ? 'Submit your first complaint to get started' : 'No complaints have been assigned to you yet'}
                      </p>
                      {!isAdmin && !isVendor && !search && filterCat === 'All' && (
                        <button
                          onClick={() => setShowForm(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 transition-colors"
                        >
                          <Plus size={16} /> Submit Your First Complaint
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}