import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Bell, TrendingUp, Shield, MessageSquare, MapPin, Star, BookOpen, Mail, Hash, GraduationCap, BookMarked, Users, Quote, FileWarning, UserCircle, Sun, CloudSun, Sunset, Moon, Clock, CheckCircle, XCircle, X } from 'lucide-react'
import { apiJson } from '../lib/api'

const QUOTES = [
  { text: "Success is the sum of small efforts, repeated day in and day out." },
  { text: "The secret of getting ahead is getting started." },
  { text: "Don't watch the clock; do what it does — keep going." },
  { text: "Believe you can and you're halfway there." },
  { text: "Push yourself, because no one else is going to do it for you." },
  { text: "Great things never come from comfort zones." },
  { text: "Little progress each day adds up to big results." },
  { text: "Education is the most powerful weapon to change the world." },
  { text: "Stay focused and never give up on your goals." },
  { text: "Dream big, work hard, stay humble." },
]

const ROLE_CONFIG = {
  student: { label: 'Student',              color: '#0A3A6A', bg: '#eff6ff' },
  cr:      { label: 'Class Representative', color: '#16a34a', bg: '#dcfce7' },
  vendor:  { label: 'Vendor',               color: '#B10428', bg: '#fff1f2' },
  admin:   { label: 'Admin',                color: '#9333ea', bg: '#f5f3ff' },
  faculty: { label: 'Faculty',              color: '#0f766e', bg: '#f0fdfa' },
}

const T = {
  primary: '#0A3A6A', accent: '#B10428', accentLight: '#fff1f2',
  border: '#e2e8f0', text: '#0f172a', textSub: '#475569', textMuted: '#94a3b8',
  card: '#ffffff', bg: '#f8fafc',
}

const css = `
  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes fadeUp  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeOut { from { opacity:1; transform:translateY(0); } to { opacity:0; transform:translateY(-6px); } }
  @keyframes pulse   { 0%,100%{opacity:1; transform:scale(1);} 50%{opacity:0.6; transform:scale(0.85);} }
  @keyframes floatUp { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-4px);} }

  .dash-root    { animation: fadeUp 0.35s ease; }
  .stat-card    { transition: all 0.22s ease; }
  .stat-card:hover { transform: translateY(-4px); box-shadow: 0 14px 36px rgba(0,0,0,0.08) !important; }
  .action-btn   { transition: all 0.2s ease; cursor: pointer; font-family: inherit; }
  .action-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  .quote-enter  { animation: fadeIn 0.5s ease forwards; }
  .quote-exit   { animation: fadeOut 0.4s ease forwards; }
  .dot-pulse    { animation: pulse 2.2s ease-in-out infinite; }
  .quote-float  { animation: floatUp 4s ease-in-out infinite; }
  .profile-card { animation: fadeUp 0.4s ease 0.1s both; }

  .profile-grid { display: grid; grid-template-columns: 1fr; gap: 16px; align-items: stretch; }
  @media (min-width: 768px) { .profile-grid { grid-template-columns: 1fr 230px; } }

  .chart-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
  @media (min-width: 768px) { .chart-grid { grid-template-columns: 1.5fr 1fr; } }

  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; }

  .actions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
`

