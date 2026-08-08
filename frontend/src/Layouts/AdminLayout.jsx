import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, AlertTriangle, MessageSquare, Search, Star, ShoppingBag, BookOpen,
  Menu, LogOut, Shield, Megaphone, FileWarning, Users, BarChart3, FileText,
  Activity, Radio, Lock, UserCog, MessagesSquare, X, GraduationCap,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useRoutePage } from '../hooks/useRoutePage'
import NotificationBell from '../components/admin/NotificationBell'
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminUsers from '../pages/admin/AdminUsers'
import AdminAnalytics from '../pages/admin/AdminAnalytics'
import AdminReports from '../pages/admin/AdminReports'
import AdminMonitoring from '../pages/admin/AdminMonitoring'
import AdminCommunication from '../pages/admin/AdminCommunication'
import AdminSecurity from '../pages/admin/AdminSecurity'
import AdminCRManagement from '../pages/admin/AdminCRManagement'
import AdminChat from '../pages/admin/AdminChat'
import Complaints from '../pages/complaints'
import Feedbacks from '../pages/Feedbacks'
import LostItems from '../pages/LostItems'
import Ratings from '../pages/Ratings'
import Vendors from '../pages/Vendors'
import SkillResources from '../pages/SkillResources'
import Announcements from '../pages/Announcements'
import AdminGrievance from '../pages/AdminGrievance'

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
      { id: 'analytics',   label: 'Analytics',   icon: BarChart3 },
      { id: 'monitoring',  label: 'Monitoring',  icon: Activity },
    ],
  },
  {
    label: 'Management',
    items: [
      { id: 'users',          label: 'User Management', icon: Users },
      { id: 'cr-management',  label: 'CR Management',   icon: UserCog, badge: 'NEW' },
      { id: 'complaints',     label: 'Complaints',      icon: AlertTriangle },
      { id: 'vendors',        label: 'Vendors',         icon: ShoppingBag },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'announcements',   label: 'Announcements',  icon: Megaphone },
      { id: 'communication',   label: 'Communication',  icon: Radio },
      { id: 'admin-chat',      label: 'Admin Chat',     icon: MessagesSquare, badge: 'NEW' },
      { id: 'feedbacks',       label: 'Feedbacks',      icon: MessageSquare },
      { id: 'lost-items',      label: 'Lost & Found',   icon: Search },
      { id: 'ratings',         label: 'Ratings',        icon: Star },
      { id: 'skill-resources', label: 'Skill Resources',icon: BookOpen },
    ],
  },
  {
    label: 'Administration',
    items: [
      { id: 'reports',  label: 'Reports',         icon: FileText },
      { id: 'security', label: 'Security & Audit', icon: Lock },
    ],
  },
]

const NAV_IDS = NAV_SECTIONS.flatMap(s => s.items.map(i => i.id))

const PAGES = {
  dashboard:        AdminDashboard,
  analytics:        AdminAnalytics,
  monitoring:       AdminMonitoring,
  users:            AdminUsers,
  'cr-management':  AdminCRManagement,
  grievances:       AdminGrievance,
  complaints:       Complaints,
  vendors:          Vendors,
  announcements:    Announcements,
  communication:    AdminCommunication,
  'admin-chat':     AdminChat,
  feedbacks:        Feedbacks,
  'lost-items':     LostItems,
  ratings:          Ratings,
  'skill-resources':SkillResources,
  reports:          AdminReports,
  security:         AdminSecurity,
}

