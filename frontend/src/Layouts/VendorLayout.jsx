import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, Star, Menu, LogOut, ShoppingBag, TrendingUp, AlertTriangle, Eye, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useRoutePage } from '../hooks/useRoutePage'
import { usePolling } from '../hooks/usePolling'
import { apiJson } from '../lib/api'
import NotificationBell from '../components/NotificationBell'

const ALL_RATINGS = [
  { ratingID: 'R001', studentID: 'STU001', vendorName: 'Campus Canteen', rating: 4, comments: 'Good food and reasonable prices', date: '2024-06-10' },
  { ratingID: 'R002', studentID: 'STU002', vendorName: 'Book Store', rating: 3, comments: 'Average collection, needs more technical books', date: '2024-06-09' },
  { ratingID: 'R003', studentID: 'STU003', vendorName: 'Campus Canteen', rating: 5, comments: 'Best samosas on campus!', date: '2024-06-08' },
  { ratingID: 'R004', studentID: 'STU004', vendorName: 'Stationery Shop', rating: 4, comments: 'Wide variety, slightly expensive', date: '2024-06-07' },
  { ratingID: 'R005', studentID: 'STU005', vendorName: 'Book Store', rating: 2, comments: 'Very slow service, staff not helpful', date: '2024-06-06' },
  { ratingID: 'R006', studentID: 'STU006', vendorName: 'Campus Canteen', rating: 4, comments: 'Could improve packaging', date: '2024-06-05' },
  { ratingID: 'R007', studentID: 'STU007', vendorName: 'Stationery Shop', rating: 5, comments: 'Best stationery shop on campus!', date: '2024-06-04' },
  { ratingID: 'R008', studentID: 'STU008', vendorName: 'Medical Store', rating: 4, comments: 'Always available, very helpful', date: '2024-06-03' },
]

const VENDOR_MAP = {
  'canteen': 'Campus Canteen',
  'campus canteen': 'Campus Canteen',
  'book': 'Book Store',
  'book store': 'Book Store',
  'stationery': 'Stationery Shop',
  'stationery shop': 'Stationery Shop',
  'medical': 'Medical Store',
  'medical store': 'Medical Store',
  'photocopy': 'Photocopy Center',
}

const ALL_VENDOR_NAMES = ['Campus Canteen', 'Book Store', 'Stationery Shop', 'Medical Store', 'Photocopy Center']

const NAV_ITEMS = [
  { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
  { id: 'ratings',   label: 'My Ratings',   icon: Star },
]

const NAV_IDS = NAV_ITEMS.map(n => n.id)

/* ─── Brand Sidebar Gradient (matches landing page) ─── */
const SIDEBAR_BG = 'linear-gradient(170deg, #0f172a 0%, #0A3A6A 55%, #B10428 100%)'

function StarDisplay({ value }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={13} className={s <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
      ))}
    </div>
  )
}

const BADGE_STYLES = {
  pending:      'bg-amber-100 text-amber-700',
  Pending:      'bg-amber-100 text-amber-700',
  'In Progress':'bg-blue-100 text-blue-700',
  resolved:     'bg-green-100 text-green-700',
  Resolved:     'bg-green-100 text-green-700',
  rejected:     'bg-red-100 text-red-700',
  Rejected:     'bg-red-100 text-red-700',
}

