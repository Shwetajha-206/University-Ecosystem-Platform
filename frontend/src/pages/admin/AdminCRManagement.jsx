import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search, Plus, X, Eye, UserCheck, UserX, Key, RefreshCw, AlertTriangle,
  Users, BarChart3, MessageSquare, Megaphone, Vote, FileWarning, Clock,
  TrendingUp, Shield, Ban, ArrowRightLeft, Replace, Trash2, AlertOctagon,
  Activity, Star, Send,
} from 'lucide-react'
import { apiJson } from '../../lib/api'
import LoadingState from '../../components/admin/LoadingState'
import EmptyState from '../../components/admin/EmptyState'
import StatCard from '../../components/admin/StatCard'
import AssignedClassSelect from '../../components/admin/AssignedClassSelect'

const STATUS_TABS = [
  { id: 'all', label: 'All CRs' },
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
]

const MONITOR_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'activity', label: 'Activity Logs' },
  { id: 'complaints', label: 'Complaints' },
  { id: 'grievances', label: 'Grievances' },
  { id: 'polls', label: 'Polls' },
  { id: 'notices', label: 'Notices' },
  { id: 'messages', label: 'Chats' },
  { id: 'performance', label: 'Performance' },
  { id: 'ratings', label: 'Ratings' },
  { id: 'chat', label: '💬 Message CR' },
]

const EMPTY_CR_FORM = {
  name: '', email: '', password: '', enrollmentNumber: '',
  course: '', branch: '', semester: '', section: '',
}

