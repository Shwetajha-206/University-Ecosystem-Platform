import { useState, useEffect, useRef } from 'react'
import { Bell, AlertTriangle, Megaphone, Info, CheckCheck, Check } from 'lucide-react'
import { apiJson } from '../lib/api'

const TYPE_ICON = {
  emergency:    AlertTriangle,
  announcement: Megaphone,
  alert:        AlertTriangle,
  notice:       Info,
}

const TYPE_COLOR = {
  emergency:    'text-red-600 bg-red-50',
  announcement: 'text-purple-600 bg-purple-50',
  alert:        'text-amber-600 bg-amber-50',
  notice:       'text-blue-600 bg-blue-50',
}

const SEEN_KEY = 'notif_seen_ids'

function getSeenIds() {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')) }
  catch { return new Set() }
}

function saveSeenIds(ids) {
  localStorage.setItem(SEEN_KEY, JSON.stringify([...ids]))
}

export default function NotificationBell({ pollInterval = 15000 }) {
  const [open, setOpen]                   = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread]               = useState(0)
  const [markingAll, setMarkingAll]       = useState(false)
  const ref = useRef(null)

  const fetchNotifications = async () => {
    try {
      const [list, countData] = await Promise.all([
        apiJson('/notifications'),
        apiJson('/notifications/unread-count'),
      ])
      const items = Array.isArray(list) ? list.slice(0, 20) : []
      setNotifications(items)

      // Merge server unread count with locally-seen ids so dismissed
      // notifications don't re-appear as unread after a server restart
      const seen = getSeenIds()
      const locallyUnseen = items.filter(n => !seen.has(n._id)).length
      setUnread(Math.min(countData?.count || 0, locallyUnseen))
    } catch { /* silent */ }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, pollInterval)
    return () => clearInterval(interval)
  }, [pollInterval])

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markRead = async (id) => {
    try {
      await apiJson(`/notifications/${id}/read`, { method: 'PATCH' })
      const seen = getSeenIds()
      seen.add(id)
      saveSeenIds(seen)
      fetchNotifications()
    } catch { /* silent */ }
  }

  const markAllRead = async () => {
    if (markingAll || notifications.length === 0) return
    setMarkingAll(true)
    try {
      await Promise.all(
        notifications.map(n => apiJson(`/notifications/${n._id}/read`, { method: 'PATCH' }).catch(() => {}))
      )
      const seen = getSeenIds()
      notifications.forEach(n => seen.add(n._id))
      saveSeenIds(seen)
      setUnread(0)
      fetchNotifications()
    } catch { /* silent */ }
    finally { setMarkingAll(false) }
  }

  const handleOpen = () => {
    setOpen(o => !o)
    // Mark all as locally seen when panel is opened (suppresses badge on next poll)
    if (!open) {
      const seen = getSeenIds()
      notifications.forEach(n => seen.add(n._id))
      saveSeenIds(seen)
      setUnread(0)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} className="text-gray-500" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">Notifications</span>
            <div className="flex items-center gap-3">
              {unread > 0 && (
                <span className="text-xs font-medium" style={{ color: '#0A3A6A' }}>{unread} unread</span>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={markingAll}
                  className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-50"
                  title="Mark all as read"
                >
                  <CheckCheck size={13} />
                  {markingAll ? 'Marking...' : 'Mark all read'}
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No notifications</p>
            ) : notifications.map(n => {
              const Icon       = TYPE_ICON[n.type] || Info
              const colorClass = TYPE_COLOR[n.type] || TYPE_COLOR.notice
              const seen       = getSeenIds().has(n._id)
              return (
                <div
                  key={n._id}
                  className={`flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${!seen ? 'bg-blue-50/40' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${colorClass}`}>
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs font-semibold text-gray-900 truncate ${!seen ? 'font-bold' : ''}`}>{n.title}</p>
                      {!seen && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-[10px] text-gray-400">
                        {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {!seen && (
                        <button
                          onClick={() => markRead(n._id)}
                          className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Check size={10} /> Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