function VendorAssignedComplaints({ user }) {
  const [complaints, setComplaints] = useState([])
  const [detail, setDetail] = useState(null)
  const [progressReply, setProgressReply] = useState('')

  const fetchComplaints = async () => {
    try {
      const data = await apiJson('/complaints')
      if (Array.isArray(data)) setComplaints(data)
    } catch { /* silent */ }
  }

  useEffect(() => { fetchComplaints() }, [])
  usePolling(fetchComplaints, 10000)

  const updateStatus = async (id, status) => {
    try {
      const data = await apiJson(`/complaints/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
      setComplaints(prev => prev.map(c => c._id === id ? data : c))
      if (detail?._id === id) setDetail(data)
    } catch (err) { alert(err.message || 'Failed to update status') }
  }

  const sendProgress = async (id) => {
    if (!progressReply.trim()) return
    try {
      const data = await apiJson(`/complaints/${id}/reply`, { method: 'PATCH', body: JSON.stringify({ adminReply: progressReply }) })
      setComplaints(prev => prev.map(c => c._id === id ? data : c))
      setProgressReply('')
      if (detail?._id === id) setDetail(data)
    } catch (err) { alert(err.message || 'Failed to send update') }
  }

  if (detail) {
    return (
      <div className="card p-5 space-y-4">
        <button onClick={() => setDetail(null)} className="text-sm font-semibold" style={{ color: '#0A3A6A', background: 'none', border: 'none', cursor: 'pointer' }}>← Back to assigned complaints</button>
        <div className="flex flex-wrap gap-2">
          <span className={`badge ${BADGE_STYLES[detail.status] || 'bg-gray-100 text-gray-700'}`}>{detail.status}</span>
          {detail.escalationLevel > 0 && <span className="badge bg-amber-100 text-amber-700">Escalated L{detail.escalationLevel}</span>}
        </div>
        <h3 className="text-sm font-bold text-gray-900">{detail.title || detail.complaintID}</h3>
        <p className="text-sm text-gray-600">{detail.description}</p>
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <span>ID: {detail.complaintID}</span>
          <span>Category: {detail.category}</span>
          {detail.deadline && <span>Deadline: {new Date(detail.deadline).toLocaleDateString()}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {['In Progress', 'resolved'].map(s => (
            <button key={s} onClick={() => updateStatus(detail._id, s)} className="btn-primary capitalize">{s}</button>
          ))}
        </div>
        <div>
          <textarea className="input resize-none" rows={3} placeholder="Post progress update for student and admin..."
            value={progressReply} onChange={e => setProgressReply(e.target.value)} />
          <button onClick={() => sendProgress(detail._id)} className="btn-primary mt-2">Send Progress Update</button>
          {detail.adminReply && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg text-sm text-green-800">{detail.adminReply}</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <AlertTriangle size={16} style={{ color: '#0A3A6A' }} />
        <h3 className="text-sm font-semibold text-gray-900">Assigned Complaints ({complaints.length})</h3>
      </div>
      {complaints.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No complaints assigned yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['ID', 'Category', 'Status', 'Deadline', ''].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-400 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {complaints.map(c => (
                <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.complaintID}</td>
                  <td className="px-4 py-3 text-gray-700">{c.category}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${BADGE_STYLES[c.status] || 'bg-gray-100 text-gray-700'}`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {c.deadline ? new Date(c.deadline).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setDetail(c)} className="p-1.5 rounded-lg" style={{ background: 'rgba(10,58,106,0.07)', color: '#0A3A6A' }}>
                      <Eye size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function VendorDashboard({ user, myRatings, myVendorName }) {
  const avg = myRatings.length
    ? (myRatings.reduce((s, r) => s + r.rating, 0) / myRatings.length).toFixed(1)
    : '0.0'
  const positive = myRatings.filter(r => r.rating >= 4).length
  const positivePercent = myRatings.length ? Math.round((positive / myRatings.length) * 100) : 0

  return (
    <div className="space-y-4">
      <div>
        <h2 className="page-title">Vendor Dashboard</h2>
        <p className="text-sm text-gray-500 mt-0.5">Welcome, {user?.name}! Stats for <span className="font-semibold" style={{ color: '#0A3A6A' }}>{myVendorName}</span></p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 text-center">
          <p className="text-4xl font-bold text-amber-500">{avg}</p>
          <div className="flex justify-center my-2">
            <StarDisplay value={Math.round(parseFloat(avg))} />
          </div>
          <p className="text-sm text-gray-500">Average Rating</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-4xl font-bold" style={{ color: '#0A3A6A' }}>{myRatings.length}</p>
          <p className="text-sm text-gray-500 mt-2">Total Reviews</p>
          <p className="text-xs text-gray-400 mt-1">for {myVendorName}</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-4xl font-bold text-green-600">{positivePercent}%</p>
          <p className="text-sm text-gray-500 mt-2">Positive Feedback</p>
          <p className="text-xs text-gray-400 mt-1">ratings 4★ and above</p>
        </div>
      </div>

      {/* Rating breakdown */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp size={16} style={{ color: '#0A3A6A' }} /> Rating Breakdown
        </h3>
        {[5, 4, 3, 2, 1].map(star => {
          const count = myRatings.filter(r => r.rating === star).length
          const percent = myRatings.length ? (count / myRatings.length) * 100 : 0
          return (
            <div key={star} className="flex items-center gap-3 mb-2">
              <span className="text-xs text-gray-500 w-4">{star}★</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div className="h-2 rounded-full transition-all" style={{ width: `${percent}%`, background: 'linear-gradient(90deg, #0A3A6A, #B10428)' }} />
              </div>
              <span className="text-xs text-gray-400 w-6">{count}</span>
            </div>
          )
        })}
      </div>

      <VendorAssignedComplaints user={user} />

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Reviews</h3>
        {myRatings.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No reviews yet for {myVendorName}</p>
        )}
        {myRatings.slice(0, 5).map((r) => (
          <div key={r.ratingID} className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(10,58,106,0.08)' }}>
              <span className="text-xs font-semibold" style={{ color: '#0A3A6A' }}>{r.studentID.slice(-2)}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <StarDisplay value={r.rating} />
                <span className="text-xs text-gray-400">{r.date}</span>
              </div>
              <p className="text-sm text-gray-700 mt-1">{r.comments}</p>
              <p className="text-xs text-gray-400 mt-1">{r.studentID}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function VendorRatings({ myRatings, myVendorName }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="page-title">My Ratings</h2>
        <p className="text-sm text-gray-500 mt-0.5">{myRatings.length} reviews for <span className="font-semibold" style={{ color: '#0A3A6A' }}>{myVendorName}</span></p>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['ID', 'Rating', 'Comments', 'Student', 'Date'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-400 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {myRatings.map(r => (
                <tr key={r.ratingID} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.ratingID}</td>
                  <td className="px-4 py-3"><StarDisplay value={r.rating} /></td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{r.comments}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{r.studentID}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{r.date}</td>
                </tr>
              ))}
              {myRatings.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">No ratings yet for {myVendorName}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function VendorLayout() {
  const { user, logout } = useAuth()
  const navigateRoot = useNavigate()
  const { activePage, navigateTo } = useRoutePage(NAV_IDS, 'dashboard', '/vendor')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigateRoot('/login')
  }

  const nameLower = user?.name?.toLowerCase() || ''
  const myVendorName =
    Object.entries(VENDOR_MAP).find(([key]) => nameLower.includes(key))?.[1]
    || ALL_VENDOR_NAMES[0]

  const myRatings = ALL_RATINGS.filter(r => r.vendorName === myVendorName)
  const activeItem = NAV_ITEMS.find(n => n.id === activePage)
  const avg = myRatings.length
    ? (myRatings.reduce((s, r) => s + r.rating, 0) / myRatings.length).toFixed(1)
    : '0.0'

  return (
    <>
      <style>{`
        .vendor-sidebar-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          z-index: 40; backdrop-filter: blur(3px);
        }
        .vendor-sidebar {
          position: fixed; left: 0; top: 0; height: 100vh; width: 260px;
          z-index: 50;
          transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
          background: ${SIDEBAR_BG};
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .vendor-sidebar-open  { transform: translateX(0); }
        .vendor-sidebar-closed { transform: translateX(-100%); }
        @media (min-width: 1024px) {
          .vendor-sidebar-overlay { display: none !important; }
          .vendor-sidebar {
            position: static;
            transform: none !important;
            flex-shrink: 0;
          }
          .vendor-sidebar-close-btn { display: none !important; }
          .vendor-hamburger-btn     { display: none !important; }
        }
        .vendor-nav-item {
          display: flex; align-items: center; gap: 12px; width: 100%;
          padding: 11px 14px; border-radius: 12px; border: none; cursor: pointer;
          font-size: 13.5px; font-weight: 500; color: rgba(255,255,255,0.65);
          background: transparent; transition: all 0.2s; text-align: left; font-family: inherit;
        }
        .vendor-nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; transform: translateX(4px); }
        .vendor-nav-item.active {
          background: rgba(255,255,255,0.16); color: #fff; font-weight: 700;
          border-left: 3px solid rgba(255,255,255,0.75);
        }
        .vendor-app-header {
          background: #fff;
          border-bottom: 3px solid transparent;
          border-image: linear-gradient(90deg, #0A3A6A, #B10428) 1;
        }
      `}</style>

      <div className="flex h-screen overflow-hidden" style={{ background: '#f0f4f8' }}>
        {sidebarOpen && <div className="vendor-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

        {/* ── Sidebar ── */}
        <aside className={`vendor-sidebar ${sidebarOpen ? 'vendor-sidebar-open' : 'vendor-sidebar-closed'}`}>

          {/* Brand Header */}
          <div style={{ padding: '18px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
            <button onClick={() => navigateRoot('/')}
              style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <div style={{ width: 38, height: 38, background: 'rgba(255,255,255,0.12)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.15)' }}>
                <ShoppingBag size={18} color="#fff" />
              </div>
              <div>
                <p style={{ margin: 0, color: '#fff', fontWeight: 800, fontSize: 14, letterSpacing: '-0.2px' }}>UniCampus</p>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>Vendor Portal</p>
              </div>
            </button>
            <button className="vendor-sidebar-close-btn" onClick={() => setSidebarOpen(false)}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex' }}>
              <X size={16} color="#fff" />
            </button>
          </div>

          {/* Vendor Info Card */}
          <div style={{ margin: '12px 12px', background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #0A3A6A, #B10428)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(177,4,40,0.35)' }}>
                <span style={{ color: '#fff', fontSize: 15, fontWeight: 800 }}>{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</p>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{myVendorName}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Star size={10} className="text-amber-400 fill-amber-400" />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{avg} avg rating</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, padding: '8px 10px', overflowY: 'auto' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.32)', letterSpacing: '1.4px', textTransform: 'uppercase', padding: '8px 4px 6px' }}>Vendor Menu</div>
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button key={id}
                onClick={() => { navigateTo(id); setSidebarOpen(false) }}
                className={`vendor-nav-item ${activePage === id ? 'active' : ''}`}>
                <Icon size={17} />
                {label}
              </button>
            ))}
          </nav>

          {/* Logout */}
          <div style={{ padding: '10px 10px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
            <button onClick={handleLogout} className="vendor-nav-item" style={{ color: 'rgba(255,200,200,0.85)' }}>
              <LogOut size={17} />
              Logout
            </button>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Header */}
          <header className="vendor-app-header" style={{ padding: '0 20px', height: 62, display: 'flex', alignItems: 'center', boxShadow: '0 1px 8px rgba(10,58,106,0.08)', flexShrink: 0, zIndex: 10 }}>
            <button className="vendor-hamburger-btn" onClick={() => setSidebarOpen(true)}
              style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', padding: '8px 10px', borderRadius: 10, display: 'flex', alignItems: 'center', marginRight: 14 }}>
              <Menu size={20} color="#0A3A6A" />
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.2px' }}>{activeItem?.label || 'Dashboard'}</h1>
              <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{myVendorName}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <NotificationBell />
              <div onClick={() => navigateTo('dashboard')}
                style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #0A3A6A, #B10428)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(177,4,40,0.25)' }}>
                <span style={{ color: '#fff', fontSize: 14, fontWeight: 800 }}>{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {activePage === 'ratings'
              ? <VendorRatings myRatings={myRatings} myVendorName={myVendorName} />
              : <VendorDashboard user={user} myRatings={myRatings} myVendorName={myVendorName} />
            }
          </main>
        </div>
      </div>
    </>
  )
}