/* ─── Brand Sidebar Gradient (matches landing page) ─── */
const SIDEBAR_BG = 'linear-gradient(170deg, #0f172a 0%, #0A3A6A 55%, #B10428 100%)'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigateRoot = useNavigate()
  const { activePage, navigateTo } = useRoutePage(NAV_IDS, 'dashboard', '/admin')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const PageComponent = PAGES[activePage] || AdminDashboard
  const activeItem = NAV_SECTIONS.flatMap(s => s.items).find(n => n.id === activePage)

  const handleLogout = async () => {
    await logout()
    navigateRoot('/login')
  }

  return (
    <>
      <style>{`
        .admin-sidebar-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          z-index: 40; backdrop-filter: blur(3px);
        }
        .admin-sidebar {
          position: fixed; left: 0; top: 0; height: 100vh; width: 264px;
          z-index: 50;
          transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
          background: ${SIDEBAR_BG};
          overflow-y: auto;
        }
        .admin-sidebar-open  { transform: translateX(0); }
        .admin-sidebar-closed { transform: translateX(-100%); }
        @media (min-width: 1024px) {
          .admin-sidebar-overlay { display: none !important; }
          .admin-sidebar {
            position: static;
            transform: none !important;
            flex-shrink: 0;
          }
          .admin-sidebar-close-btn { display: none !important; }
          .admin-hamburger-btn     { display: none !important; }
        }
        .admin-nav-item {
          display: flex; align-items: center; gap: 12px; width: 100%;
          padding: 10px 14px; border-radius: 12px; border: none; cursor: pointer;
          font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.65);
          background: transparent; transition: all 0.2s; text-align: left; font-family: inherit;
        }
        .admin-nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; transform: translateX(4px); }
        .admin-nav-item.active {
          background: rgba(255,255,255,0.16); color: #fff; font-weight: 700;
          border-left: 3px solid rgba(255,255,255,0.75);
        }
        .admin-section-label {
          font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.32);
          letter-spacing: 1.4px; text-transform: uppercase; padding: 10px 4px 6px; margin: 0;
        }
        .admin-sidebar::-webkit-scrollbar { width: 4px; }
        .admin-sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
        .admin-app-header {
          background: #fff;
          border-bottom: 3px solid transparent;
          border-image: linear-gradient(90deg, #0A3A6A, #B10428) 1;
        }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', background: '#f0f4f8', overflow: 'hidden' }}>
        {sidebarOpen && <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

        {/* ── Sidebar ── */}
        <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar-open' : 'admin-sidebar-closed'}`}>

          {/* Brand Header */}
          <div style={{ padding: '18px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => navigateRoot('/')}
              style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <div style={{ width: 38, height: 38, background: 'rgba(255,255,255,0.12)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.15)' }}>
                <Shield size={18} color="#fff" />
              </div>
              <div>
                <p style={{ margin: 0, color: '#fff', fontWeight: 800, fontSize: 14, letterSpacing: '-0.2px' }}>UniCampus</p>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>Admin Portal</p>
              </div>
            </button>
            <button className="admin-sidebar-close-btn" onClick={() => setSidebarOpen(false)}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex' }}>
              <X size={16} color="#fff" />
            </button>
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, padding: '8px 10px', overflowY: 'auto' }}>
            {NAV_SECTIONS.map(section => (
              <div key={section.label}>
                <p className="admin-section-label">{section.label}</p>
                {section.items.map(({ id, label, icon: Icon, badge }) => (
                  <button key={id}
                    onClick={() => { navigateTo(id); setSidebarOpen(false) }}
                    className={`admin-nav-item ${activePage === id ? 'active' : ''}`}>
                    <Icon size={17} />
                    {label}
                    {badge && (
                      <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 8 }}>{badge}</span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          {/* User + Logout */}
          <div style={{ padding: '10px 10px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #0A3A6A, #B10428)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(177,4,40,0.35)' }}>
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 800 }}>{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
                <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Administrator</p>
              </div>
              <button onClick={handleLogout}
                style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex' }} title="Logout">
                <LogOut size={14} color="rgba(255,200,200,0.85)" />
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

          {/* Header */}
          <header className="admin-app-header" style={{ padding: '0 20px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 8px rgba(10,58,106,0.08)', flexShrink: 0, zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button className="admin-hamburger-btn" onClick={() => setSidebarOpen(true)}
                style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', padding: '8px 10px', borderRadius: 10, display: 'flex', alignItems: 'center' }}>
                <Menu size={20} color="#0A3A6A" />
              </button>
              <div>
                <h1 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.2px' }}>{activeItem?.label || 'Dashboard'}</h1>
                <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>Grievance Management Portal</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <NotificationBell />
              <div onClick={() => navigateTo('dashboard')}
                style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #0A3A6A, #B10428)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(177,4,40,0.25)' }}>
                <span style={{ color: '#fff', fontSize: 14, fontWeight: 800 }}>{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
            </div>
          </header>

          <main style={{ flex: 1, overflowY: 'auto', padding: '22px 24px' }}>
            <PageComponent user={user} onNavigate={navigateTo} />
          </main>
        </div>
      </div>
    </>
  )
}
