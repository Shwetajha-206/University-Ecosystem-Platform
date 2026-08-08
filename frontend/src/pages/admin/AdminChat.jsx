import { useState, useEffect, useCallback, useRef } from 'react'
import { MessageSquare, Users, History, Search, Send, UserCog } from 'lucide-react'
import { apiJson } from '../../lib/api'
import { usePolling } from '../../hooks/usePolling'
import AssignedClassSelect, { EMPTY_CLASS, isClassFilterComplete } from '../../components/admin/AssignedClassSelect'
import LoadingState from '../../components/admin/LoadingState'
import EmptyState from '../../components/admin/EmptyState'

const ROLE_BADGE = {
  student: 'bg-blue-100 text-blue-700',
  cr: 'bg-green-100 text-green-700',
}

export default function AdminChat({ user }) {
  const [classFilter, setClassFilter] = useState(EMPTY_CLASS)
  const [tab, setTab] = useState('class')
  const [classContacts, setClassContacts] = useState({ students: [], crs: [] })
  const [conversations, setConversations] = useState([])
  const [history, setHistory] = useState([])
  const [selectedPeer, setSelectedPeer] = useState(null)
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const [search, setSearch] = useState('')
  const [historySearch, setHistorySearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const chatEndRef = useRef(null)

  const filterComplete = isClassFilterComplete(classFilter)

  const buildClassParams = () => {
    const p = new URLSearchParams()
    p.set('course', classFilter.course)
    p.set('branch', classFilter.branch)
    p.set('semester', classFilter.semester)
    p.set('section', classFilter.section)
    return p
  }

  const loadClassContacts = useCallback(async () => {
    if (!filterComplete) {
      setClassContacts({ students: [], crs: [] })
      return
    }
    setLoading(true)
    try {
      const params = buildClassParams()
      if (search) params.set('search', search)
      const [assigned, contacts] = await Promise.all([
        apiJson(`/class/assigned?${params}`),
        apiJson(`/messages/contacts?${params}${search ? `&search=${encodeURIComponent(search)}` : ''}`),
      ])
      const contactList = Array.isArray(contacts) ? contacts : []
      setClassContacts({
        students: contactList.filter(c => c.role === 'student'),
        crs: contactList.filter(c => c.role === 'cr'),
        counts: assigned?.counts,
      })
    } catch {
      setClassContacts({ students: [], crs: [] })
    } finally {
      setLoading(false)
    }
  }, [classFilter, search, filterComplete])

  const loadConversations = useCallback(async () => {
    try {
      const data = await apiJson('/messages/conversations')
      setConversations(Array.isArray(data) ? data : [])
    } catch {
      setConversations([])
    }
  }, [])

  const loadHistory = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterComplete) {
        params.set('course', classFilter.course)
        params.set('branch', classFilter.branch)
        params.set('semester', classFilter.semester)
        params.set('section', classFilter.section)
      }
      if (historySearch) params.set('search', historySearch)
      const data = await apiJson(`/messages/history?${params}`)
      setHistory(Array.isArray(data) ? data : [])
    } catch {
      setHistory([])
    }
  }, [classFilter, historySearch, filterComplete])

  const loadMessages = useCallback(async () => {
    if (!selectedPeer?.email) return
    try {
      const data = await apiJson(`/messages?peer=${encodeURIComponent(selectedPeer.email)}`)
      if (Array.isArray(data)) {
        setMessages(data)
        await apiJson('/messages/read-thread', {
          method: 'PATCH',
          body: JSON.stringify({ peer: selectedPeer.email }),
        }).catch(() => {})
      }
    } catch {
      setMessages([])
    }
  }, [selectedPeer?.email])

  useEffect(() => {
    if (tab === 'class') loadClassContacts()
    if (tab === 'history') {
      setLoading(true)
      loadHistory().finally(() => setLoading(false))
    }
    loadConversations()
  }, [tab, loadClassContacts, loadHistory, loadConversations])

  useEffect(() => {
    if (selectedPeer) loadMessages()
  }, [selectedPeer, loadMessages])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  usePolling(() => {
    if (tab === 'class' && filterComplete) loadClassContacts()
    loadConversations()
    if (tab === 'history') loadHistory()
    if (selectedPeer) loadMessages()
  }, 3000, true)

  const sendMessage = async () => {
    if (!selectedPeer?.email || !body.trim() || sending) return
    setSending(true)
    try {
      await apiJson('/messages', {
        method: 'POST',
        body: JSON.stringify({ toEmail: selectedPeer.email, body }),
      })
      setBody('')
      await loadMessages()
      await loadConversations()
    } catch (err) {
      alert(err.message)
    }
    setSending(false)
  }

  const selectContact = (contact) => {
    setSelectedPeer(contact)
    if (tab === 'history') setTab('class')
  }

  const allContacts = [...classContacts.crs, ...classContacts.students]
  const classLabel = filterComplete
    ? `${classFilter.course} · ${classFilter.branch} · Sem ${classFilter.semester} · Sec ${classFilter.section}`
    : ''

  const renderContact = (c) => (
    <button
      key={c.email}
      onClick={() => selectContact(c)}
      className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
        selectedPeer?.email === c.email ? 'bg-purple-50' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
          c.role === 'cr' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {c.name?.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
          <p className="text-xs text-gray-500 truncate">{c.email}</p>
          {c.enrollmentNumber && (
            <p className="text-xs text-gray-400 truncate">Enroll: {c.enrollmentNumber}</p>
          )}
        </div>
        <span className={`badge text-[10px] ${ROLE_BADGE[c.role] || ''}`}>
          {c.role === 'cr' ? 'CR' : 'Student'}
        </span>
      </div>
    </button>
  )

  return (
    <div className="space-y-4">
      <div>
        <h2 className="page-title">Admin Chat</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Select Course, Branch, Semester, and Section to view the class contact list and chat directly.
        </p>
      </div>

      <AssignedClassSelect value={classFilter} onChange={setClassFilter} requireAll />

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setTab('class')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'class' ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Users size={15} /> Class Contacts
        </button>
        <button
          onClick={() => setTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'history' ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <History size={15} /> All History
        </button>
      </div>

      {tab === 'class' ? (
        !filterComplete ? (
          <div className="card p-10 text-center text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium text-gray-600">Select all four class fields above</p>
            <p className="text-xs mt-1">Course, Branch, Semester, and Section are required to load the class contact list.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[520px]">
            <div className="card flex flex-col overflow-hidden lg:col-span-1">
              <div className="p-3 border-b bg-purple-50">
                <p className="text-xs font-semibold text-purple-800">{classLabel}</p>
                <p className="text-xs text-purple-600 mt-0.5">
                  {classContacts.crs?.length || 0} CR(s) · {classContacts.students?.length || 0} student(s)
                </p>
              </div>
              <div className="p-3 border-b">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="input text-sm pl-9 w-full"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                {conversations.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Recent conversations</p>
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                      {conversations.slice(0, 4).map(c => (
                        <button
                          key={c.email}
                          onClick={() => selectContact(c)}
                          className="w-full text-left px-2 py-1 rounded-lg text-xs hover:bg-purple-50 text-gray-700"
                        >
                          {c.name}
                          {c.unread && <span className="ml-1 w-1.5 h-1.5 inline-block bg-red-500 rounded-full" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <LoadingState message="Loading class contacts..." />
                ) : allContacts.length === 0 ? (
                  <EmptyState title="No contacts in this class" description="No students or CRs match the selected class." icon={Users} />
                ) : (
                  <>
                    {classContacts.crs?.length > 0 && (
                      <div>
                        <p className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 flex items-center gap-1">
                          <UserCog size={12} /> Class Representatives ({classContacts.crs.length})
                        </p>
                        <div className="divide-y divide-gray-50">
                          {classContacts.crs.map(renderContact)}
                        </div>
                      </div>
                    )}
                    {classContacts.students?.length > 0 && (
                      <div>
                        <p className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 flex items-center gap-1">
                          <Users size={12} /> Students ({classContacts.students.length})
                        </p>
                        <div className="divide-y divide-gray-50">
                          {classContacts.students.map(renderContact)}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="card flex flex-col overflow-hidden lg:col-span-2">
              {selectedPeer ? (
                <>
                  <div className="p-4 border-b flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      selectedPeer.role === 'cr' ? 'bg-green-600' : 'bg-blue-600'
                    }`}>
                      {selectedPeer.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{selectedPeer.name}</p>
                      <p className="text-xs text-gray-500">{selectedPeer.email}</p>
                    </div>
                    <span className={`ml-auto badge ${ROLE_BADGE[selectedPeer.role] || ''}`}>
                      {selectedPeer.role === 'cr' ? 'CR' : 'Student'}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-2 min-h-[340px]">
                    {messages.map(m => (
                      <div
                        key={m._id}
                        className={`text-sm p-3 rounded-xl max-w-[80%] ${
                          m.fromEmail === user.email
                            ? 'bg-purple-600 text-white ml-auto'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <div className={`text-xs mb-1 ${m.fromEmail === user.email ? 'text-purple-200' : 'text-gray-500'}`}>
                          {m.fromName} · {new Date(m.createdAt).toLocaleString()}
                        </div>
                        {m.body}
                      </div>
                    ))}
                    {messages.length === 0 && (
                      <p className="text-center text-gray-400 text-sm py-12">
                        No messages yet. Send a direct message to {selectedPeer.name}.
                      </p>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="p-3 border-t flex gap-2">
                    <input
                      className="input flex-1 text-sm"
                      placeholder="Type your message..."
                      value={body}
                      onChange={e => setBody(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || !body.trim()}
                      className="btn-primary bg-purple-600 hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50"
                    >
                      <Send size={15} /> Send
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                  <MessageSquare size={40} className="mb-3 opacity-40" />
                  <p className="text-sm font-medium">Select a student or CR from the contact list</p>
                  <p className="text-xs mt-1">Messages refresh every 3 seconds · notifications sent instantly</p>
                </div>
              )}
            </div>
          </div>
        )
      ) : (
        <div className="card overflow-hidden">
          <div className="p-3 border-b flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input text-sm pl-9 w-full"
                placeholder="Search all chat history..."
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
              />
            </div>
            <button onClick={loadHistory} className="btn-secondary text-sm">Refresh</button>
          </div>
          {loading ? (
            <LoadingState message="Loading chat history..." />
          ) : history.length === 0 ? (
            <EmptyState title="No chat history" description="Messages will appear here once conversations begin." icon={History} />
          ) : (
            <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
              {history.map(m => (
                <div key={m._id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-gray-500">
                        {m.fromName} ({m.fromRole}) → {m.toName} ({m.toRole})
                      </p>
                      <p className="text-sm text-gray-800 mt-1">{m.body}</p>
                      {(m.course || m.section) && (
                        <p className="text-xs text-purple-600 mt-1">
                          {[m.course, m.branch, m.semester && `Sem ${m.semester}`, m.section && `Sec ${m.section}`].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(m.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {(m.fromRole === 'student' || m.fromRole === 'cr' || m.toRole === 'student' || m.toRole === 'cr') && (
                    <button
                      onClick={() => selectContact({
                        email: m.fromEmail === user.email ? m.toEmail : m.fromEmail,
                        name: m.fromEmail === user.email ? m.toName : m.fromName,
                        role: m.fromEmail === user.email ? m.toRole : m.fromRole,
                      })}
                      className="text-xs text-purple-600 hover:underline mt-2"
                    >
                      Open conversation
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
