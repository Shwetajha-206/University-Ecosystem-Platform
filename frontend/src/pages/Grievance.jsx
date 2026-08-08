import { useState, useEffect, useRef } from 'react'
import { FileWarning, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, Shield, AlertTriangle, Send, X, Plus, Eye, Paperclip, Camera } from 'lucide-react'
import { apiJson } from '../lib/api'
import { usePolling } from '../hooks/usePolling'

const CATEGORIES = [
  'Academic Issue', 'Financial Issue', 'Faculty Concern', 'Harassment / Safety',
  'Hostel Related', 'Administrative Issue', 'Mental Health Support', 'Discrimination Issue',
  'Privacy Concern', 'Ragging Issue', 'Examination / Result Issue', 'Scholarship Issue',
  'Attendance Issue', 'Unfair Fine / Penalty', 'Gender Safety Concern', 'Complaint Against Staff',
  'ID Card Misuse', 'Corruption / Bribery', 'Other',
]
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']

const STATUS_CONFIG = {
  pending:       { color: '#92400e', bg: '#fffbeb', border: '#fcd34d', icon: <Clock size={11} />,       label: 'Pending' },
  Pending:       { color: '#92400e', bg: '#fffbeb', border: '#fcd34d', icon: <Clock size={11} />,       label: 'Pending' },
  'In Progress': { color: '#1e40af', bg: '#eff6ff', border: '#93c5fd', icon: <Eye size={11} />,         label: 'In Progress' },
  Resolved:      { color: '#065f46', bg: '#ecfdf5', border: '#6ee7b7', icon: <CheckCircle size={11} />, label: 'Resolved' },
  resolved:      { color: '#065f46', bg: '#ecfdf5', border: '#6ee7b7', icon: <CheckCircle size={11} />, label: 'Resolved' },
  reviewing:     { color: '#1e40af', bg: '#eff6ff', border: '#93c5fd', icon: <Eye size={11} />,         label: 'Reviewing' },
  Rejected:      { color: '#991b1b', bg: '#fff1f2', border: '#fca5a5', icon: <XCircle size={11} />,     label: 'Rejected' },
  rejected:      { color: '#991b1b', bg: '#fff1f2', border: '#fca5a5', icon: <XCircle size={11} />,     label: 'Rejected' },
}

const PRIORITY_CONFIG = {
  Low:    { color: '#065f46', bg: '#ecfdf5', dot: '#10b981' },
  Medium: { color: '#92400e', bg: '#fffbeb', dot: '#f59e0b' },
  High:   { color: '#991b1b', bg: '#fff1f2', dot: '#f87171' },
  Urgent: { color: '#fff',    bg: '#dc2626', dot: '#fff'    },
}

const CATEGORY_ICONS = {
  'Academic Issue':'🎓','Financial Issue':'💳','Faculty Concern':'👨‍🏫',
  'Harassment / Safety':'🚨','Hostel Related':'🏠','Administrative Issue':'🏛️',
  'Mental Health Support':'🧠','Discrimination Issue':'⚖️','Privacy Concern':'🔒',
  'Ragging Issue':'⚠️','Examination / Result Issue':'📝','Scholarship Issue':'🎖️',
  'Attendance Issue':'📅','Unfair Fine / Penalty':'💰','Gender Safety Concern':'🛡️',
  'Complaint Against Staff':'👤','ID Card Misuse':'🪪','Corruption / Bribery':'🚫','Other':'📋',
}

const T = {
  primary:'#1e3a8a', accent:'#2563eb', accentLight:'#eff6ff',
  border:'#e2e8f0', text:'#0f172a', textSub:'#475569', textMuted:'#94a3b8',
  card:'#ffffff', bg:'#f1f5f9',
}

const inp = {
  width:'100%', padding:'11px 14px', border:`1.5px solid ${T.border}`,
  borderRadius:10, fontSize:13, color:T.text, background:'#fff',
  fontFamily:'inherit', outline:'none', transition:'all 0.2s', boxSizing:'border-box',
}

