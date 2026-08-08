import { useState, useEffect, useRef } from 'react'
import { Send, X, Plus, Clock, CheckCircle, XCircle, Eye, ChevronDown, ChevronUp, Paperclip, Camera, Shield, Filter } from 'lucide-react'
import { apiJson } from '../lib/api'
import { usePolling } from '../hooks/usePolling'

const CATEGORIES = [
  'Cleanliness & Hygiene', 'Canteen Issue', 'Water Problem', 'Electricity Issue',
  'WiFi / Internet Issue', 'Classroom Infrastructure', 'Hostel Complaint',
  'Transport / Bus Issue', 'Sports Facility Issue', 'Medical Facility Issue',
  'Library Issue', 'Parking Issue', 'Washroom Issue', 'Noise / Disturbance',
  'Security Issue', 'Maintenance Issue', 'Lift / Fan / AC Problem',
  'Laboratory Issue', 'Furniture Damage', 'Other',
]

const CAT_ICONS = {
  'Cleanliness & Hygiene': '🧹', 'Canteen Issue': '🍽️', 'Water Problem': '💧',
  'Electricity Issue': '⚡', 'WiFi / Internet Issue': '📶', 'Classroom Infrastructure': '🏫',
  'Hostel Complaint': '🛏️', 'Transport / Bus Issue': '🚌', 'Sports Facility Issue': '⚽',
  'Medical Facility Issue': '🏥', 'Library Issue': '📚', 'Parking Issue': '🅿️',
  'Washroom Issue': '🚻', 'Noise / Disturbance': '🔊', 'Security Issue': '🔐',
  'Maintenance Issue': '🔧', 'Lift / Fan / AC Problem': '❄️', 'Laboratory Issue': '🔬',
  'Furniture Damage': '🪑', 'Other': '📋',
}