function DetailsModal({ isOpen, onClose, title, data }) {
  if (!isOpen) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', animation: 'fadeUp 0.3s ease-out' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderRadius: '16px 16px 0 0' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{title} <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b', marginLeft: '8px' }}>({data?.length || 0})</span></h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}><X size={18} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {!data || data.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>No records found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.map((item, idx) => (
                <div key={item._id || idx} style={{ padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9', background: '#fff', fontSize: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.title || item.subject || item.category || 'Issue'}</div>
                    <span style={{ fontSize: '12px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: item.status === 'Resolved' ? '#dcfce7' : item.status === 'Rejected' ? '#fee2e2' : '#fef3c7', color: item.status === 'Resolved' ? '#16a34a' : item.status === 'Rejected' ? '#dc2626' : '#d97706' }}>
                      {item.status}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 8px 0', color: '#475569', fontSize: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</p>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#94a3b8' }}>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard({ user, onNavigate }) {
  const [announcements, setAnnouncements] = useState([])
  const [monthlyData, setMonthlyData]     = useState([])
  const [stats, setStats]                 = useState({ total: 0, pending: 0, resolved: 0, rejected: 0, g: [] })
  const [modalState, setModalState]       = useState({ isOpen: false, title: '', data: [] })
  const [loading, setLoading]             = useState(true)
  const [time, setTime]                   = useState(new Date())
  const [quoteIdx, setQuoteIdx]           = useState(0)
  const [quoteVisible, setQuoteVisible]   = useState(true)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => {
      setQuoteVisible(false)
      setTimeout(() => {
        setQuoteIdx(i => (i + 1) % QUOTES.length)
        setQuoteVisible(true)
      }, 450)
    }, 6000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const grievUrl = '/grievances/user/' + encodeURIComponent(user?.email || '')
        const [griev, comp, ann] = await Promise.allSettled([
          user?.email ? apiJson(grievUrl) : Promise.resolve([]),
          user?.role === 'student' ? Promise.resolve([]) : apiJson('/complaints'),
          apiJson('/announcements'),
        ])

        const g = griev.status === 'fulfilled' && Array.isArray(griev.value) ? griev.value : []
        const c = comp.status === 'fulfilled' && Array.isArray(comp.value) ? comp.value : []
        const a = ann.status  === 'fulfilled' && Array.isArray(ann.value)  ? ann.value  : []

        setStats({
           total: g.length,
           pending: g.filter(x => x.status === 'Pending').length,
           resolved: g.filter(x => x.status === 'Resolved').length,
           rejected: g.filter(x => x.status === 'Rejected').length,
           g: g
        })

        setAnnouncements(a.slice(0, 5))
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
        setMonthlyData(months.slice(0, new Date().getMonth() + 1).map((month, i) => ({
          month, count: c.filter(x => new Date(x.createdAt).getMonth() === i).length
        })))
      } catch(e) { console.log(e) }
      setLoading(false)
    }
    fetchAll()
  }, [user])

  const hour       = time.getHours()
  const greeting   = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : hour < 20 ? 'Good Evening' : 'Good Night'
  const GreetIcon   = hour < 12 ? Sun : hour < 17 ? CloudSun : hour < 20 ? Sunset : Moon
  const timeStr    = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  const roleInfo      = ROLE_CONFIG[user?.role] || ROLE_CONFIG.student
  const initials      = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'
  const isStudentOrCR = user?.role === 'student' || user?.role === 'cr'
  const currentQuote  = QUOTES[quoteIdx]

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ width: 36, height: 36, border: '3px solid #eff6ff', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  const cardBorder = '1.5px solid ' + T.border
  const chartBorder = '1px solid ' + T.border

  return (
    <>
      <style>{css}</style>
      <DetailsModal isOpen={modalState.isOpen} onClose={() => setModalState({ ...modalState, isOpen: false })} title={modalState.title} data={modalState.data} />
      <div className="dash-root" style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: "'Plus Jakarta Sans', Segoe UI, sans-serif" }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #0A3A6A 55%, #B10428 100%)', borderRadius: 20, padding: '26px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 8px 32px rgba(177,4,40,0.2)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', top: -70, right: 140, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', bottom: -50, right: 50, pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 6, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}><GreetIcon size={14} /> {greeting}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Welcome, {user?.name?.split(' ')[0]}!</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)' }}>
              <div className="dot-pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>KR Mangalam University</span>
            </div>
          </div>
          <div style={{ textAlign: 'right', position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 38, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-1px' }}>{timeStr}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
              {time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
            </div>
          </div>
        </div>

        {/* Profile Card + Quote Card */}
        <div className="profile-grid">
          <div className="profile-card" style={{ background: T.card, borderRadius: 18, border: cardBorder, boxShadow: '0 2px 16px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ height: 5, background: 'linear-gradient(90deg, #0A3A6A, #B10428)' }} />
            <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #0A3A6A, #B10428)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 16px rgba(177,4,40,0.25)' }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{initials}</span>
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 17, fontWeight: 800, color: T.text }}>{user?.name}</span>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: roleInfo.bg, color: roleInfo.color }}>{roleInfo.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.textMuted }}>
                  <Mail size={12} /> {user?.email}
                </div>
              </div>
              <div style={{ width: 1, height: 52, background: T.border, flexShrink: 0 }} />
              {isStudentOrCR && (
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  {user?.enrollmentNumber && <InfoChip icon={Hash}         color="#2563eb" bg="#eff6ff" label="Enrollment" value={user.enrollmentNumber} />}
                  {user?.course          && <InfoChip icon={GraduationCap} color="#7c3aed" bg="#f5f3ff" label="Course"     value={user.course + (user?.branch ? ' — ' + user.branch : '')} />}
                  {user?.semester        && <InfoChip icon={BookMarked}    color="#0f766e" bg="#f0fdfa" label="Semester"   value={'Sem ' + user.semester} />}
                  {user?.section         && <InfoChip icon={Users}         color="#be185d" bg="#fdf2f8" label="Section"    value={'Sec ' + user.section} />}
                </div>
              )}
              {user?.role === 'vendor' && user?.shop && (
                <InfoChip icon={Star} color="#f97316" bg="#fff7ed" label="Shop" value={user.shop} />
              )}
            </div>
          </div>

          {/* Quote Card */}
          <div style={{ background: 'linear-gradient(145deg, #0f172a 0%, #0A3A6A 50%, #B10428 100%)', borderRadius: 18, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 24px rgba(177,4,40,0.22)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', top: -30, right: -20, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: 10, left: -15, pointerEvents: 'none' }} />
            <div className="quote-float" style={{ width: 34, height: 34, background: 'rgba(255,255,255,0.14)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, position: 'relative', zIndex: 1 }}>
              <Quote size={16} color="#fff" />
            </div>
            <div className={quoteVisible ? 'quote-enter' : 'quote-exit'} style={{ flex: 1, position: 'relative', zIndex: 1 }}>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.9)', lineHeight: 1.7, fontStyle: 'italic', fontWeight: 500 }}>"{currentQuote.text}"</p>
            </div>
            <div style={{ display: 'flex', gap: 5, marginTop: 16, position: 'relative', zIndex: 1 }}>
              {QUOTES.map((_, i) => (
                <div key={i}
                  onClick={() => { setQuoteVisible(false); setTimeout(() => { setQuoteIdx(i); setQuoteVisible(true) }, 300) }}
                  style={{ width: i === quoteIdx ? 20 : 6, height: 6, borderRadius: 3, background: i === quoteIdx ? '#fff' : 'rgba(255,255,255,0.25)', transition: 'all 0.35s ease', cursor: 'pointer' }} />
              ))}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="stats-grid">
          <StatCard icon={Shield} label="Total Issues" value={stats.total} iconBg="linear-gradient(135deg, #3b82f6, #1d4ed8)" iconColor="#fff" onClick={() => setModalState({ isOpen: true, title: 'All Issues', data: stats.g })} />
          <StatCard icon={Clock} label="Pending" value={stats.pending} iconBg="#fffbeb" iconColor="#d97706" onClick={() => setModalState({ isOpen: true, title: 'Pending Issues', data: stats.g.filter(x => x.status === 'Pending') })} />
          <StatCard icon={CheckCircle} label="Resolved" value={stats.resolved} iconBg="#f0fdf4" iconColor="#16a34a" onClick={() => setModalState({ isOpen: true, title: 'Resolved Issues', data: stats.g.filter(x => x.status === 'Resolved') })} />
          <StatCard icon={XCircle} label="Rejected" value={stats.rejected} iconBg="#fef2f2" iconColor="#dc2626" onClick={() => setModalState({ isOpen: true, title: 'Rejected Issues', data: stats.g.filter(x => x.status === 'Rejected') })} />
        </div>

        {/* Chart + Announcements */}
        <div className="chart-grid">
          <div style={{ background: T.card, borderRadius: 16, padding: '22px 24px', border: chartBorder, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 32, height: 32, background: '#eff6ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={16} color="#2563eb" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Complaints This Year</div>
                <div style={{ fontSize: 11, color: T.textMuted }}>Monthly overview</div>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={monthlyData} barSize={20}>
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#0A3A6A" radius={[5,5,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: T.card, borderRadius: 16, padding: '22px 24px', border: chartBorder, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, background: '#fff1f2', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={16} color="#B10428" />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Latest Notices</div>
            </div>
            {announcements.length === 0 ? (
              <div style={{ textAlign: 'center', color: T.textMuted, fontSize: 13, padding: '20px 0' }}>No announcements yet</div>
            ) : announcements.map((a, i) => (
              <div key={a._id} style={{ display: 'flex', gap: 12, paddingBottom: 12, marginBottom: 12, borderBottom: i < announcements.length - 1 ? '1px solid ' + T.border : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0A3A6A', marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text, lineHeight: 1.4 }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>
                    {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Row */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 12 }}>Quick Actions</div>
          <div className="actions-grid">
            <ActionBtn icon={FileWarning} label="File Complaint" bg="#eff6ff" color="#2563eb" onClick={() => onNavigate && onNavigate('complaints')} />
            <ActionBtn icon={MessageSquare} label="Give Feedback" bg="#fff1f2" color="#be123c" onClick={() => onNavigate && onNavigate('feedbacks')} />
            <ActionBtn icon={MapPin} label="Report Lost Item" bg="#fdf2f8" color="#be185d" onClick={() => onNavigate && onNavigate('lost-items')} />
          </div>
        </div>

      </div>
    </>
  )
}

function StatCard({ icon: Icon, label, value, iconBg, iconColor, onClick }) {
  return (
    <div className="stat-card" onClick={onClick} style={{ background: '#ffffff', borderRadius: 16, padding: '20px', border: '1.5px solid #e2e8f0', cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor }}>
          <Icon size={20} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#475569' }}>{label}</div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>{value}</div>
    </div>
  )
}

function ActionBtn({ icon: Icon, label, bg, color, onClick }) {
  return (
    <button className="action-btn" onClick={onClick} style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '14px', display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', color: '#0f172a', fontWeight: 600, fontSize: 13 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}><Icon size={14} /></div>
      {label}
    </button>
  )
}

function InfoChip({ icon: Icon, color, bg, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <div style={{ width: 30, height: 30, background: bg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={13} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginTop: 1 }}>{value}</div>
      </div>
    </div>
  )
}