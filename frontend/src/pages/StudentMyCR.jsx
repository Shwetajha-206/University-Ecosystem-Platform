import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Vote, Megaphone, User, Mail, Star, Shield } from 'lucide-react'
import { apiJson } from '../lib/api'
import { usePolling } from '../hooks/usePolling'

export default function StudentMyCR({ user }) {
  const [cr, setCr] = useState(null)
  const [admins, setAdmins] = useState([])
  const [adminPeer, setAdminPeer] = useState(null)
  const [messages, setMessages] = useState([])
  const [adminMessages, setAdminMessages] = useState([])
  const [polls, setPolls] = useState([])
  const [notices, setNotices] = useState([])
  const [body, setBody] = useState('')
  const [adminBody, setAdminBody] = useState('')
  const [tab, setTab] = useState('chat')
  const [rating, setRating] = useState(0)
  const [ratingComment, setRatingComment] = useState('')
  const [ratingSent, setRatingSent] = useState(false)

  const loadCr = useCallback(async () => {
    try {
      const data = await apiJson('/class/cr')
      setCr(data)
    } catch { setCr(null) }
  }, [])

  const loadAdmins = useCallback(async () => {
    try {
      const data = await apiJson('/messages/admin-contacts')
      if (!Array.isArray(data)) return
      setAdmins(data)
      setAdminPeer(prev => {
        if (prev && data.some(a => a.email === prev.email)) return prev
        const withThread = data.find(a => a.lastAt)
        return withThread || data[0] || null
      })
    } catch { setAdmins([]) }
  }, [])

  const loadMessages = useCallback(async () => {
    if (!cr?.email) return
    try {
      const data = await apiJson(`/messages?peer=${encodeURIComponent(cr.email)}`)
      if (Array.isArray(data)) {
        setMessages(data)
        await apiJson('/messages/read-thread', {
          method: 'PATCH',
          body: JSON.stringify({ peer: cr.email }),
        }).catch(() => {})
      }
    } catch { /* silent */ }
  }, [cr?.email])

  const loadAdminMessages = useCallback(async () => {
    if (!adminPeer?.email) return
    try {
      const data = await apiJson(`/messages?peer=${encodeURIComponent(adminPeer.email)}`)
      if (Array.isArray(data)) {
        setAdminMessages(data)
        await apiJson('/messages/read-thread', {
          method: 'PATCH',
          body: JSON.stringify({ peer: adminPeer.email }),
        }).catch(() => {})
      }
    } catch { /* silent */ }
  }, [adminPeer?.email])

  const loadPolls = useCallback(async () => {
    try {
      const data = await apiJson('/polls')
      if (Array.isArray(data)) setPolls(data)
    } catch { /* silent */ }
  }, [])

  const loadNotices = useCallback(async () => {
    try {
      const data = await apiJson('/announcements')
      if (Array.isArray(data)) {
        setNotices(data.filter(a => a.targetCourse && a.role === 'cr'))
      }
    } catch { /* silent */ }
  }, [])

  useEffect(() => { loadCr(); loadAdmins() }, [loadCr, loadAdmins])
  useEffect(() => {
    if (cr) loadMessages()
    loadPolls()
    loadNotices()
  }, [cr, loadMessages, loadPolls, loadNotices])
  useEffect(() => {
    if (adminPeer) loadAdminMessages()
  }, [adminPeer, loadAdminMessages])

  usePolling(() => {
    loadCr()
    loadAdmins()
    if (cr) loadMessages()
    if (adminPeer) loadAdminMessages()
    loadPolls()
    loadNotices()
  }, 3000, true)

  const sendMessage = async () => {
    if (!cr?.email || !body.trim()) return
    await apiJson('/messages', { method: 'POST', body: JSON.stringify({ toEmail: cr.email, body }) })
    setBody('')
    loadMessages()
  }

  const sendAdminMessage = async () => {
    if (!adminPeer?.email || !adminBody.trim()) return
    await apiJson('/messages', { method: 'POST', body: JSON.stringify({ toEmail: adminPeer.email, body: adminBody }) })
    setAdminBody('')
    loadAdminMessages()
    loadAdmins()
  }

  const vote = async (pollId, optionIndex) => {
    await apiJson(`/polls/${pollId}/vote`, { method: 'POST', body: JSON.stringify({ optionIndex }) })
    loadPolls()
  }

  const submitRating = async () => {
    if (!rating) return alert('Select a rating')
    await apiJson('/class/cr/rate', { method: 'POST', body: JSON.stringify({ rating, comment: ratingComment }) })
    setRatingSent(true)
  }

  const classLabel = `${user?.course || ''} · Year ${user?.semester || ''} · Section ${user?.section || ''}`
  const hasUnreadAdmin = admins.some(a => a.unread)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="page-title">My Class Representative</h2>
        <p className="text-sm text-gray-500 mt-0.5">{classLabel}</p>
      </div>

      {cr ? (
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
            {cr.name?.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{cr.name}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1"><Mail size={12} /> {cr.email}</p>
            <p className="text-xs text-blue-600 mt-1">{cr.classLabel}</p>
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center text-gray-400 text-sm">
          <User size={32} className="mx-auto mb-2 opacity-40" />
          No CR assigned for your class yet. Contact administration.
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'chat', label: 'Chat with CR', icon: MessageSquare },
          { id: 'admin-chat', label: 'Admin Messages', icon: Shield, badge: hasUnreadAdmin },
          { id: 'polls', label: 'Class Polls', icon: Vote },
          { id: 'notices', label: 'Class Notices', icon: Megaphone },
          { id: 'rate', label: 'Rate CR', icon: Star },
        ].map(({ id, label, icon: Icon, badge }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border ${tab === id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>
            <Icon size={14} /> {label}
            {badge && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
            )}
          </button>
        ))}
      </div>

      {tab === 'chat' && cr && (
        <div className="card p-4 space-y-3">
          <p className="text-xs text-gray-500">Chat with your assigned Class Representative.</p>
          <div className="h-64 overflow-y-auto border rounded-lg p-3 bg-gray-50 space-y-2">
            {messages.map(m => (
              <div key={m._id} className={`text-sm p-2 rounded-lg max-w-[80%] ${m.fromEmail === user.email ? 'bg-blue-100 ml-auto' : 'bg-white border'}`}>
                <div className="text-xs text-gray-500 mb-1">{m.fromName}</div>
                {m.body}
              </div>
            ))}
            {messages.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Start a conversation with your CR</p>}
          </div>
          <div className="flex gap-2">
            <input className="input flex-1 text-sm" placeholder="Message your CR..." value={body} onChange={e => setBody(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
            <button onClick={sendMessage} className="btn-primary">Send</button>
          </div>
        </div>
      )}

      {tab === 'admin-chat' && (
        <div className="card p-4 space-y-3">
          {admins.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No admin contacts available</p>
          ) : (
            <>
              <p className="text-xs text-gray-500">View and reply to messages from administration.</p>
              {admins.length > 1 && (
                <select
                  className="input text-sm"
                  value={adminPeer?.email || ''}
                  onChange={e => setAdminPeer(admins.find(a => a.email === e.target.value) || null)}
                >
                  {admins.map(a => (
                    <option key={a.email} value={a.email}>
                      {a.name} (Admin){a.unread ? ' · New' : ''}
                    </option>
                  ))}
                </select>
              )}
              {adminPeer && (
                <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                  <Shield size={16} className="text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">{adminPeer.name}</span>
                  <span className="text-xs text-purple-600">{adminPeer.email}</span>
                </div>
              )}
              <div className="h-64 overflow-y-auto border rounded-lg p-3 bg-gray-50 space-y-2">
                {adminMessages.map(m => (
                  <div
                    key={m._id}
                    className={`text-sm p-2 rounded-lg max-w-[80%] ${
                      m.fromEmail === user.email
                        ? 'bg-blue-100 ml-auto'
                        : 'bg-purple-100 border border-purple-200'
                    }`}
                  >
                    <div className="text-xs text-gray-500 mb-1">
                      {m.fromName}{m.fromRole === 'admin' ? ' · Admin' : ''}
                      {' · '}{new Date(m.createdAt).toLocaleString()}
                    </div>
                    {m.body}
                  </div>
                ))}
                {adminMessages.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-8">
                    No messages yet. You can send a message to administration below.
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  className="input flex-1 text-sm"
                  placeholder="Reply to admin..."
                  value={adminBody}
                  onChange={e => setAdminBody(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendAdminMessage()}
                />
                <button onClick={sendAdminMessage} className="btn-primary bg-purple-600 hover:bg-purple-700">
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'polls' && (
        <div className="space-y-3">
          {polls.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No active polls from your CR</p>}
          {polls.map(p => (
            <div key={p._id} className="card p-4">
              <h4 className="font-semibold text-sm">{p.question}</h4>
              <p className="text-xs text-gray-400 mb-3">{p.totalVotes || 0} votes</p>
              {p.options.map((o, i) => (
                <div key={i} className="mb-2">
                  {p.userVoted ? (
                    <div className="text-sm">
                      <div className="flex justify-between text-xs mb-1"><span>{o.text}</span><span>{o.votes?.length || 0}</span></div>
                      <div className="h-2 bg-gray-100 rounded-full"><div className="h-2 bg-blue-500 rounded-full" style={{ width: `${p.totalVotes ? (o.votes.length / p.totalVotes) * 100 : 0}%` }} /></div>
                    </div>
                  ) : (
                    <button onClick={() => vote(p._id, i)} className="w-full text-left px-3 py-2 rounded-lg border text-sm hover:bg-blue-50 hover:border-blue-200">{o.text}</button>
                  )}
                </div>
              ))}
              {p.userVoted && <p className="text-xs text-green-600 mt-2">✓ You voted</p>}
            </div>
          ))}
        </div>
      )}

      {tab === 'notices' && (
        <div className="space-y-3">
          {notices.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No class notices from your CR</p>}
          {notices.map(n => (
            <div key={n._id} className="card p-4">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-sm">{n.title}</h4>
                <span className="badge bg-blue-100 text-blue-700 text-xs">Class Notice</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{n.content}</p>
              <p className="text-xs text-gray-400 mt-2">{new Date(n.createdAt).toLocaleDateString()} · {n.postedBy}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'rate' && cr && (
        <div className="card p-5 space-y-4">
          <h4 className="font-semibold text-sm">Rate your Class Representative</h4>
          {ratingSent ? (
            <p className="text-sm text-green-600">Thank you! Your feedback has been submitted.</p>
          ) : (
            <>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setRating(n)}
                    className={`w-10 h-10 rounded-lg text-sm font-bold border ${rating >= n ? 'bg-amber-400 text-white border-amber-400' : 'bg-white text-gray-400 border-gray-200'}`}>
                    {n}
                  </button>
                ))}
              </div>
              <textarea className="input text-sm min-h-[60px]" placeholder="Optional comment..." value={ratingComment} onChange={e => setRatingComment(e.target.value)} />
              <button onClick={submitRating} className="btn-primary">Submit Rating</button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