const STATUS_CONFIG = {
  pending:       { color: '#d97706', bg: '#fef3c7', border: '#fde68a', dot: '#f59e0b', label: 'Pending' },
  Pending:       { color: '#d97706', bg: '#fef3c7', border: '#fde68a', dot: '#f59e0b', label: 'Pending' },
  reviewing:     { color: '#2563eb', bg: '#dbeafe', border: '#bfdbfe', dot: '#3b82f6', label: 'Reviewing' },
  'In Progress': { color: '#2563eb', bg: '#dbeafe', border: '#bfdbfe', dot: '#3b82f6', label: 'In Progress' },
  resolved:      { color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0', dot: '#22c55e', label: 'Resolved' },
  Resolved:      { color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0', dot: '#22c55e', label: 'Resolved' },
  rejected:      { color: '#dc2626', bg: '#fee2e2', border: '#fecaca', dot: '#ef4444', label: 'Rejected' },
  Rejected:      { color: '#dc2626', bg: '#fee2e2', border: '#fecaca', dot: '#ef4444', label: 'Rejected' },
}

const css = `
  @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
  .comp-row { transition: all 0.15s ease; border-bottom: 1px solid #f1f5f9; }
  .comp-row:hover { background: #f8fafc !important; }
  .comp-row:last-child { border-bottom: none; }
  .filter-pill { transition: all 0.15s; }
  .filter-pill:hover { background: #f1f5f9; }
  .submit-btn { transition: all 0.2s; }
  .submit-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(15,118,110,0.35) !important; }
  .comp-input:focus { border-color: #0f766e !important; box-shadow: 0 0 0 3px rgba(15,118,110,0.1); outline: none; }
  .proof-img { transition: all 0.2s; cursor: pointer; }
  .proof-img:hover { transform: scale(1.04); }
`

const compressImage = (file) => new Promise((resolve) => {
  if (!file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = () => resolve({ name: file.name, type: file.type, data: reader.result })
    reader.readAsDataURL(file); return
  }
  const img = new Image()
  const url = URL.createObjectURL(file)
  img.onload = () => {
    const canvas = document.createElement('canvas')
    const MAX = 600; let w = img.width, h = img.height
    if (w > h && w > MAX) { h = (h * MAX) / w; w = MAX }
    else if (h > MAX) { w = (w * MAX) / h; h = MAX }
    canvas.width = w; canvas.height = h
    canvas.getContext('2d').drawImage(img, 0, 0, w, h)
    URL.revokeObjectURL(url)
    resolve({ name: file.name, type: 'image/jpeg', data: canvas.toDataURL('image/jpeg', 0.6) })
  }
  img.src = url
})

export default function StudentComplaints({ user }) {
  const [view, setView] = useState('list')
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState(null)
  const [filterStatus, setFilterStatus] = useState('All')
  const [form, setForm] = useState({ title: '', category: 'Cleanliness & Hygiene', priority: 'Medium', description: '', anonymous: false })
  const [proofFiles, setProofFiles] = useState([])
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  const fetchComplaints = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = await apiJson(`/complaints/user/${encodeURIComponent(user.email)}`)
      const list = Array.isArray(data) ? data : []
      setComplaints(list)
      if (selected) {
        const updated = list.find(c => c._id === selected._id)
        if (updated) setSelected(updated)
      }
    } catch { if (!silent) setComplaints([]) }
    if (!silent) setLoading(false)
  }

  useEffect(() => { if (user?.email) fetchComplaints() }, [user])
  usePolling(() => { if (user?.email) fetchComplaints(true) }, 10000, !!user?.email)

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    const valid = files.filter(f => f.size <= 5 * 1024 * 1024)
    setProofFiles(prev => [...prev, ...valid].slice(0, 3))
    e.target.value = ''
  }

  const submit = async () => {
    if (!form.title || !form.description) return alert('Title and description required!')
    setSaving(true)
    try {
      const proofData = proofFiles.length > 0 ? await Promise.all(proofFiles.map(compressImage)) : []
      await apiJson('/complaints', {
        method: 'POST',
        body: JSON.stringify({
          category: form.category, description: form.description, proof: proofData,
          title: form.title, priority: form.priority, anonymous: form.anonymous,
        }),
      })
      fetchComplaints()
      setForm({ title: '', category: 'Cleanliness & Hygiene', priority: 'Medium', description: '', anonymous: false })
      setProofFiles([])
      setView('list')
    } catch (err) { alert(err.message || 'Server error!') }
    setSaving(false)
  }

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => ['pending','Pending'].includes(c.status)).length,
    inProgress: complaints.filter(c => ['In Progress','reviewing'].includes(c.status)).length,
    resolved: complaints.filter(c => ['resolved','Resolved'].includes(c.status)).length,
  }

  const filtered = complaints.filter(c => {
    if (filterStatus === 'All') return true
    if (filterStatus === 'Pending') return ['pending','Pending'].includes(c.status)
    if (filterStatus === 'In Progress') return ['reviewing','In Progress'].includes(c.status)
    if (filterStatus === 'Resolved') return ['resolved','Resolved'].includes(c.status)
    if (filterStatus === 'Rejected') return ['rejected','Rejected'].includes(c.status)
    return true
  })

  const inputStyle = {
    width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0',
    borderRadius: 10, fontSize: 13, color: '#0f172a', background: '#f8fafc',
    fontFamily: 'inherit', boxSizing: 'border-box',
  }

  return (
    <>
      <style>{css}</style>
      <div style={{ fontFamily: "'Plus Jakarta Sans', Segoe UI, sans-serif", maxWidth: 860 }}>

        {/* Dark Header */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f766e 100%)', borderRadius: 20, padding: '28px 32px', marginBottom: 24, boxShadow: '0 12px 40px rgba(15,23,42,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.1)', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: '1px solid rgba(255,255,255,0.15)' }}>📋</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>Complaints</h2>
                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Report & track general campus issues</p>
                </div>
              </div>
              {/* Mini Stats */}
              <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
                {[
                  { label: 'Total', value: stats.total, color: '#94a3b8' },
                  { label: 'Pending', value: stats.pending, color: '#fbbf24' },
                  { label: 'In Progress', value: stats.inProgress, color: '#60a5fa' },
                  { label: 'Resolved', value: stats.resolved, color: '#4ade80' },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setView(view === 'form' ? 'list' : 'form')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: view === 'form' ? 'rgba(255,255,255,0.15)' : '#0f766e', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(0,0,0,0.2)', transition: 'all 0.2s' }}>
              {view === 'form' ? <><X size={15} /> Cancel</> : <><Plus size={15} /> New Complaint</>}
            </button>
          </div>
        </div>

        {/* New Complaint Form */}
        {view === 'form' && (
          <div style={{ background: '#fff', borderRadius: 18, padding: '28px 30px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1.5px solid #e2e8f0', marginBottom: 24, animation: 'slideDown 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 18, borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #0f172a, #0f766e)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📝</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>File a Complaint</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>Reviewed within 24–48 hours</div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Complaint Title *</label>
              <input className="comp-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Washroom not cleaned for 3 days"
                style={inputStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Category *</label>
                <select className="comp-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
                  {CATEGORIES.map(c => <option key={c}>{CAT_ICONS[c]} {c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Priority</label>
                <select className="comp-input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={inputStyle}>
                  {['Low', 'Medium', 'High'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Description *</label>
              <textarea className="comp-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="What happened, where, since when..." rows={4}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }} />
            </div>

            {/* Proof Upload */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                Proof <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional, max 3 files, 5MB each)</span>
              </label>
              <div style={{ border: '2px dashed #e2e8f0', borderRadius: 12, padding: '16px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 9, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#475569', fontFamily: 'inherit' }}>
                  <Paperclip size={13} /> Upload File
                </button>
                <button type="button" onClick={() => cameraInputRef.current?.click()}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 9, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#475569', fontFamily: 'inherit' }}>
                  <Camera size={13} /> Take Photo
                </button>
              </div>
              <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx" onChange={handleFileChange} style={{ display: 'none' }} />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} />
              {proofFiles.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {proofFiles.map((file, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10 }}>
                      <span style={{ fontSize: 16 }}>{file.type.startsWith('image/') ? '🖼️' : '📄'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{(file.size / 1024).toFixed(1)} KB</div>
                      </div>
                      {file.type.startsWith('image/') && <img src={URL.createObjectURL(file)} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 7, border: '1px solid #e2e8f0' }} />}
                      <button onClick={() => setProofFiles(p => p.filter((_, j) => j !== i))}
                        style={{ width: 26, height: 26, borderRadius: '50%', background: '#fee2e2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={12} color="#dc2626" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Anonymous */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, padding: '12px 16px', background: '#f8fafc', borderRadius: 11, border: '1.5px solid #e2e8f0' }}>
              <div onClick={() => setForm({ ...form, anonymous: !form.anonymous })}
                style={{ width: 46, height: 26, borderRadius: 13, background: form.anonymous ? '#0f766e' : '#cbd5e1', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 3, left: form.anonymous ? 23 : 3, width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Submit Anonymously</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Your identity will be hidden from admins</div>
              </div>
              {form.anonymous && <span style={{ marginLeft: 'auto', padding: '2px 10px', background: '#f0fdfa', color: '#0f766e', borderRadius: 20, fontSize: 11, fontWeight: 700, border: '1px solid #99f6e4' }}>🔒 On</span>}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={submit} disabled={saving} className="submit-btn"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 26px', background: saving ? '#94a3b8' : 'linear-gradient(135deg, #0f172a, #0f766e)', color: '#fff', border: 'none', borderRadius: 11, fontWeight: 700, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(15,118,110,0.25)' }}>
                <Send size={14} /> {saving ? 'Submitting...' : 'Submit Complaint'}
              </button>
              <button onClick={() => setView('list')}
                style={{ padding: '11px 20px', background: '#f8fafc', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: 11, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Filter Pills */}
        {view === 'list' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {['All', 'Pending', 'In Progress', 'Resolved', 'Rejected'].map(s => {
              const counts = {
                All: complaints.length,
                Pending: stats.pending,
                'In Progress': stats.inProgress,
                Resolved: stats.resolved,
                Rejected: complaints.filter(c => ['rejected','Rejected'].includes(c.status)).length,
              }
              const active = filterStatus === s
              return (
                <button key={s} onClick={() => setFilterStatus(s)} className="filter-pill"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 20, border: active ? 'none' : '1.5px solid #e2e8f0', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: active ? '#0f172a' : '#fff', color: active ? '#fff' : '#64748b', fontFamily: 'inherit', boxShadow: active ? '0 3px 10px rgba(15,23,42,0.2)' : 'none' }}>
                  {s}
                  <span style={{ background: active ? 'rgba(255,255,255,0.2)' : '#f1f5f9', color: active ? '#fff' : '#64748b', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 800 }}>{counts[s]}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Complaints List */}
        {view === 'list' && (
          loading ? (
            <div style={{ background: '#fff', borderRadius: 16, padding: '60px', textAlign: 'center', border: '1.5px solid #e2e8f0' }}>
              <div style={{ width: 36, height: 36, border: '3px solid #f0fdfa', borderTopColor: '#0f766e', borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ color: '#94a3b8', fontSize: 13 }}>Loading complaints...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 18, padding: '70px 20px', textAlign: 'center', border: '1.5px solid #e2e8f0' }}>
              <div style={{ width: 72, height: 72, background: 'linear-gradient(135deg, #0f172a, #0f766e)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: 32 }}>📋</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>No Complaints Yet</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>Report a campus issue and track its resolution.</div>
              <button onClick={() => setView('form')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', background: 'linear-gradient(135deg, #0f172a, #0f766e)', color: '#fff', border: 'none', borderRadius: 11, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(15,118,110,0.3)' }}>
                <Plus size={14} /> File First Complaint
              </button>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #e2e8f0', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              {filtered.map((c, idx) => {
                const st = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending
                const hasProof = Array.isArray(c.proof) && c.proof.length > 0
                const isOpen = selected?._id === c._id
                return (
                  <div key={c._id}>
                    <div className="comp-row" onClick={() => setSelected(isOpen ? null : c)}
                      style={{ padding: '16px 22px', cursor: 'pointer', background: isOpen ? '#f8fafc' : '#fff', display: 'flex', alignItems: 'center', gap: 14 }}>

                      {/* Status Dot */}
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: st.dot, flexShrink: 0, boxShadow: `0 0 0 3px ${st.dot}22` }} />

                      {/* Category Icon */}
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f8fafc', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                        {CAT_ICONS[c.category] || '📋'}
                      </div>

                      {/* Main Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{c.title || c.category}</span>
                          <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{st.label}</span>
                          {hasProof && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', background: '#f0fdf4', color: '#16a34a', borderRadius: 20, fontSize: 11, fontWeight: 700, border: '1px solid #bbf7d0' }}>
                              <Paperclip size={9} /> {c.proof.length}
                            </span>
                          )}
                          {c.anonymous && <span style={{ padding: '2px 8px', background: '#f1f5f9', color: '#64748b', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>🔒</span>}
                          {c.adminReply && <span style={{ padding: '2px 8px', background: '#f0fdf4', color: '#16a34a', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>💬 Replied</span>}
                          {c.escalationLevel > 0 && <span style={{ padding: '2px 8px', background: '#fef3c7', color: '#b45309', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>⬆ Escalated</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#94a3b8', flexWrap: 'wrap' }}>
                          <span>{c.category}</span>
                          <span>•</span>
                          <span>{new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          {c.complaintID && <><span>•</span><span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#64748b' }}>{c.complaintID}</span></>}
                          {c.assignedToName && <><span>•</span><span>Assigned: {c.assignedToName}</span></>}
                          {c.deadline && <><span>•</span><span style={{ color: new Date(c.deadline) < new Date() && !['resolved','Resolved','rejected','Rejected'].includes(c.status) ? '#dc2626' : '#94a3b8' }}>Due: {new Date(c.deadline).toLocaleDateString('en-IN')}</span></>}
                        </div>
                      </div>

                      <div style={{ color: '#94a3b8', flexShrink: 0 }}>{isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                    </div>

                    {/* Expanded Panel */}
                    {isOpen && (
                      <div style={{ borderTop: '1px solid #f1f5f9', padding: '20px 22px 22px', background: '#fafafa', animation: 'slideDown 0.15s ease' }} onClick={e => e.stopPropagation()}>

                        <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 16, border: '1.5px solid #e2e8f0' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Description</div>
                          <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.8, margin: 0 }}>{c.description}</p>
                        </div>

                        {/* Proof */}
                        {hasProof && (
                          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 16, border: '1.5px solid #e2e8f0' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>📎 Proof ({c.proof.length} file{c.proof.length > 1 ? 's' : ''})</div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                              {c.proof.map((file, i) => (
                                file.type?.startsWith('image/') ? (
                                  <div key={i} style={{ textAlign: 'center' }}>
                                    <img src={file.data} alt={file.name} className="proof-img"
                                      style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 10, border: '1.5px solid #e2e8f0', display: 'block' }}
                                      onClick={() => window.open(file.data)} />
                                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                                  </div>
                                ) : (
                                  <a key={i} href={file.data} download={file.name} target="_blank" rel="noopener noreferrer"
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 16px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, textDecoration: 'none', color: '#0f172a', minWidth: 80 }}>
                                    <span style={{ fontSize: 28 }}>📄</span>
                                    <span style={{ fontSize: 10, fontWeight: 600, maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                                  </a>
                                )
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Timeline */}
                        <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: c.adminReply ? 16 : 0, border: '1.5px solid #e2e8f0' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 16 }}>Status Timeline</div>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {['Pending', 'In Progress', 'Resolved'].map((s, i) => {
                              const order = { pending: 0, Pending: 0, reviewing: 1, 'In Progress': 1, resolved: 2, Resolved: 2, rejected: 2, Rejected: 2 }
                              const cur = order[c.status] ?? 0
                              const done = i <= cur
                              const COLS = ['#f59e0b', '#3b82f6', '#22c55e']
                              return (
                                <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: done ? COLS[i] : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: done ? '#fff' : '#94a3b8', fontSize: 12, fontWeight: 800, marginBottom: 6, boxShadow: done ? `0 0 0 4px ${COLS[i]}25` : 'none' }}>
                                      {done ? '✓' : i + 1}
                                    </div>
                                    <div style={{ fontSize: 11, color: done ? COLS[i] : '#94a3b8', fontWeight: done ? 700 : 500 }}>{s}</div>
                                  </div>
                                  {i < 2 && <div style={{ height: 2, flex: 1, background: i < cur ? COLS[i] : '#e2e8f0', margin: '0 4px', marginBottom: 22, borderRadius: 2 }} />}
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Admin Reply */}
                        {c.adminReply && (
                          <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: 12, padding: '16px 18px', border: '1.5px solid #bbf7d0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                              <div style={{ width: 28, height: 28, background: '#dcfce7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Shield size={14} color="#16a34a" />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>Admin Response</span>
                              {c.repliedAt && <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>{new Date(c.repliedAt).toLocaleDateString('en-IN')}</span>}
                            </div>
                            <p style={{ fontSize: 13, color: '#166534', lineHeight: 1.8, margin: 0, paddingLeft: 36 }}>{c.adminReply}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>
    </>
  )
}