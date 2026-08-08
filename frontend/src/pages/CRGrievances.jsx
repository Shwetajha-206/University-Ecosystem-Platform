import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Eye, ArrowUp, AlertCircle } from 'lucide-react'
import { apiJson } from '../lib/api'
import { usePolling } from '../hooks/usePolling'

const BADGE_STYLES = {
  pending: 'bg-amber-100 text-amber-700', Pending: 'bg-amber-100 text-amber-700',
  'In Progress': 'bg-blue-100 text-blue-700', resolved: 'bg-green-100 text-green-700',
  Resolved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700', Rejected: 'bg-red-100 text-red-700',
}

export default function CRGrievances({ user }) {
  const [items, setItems] = useState([])
  const [detail, setDetail] = useState(null)
  const [search, setSearch] = useState('')
  const [reply, setReply] = useState('')
  const [forwardEmail, setForwardEmail] = useState('')
  const [priorityRec, setPriorityRec] = useState('High')
  const detailRef = useRef(null)
  detailRef.current = detail

  const fetchAll = useCallback(async () => {
    try {
      const data = await apiJson('/grievances')
      if (Array.isArray(data)) {
        setItems(data)
        if (detailRef.current) {
          const u = data.find(g => g._id === detailRef.current._id)
          if (u) setDetail(u)
        }
      }
    } catch { /* silent */ }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])
  usePolling(fetchAll, 10000)

  const filtered = items.filter(g =>
    g.title?.toLowerCase().includes(search.toLowerCase()) ||
    g.category?.toLowerCase().includes(search.toLowerCase()) ||
    g.grievanceID?.toLowerCase().includes(search.toLowerCase())
  )

  const updateStatus = async (id, status) => {
    const data = await apiJson(`/grievances/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
    setItems(prev => prev.map(g => g._id === id ? data : g))
    if (detail?._id === id) setDetail(data)
  }

  const crAction = async (id, path, body) => {
    try {
      const data = await apiJson(`/grievances/${id}/${path}`, { method: 'PATCH', body: JSON.stringify(body || {}) })
      setItems(prev => prev.map(g => g._id === id ? data : g))
      if (detail?._id === id) setDetail(data)
    } catch (err) { alert(err.message) }
  }

  const sendReply = async (id) => {
    if (!reply.trim()) return
    const data = await apiJson(`/grievances/${id}/reply`, { method: 'PATCH', body: JSON.stringify({ adminReply: reply }) })
    setItems(prev => prev.map(g => g._id === id ? data : g))
    setReply('')
    if (detail?._id === id) setDetail(data)
  }

  if (detail) {
    return (
      <div className="space-y-4">
        <button onClick={() => setDetail(null)} className="text-sm text-green-600 font-medium hover:underline">← Back to class grievances</button>
        <div className="card p-6">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`badge ${BADGE_STYLES[detail.status] || 'bg-gray-100 text-gray-700'}`}>{detail.status}</span>
            {detail.crVerified && <span className="badge bg-green-100 text-green-700">Verified</span>}
            {detail.markedImportant && <span className="badge bg-red-100 text-red-700">Important</span>}
            {detail.crEscalated && <span className="badge bg-amber-100 text-amber-700">Escalated</span>}
          </div>
          <h2 className="text-lg font-bold">{detail.title || detail.grievanceID}</h2>
          <p className="text-sm text-gray-600 mt-2">{detail.description}</p>
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
            <span>{detail.grievanceID}</span>
            <span>{detail.category}</span>
            <span>Student: {detail.studentName || detail.studentID}</span>
            <span>{detail.studentCourse} · Year {detail.studentSemester} · Sec {detail.studentSection}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {['Pending', 'In Progress', 'Resolved', 'Rejected'].map(s => (
              <button key={s} onClick={() => updateStatus(detail._id, s)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white">{s}</button>
            ))}
            {!detail.crVerified && <button onClick={() => crAction(detail._id, 'verify')} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white">Verify Authenticity</button>}
            <button onClick={() => crAction(detail._id, 'important', { markedImportant: !detail.markedImportant })} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white">
              {detail.markedImportant ? 'Unmark Important' : 'Mark Important'}
            </button>
            <button onClick={() => crAction(detail._id, 'cr-escalate')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600 text-white">
              <ArrowUp size={12} /> Escalate to Admin
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 p-4 bg-green-50/50 rounded-xl">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Priority Recommendation</label>
              <div className="flex gap-2">
                <select className="input text-xs flex-1" value={priorityRec} onChange={e => setPriorityRec(e.target.value)}>
                  {['Low', 'Medium', 'High', 'Urgent'].map(p => <option key={p}>{p}</option>)}
                </select>
                <button onClick={() => crAction(detail._id, 'priority-recommendation', { priorityRecommendation: priorityRec })} className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs">Recommend</button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Forward to Admin/Vendor</label>
              <div className="flex gap-2">
                <input className="input text-xs flex-1" value={forwardEmail} onChange={e => setForwardEmail(e.target.value)} placeholder="email@..." />
                <button onClick={() => forwardEmail && crAction(detail._id, 'forward', { assigneeEmail: forwardEmail })} className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs">Forward</button>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <textarea className="input resize-none" rows={3} placeholder="CR response to student..." value={reply} onChange={e => setReply(e.target.value)} />
            <button onClick={() => sendReply(detail._id)} className="mt-2 btn-primary bg-green-600 hover:bg-green-700">Send Reply</button>
            {detail.adminReply && <div className="mt-3 p-3 bg-green-50 rounded-lg text-sm text-green-800">{detail.adminReply}</div>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="page-title">Class Grievances</h2>
        <p className="text-sm text-gray-500 mt-0.5">{user?.course} · Year {user?.semester} · Section {user?.section} — {items.length} grievances</p>
      </div>
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9" placeholder="Search grievances..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['ID', 'Title', 'Category', 'Student', 'Status', ''].map(h => (
                <th key={h} className="text-left text-xs font-medium text-gray-400 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(g => (
              <tr key={g._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{g.grievanceID}</td>
                <td className="px-4 py-3">{g.title || g.category}</td>
                <td className="px-4 py-3"><span className="badge bg-gray-100 text-gray-700">{g.category}</span></td>
                <td className="px-4 py-3 text-xs text-gray-500">{g.studentName || g.studentID}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${BADGE_STYLES[g.status] || ''}`}>{g.status}</span>
                  {g.markedImportant && <AlertCircle size={12} className="inline ml-1 text-red-500" />}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => setDetail(g)} className="p-1.5 rounded-lg bg-green-50 text-green-600"><Eye size={13} /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">No class grievances</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