const css = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin   { to{transform:rotate(360deg)} }
  @keyframes pulse  { 0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,0.5)} 60%{box-shadow:0 0 0 10px rgba(220,38,38,0)} }
  @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0.7} }

  .g-root { animation:fadeUp 0.3s ease; font-family:'Plus Jakarta Sans',Segoe UI,sans-serif; }
  .g-card { background:#fff; border-radius:16px; border:1.5px solid #e2e8f0; box-shadow:0 1px 6px rgba(0,0,0,0.05); transition:all 0.2s; }
  .g-card:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.09) !important; }
  .g-btn  { transition:all 0.18s; cursor:pointer; }
  .g-btn:hover { opacity:0.88; transform:translateY(-1px); }
  .g-inp:focus  { border-color:#2563eb !important; box-shadow:0 0 0 3px rgba(37,99,235,0.12) !important; outline:none; }
  .stat:hover   { transform:translateY(-3px); box-shadow:0 10px 28px rgba(0,0,0,0.1) !important; }
  .row   { cursor:pointer; border-radius:14px; border:1.5px solid #e2e8f0; background:#fff; transition:all 0.18s; }
  .row:hover    { border-color:#bfdbfe !important; box-shadow:0 6px 20px rgba(37,99,235,0.1) !important; transform:translateY(-1px); }
  .emg-pulse    { animation:pulse 1.6s infinite; }
  .emg-blink    { animation:blink 1.8s infinite; }
  .tab-active   { background:#1e3a8a; color:#fff; box-shadow:0 2px 10px rgba(30,58,138,0.25); }
  .tab-idle     { background:#fff; color:#64748b; }
  .tab-idle:hover { background:#f1f5f9; color:#1e3a8a; }
`

export default function Grievance({ user }) {
  const [tab, setTab]   = useState('my')
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [selected, setSelected]     = useState(null)
  const [form, setForm] = useState({ title:'', category:'Academic Issue', priority:'Medium', description:'', anonymous:false })
  const [proofFiles, setProofFiles] = useState([])
  const [showEmg, setShowEmg]       = useState(false)
  const fileRef   = useRef(null)
  const cameraRef = useRef(null)

  const fetchComplaints = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const d = await apiJson(`/grievances/user/${encodeURIComponent(user.email)}`)
      const list = Array.isArray(d) ? d : []
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

  const onFiles = (e) => {
    const valid = Array.from(e.target.files).filter(f => f.size <= 5*1024*1024)
    setProofFiles(p => [...p, ...valid].slice(0,3))
    e.target.value = ''
  }

  const compress = (file) => new Promise(res => {
    if (!file.type.startsWith('image/')) {
      const r = new FileReader()
      r.onload = () => res({ name:file.name, type:file.type, data:r.result })
      r.readAsDataURL(file); return
    }
    const img = new Image(), url = URL.createObjectURL(file)
    img.onload = () => {
      const c = document.createElement('canvas')
      const M=600; let w=img.width, h=img.height
      if (w>h&&w>M){h=h*M/w;w=M} else if(h>M){w=w*M/h;h=M}
      c.width=w; c.height=h; c.getContext('2d').drawImage(img,0,0,w,h)
      URL.revokeObjectURL(url)
      res({ name:file.name, type:'image/jpeg', data:c.toDataURL('image/jpeg',0.6) })
    }
    img.src=url
  })

  const submit = async () => {
    if (!form.title||!form.description) return alert('Title and description required!')
    setSaving(true)
    try {
      const proof = proofFiles.length ? await Promise.all(proofFiles.map(compress)) : []
      await apiJson('/grievances', {
        method:'POST',
        body: JSON.stringify({ ...form, proof }),
      })
      fetchComplaints()
      setForm({ title:'', category:'Academic Issue', priority:'Medium', description:'', anonymous:false })
      setProofFiles([]); setTab('my')
    } catch (err) { alert(err.message || 'Server error!') }
    setSaving(false)
  }

  const fireEmergency = () => {
    setForm({ title:'🚨 EMERGENCY COMPLAINT', category:'Harassment / Safety', priority:'Urgent', description:'', anonymous:false })
    setProofFiles([]); setTab('new'); setShowEmg(false)
    window.scrollTo({ top:0, behavior:'smooth' })
  }

  const st = {
    total:      complaints.length,
    pending:    complaints.filter(c=>['pending','Pending'].includes(c.status)).length,
    inProgress: complaints.filter(c=>['In Progress','reviewing'].includes(c.status)).length,
    resolved:   complaints.filter(c=>['resolved','Resolved'].includes(c.status)).length,
  }

  return (
    <>
      <style>{css}</style>
      <div className="g-root" style={{ maxWidth:900 }}>

        {/* ── EMERGENCY MODAL ── */}
        {showEmg && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(6px)' }}>
            <div style={{ background:'#fff', borderRadius:22, padding:'36px 32px', maxWidth:400, width:'100%', boxShadow:'0 32px 80px rgba(0,0,0,0.25)', animation:'fadeUp 0.25s ease', textAlign:'center' }}>
              <div style={{ width:64, height:64, background:'linear-gradient(135deg,#fee2e2,#fecaca)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', boxShadow:'0 4px 16px rgba(220,38,38,0.2)' }}>
                <AlertTriangle size={30} color="#dc2626" />
              </div>
              <div style={{ fontSize:20, fontWeight:800, color:T.text, marginBottom:10 }}>File Emergency Complaint?</div>
              <p style={{ fontSize:13, color:T.textSub, lineHeight:1.7, marginBottom:26 }}>
                This will be marked <strong style={{color:'#dc2626'}}>Urgent</strong> and escalated directly to administration. Use only in genuine emergencies.
              </p>
              <div style={{ display:'flex', gap:10 }}>
                <button className="g-btn" onClick={()=>setShowEmg(false)}
                  style={{ flex:1, padding:'12px', background:'#f1f5f9', border:'none', borderRadius:12, fontWeight:700, fontSize:13, color:T.textSub, fontFamily:'inherit' }}>
                  Cancel
                </button>
                <button className="g-btn" onClick={fireEmergency}
                  style={{ flex:1, padding:'12px', background:'linear-gradient(135deg,#dc2626,#991b1b)', border:'none', borderRadius:12, fontWeight:700, fontSize:13, color:'#fff', fontFamily:'inherit' }}>
                  🚨 Yes, Proceed
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── HEADER ── */}
        <div style={{ background:'linear-gradient(135deg,#0f172a 0%,#1e3a8a 55%,#1d4ed8 100%)', borderRadius:22, padding:'28px 32px', marginBottom:22, position:'relative', overflow:'hidden', boxShadow:'0 10px 40px rgba(30,58,138,0.3)' }}>
          <div style={{ position:'absolute', width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,0.04)', top:-80, right:100, pointerEvents:'none' }} />
          <div style={{ position:'absolute', width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,0.04)', bottom:-50, right:30, pointerEvents:'none' }} />

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', position:'relative', zIndex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ width:50, height:50, background:'rgba(255,255,255,0.12)', borderRadius:15, display:'flex', alignItems:'center', justifyContent:'center', border:'1.5px solid rgba(255,255,255,0.15)', backdropFilter:'blur(8px)' }}>
                <Shield size={24} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize:22, fontWeight:900, color:'#fff', letterSpacing:'-0.3px' }}>Grievance Portal</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginTop:3 }}>Submit and track your complaints securely</div>
              </div>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button className="g-btn emg-blink" onClick={()=>setShowEmg(true)}
                style={{ display:'flex', alignItems:'center', gap:7, padding:'11px 20px', background:'linear-gradient(135deg,#dc2626,#b91c1c)', border:'1.5px solid rgba(255,255,255,0.1)', borderRadius:12, color:'#fff', fontWeight:700, fontSize:13, fontFamily:'inherit' }}>
                🚨 Emergency
              </button>
              <button className="g-btn" onClick={()=>setTab(tab==='new'?'my':'new')}
                style={{ display:'flex', alignItems:'center', gap:7, padding:'11px 20px', background:'rgba(255,255,255,0.1)', border:'1.5px solid rgba(255,255,255,0.2)', borderRadius:12, color:'#fff', fontWeight:700, fontSize:13, fontFamily:'inherit', backdropFilter:'blur(8px)' }}>
                {tab==='new' ? <><X size={14}/>Cancel</> : <><Plus size={14}/>New Complaint</>}
              </button>
            </div>
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
          {[
            { label:'Total Filed',  val:st.total,       grad:'linear-gradient(135deg,#1e3a8a,#2563eb)', icon:<FileWarning size={22} color="#fff"/>, sub:'Complaints' },
            { label:'Pending',      val:st.pending,     grad:'linear-gradient(135deg,#b45309,#d97706)', icon:<Clock size={22} color="#fff"/>,       sub:'Awaiting review' },
            { label:'In Progress',  val:st.inProgress,  grad:'linear-gradient(135deg,#1d4ed8,#3b82f6)', icon:<Eye size={22} color="#fff"/>,         sub:'Being reviewed' },
            { label:'Resolved',     val:st.resolved,    grad:'linear-gradient(135deg,#065f46,#10b981)', icon:<CheckCircle size={22} color="#fff"/>,  sub:'Completed' },
          ].map((s,i) => (
            <div key={i} className="stat" style={{ borderRadius:16, overflow:'hidden', boxShadow:'0 4px 16px rgba(0,0,0,0.1)', transition:'all 0.2s' }}>
              <div style={{ background:s.grad, padding:'18px 20px', display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:46, height:46, background:'rgba(255,255,255,0.2)', borderRadius:13, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontSize:30, fontWeight:900, color:'#fff', lineHeight:1 }}>{s.val}</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.75)', marginTop:2, fontWeight:600 }}>{s.label}</div>
                </div>
              </div>
              <div style={{ background:'#fff', padding:'8px 20px', borderTop:'none' }}>
                <div style={{ fontSize:11, color:T.textMuted, fontWeight:500 }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── TABS ── */}
        <div style={{ display:'flex', gap:6, marginBottom:20, background:'#fff', padding:5, borderRadius:13, border:`1px solid ${T.border}`, width:'fit-content', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
          {[{id:'my',label:'📋 My Complaints'},{id:'new',label:'+ File Grievance'}].map(t=>(
            <button key={t.id} className={`g-btn tab-${tab===t.id?'active':'idle'}`} onClick={()=>setTab(t.id)}
              style={{ padding:'9px 22px', borderRadius:9, border:'none', fontWeight:700, fontSize:13, fontFamily:'inherit', transition:'all 0.2s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── FILE GRIEVANCE FORM ── */}
        {tab==='new' && (
          <div style={{ background:'#fff', borderRadius:20, border: form.priority==='Urgent' ? '1.5px solid #fca5a5' : `1.5px solid ${T.border}`, boxShadow:'0 4px 24px rgba(0,0,0,0.07)', marginBottom:22, overflow:'hidden' }}>

            {/* Form top strip */}
            <div style={{ height:4, background: form.priority==='Urgent' ? 'linear-gradient(90deg,#dc2626,#f87171)' : 'linear-gradient(90deg,#1e3a8a,#2563eb,#7c3aed)' }} />

            <div style={{ padding:'28px 30px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24, paddingBottom:20, borderBottom:`1px solid ${T.border}` }}>
                <div style={{ width:42, height:42, background: form.priority==='Urgent' ? '#fee2e2' : T.accentLight, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <FileWarning size={20} color={form.priority==='Urgent'?'#dc2626':T.accent} />
                </div>
                <div>
                  <div style={{ fontSize:16, fontWeight:800, color:T.primary }}>File a Grievance</div>
                  <div style={{ fontSize:12, color:T.textMuted }}>Your complaint will be reviewed within 48 hours</div>
                </div>
              </div>

              {form.priority==='Urgent' && (
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 16px', background:'#fff1f2', borderRadius:11, marginBottom:20, border:'1.5px solid #fecdd3' }}>
                  <AlertTriangle size={16} color="#dc2626" />
                  <div>
                    <div style={{ fontSize:13, color:'#dc2626', fontWeight:700 }}>🚨 Emergency Complaint Mode</div>
                    <div style={{ fontSize:11, color:'#ef4444', marginTop:2 }}>Will be escalated immediately to administration</div>
                  </div>
                </div>
              )}

              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:12, fontWeight:700, color:T.textSub, display:'block', marginBottom:7 }}>Complaint Title *</label>
                <input className="g-inp" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}
                  placeholder="Brief title of your complaint" style={inp} />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:T.textSub, display:'block', marginBottom:7 }}>Category *</label>
                  <select className="g-inp" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={inp}>
                    {CATEGORIES.map(c=><option key={c}>{CATEGORY_ICONS[c]} {c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:T.textSub, display:'block', marginBottom:7 }}>Priority *</label>
                  <select className="g-inp" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} style={inp}>
                    {PRIORITIES.map(p=><option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:12, fontWeight:700, color:T.textSub, display:'block', marginBottom:7 }}>Description *</label>
                <textarea className="g-inp" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}
                  placeholder="Describe your issue in detail..." rows={4}
                  style={{ ...inp, resize:'vertical' }} />
              </div>

              {/* Proof */}
              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:12, fontWeight:700, color:T.textSub, display:'block', marginBottom:7 }}>
                  Proof / Evidence <span style={{ color:T.textMuted, fontWeight:500 }}>(optional — max 3 files, 5MB each)</span>
                </label>
                <div style={{ border:`2px dashed #cbd5e1`, borderRadius:13, padding:'20px', textAlign:'center', background:'#f8fafc' }}>
                  <div style={{ display:'flex', justifyContent:'center', gap:10, marginBottom:8 }}>
                    <button type="button" onClick={()=>fileRef.current?.click()} className="g-btn"
                      style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', background:'#eff6ff', border:'1.5px solid #bfdbfe', borderRadius:10, fontSize:12, fontWeight:700, color:T.accent, fontFamily:'inherit' }}>
                      <Paperclip size={14}/> Upload File
                    </button>
                    <button type="button" onClick={()=>cameraRef.current?.click()} className="g-btn"
                      style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', background:'#f0fdf4', border:'1.5px solid #bbf7d0', borderRadius:10, fontSize:12, fontWeight:700, color:'#15803d', fontFamily:'inherit' }}>
                      <Camera size={14}/> Take Photo
                    </button>
                  </div>
                  <div style={{ fontSize:11, color:T.textMuted }}>JPG, PNG, PDF, DOC • Max 5MB each</div>
                </div>
                <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx" onChange={onFiles} style={{ display:'none' }} />
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={onFiles} style={{ display:'none' }} />
                {proofFiles.length>0 && (
                  <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:8 }}>
                    {proofFiles.map((f,i)=>(
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'#fff', border:`1.5px solid ${T.border}`, borderRadius:11 }}>
                        <span style={{ fontSize:18 }}>{f.type.startsWith('image/')?'🖼️':f.type==='application/pdf'?'📄':'📎'}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:600, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</div>
                          <div style={{ fontSize:11, color:T.textMuted }}>{(f.size/1024).toFixed(1)} KB</div>
                        </div>
                        {f.type.startsWith('image/') && <img src={URL.createObjectURL(f)} alt="" style={{ width:38, height:38, objectFit:'cover', borderRadius:8, border:`1px solid ${T.border}` }} />}
                        <button onClick={()=>setProofFiles(p=>p.filter((_,j)=>j!==i))} style={{ width:26, height:26, borderRadius:'50%', background:'#fee2e2', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <X size={12} color="#dc2626"/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Anonymous */}
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24, padding:'14px 18px', background:'#f8fafc', borderRadius:13, border:`1.5px solid ${T.border}` }}>
                <div onClick={()=>setForm({...form,anonymous:!form.anonymous})}
                  style={{ width:44, height:24, borderRadius:12, background:form.anonymous?T.accent:'#cbd5e1', cursor:'pointer', position:'relative', transition:'background 0.25s', flexShrink:0 }}>
                  <div style={{ position:'absolute', top:3, left:form.anonymous?22:3, width:18, height:18, background:'#fff', borderRadius:'50%', transition:'left 0.25s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.text }}>Submit Anonymously</div>
                  <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>Your identity will be hidden from this complaint</div>
                </div>
                {form.anonymous && <span style={{ padding:'3px 12px', background:T.accentLight, color:T.accent, borderRadius:20, fontSize:11, fontWeight:700, border:'1px solid #bfdbfe' }}>🔒 Anonymous</span>}
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={submit} disabled={saving} className="g-btn"
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 26px', background:saving?'#94a3b8':form.priority==='Urgent'?'linear-gradient(135deg,#dc2626,#991b1b)':'linear-gradient(135deg,#1e3a8a,#2563eb)', color:'#fff', border:'none', borderRadius:11, fontWeight:700, fontSize:13, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit', boxShadow:saving?'none':'0 4px 16px rgba(37,99,235,0.3)' }}>
                  <Send size={14}/> {saving?'Submitting...':form.priority==='Urgent'?'🚨 Submit Emergency':'Submit Grievance'}
                </button>
                <button onClick={()=>setTab('my')} className="g-btn"
                  style={{ padding:'12px 22px', background:'#f1f5f9', color:T.textSub, border:'none', borderRadius:11, fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MY COMPLAINTS ── */}
        {tab==='my' && (
          loading ? (
            <div style={{ background:'#fff', borderRadius:16, padding:'50px', textAlign:'center', border:`1px solid ${T.border}` }}>
              <div style={{ width:34, height:34, border:`3px solid ${T.accentLight}`, borderTopColor:T.accent, borderRadius:'50%', margin:'0 auto 14px', animation:'spin 0.8s linear infinite' }} />
              <div style={{ color:T.textMuted, fontSize:13 }}>Loading your complaints...</div>
            </div>
          ) : complaints.length===0 ? (
            <div style={{ background:'#fff', borderRadius:20, padding:'64px 20px', textAlign:'center', border:`1.5px solid ${T.border}`, boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
              <div style={{ width:76, height:76, background:'linear-gradient(135deg,#eff6ff,#dbeafe)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', boxShadow:'0 4px 16px rgba(37,99,235,0.15)' }}>
                <FileWarning size={34} color={T.accent} />
              </div>
              <div style={{ fontSize:18, fontWeight:800, color:T.text, marginBottom:8 }}>No Complaints Filed Yet</div>
              <div style={{ fontSize:13, color:T.textMuted, marginBottom:26, maxWidth:320, margin:'0 auto 26px' }}>Have an issue? File a grievance and we'll look into it promptly.</div>
              <button onClick={()=>setTab('new')} className="g-btn"
                style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'11px 24px', background:'linear-gradient(135deg,#1e3a8a,#2563eb)', color:'#fff', border:'none', borderRadius:11, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(37,99,235,0.3)' }}>
                <Plus size={14}/> File a Complaint
              </button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {complaints.map(c => {
                const st2 = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending
                const pr  = PRIORITY_CONFIG[c.priority] || PRIORITY_CONFIG.Medium
                const open = selected?._id===c._id
                return (
                  <div key={c._id} className="row" onClick={()=>setSelected(open?null:c)}
                    style={{ padding:'18px 22px', border: open?`1.5px solid ${T.accent}`:`1.5px solid ${T.border}` }}>

                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8, flexWrap:'wrap' }}>
                          <span style={{ fontSize:16 }}>{CATEGORY_ICONS[c.category]||'📋'}</span>
                          <span style={{ fontWeight:800, fontSize:14, color:T.text }}>{c.title||c.complaintID}</span>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:st2.bg, color:st2.color, border:`1px solid ${st2.border}` }}>
                            {st2.icon} {st2.label}
                          </span>
                          {c.priority && (
                            <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:pr.bg, color:pr.color }}>
                              <span style={{ width:5, height:5, borderRadius:'50%', background:pr.dot, display:'inline-block' }} />
                              {c.priority}
                            </span>
                          )}
                          {c.anonymous && <span style={{ padding:'3px 9px', background:'#f1f5f9', color:'#64748b', borderRadius:20, fontSize:11, fontWeight:700 }}>🔒 Anon</span>}
                          {Array.isArray(c.proof)&&c.proof.length>0 && (
                            <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 9px', background:'#f0fdf4', color:'#15803d', borderRadius:20, fontSize:11, fontWeight:700, border:'1px solid #bbf7d0' }}>
                              <Paperclip size={9}/> {c.proof.length} proof
                            </span>
                          )}
                        </div>
                        <div style={{ display:'flex', gap:14, fontSize:11, color:T.textMuted }}>
                          <span>📁 {c.category}</span>
                          <span>📅 {new Date(c.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
                          {(c.grievanceID || c.complaintID) && <span style={{ fontFamily:'monospace', background:'#f8fafc', padding:'1px 7px', borderRadius:5, border:`1px solid ${T.border}`, fontSize:10 }}>{c.grievanceID || c.complaintID}</span>}
                          {c.assignedToName && <span>👤 {c.assignedToName}</span>}
                          {c.deadline && <span style={{ color: new Date(c.deadline) < new Date() && !['resolved','Resolved','rejected','Rejected'].includes(c.status) ? '#dc2626' : T.textMuted }}>⏰ {new Date(c.deadline).toLocaleDateString('en-IN')}</span>}
                          {c.escalationLevel > 0 && <span style={{ color:'#b45309' }}>⬆ Escalated</span>}
                        </div>
                        {!open && <div style={{ fontSize:12, color:T.textSub, marginTop:7, lineHeight:1.6 }}>{c.description?.slice(0,110)}{c.description?.length>110?'...':''}</div>}
                      </div>
                      <div style={{ color:T.textMuted, flexShrink:0, marginTop:2 }}>{open?<ChevronUp size={17}/>:<ChevronDown size={17}/>}</div>
                    </div>

                    {open && (
                      <div style={{ marginTop:18, paddingTop:18, borderTop:`1px solid ${T.border}` }}>
                        <p style={{ fontSize:13, color:T.textSub, lineHeight:1.8, marginBottom:20 }}>{c.description}</p>

                        {Array.isArray(c.proof)&&c.proof.length>0 && (
                          <div style={{ marginBottom:20 }}>
                            <div style={{ fontSize:11, fontWeight:700, color:T.textSub, marginBottom:10, textTransform:'uppercase', letterSpacing:'0.5px' }}>📎 Attached Proof</div>
                            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                              {c.proof.map((f,i)=>(
                                f.type?.startsWith('image/') ? (
                                  <img key={i} src={f.data} alt={f.name} style={{ width:78, height:78, objectFit:'cover', borderRadius:10, border:`1.5px solid ${T.border}`, cursor:'pointer' }} onClick={e=>{e.stopPropagation();window.open(f.data)}} />
                                ) : (
                                  <a key={i} href={f.data} download={f.name} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}
                                    style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 14px', background:'#f8fafc', border:`1.5px solid ${T.border}`, borderRadius:10, textDecoration:'none', color:T.text, fontSize:12, fontWeight:600 }}>
                                    📄 {f.name}
                                  </a>
                                )
                              ))}
                            </div>
                          </div>
                        )}

                        <div style={{ fontSize:11, fontWeight:700, color:T.textSub, marginBottom:14, textTransform:'uppercase', letterSpacing:'0.5px' }}>Status Timeline</div>
                        <div style={{ display:'flex', alignItems:'flex-start', marginBottom:20 }}>
                          {['Pending','In Progress','Resolved'].map((s,i)=>{
                            const ord={pending:0,Pending:0,reviewing:1,'In Progress':1,resolved:2,Resolved:2,rejected:2,Rejected:2}
                            const cur=ord[c.status]??0; const done=i<=cur
                            const COLS=['#b45309','#1d4ed8','#15803d']
                            return (
                              <div key={s} style={{ display:'flex', alignItems:'center', flex:1 }}>
                                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flex:1 }}>
                                  <div style={{ width:32, height:32, borderRadius:'50%', background:done?COLS[i]:'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', color:done?'#fff':'#94a3b8', fontSize:12, fontWeight:800, marginBottom:6, boxShadow:done?`0 0 0 4px ${COLS[i]}25`:'none', transition:'all 0.3s' }}>
                                    {done?'✓':i+1}
                                  </div>
                                  <div style={{ fontSize:10, color:done?COLS[i]:T.textMuted, fontWeight:done?700:500, textAlign:'center' }}>{s}</div>
                                </div>
                                {i<2 && <div style={{ height:2, flex:1, background:i<cur?COLS[i]:'#e2e8f0', margin:'0 4px', marginBottom:18, borderRadius:2 }} />}
                              </div>
                            )
                          })}
                        </div>

                        {c.adminReply && (
                          <div style={{ padding:'16px 20px', background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', borderRadius:14, border:'1.5px solid #6ee7b7' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                              <div style={{ width:28, height:28, background:'#dcfce7', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <Shield size={14} color="#15803d"/>
                              </div>
                              <span style={{ fontSize:13, fontWeight:700, color:'#065f46' }}>Admin Response</span>
                              {c.repliedAt && <span style={{ fontSize:11, color:T.textMuted, marginLeft:'auto' }}>{new Date(c.repliedAt).toLocaleDateString('en-IN')}</span>}
                            </div>
                            <p style={{ fontSize:13, color:'#166534', lineHeight:1.75, margin:0 }}>{c.adminReply}</p>
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

        {/* Floating Emergency */}
        <button onClick={()=>setShowEmg(true)} className="g-btn emg-pulse"
          style={{ position:'fixed', bottom:28, right:28, zIndex:9999, display:'flex', alignItems:'center', gap:8, padding:'13px 22px', background:'linear-gradient(135deg,#dc2626,#991b1b)', color:'#fff', border:'none', borderRadius:50, fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
          🚨 Emergency
        </button>

      </div>
    </>
  )
}