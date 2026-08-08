import { useState, useEffect } from 'react'
import { Megaphone, AlertTriangle, Bell, Send, Radio, Trash2 } from 'lucide-react'
import { apiJson } from '../../lib/api'

const TARGET_ROLES = [
  { id: 'student', label: 'Students' },
  { id: 'cr', label: 'Class Reps' },
  { id: 'vendor', label: 'Vendors' },
  { id: 'admin', label: 'Admins' },
]

export default function AdminCommunication() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('broadcast')
  const [form, setForm] = useState({ title: '', message: '', targetRoles: ['student', 'cr', 'vendor'], priority: 'normal' })
  const [emergencyForm, setEmergencyForm] = useState({ title: '', message: '' })
  const [sending, setSending] = useState(false)

  const fetchAll = async () => {
    try {
      const data = await apiJson('/notifications')
      setNotifications(Array.isArray(data) ? data : [])
    } catch { setNotifications([]) }
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const sendBroadcast = async () => {
    if (!form.title || !form.message) return alert('Title and message are required')
    setSending(true)
    try {
      await apiJson('/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify({ ...form, type: 'announcement' }),
      })
      setForm({ title: '', message: '', targetRoles: ['student', 'cr', 'vendor'], priority: 'normal' })
      fetchAll()
      alert('Broadcast sent successfully!')
    } catch (err) { alert(err.message) }
    setSending(false)
  }

  const sendEmergency = async () => {
    if (!emergencyForm.title || !emergencyForm.message) return alert('Title and message are required')
    if (!confirm('Send emergency alert to ALL users? This cannot be undone.')) return
    setSending(true)
    try {
      await apiJson('/notifications/emergency', {
        method: 'POST',
        body: JSON.stringify(emergencyForm),
      })
      setEmergencyForm({ title: '', message: '' })
      fetchAll()
      alert('Emergency alert sent!')
    } catch (err) { alert(err.message) }
    setSending(false)
  }

  const deleteNotification = async (id) => {
    if (!confirm('Delete this notification?')) return
    try {
      await apiJson(`/notifications/${id}`, { method: 'DELETE' })
      fetchAll()
    } catch (err) { alert(err.message) }
  }

  const toggleRole = (role) => {
    setForm(f => ({
      ...f,
      targetRoles: f.targetRoles.includes(role)
        ? f.targetRoles.filter(r => r !== role)
        : [...f.targetRoles, role],
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Communication Center</h2>
        <p className="text-sm text-gray-500 mt-0.5">Broadcast notices, send announcements, and manage emergency alerts</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'broadcast', label: 'Broadcast Notice', icon: Megaphone },
          { id: 'emergency', label: 'Emergency Alert', icon: AlertTriangle },
          { id: 'history', label: 'Sent History', icon: Bell },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'broadcast' && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Radio size={16} className="text-purple-600" /> Broadcast Notice to Users
          </h3>
          <div className="space-y-3">
            <input className="input" placeholder="Notice Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <textarea className="input resize-none" rows={4} placeholder="Message content..."
              value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Target Audience</p>
              <div className="flex gap-2 flex-wrap">
                {TARGET_ROLES.map(r => (
                  <button key={r.id} onClick={() => toggleRole(r.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${form.targetRoles.includes(r.id) ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Priority</p>
              <div className="flex gap-2">
                {['normal', 'high', 'critical'].map(p => (
                  <button key={p} onClick={() => setForm({ ...form, priority: p })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${form.priority === p ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={sendBroadcast} disabled={sending}
            className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50">
            <Send size={15} /> {sending ? 'Sending...' : 'Send Broadcast'}
          </button>
        </div>
      )}

      {tab === 'emergency' && (
        <div className="card p-6 border-red-200 bg-red-50/30">
          <h3 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
            <AlertTriangle size={16} /> Emergency Alert System
          </h3>
          <p className="text-xs text-red-600 mb-4">This will immediately notify ALL users with a critical priority alert. Use only for genuine emergencies.</p>
          <div className="space-y-3">
            <input className="input border-red-200" placeholder="Emergency Title (e.g. Campus Evacuation)" value={emergencyForm.title} onChange={e => setEmergencyForm({ ...emergencyForm, title: e.target.value })} />
            <textarea className="input resize-none border-red-200" rows={4} placeholder="Emergency instructions and details..."
              value={emergencyForm.message} onChange={e => setEmergencyForm({ ...emergencyForm, message: e.target.value })} />
          </div>
          <button onClick={sendEmergency} disabled={sending}
            className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50">
            <AlertTriangle size={15} /> {sending ? 'Sending...' : 'Send Emergency Alert'}
          </button>
        </div>
      )}

      {tab === 'history' && (
        <div className="card overflow-hidden">
          {loading ? (
            <p className="text-center py-10 text-sm text-gray-400">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="text-center py-10 text-sm text-gray-400">No notifications sent yet</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {notifications.map(n => (
                <div key={n._id} className="p-4 hover:bg-gray-50 flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${n.type === 'emergency' ? 'bg-red-100' : 'bg-purple-100'}`}>
                    {n.type === 'emergency' ? <AlertTriangle size={14} className="text-red-600" /> : <Megaphone size={14} className="text-purple-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                      <span className={`badge capitalize ${n.type === 'emergency' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'}`}>{n.type}</span>
                      <span className={`badge capitalize ${n.priority === 'critical' ? 'bg-red-100 text-red-700' : n.priority === 'high' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{n.priority}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      By {n.postedByName || n.postedBy} · {new Date(n.createdAt).toLocaleString()} · To: {n.targetRoles?.join(', ')}
                    </p>
                  </div>
                  <button onClick={() => deleteNotification(n._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
