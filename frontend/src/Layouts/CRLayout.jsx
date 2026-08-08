import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, AlertTriangle, Menu, LogOut, Users, Megaphone, Shield, MessageSquare, X, GraduationCap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useRoutePage } from '../hooks/useRoutePage'
import Dashboard from '../pages/Dashboard'
import Complaints from '../pages/Complaints'
import Announcements from '../pages/Announcements'
import CRGrievances from '../pages/CRGrievances'
import CRClassHub from '../pages/CRClassHub'
import CRAdminChat from '../pages/CRAdminChat'
import NotificationBell from '../components/NotificationBell'

const NAV_ITEMS = [
  { id: 'dashboard',     label: 'Dashboard',         icon: LayoutDashboard },
  { id: 'complaints',    label: 'Class Complaints',  icon: AlertTriangle },
  { id: 'class-hub',     label: 'Class Management',  icon: Users },
  { id: 'announcements', label: 'Class Notices',     icon: Megaphone },
  { id: 'admin-chat',    label: 'Admin Chat',        icon: MessageSquare },
]

const NAV_IDS = NAV_ITEMS.map(n => n.id)

const PAGES = {
  dashboard:     Dashboard,
  announcements: Announcements,
  complaints:    Complaints,
  'class-hub':   CRClassHub,
  'admin-chat':  CRAdminChat,
}

/* ─── Brand Sidebar Gradient (matches landing page) ─── */
const SIDEBAR_BG = 'linear-gradient(170deg, #0f172a 0%, #0A3A6A 55%, #B10428 100%)'

export default function CRLayout() {
  const { user, logout, updateUser } = useAuth()
  const navigateRoot = useNavigate()
  const { activePage, navigateTo } = useRoutePage(NAV_IDS, 'dashboard', '/cr')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const PageComponent = PAGES[activePage] || Dashboard
  const activeItem = NAV_ITEMS.find(n => n.id === activePage)

  const handleLogout = async () => {
    await logout()
    navigateRoot('/login')
  }

  return (
    <>
      <style>{`
        .cr-sidebar-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          z-index: 40; backdrop-filter: blur(3px);
        }
        .cr-sidebar {
          position: fixed; left: 0; top: 0; height: 100vh; width: 260px;
          z-index: 50;
          transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
          background: ${SIDEBAR_BG};
          overflow-y: auto;
        }
        .cr-sidebar-open  { transform: translateX(0); }
        .cr-sidebar-closed { transform: translateX(-100%); }
        @media (min-width: 1024px) {
          .cr-sidebar-overlay { display: none !important; }
          .cr-sidebar {
            position: static;
            transform: none !important;
            flex-shrink: 0;
          }
          .cr-sidebar-close-btn { display: none !important; }
          .cr-hamburger-btn     { display: none !important; }
        }
        .cr-nav-item {
          display: flex; align-items: center; gap: 12px; width: 100%;
          padding: 11px 14px; border-radius: 12px; border: none; cursor: pointer;
          font-size: 13.5px; font-weight: 500; color: rgba(255,255,255,0.65);
          background: transparent; transition: all 0.2s; text-align: left; font-family: inherit;
        }
        .cr-nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; transform: translateX(4px); }
        .cr-nav-item.active {
          background: rgba(255,255,255,0.16); color: #fff; font-weight: 700;
          border-left: 3px solid rgba(255,255,255,0.75);
        }
        .cr-app-header {
          background: #fff;
          border-bottom: 3px solid transparent;
          border-image: linear-gradient(90deg, #0A3A6A, #B10428) 1;
        }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', background: '#f0f4f8', overflow: 'hidden' }}>
        {sidebarOpen && <div className="cr-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

        {/* ── Sidebar ── */}
        <div className={`cr-sidebar ${sidebarOpen ? 'cr-sidebar-open' : 'cr-sidebar-closed'}`}>

          {/* Brand Header */}
          <div style={{ padding: '18px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => navigateRoot('/')}
              style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <div style={{ width: 38, height: 38, background: 'rgba(255,255,255,0.12)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.15)' }}>
                <GraduationCap size={20} color="#fff" />
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 14, letterSpacing: '-0.2px' }}>UniCampus</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>CR Portal</div>
              </div>
            </button>
            <button className="cr-sidebar-close-btn" onClick={() => setSidebarOpen(false)}
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
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.course} Y{user?.semester} · Sec {user?.section}</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ padding: '8px 10px', flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.32)', letterSpacing: '1.4px', textTransform: 'uppercase', padding: '8px 4px 6px' }}>CR Menu</div>
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button key={id}
                onClick={() => { navigateTo(id); setSidebarOpen(false) }}
                className={`cr-nav-item ${activePage === id ? 'active' : ''}`}>
                <Icon size={17} />
                {label}
                {id === 'admin-chat' && (
                  <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 8 }}>NEW</span>
                )}
              </button>
            ))}
          </nav>

          {/* Logout */}
          <div style={{ padding: '10px 10px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button onClick={handleLogout} className="cr-nav-item" style={{ color: 'rgba(255,200,200,0.85)' }}>
              <LogOut size={17} style={{ flexShrink: 0 }} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* ── Main Content ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

          {/* Header */}
          <header className="cr-app-header" style={{ padding: '0 20px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 8px rgba(10,58,106,0.08)', flexShrink: 0, zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button className="cr-hamburger-btn" onClick={() => setSidebarOpen(true)}
                style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', padding: '8px 10px', borderRadius: 10, display: 'flex', alignItems: 'center' }}>
                <Menu size={20} color="#0A3A6A" />
              </button>
              <div>
                <h1 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.2px' }}>
                  {activeItem?.label || 'Dashboard'}
                </h1>
                <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>Class Representative Portal</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <NotificationBell />
              <div onClick={() => navigateTo('dashboard')}
                style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #0A3A6A, #B10428)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(177,4,40,0.25)' }}>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
            </div>
          </header>

          <main style={{ flex: 1, overflowY: 'auto', padding: '22px 24px' }}>
            <PageComponent user={user} onNavigate={navigateTo} onUserUpdate={updateUser} />
          </main>
        </div>
      </div>
    </>
  )
}