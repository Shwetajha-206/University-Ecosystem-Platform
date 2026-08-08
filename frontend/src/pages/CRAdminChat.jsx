import { useState, useEffect, useCallback, useRef } from 'react'
import { Send, Shield, MessageSquare, ChevronLeft } from 'lucide-react'

const API = 'http://localhost:5000/api'

export default function CRAdminChat({ user }) {
  const [admins, setAdmins] = useState([])
  const [selectedAdmin, setSelectedAdmin] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [adminsLoading, setAdminsLoading] = useState(true)
  const bottomRef = useRef(null)

  // Fetch all admins
  useEffect(() => {
    fetch(`${API}/auth/admins`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAdmins(data) })
      .catch(() => {})
      .finally(() => setAdminsLoading(false))
  }, [])

  const fetchMessages = useCallback(async () => {
    if (!selectedAdmin) return
    try {
      const res = await fetch(`${API}/messages?peer=${encodeURIComponent(selectedAdmin.email)}`, {
        credentials: 'include'
      })
      const data = await res.json()
      setMessages(Array.isArray(data) ? data : [])
    } catch { setMessages([]) }
    setLoading(false)
  }, [selectedAdmin])

  useEffect(() => {
    if (selectedAdmin) { setLoading(true); fetchMessages() }
  }, [fetchMessages, selectedAdmin])

  useEffect(() => {
    if (!selectedAdmin) return
    const t = setInterval(fetchMessages, 5000)
    return () => clearInterval(t)
  }, [fetchMessages, selectedAdmin])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!text.trim() || !selectedAdmin) return
    setSending(true)
    try {
      await fetch(`${API}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ toEmail: selectedAdmin.email, body: text.trim() })
      })
      setText('')
      await fetchMessages()
    } catch { alert('Message send nahi hua') }
    setSending(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const formatTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const formatDate = (d) => {
    const date = new Date(d)
    const today = new Date()
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  const grouped = messages.reduce((acc, m) => {
    const key = new Date(m.createdAt).toDateString()
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  return (
    <div style={{ maxWidth: 720, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #2563eb 100%)', borderRadius: 20, padding: '24px 28px', marginBottom: 20, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 32px rgba(37,99,235,0.28)' }}>
        <div style={{ position: 'absolute', width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', top: -50, right: 80, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', bottom: -30, right: 20, pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
          {selectedAdmin && (
            <button onClick={() => { setSelectedAdmin(null); setMessages([]) }}
              style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#fff' }}>
              <ChevronLeft size={18} />
            </button>
          )}
          <div style={{ width: 50, height: 50, borderRadius: 15, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid rgba(255,255,255,0.2)' }}>
            <Shield size={24} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
              {selectedAdmin ? selectedAdmin.name : 'Admin Chat'}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
              {selectedAdmin ? selectedAdmin.email : 'Select an admin to start chatting'}
            </div>
          </div>
          {selectedAdmin && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px', background: 'rgba(255,255,255,0.1)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Connected</span>
            </div>
          )}
        </div>
      </div>

      {/* Admin List or Chat */}
      <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>

        {!selectedAdmin ? (
          /* ── ADMIN LIST ── */
          <div style={{ padding: '20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 14, padding: '0 4px' }}>
              Select Admin to Chat
            </div>
            {adminsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: 13 }}>
                <div style={{ width: 28, height: 28, border: '3px solid #eff6ff', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
                Loading admins...
              </div>
            ) : admins.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: 13 }}>No admins found</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {admins.map(admin => (
                  <div key={admin.email} onClick={() => setSelectedAdmin(admin)}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, border: '1.5px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s', background: '#f8fafc' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.background = '#eff6ff' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                      {admin.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{admin.name}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{admin.email}</div>
                    </div>
                    <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 600 }}>Chat →</div>
                  </div>
                ))}
              </div>
            )}
          </div>

        ) : (
          /* ── CHAT VIEW ── */
          <>
            <div style={{ height: 460, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 4, background: '#f8fafc' }}>
              {loading ? (
                <div style={{ textAlign: 'center', margin: 'auto' }}>
                  <div style={{ width: 32, height: 32, border: '3px solid #eff6ff', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                  <div style={{ color: '#94a3b8', fontSize: 13 }}>Loading messages...</div>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', margin: 'auto' }}>
                  <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                    <MessageSquare size={28} color="#2563eb" />
                  </div>
                  <div style={{ fontWeight: 700, color: '#475569', fontSize: 14, marginBottom: 6 }}>No messages yet</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Start a conversation with {selectedAdmin.name}</div>
                </div>
              ) : (
                Object.entries(grouped).map(([dateKey, msgs]) => (
                  <div key={dateKey}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0' }}>
                      <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, padding: '3px 10px', background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0' }}>
                        {formatDate(msgs[0].createdAt)}
                      </span>
                      <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                    </div>
                    {msgs.map((m, i) => {
                      const isMe = m.fromEmail === user?.email
                      const showAvatar = i === 0 || msgs[i-1]?.fromEmail !== m.fromEmail
                      return (
                        <div key={m._id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, marginBottom: 6 }}>
                          {showAvatar ? (
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: isMe ? 'linear-gradient(135deg, #16a34a, #22c55e)' : 'linear-gradient(135deg, #1e3a8a, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                              {isMe ? user?.name?.charAt(0).toUpperCase() : selectedAdmin.name?.charAt(0).toUpperCase()}
                            </div>
                          ) : (
                            <div style={{ width: 32, flexShrink: 0 }} />
                          )}
                          <div style={{ maxWidth: '68%' }}>
                            {showAvatar && (
                              <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 3, textAlign: isMe ? 'right' : 'left', fontWeight: 600 }}>
                                {isMe ? 'You' : selectedAdmin.name}
                              </div>
                            )}
                            <div style={{ padding: '10px 14px', borderRadius: isMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px', background: isMe ? 'linear-gradient(135deg, #16a34a, #22c55e)' : '#fff', color: isMe ? '#fff' : '#0f172a', fontSize: 13, lineHeight: 1.65, boxShadow: isMe ? '0 3px 12px rgba(22,163,74,0.25)' : '0 2px 8px rgba(0,0,0,0.07)', border: isMe ? 'none' : '1.5px solid #e2e8f0', wordBreak: 'break-word' }}>
                              {m.body}
                            </div>
                            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4, textAlign: isMe ? 'right' : 'left' }}>
                              {formatTime(m.createdAt)}
                              {isMe && <span style={{ marginLeft: 4, color: m.read ? '#22c55e' : '#94a3b8' }}>{m.read ? '✓✓' : '✓'}</span>}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '14px 18px', background: '#fff', borderTop: '1.5px solid #e2e8f0', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message... (Enter to send)"
                rows={1}
                style={{ flex: 1, padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 13, fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.55, maxHeight: 100, overflowY: 'auto', background: '#f8fafc', color: '#0f172a', transition: 'border 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#2563eb'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px' }}
              />
              <button onClick={sendMessage} disabled={sending || !text.trim()}
                style={{ width: 46, height: 46, borderRadius: 13, background: sending || !text.trim() ? '#e2e8f0' : 'linear-gradient(135deg, #1e3a8a, #2563eb)', border: 'none', cursor: sending || !text.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s', boxShadow: sending || !text.trim() ? 'none' : '0 4px 14px rgba(37,99,235,0.35)' }}>
                <Send size={17} color={sending || !text.trim() ? '#94a3b8' : '#fff'} />
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}