// ── Chat Component ─────────────────────────────────────────────────────────
function AdminCRChat({ crEmail, crName, adminEmail }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  const fetchMessages = useCallback(async () => {
    try {
      const data = await apiJson(`/messages?peer=${encodeURIComponent(crEmail)}`)
      setMessages(Array.isArray(data) ? data : [])
    } catch { setMessages([]) }
    setLoading(false)
  }, [crEmail])

  useEffect(() => { fetchMessages() }, [fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const t = setInterval(fetchMessages, 5000)
    return () => clearInterval(t)
  }, [fetchMessages])

  const sendMessage = async () => {
    if (!text.trim()) return
    setSending(true)
    try {
      await apiJson('/messages', {
        method: 'POST',
        body: JSON.stringify({ toEmail: crEmail, body: text.trim() })
      })
      setText('')
      await fetchMessages()
    } catch { alert('Message send nahi hua') }
    setSending(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  if (loading) return <LoadingState message="Loading messages..." />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 480, background: '#f8fafc', borderRadius: 14, border: '1.5px solid #e2e8f0', overflow: 'hidden' }}>

      {/* Chat Header */}
      <div style={{ padding: '14px 18px', background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 16 }}>
          {crName?.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{crName}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>Class Representative · {crEmail}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>Online</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, margin: 'auto' }}>
            <MessageSquare size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
            <p>No messages yet — start the conversation!</p>
          </div>
        ) : messages.map(m => {
          const isMe = m.fromEmail === adminEmail
          return (
            <div key={m._id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: isMe ? '#1e3a8a' : '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                {m.fromName?.charAt(0).toUpperCase()}
              </div>
              <div style={{ maxWidth: '70%' }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: isMe ? 'linear-gradient(135deg, #1e3a8a, #2563eb)' : '#fff',
                  color: isMe ? '#fff' : '#0f172a',
                  fontSize: 13,
                  lineHeight: 1.5,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  border: isMe ? 'none' : '1px solid #e2e8f0',
                }}>
                  {m.body}
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3, textAlign: isMe ? 'right' : 'left' }}>
                  {new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  {isMe && <span style={{ marginLeft: 4 }}>{m.read ? '✓✓' : '✓'}</span>}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${crName}...`}
          rows={1}
          style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.5, maxHeight: 100, overflowY: 'auto' }}
          onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
        />
        <button onClick={sendMessage} disabled={sending || !text.trim()}
          style={{ width: 42, height: 42, borderRadius: 12, background: sending || !text.trim() ? '#e2e8f0' : 'linear-gradient(135deg, #1e3a8a, #2563eb)', border: 'none', cursor: sending || !text.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
          <Send size={16} color={sending || !text.trim() ? '#94a3b8' : '#fff'} />
        </button>
      </div>
    </div>
  )
}

export default function AdminCRManagement({ user }) {
  const [view, setView] = useState('dashboard')
  const [crs, setCrs] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusTab, setStatusTab] = useState('all')
  const [selected, setSelected] = useState(null)
  const [profile, setProfile] = useState(null)
  const [monitorTab, setMonitorTab] = useState('overview')
  const [monitorData, setMonitorData] = useState({})
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showReplace, setShowReplace] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [showWarn, setShowWarn] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showClassEdit, setShowClassEdit] = useState(false)
  const [form, setForm] = useState(EMPTY_CR_FORM)
  const [editForm, setEditForm] = useState({ name: '', email: '', enrollmentNumber: '' })
  const [classForm, setClassForm] = useState({ course: '', branch: '', semester: '', section: '' })
  const [replaceForm, setReplaceForm] = useState({ name: '', email: '', password: '', deactivateOld: true })
  const [transferForm, setTransferForm] = useState({ toCrId: '', studentEmails: [] })
  const [warnMessage, setWarnMessage] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchDashboard = useCallback(async () => {
    try {
      const data = await apiJson('/cr-management/dashboard')
      setDashboard(data)
    } catch { setDashboard(null) }
  }, [])

  const fetchCrs = useCallback(async () => {
    try {
      const data = await apiJson('/cr-management')
      setCrs(Array.isArray(data) ? data : [])
    } catch { setCrs([]) }
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchDashboard(), fetchCrs()])
    setLoading(false)
  }, [fetchDashboard, fetchCrs])

  useEffect(() => { fetchAll() }, [fetchAll])

  const loadProfile = async (cr) => {
    setSelected(cr)
    setView('profile')
    setMonitorTab('overview')
    setMonitorData({})
    try {
      const data = await apiJson(`/cr-management/${cr._id || cr.id}`)
      setProfile(data)
    } catch { setProfile(cr) }
  }

  const loadMonitorTab = async (tab, crId) => {
    setMonitorTab(tab)
    if (tab === 'overview' || tab === 'chat') return
    const endpoints = {
      activity: 'activity', complaints: 'complaints', grievances: 'grievances',
      polls: 'polls', notices: 'notices', messages: 'messages',
      performance: 'performance', ratings: 'ratings',
    }
    if (!endpoints[tab]) return
    try {
      const data = await apiJson(`/cr-management/${crId}/${endpoints[tab]}`)
      setMonitorData(prev => ({ ...prev, [tab]: data }))
    } catch { setMonitorData(prev => ({ ...prev, [tab]: null })) }
  }

  const filtered = crs.filter(cr => {
    const q = search.toLowerCase()
    const matchSearch = !q || cr.name?.toLowerCase().includes(q) || cr.email?.toLowerCase().includes(q) || cr.classLabel?.toLowerCase().includes(q)
    const matchStatus = statusTab === 'all'
      || (statusTab === 'active' && cr.isActive)
      || (statusTab === 'inactive' && !cr.isActive)
    return matchSearch && matchStatus
  })

  const runAction = async (fn) => {
    setActionLoading(true)
    try {
      await fn()
      await fetchAll()
      if (selected && profile) {
        const data = await apiJson(`/cr-management/${selected._id || selected.id}`)
        setProfile(data)
      }
    } catch (err) { alert(err.message) }
    setActionLoading(false)
  }

  const createCr = () => runAction(async () => {
    await apiJson('/cr-management', { method: 'POST', body: JSON.stringify(form) })
    setShowCreate(false); setForm(EMPTY_CR_FORM)
  })

  const updateCr = () => runAction(async () => {
    await apiJson(`/cr-management/${selected._id || selected.id}`, { method: 'PATCH', body: JSON.stringify(editForm) })
    setShowEdit(false)
  })

  const updateClass = () => runAction(async () => {
    await apiJson(`/cr-management/${selected._id || selected.id}/class`, {
      method: 'PATCH', body: JSON.stringify({ ...classForm, reassignStudents: true }),
    })
    setShowClassEdit(false)
  })

  const resetPassword = () => runAction(async () => {
    if (!newPassword) return alert('Enter a new password')
    await apiJson(`/cr-management/${selected._id || selected.id}/password`, {
      method: 'PATCH', body: JSON.stringify({ password: newPassword }),
    })
    setShowPassword(false); setNewPassword('')
  })

  const toggleStatus = (cr, active) => runAction(async () => {
    await apiJson(`/cr-management/${cr._id || cr.id}/status`, {
      method: 'PATCH', body: JSON.stringify({ active }),
    })
  })

  const toggleSuspend = (cr, suspended, reason = '') => runAction(async () => {
    await apiJson(`/cr-management/${cr._id || cr.id}/suspend`, {
      method: 'PATCH', body: JSON.stringify({ suspended, reason }),
    })
  })

  const sendWarning = () => runAction(async () => {
    if (!warnMessage.trim()) return alert('Enter a warning message')
    await apiJson(`/cr-management/${selected._id || selected.id}/warn`, {
      method: 'POST', body: JSON.stringify({ message: warnMessage }),
    })
    setShowWarn(false); setWarnMessage('')
  })

  const replaceCr = () => runAction(async () => {
    await apiJson(`/cr-management/${selected._id || selected.id}/replace`, {
      method: 'POST', body: JSON.stringify(replaceForm),
    })
    setShowReplace(false); setView('list'); setSelected(null)
  })

  const transferStudents = () => runAction(async () => {
    if (!transferForm.toCrId) return alert('Select target CR')
    await apiJson(`/cr-management/${selected._id || selected.id}/transfer-students`, {
      method: 'POST', body: JSON.stringify(transferForm),
    })
    setShowTransfer(false)
  })

  const deleteCr = (cr, transferToCrId = null) => {
    if (!confirm(`Delete CR ${cr.name}? Students will be reassigned automatically.`)) return
    runAction(async () => {
      await apiJson(`/cr-management/${cr._id || cr.id}`, {
        method: 'DELETE',
        body: JSON.stringify(transferToCrId ? { transferToCrId } : {}),
      })
      if (selected?._id === cr._id) { setView('list'); setSelected(null) }
    })
  }

  if (loading) return <LoadingState message="Loading CR management..." />

  if (view === 'profile' && selected) {
    const cr = profile || selected
    const perf = cr.performance || monitorData.performance?.performance
    return (
      <div className="space-y-4">
        <button onClick={() => { setView('list'); setSelected(null); setProfile(null) }}
          className="text-sm text-purple-600 font-medium hover:underline">← Back to CR Management</button>

        <div className="card p-6">
          <div className="flex flex-col lg:flex-row lg:items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-green-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {cr.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900">{cr.name}</h2>
                <span className="badge bg-green-100 text-green-700">Class Rep</span>
                {!cr.blocked && !cr.suspended && <span className="badge bg-emerald-100 text-emerald-700">Active</span>}
                {cr.blocked && <span className="badge bg-red-100 text-red-700">Deactivated</span>}
                {cr.suspended && <span className="badge bg-amber-100 text-amber-700">Suspended</span>}
              </div>
              <p className="text-sm text-gray-500 mt-1">{cr.email}</p>
              <p className="text-sm text-purple-600 font-medium mt-1">{cr.classLabel}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                <span>Students: <strong className="text-gray-800">{cr.studentCount ?? '—'}</strong></span>
                <span>Resolution: <strong className="text-gray-800">{cr.resolutionRate ?? perf?.resolutionRate ?? '—'}%</strong></span>
                <span>Last Login: <strong className="text-gray-800">{cr.lastLoginAt ? new Date(cr.lastLoginAt).toLocaleString() : 'Never'}</strong></span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionBtn icon={MessageSquare} label="Message CR" onClick={() => loadMonitorTab('chat', cr._id || cr.id)} color="purple" />
              <ActionBtn icon={Eye} label="Edit" onClick={() => { setEditForm({ name: cr.name, email: cr.email, enrollmentNumber: cr.enrollmentNumber || '' }); setShowEdit(true) }} />
              <ActionBtn icon={RefreshCw} label="Class" onClick={() => { setClassForm({ course: cr.course || '', branch: cr.branch || '', semester: cr.semester || '', section: cr.section || '' }); setShowClassEdit(true) }} />
              <ActionBtn icon={Key} label="Password" onClick={() => setShowPassword(true)} />
              <ActionBtn icon={Replace} label="Replace" onClick={() => setShowReplace(true)} />
              <ActionBtn icon={ArrowRightLeft} label="Transfer" onClick={() => setShowTransfer(true)} />
              <ActionBtn icon={AlertOctagon} label="Warn" onClick={() => setShowWarn(true)} color="amber" />
              {cr.suspended
                ? <ActionBtn icon={UserCheck} label="Unsuspend" onClick={() => toggleSuspend(cr, false)} color="green" />
                : <ActionBtn icon={Ban} label="Suspend" onClick={() => { const r = prompt('Suspension reason:'); if (r !== null) toggleSuspend(cr, true, r) }} color="amber" />}
              {cr.blocked
                ? <ActionBtn icon={UserCheck} label="Activate" onClick={() => toggleStatus(cr, true)} color="green" />
                : <ActionBtn icon={UserX} label="Deactivate" onClick={() => toggleStatus(cr, false)} color="red" />}
              <ActionBtn icon={Trash2} label="Delete" onClick={() => deleteCr(cr)} color="red" />
            </div>
          </div>

          {cr.crWarnings?.length > 0 && (
            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-xs font-semibold text-amber-800 mb-2">Warnings Issued ({cr.crWarnings.length})</p>
              {cr.crWarnings.slice(-3).reverse().map((w, i) => (
                <p key={i} className="text-xs text-amber-700">{w.message} — {new Date(w.issuedAt).toLocaleDateString()}</p>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-1 flex-wrap border-b border-gray-200 pb-1">
          {MONITOR_TABS.map(t => (
            <button key={t.id}
              onClick={() => loadMonitorTab(t.id, cr._id || cr.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${monitorTab === t.id ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── CHAT TAB ── */}
        {monitorTab === 'chat' && (
          <AdminCRChat crEmail={cr.email} crName={cr.name} adminEmail={user?.email} />
        )}

        {monitorTab === 'overview' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Students" value={cr.studentCount} icon={Users} color="blue" />
            <StatCard label="Resolution Rate" value={`${cr.performance?.resolutionRate ?? cr.resolutionRate ?? 0}%`} icon={TrendingUp} color="green" />
            <StatCard label="Avg Response" value={cr.performance?.avgResponseHours ? `${cr.performance.avgResponseHours}h` : '—'} icon={Clock} color="amber" />
            <StatCard label="Avg Rating" value={cr.avgRating ?? '—'} icon={Star} color="purple" />
            <StatCard label="Complaints" value={cr.performance?.totalComplaints ?? 0} icon={AlertTriangle} color="amber" />
            <StatCard label="Grievances" value={cr.performance?.totalGrievances ?? 0} icon={FileWarning} color="red" />
            <StatCard label="Polls" value={cr.pollsCount ?? 0} icon={Vote} color="blue" />
            <StatCard label="Notices" value={cr.noticesCount ?? 0} icon={Megaphone} color="purple" />
          </div>
        )}

        {monitorTab === 'activity' && <DataList items={monitorData.activity} render={log => (
          <div className="flex justify-between items-start gap-2">
            <div><p className="text-sm font-medium">{log.action}</p><p className="text-xs text-gray-500">{log.details}</p></div>
            <span className="text-xs text-gray-400 flex-shrink-0">{new Date(log.createdAt).toLocaleString()}</span>
          </div>
        )} empty="No activity logs" />}

        {monitorTab === 'complaints' && <DataList items={monitorData.complaints} render={c => (
          <ComplaintRow item={c} crId={cr._id || cr.id} onRefresh={() => loadMonitorTab('complaints', cr._id || cr.id)} />
        )} empty="No complaints handled" />}

        {monitorTab === 'grievances' && <DataList items={monitorData.grievances} render={g => (
          <ComplaintRow item={g} crId={cr._id || cr.id} type="grievance" onRefresh={() => loadMonitorTab('grievances', cr._id || cr.id)} />
        )} empty="No grievances handled" />}

        {monitorTab === 'polls' && <DataList items={monitorData.polls} render={p => (
          <div><p className="text-sm font-medium">{p.question}</p><p className="text-xs text-gray-500">{p.options?.length} options · {new Date(p.createdAt).toLocaleDateString()}</p></div>
        )} empty="No polls created" />}

        {monitorTab === 'notices' && <DataList items={monitorData.notices} render={n => (
          <div><p className="text-sm font-medium">{n.title}</p><p className="text-xs text-gray-500">{n.category} · {new Date(n.createdAt).toLocaleDateString()}</p></div>
        )} empty="No notices sent" />}

        {monitorTab === 'messages' && <DataList items={monitorData.messages} render={m => (
          <div>
            <p className="text-xs text-gray-400">{m.fromRole} → {m.toRole} · {new Date(m.createdAt).toLocaleString()}</p>
            <p className="text-sm mt-0.5">{m.body}</p>
          </div>
        )} empty="No chat messages" />}

        {monitorTab === 'performance' && monitorData.performance && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(monitorData.performance.performance || {}).map(([k, v]) => (
                <StatCard key={k} label={k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())} value={v} icon={BarChart3} color="purple" />
              ))}
            </div>
            {monitorData.performance.statusBreakdown && (
              <div className="card p-4">
                <h4 className="text-sm font-semibold mb-3">Status Breakdown</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(monitorData.performance.statusBreakdown).map(([s, count]) => (
                    <span key={s} className="badge bg-gray-100 text-gray-700">{s}: {count}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {monitorTab === 'ratings' && <DataList items={monitorData.ratings} render={r => (
          <div className="flex justify-between">
            <div><p className="text-sm font-medium">{r.studentName}</p><p className="text-xs text-gray-500">{r.comment}</p></div>
            <span className="badge bg-amber-100 text-amber-700">{r.rating}/5</span>
          </div>
        )} empty="No student ratings yet" />}

        {cr.students?.length > 0 && monitorTab === 'overview' && (
          <div className="card p-4">
            <h4 className="text-sm font-semibold mb-3">Assigned Students ({cr.students.length})</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
              {cr.students.map(s => (
                <div key={s.id || s._id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">{s.name?.charAt(0)}</div>
                  <div className="min-w-0"><p className="text-xs font-medium truncate">{s.name}</p><p className="text-xs text-gray-400 truncate">{s.email}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Modal show={showEdit} onClose={() => setShowEdit(false)} title="Edit CR Details">
          <FormGrid>
            <input className="input" placeholder="Name" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
            <input className="input" placeholder="Email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
            <input className="input sm:col-span-2" placeholder="Enrollment Number" value={editForm.enrollmentNumber} onChange={e => setEditForm({ ...editForm, enrollmentNumber: e.target.value })} />
          </FormGrid>
          <ModalActions onCancel={() => setShowEdit(false)} onConfirm={updateCr} loading={actionLoading} label="Save Changes" />
        </Modal>

        <Modal show={showClassEdit} onClose={() => setShowClassEdit(false)} title="Change Assigned Class">
          <p className="text-xs text-gray-500 mb-3">All students in the new class will be automatically assigned to this CR.</p>
          <AssignedClassSelect compact value={classForm} onChange={setClassForm} className="mb-2" />
          <ModalActions onCancel={() => setShowClassEdit(false)} onConfirm={updateClass} loading={actionLoading} label="Update Class" />
        </Modal>

        <Modal show={showPassword} onClose={() => setShowPassword(false)} title="Reset CR Password">
          <input className="input" type="password" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          <ModalActions onCancel={() => setShowPassword(false)} onConfirm={resetPassword} loading={actionLoading} label="Reset Password" />
        </Modal>

        <Modal show={showReplace} onClose={() => setShowReplace(false)} title="Replace CR with New Account">
          <p className="text-xs text-gray-500 mb-3">Creates a new CR, transfers all students and open items, and deactivates the current CR.</p>
          <FormGrid>
            <input className="input" placeholder="New CR Name" value={replaceForm.name} onChange={e => setReplaceForm({ ...replaceForm, name: e.target.value })} />
            <input className="input" placeholder="New CR Email" value={replaceForm.email} onChange={e => setReplaceForm({ ...replaceForm, email: e.target.value })} />
            <input className="input sm:col-span-2" type="password" placeholder="New CR Password" value={replaceForm.password} onChange={e => setReplaceForm({ ...replaceForm, password: e.target.value })} />
          </FormGrid>
          <ModalActions onCancel={() => setShowReplace(false)} onConfirm={replaceCr} loading={actionLoading} label="Replace CR" />
        </Modal>

        <Modal show={showTransfer} onClose={() => setShowTransfer(false)} title="Transfer Students to Another CR">
          <select className="input" value={transferForm.toCrId} onChange={e => setTransferForm({ ...transferForm, toCrId: e.target.value })}>
            <option value="">Select target CR</option>
            {crs.filter(c => (c._id || c.id) !== (cr._id || cr.id)).map(c => (
              <option key={c._id || c.id} value={c._id || c.id}>{c.name} — {c.classLabel}</option>
            ))}
          </select>
          <ModalActions onCancel={() => setShowTransfer(false)} onConfirm={transferStudents} loading={actionLoading} label="Transfer All Students" />
        </Modal>

        <Modal show={showWarn} onClose={() => setShowWarn(false)} title="Send Warning to CR">
          <textarea className="input min-h-[80px]" placeholder="Warning message..." value={warnMessage} onChange={e => setWarnMessage(e.target.value)} />
          <ModalActions onCancel={() => setShowWarn(false)} onConfirm={sendWarning} loading={actionLoading} label="Send Warning" />
        </Modal>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h2 className="page-title">CR Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">Full control over Class Representatives — create, monitor, and manage all CR accounts</p>
        </div>
        <div className="sm:ml-auto flex gap-2">
          <button onClick={() => setView(view === 'dashboard' ? 'list' : 'dashboard')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">
            <BarChart3 size={15} /> {view === 'dashboard' ? 'CR List' : 'Dashboard'}
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700">
            <Plus size={15} /> Create CR
          </button>
        </div>
      </div>

      {view === 'dashboard' && dashboard && (
        <>
          <div className="stats-grid">
            <StatCard label="Total CRs" value={dashboard.totals?.total} icon={Users} color="purple" />
            <StatCard label="Active CRs" value={dashboard.totals?.active} icon={UserCheck} color="green" />
            <StatCard label="Inactive CRs" value={dashboard.totals?.inactive} icon={UserX} color="red" />
            <StatCard label="Suspended" value={dashboard.totals?.suspended} icon={Ban} color="amber" />
          </div>

          {dashboard.bestPerforming?.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-green-600" /> Best Performing CRs</h3>
              <div className="space-y-2">
                {dashboard.bestPerforming.map((cr, i) => (
                  <div key={cr.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      const fullCR = crs.find(c => (c._id || c.id) === cr.id)
                      if (fullCR) {
                        setSelectedCR(fullCR)
                        setMonitorTab('overview')
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                      <div><p className="text-sm font-medium">{cr.name}</p><p className="text-xs text-gray-500">{cr.classLabel}</p></div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">{cr.resolutionRate}%</p>
                      <p className="text-xs text-gray-400">{cr.avgResponseHours}h avg response</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dashboard.complaintStats?.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2"><AlertTriangle size={16} className="text-amber-600" /> Complaint Resolution by CR</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-gray-400 border-b">
                    {['CR', 'Class', 'Total', 'Resolved', 'Rate'].map(h => <th key={h} className="text-left py-2 px-3">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {dashboard.complaintStats.map(cr => (
                      <tr key={cr.name} 
                        className="border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => {
                          const fullCR = crs.find(c => c.name === cr.name)
                          if (fullCR) {
                            setSelectedCR(fullCR)
                            setMonitorTab('overview')
                          }
                        }}
                      >
                        <td className="py-2 px-3 font-medium">{cr.name}</td>
                        <td className="py-2 px-3 text-gray-500 text-xs">{cr.classLabel}</td>
                        <td className="py-2 px-3">{cr.total}</td>
                        <td className="py-2 px-3">{cr.resolved}</td>
                        <td className="py-2 px-3"><span className="badge bg-green-100 text-green-700">{cr.resolutionRate}%</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {(view === 'list' || view === 'dashboard') && (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input pl-9" placeholder="Search CRs by name, email, or class..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-1">
              {STATUS_TABS.map(t => (
                <button key={t.id} onClick={() => setStatusTab(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusTab === t.id ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['CR', 'Class', 'Students', 'Resolution', 'Rating', 'Last Login', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs font-medium text-gray-400 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(cr => (
                    <tr key={cr._id || cr.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">{cr.name?.charAt(0)}</div>
                          <div><p className="font-medium text-gray-900">{cr.name}</p><p className="text-xs text-gray-400">{cr.email}</p></div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{cr.classLabel}</td>
                      <td className="px-4 py-3">{cr.studentCount ?? '—'}</td>
                      <td className="px-4 py-3"><span className="badge bg-green-100 text-green-700">{cr.resolutionRate ?? 0}%</span></td>
                      <td className="px-4 py-3">{cr.avgRating ? `${cr.avgRating}/5` : '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{cr.lastLoginAt ? new Date(cr.lastLoginAt).toLocaleDateString() : 'Never'}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${cr.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {cr.suspended ? 'Suspended' : cr.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => loadProfile(cr)} className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600" title="View Profile"><Eye size={14} /></button>
                          <button onClick={async () => { await loadProfile(cr); loadMonitorTab('chat', cr._id || cr.id) }}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Message CR">
                            <MessageSquare size={14} />
                          </button>
                          <button onClick={() => toggleStatus(cr, !cr.isActive)} className="p-1.5 rounded-lg hover:bg-gray-100" title={cr.isActive ? 'Deactivate' : 'Activate'}>
                            {cr.isActive ? <UserX size={14} className="text-red-500" /> : <UserCheck size={14} className="text-green-600" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8}><EmptyState title="No CRs found" description="Create a CR account or adjust your filters." icon={Shield} /></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <Modal show={showCreate} onClose={() => setShowCreate(false)} title="Create CR Account">
        <p className="text-xs text-gray-500 mb-3">Students matching this class will be automatically assigned to the new CR.</p>
        <FormGrid>
          <input className="input" placeholder="Full Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="Email *" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input className="input" placeholder="Password *" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <input className="input sm:col-span-2" placeholder="Enrollment Number" value={form.enrollmentNumber} onChange={e => setForm({ ...form, enrollmentNumber: e.target.value })} />
        </FormGrid>
        <AssignedClassSelect compact value={form} onChange={setForm} className="mt-3" />
        <ModalActions onCancel={() => setShowCreate(false)} onConfirm={createCr} loading={actionLoading} label="Create CR Account" />
      </Modal>
    </div>
  )
}

function ActionBtn({ icon: Icon, label, onClick, color = 'purple' }) {
  const colors = { purple: 'hover:bg-purple-50 text-purple-600', green: 'hover:bg-green-50 text-green-600', red: 'hover:bg-red-50 text-red-600', amber: 'hover:bg-amber-50 text-amber-600' }
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 transition-colors ${colors[color]}`}>
      <Icon size={13} /> {label}
    </button>
  )
}

