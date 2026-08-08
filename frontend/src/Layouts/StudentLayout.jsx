import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, GraduationCap, LogOut, X, LayoutDashboard, Megaphone, MessageSquare, Search, Star, BookOpen, ClipboardList, Shield, Users, UserCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useRoutePage } from '../hooks/useRoutePage'
import { API, apiJson } from '../lib/api'
import Dashboard from '../pages/Dashboard'
import Feedbacks from '../pages/Feedbacks'
import LostItems from '../pages/LostItems'
import Ratings from '../pages/Ratings'
import SkillResources from '../pages/SkillResources'
import Announcements from '../pages/Announcements'
import Grievance from '../pages/Grievance'
import MyAccount from '../pages/MyAccount'
import StudentComplaints from '../pages/StudentComplaints'
import StudentMyCR from '../pages/StudentMyCR'
import NotificationBell from '../components/NotificationBell'

const API_BASE = API

const NAV_ITEMS = [
  { id: 'dashboard',       label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'announcements',   label: 'Announcements',icon: Megaphone },
  { id: 'feedbacks',       label: 'Give Feedback',icon: MessageSquare },
  { id: 'lost-items',      label: 'Lost & Found', icon: Search },
  { id: 'ratings',         label: 'Rate Vendors', icon: Star },
  { id: 'skill-resources', label: 'Skill Hub',    icon: BookOpen },
  { id: 'complaints',      label: 'Complaints',   icon: ClipboardList },
  { id: 'my-cr',           label: 'My CR',        icon: Users, badge: 'NEW' },
  { id: 'my-account',      label: 'My Account',   icon: UserCircle },
]

const NAV_IDS = NAV_ITEMS.map(n => n.id)

const PAGES = {
  dashboard:         Dashboard,
  announcements:     Announcements,
  feedbacks:         Feedbacks,
  'lost-items':      LostItems,
  ratings:           Ratings,
  'skill-resources': SkillResources,
  complaints:        StudentComplaints,
  'my-cr':           StudentMyCR,
  'my-account':      MyAccount,
}

/* ─── Brand Sidebar Gradient (matches landing page) ─── */
const SIDEBAR_BG = 'linear-gradient(170deg, #0f172a 0%, #0A3A6A 55%, #B10428 100%)'

