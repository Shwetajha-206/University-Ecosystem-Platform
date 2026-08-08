import {
  LayoutDashboard, AlertTriangle, MessageSquare,
  Search, Star, ShoppingBag, BookOpen,
  Bell, Menu, GraduationCap, LogOut
} from 'lucide-react'
import { useState } from 'react'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'complaints', label: 'Complaints', icon: AlertTriangle },
  { id: 'feedbacks', label: 'Feedbacks', icon: MessageSquare },
  { id: 'lost-items', label: 'Lost & Found', icon: Search },
  { id: 'ratings', label: 'Ratings', icon: Star },
  { id: 'vendors', label: 'Vendors', icon: ShoppingBag },
  { id: 'skill-resources', label: 'Skill Resources', icon: BookOpen },
]

export default function Layout({ children, activePage, setActivePage, user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const activeItem = NAV_ITEMS.find(n => n.id === activePage)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-60 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <GraduationCap size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">UniCampus</p>
            <p className="text-xs text-gray-400">Ecosystem Platform</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <p className="section-label">Main Menu</p>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setActivePage(id); setSidebarOpen(false) }}
              className={`sidebar-link w-full ${activePage === id ? 'active' : ''}`}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-medium">
                {user?.name?.charAt(0).toUpperCase() || 'S'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{user?.name || 'Student'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email || 'student@university.edu'}</p>
            </div>
            <button onClick={onLogout} className="p-1.5 hover:bg-red-50 rounded-lg group" title="Logout">
              <LogOut size={14} className="text-gray-400 group-hover:text-red-500" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100">
            <Menu size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-base font-semibold text-gray-900">{activeItem?.label || 'Dashboard'}</h1>
            <p className="text-xs text-gray-400 hidden sm:block">University Ecosystem Platform</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="relative p-2 rounded-lg hover:bg-gray-100">
              <Bell size={18} className="text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                {user?.name?.charAt(0).toUpperCase() || 'S'}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}