function Modal({ show, onClose, title, children }) {
  if (!show) return null
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="card p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button onClick={onClose}><X size={16} className="text-gray-400" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function FormGrid({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
}

function ModalActions({ onCancel, onConfirm, loading, label }) {
  return (
    <div className="flex justify-end gap-2 mt-4">
      <button onClick={onCancel} className="btn-secondary">Cancel</button>
      <button onClick={onConfirm} disabled={loading} className="btn-primary bg-purple-600 hover:bg-purple-700 disabled:opacity-50">{loading ? 'Processing...' : label}</button>
    </div>
  )
}

function DataList({ items, render, empty }) {
  if (!items) return <LoadingState message="Loading..." />
  if (!items.length) return <EmptyState title={empty} icon={Activity} />
  return (
    <div className="card divide-y divide-gray-50">
      {items.map((item, i) => (
        <div key={item._id || item.id || i} className="p-4">{render(item)}</div>
      ))}
    </div>
  )
}

function ComplaintRow({ item, crId, type = 'complaint', onRefresh }) {
  const [overriding, setOverriding] = useState(false)
  const id = item._id
  const label = type === 'grievance' ? item.grievanceID : item.complaintID

  const takeControl = async () => {
    try {
      await apiJson(`/cr-management/take-control/${type}/${id}`, { method: 'POST' })
      onRefresh?.()
    } catch (err) { alert(err.message) }
  }

  const overrideStatus = async (status) => {
    try {
      await apiJson(`/cr-management/override/${type}/${id}`, {
        method: 'POST', body: JSON.stringify({ status }),
      })
      onRefresh?.()
    } catch (err) { alert(err.message) }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div>
        <p className="text-sm font-medium">{item.title || item.category} <span className="text-gray-400 font-normal">({label})</span></p>
        <p className="text-xs text-gray-500">{item.studentName} · {item.status} · {new Date(item.createdAt).toLocaleDateString()}</p>
      </div>
      <div className="flex gap-1 flex-wrap">
        <button onClick={takeControl} className="px-2 py-1 rounded text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100">Take Control</button>
        {!overriding ? (
          <button onClick={() => setOverriding(true)} className="px-2 py-1 rounded text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100">Override</button>
        ) : (
          <>
            {['resolved', 'rejected', 'In Progress'].map(s => (
              <button key={s} onClick={() => { overrideStatus(s); setOverriding(false) }}
                className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200">{s}</button>
            ))}
          </>
        )}
      </div>
    </div>
  )
}