export default function StudentLayout() {
  const { user, logout, updateUser } = useAuth()
  const navigateRoot = useNavigate()
  const { activePage, navigateTo } = useRoutePage(NAV_IDS, 'dashboard', '/student')
  const [sidebarOpen, setSidebarOpen]     = useState(false)
  const [showAnn, setShowAnn]             = useState(false)
  const [announcements, setAnnouncements] = useState([])
  const annRef        = useRef(null)
  const PageComponent = PAGES[activePage] || Dashboard
  const activeItem    = NAV_ITEMS.find(n => n.id === activePage)

  useEffect(() => {
    apiJson('/announcements')
      .then(data => { if (Array.isArray(data)) setAnnouncements(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    function handleClick(e) {
      if (annRef.current && !annRef.current.contains(e.target)) setShowAnn(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const navigate = (id) => { navigateTo(id); setSidebarOpen(false) }

  const handleLogout = async () => {
    await logout()
    navigateRoot('/login')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { font-family: 'Plus Jakarta Sans', sans-serif !important; }

        .sidebar-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          z-index: 40; backdrop-filter: blur(3px);
        }

        .sidebar-drawer {
          position: fixed; left: 0; top: 0; height: 100vh; width: 270px;
          z-index: 50;
          transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
          background: ${SIDEBAR_BG};
          overflow-y: auto;
        }
        .sidebar-open  { transform: translateX(0); }
        .sidebar-closed { transform: translateX(-100%); }

        @media (min-width: 1024px) {
          .sidebar-overlay { display: none !important; }
          .sidebar-drawer {
            position: static;
            transform: none !important;
            flex-shrink: 0;
          }
          .sidebar-close-btn { display: none !important; }
          .hamburger-btn     { display: none !important; }
        }

        /* Nav items — white text on dark gradient */
        .nav-item {
          display: flex; align-items: center; gap: 12px; width: 100%;
          padding: 11px 14px; border-radius: 12px; border: none; cursor: pointer;
          font-size: 13.5px; font-weight: 500; color: rgba(255,255,255,0.65);
          background: transparent; transition: all 0.2s; text-align: left;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .nav-item:hover {
          background: rgba(255,255,255,0.1); color: #fff; transform: translateX(4px);
        }
        .nav-item.active {
          background: rgba(255,255,255,0.16); color: #fff; font-weight: 700;
          border-left: 3px solid rgba(255,255,255,0.75);
        }

        /* Header accent line */
        .app-header {
          background: #fff;
          border-bottom: 3px solid transparent;
          border-image: linear-gradient(90deg, #0A3A6A, #B10428) 1;
        }

        .scrollbar-hide::-webkit-scrollbar { display: none; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .page-anim { animation: fadeIn 0.22s ease; }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', background: '#f0f4f8', overflow: 'hidden', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

        {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

        {/* ── Sidebar ── */}
        <div className={`sidebar-drawer scrollbar-hide ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>

          {/* Brand Header */}
          <div style={{ padding: '18px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => navigateRoot('/')}
              style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <div style={{ width: 38, height: 38, background: 'rgba(255,255,255,0.12)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.15)' }}>
                <GraduationCap size={20} color="#fff" />
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 14, letterSpacing: '-0.2px' }}>UniCampus</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>Student Portal</div>
              </div>
            </button>
            <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex' }}>
              <X size={16} color="#fff" />
            </button>
          </div>

          {/* User Card */}
          <div style={{ margin: '12px 12px', background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #0A3A6A, #B10428)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 16, flexShrink: 0, boxShadow: '0 2px 8px rgba(177,4,40,0.35)' }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ padding: '8px 10px', flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.32)', letterSpacing: '1.4px', textTransform: 'uppercase', padding: '8px 4px 6px' }}>Menu</div>
            {NAV_ITEMS.map(({ id, label, icon: Icon, badge }) => (
              <button key={id} onClick={() => navigate(id)}
                className={`nav-item ${activePage === id ? 'active' : ''}`}>
                <Icon size={18} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{label}</span>
                {badge && (
                  <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 8 }}>{badge}</span>
                )}
              </button>
            ))}
          </nav>

          {/* Logout */}
          <div style={{ padding: '10px 10px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button onClick={handleLogout} className="nav-item" style={{ color: 'rgba(255,200,200,0.85)' }}>
              <LogOut size={17} style={{ flexShrink: 0 }} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* ── Main Content ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

          {/* Header */}
          <header className="app-header" style={{ padding: '0 20px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 8px rgba(10,58,106,0.08)', flexShrink: 0, zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}
                style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', padding: '8px 10px', borderRadius: 10, display: 'flex', alignItems: 'center' }}>
                <Menu size={20} color="#0A3A6A" />
              </button>
              <div>
                <h1 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.2px' }}>
                  {activeItem?.label || 'Dashboard'}
                </h1>
                <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>Student Portal — {user?.name}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <NotificationBell />
              <div style={{ position: 'relative' }} ref={annRef}>
                <button onClick={() => setShowAnn(!showAnn)}
                  style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#0A3A6A' }}>
                  Notices
                  {announcements.length > 0 && (
                    <span style={{ background: '#B10428', color: '#fff', fontSize: 9, fontWeight: 800, borderRadius: 10, padding: '1px 5px' }}>
                      {announcements.length > 9 ? '9+' : announcements.length}
                    </span>
                  )}
                </button>
                {showAnn && (
                  <div style={{ position: 'absolute', right: 0, top: 48, width: 320, background: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.13)', border: '1px solid #e8ecf0', zIndex: 100, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>Announcements</span>
                      <button onClick={() => navigate('announcements')} style={{ fontSize: 12, color: '#0A3A6A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>View all</button>
                    </div>
                    <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                      {announcements.length === 0 ? (
                        <p style={{ textAlign: 'center', fontSize: 13, color: '#94a3b8', padding: '24px 0' }}>No announcements</p>
                      ) : announcements.slice(0, 5).map(a => (
                        <div key={a._id} style={{ padding: '10px 16px', borderBottom: '1px solid #f8f8f8' }}>
                          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 3 }}>{new Date(a.createdAt).toLocaleDateString('en-IN')}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{a.title}</div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{a.content?.slice(0, 80)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div onClick={() => navigate('my-account')}
                style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #0A3A6A, #B10428)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(177,4,40,0.25)' }}>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
            </div>
          </header>

          <main style={{ flex: 1, overflowY: 'auto', padding: '22px 24px' }}>
            <div className="page-anim">
              <PageComponent user={user} onNavigate={navigate} onUserUpdate={updateUser} />
            </div>
          </main>
        </div>
      </div>
    </>
  )
}