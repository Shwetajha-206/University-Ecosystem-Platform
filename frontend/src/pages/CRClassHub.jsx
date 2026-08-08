import { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, MessageSquare, BarChart2, FileText, Vote } from 'lucide-react'
import { apiJson } from '../lib/api'
import { usePolling } from '../hooks/usePolling'

const TABS = [
  { id: 'students', label: 'Students', icon: Users },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'polls', label: 'Polls', icon: Vote },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'reports', label: 'Monthly Report', icon: FileText },
]

export default function CRClassHub({ user }) {
  const [tab, setTab] = useState('students')
  const [students, setStudents] = useState([])
  const [messages, setMessages] = useState([])
  const [polls, setPolls] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [report, setReport] = useState(null)
  const [chatPeer, setChatPeer] = useState('')
  const [chatBody, setChatBody] = useState('')
  const [pollForm, setPollForm] = useState({ question: '', options: ['', ''] })

  const loadStudents = useCallback(async () => {
    try {
      const data = await apiJson('/class/students')
      if (Array.isArray(data)) setStudents(data)
    } catch { /* silent */ }
  }, [])

  const loadMessages = useCallback(async () => {
    try {
      if (!chatPeer) {
        setMessages([])
        return
      }
      const data = await apiJson(`/messages?peer=${encodeURIComponent(chatPeer)}`)
      if (Array.isArray(data)) {
        setMessages(data)
        await apiJson('/messages/read-thread', {
          method: 'PATCH',
          body: JSON.stringify({ peer: chatPeer }),
        }).catch(() => {})
      }
    } catch { /* silent */ }
  }, [chatPeer])

  const loadPolls = useCallback(async () => {
    try {
      const data = await apiJson('/polls')
      if (Array.isArray(data)) setPolls(data)
    } catch { /* silent */ }
  }, [])

  const loadAnalytics = useCallback(async () => {
    try {
      const data = await apiJson('/class/analytics')
      setAnalytics(data)
    } catch { /* silent */ }
  }, [])

  const loadReport = useCallback(async () => {
    try {
      const data = await apiJson('/class/reports/monthly')
      setReport(data)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    loadStudents()
    if (tab === 'chat') loadMessages()
    if (tab === 'polls') loadPolls()
    if (tab === 'analytics') loadAnalytics()
    if (tab === 'reports') loadReport()
  }, [tab, loadStudents, loadMessages, loadPolls, loadAnalytics, loadReport])

  usePolling(() => {
    if (tab === 'chat') loadMessages()
    if (tab === 'polls') loadPolls()
  }, 3000, tab === 'chat' || tab === 'polls')

  const sendMessage = async () => {
    if (!chatPeer || !chatBody.trim()) return
    await apiJson('/messages', { method: 'POST', body: JSON.stringify({ toEmail: chatPeer, body: chatBody }) })
    setChatBody('')
    loadMessages()
  }

  const createPoll = async () => {
    const opts = pollForm.options.filter(o => o.trim())
    if (!pollForm.question.trim() || opts.length < 2) return alert('Question and 2+ options required')
    await apiJson('/polls', { method: 'POST', body: JSON.stringify({ question: pollForm.question, options: opts }) })
    setPollForm({ question: '', options: ['', ''] })
    loadPolls()
  }

  const classLabel = `${user?.course || ''} · Year ${user?.semester || ''} · Sec ${user?.section || ''}`

  return (
    <div className="space-y-4">
      <div>
        <h2 className="page-title">Class Management</h2>
        <p className="text-sm text-gray-500 mt-0.5">{classLabel}</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border ${tab === id ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === 'students' && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b text-sm font-semibold">Student List ({students.length})</div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>
              {['Name', 'Email', 'Enrollment', 'Course', 'Section'].map(h => (
                <th key={h} className="text-left text-xs text-gray-400 px-4 py-2">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{s.name}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{s.email}</td>
                  <td className="px-4 py-2 text-xs">{s.enrollmentNumber || '—'}</td>
                  <td className="px-4 py-2 text-xs">{s.course} {s.branch}</td>
                  <td className="px-4 py-2 text-xs">Y{s.semester} · {s.section}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'chat' && (
        <div className="card p-4 space-y-3">
          <p className="text-xs text-gray-500">Chat only with students in your assigned class ({classLabel}).</p>
          <select className="input text-sm" value={chatPeer} onChange={e => setChatPeer(e.target.value)}>
            <option value="">Select student to chat...</option>
            {students.map(s => <option key={s.email} value={s.email}>{s.name} — {s.email}</option>)}
          </select>
          <div className="h-64 overflow-y-auto border rounded-lg p-3 bg-gray-50 space-y-2">
            {messages.map(m => (
              <div key={m._id} className={`text-sm p-2 rounded-lg max-w-[80%] ${m.fromEmail === user.email ? 'bg-green-100 ml-auto' : 'bg-white border'}`}>
                <div className="text-xs text-gray-500 mb-1">{m.fromName}</div>
                {m.body}
              </div>
            ))}
            {messages.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">Select a student from your class to start chatting</p>
            )}
          </div>
          <div className="flex gap-2">
            <input className="input flex-1 text-sm" placeholder="Type a message..." value={chatBody} onChange={e => setChatBody(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
            <button onClick={sendMessage} className="btn-primary bg-green-600 hover:bg-green-700">Send</button>
          </div>
        </div>
      )}

      {tab === 'polls' && (
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="text-sm font-semibold mb-3">Create Poll</h3>
            <input className="input mb-2 text-sm" placeholder="Poll question" value={pollForm.question} onChange={e => setPollForm({ ...pollForm, question: e.target.value })} />
            {pollForm.options.map((o, i) => (
              <input key={i} className="input mb-2 text-sm" placeholder={`Option ${i + 1}`} value={o}
                onChange={e => { const opts = [...pollForm.options]; opts[i] = e.target.value; setPollForm({ ...pollForm, options: opts }) }} />
            ))}
            <div className="flex gap-2">
              <button onClick={() => setPollForm({ ...pollForm, options: [...pollForm.options, ''] })} className="btn-secondary text-xs">+ Option</button>
              <button onClick={createPoll} className="btn-primary bg-green-600 text-sm">Create Poll</button>
            </div>
          </div>
          {polls.map(p => (
            <div key={p._id} className="card p-4">
              <h4 className="font-semibold text-sm">{p.question}</h4>
              <p className="text-xs text-gray-400 mt-1">{p.totalVotes || 0} votes</p>
              {p.options.map((o, i) => (
                <div key={i} className="mt-2">
                  <div className="flex justify-between text-xs mb-1"><span>{o.text}</span><span>{o.votes?.length || 0}</span></div>
                  <div className="h-2 bg-gray-100 rounded-full"><div className="h-2 bg-green-500 rounded-full" style={{ width: `${p.totalVotes ? (o.votes.length / p.totalVotes) * 100 : 0}%` }} /></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {tab === 'analytics' && analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-4">
            <h3 className="text-sm font-semibold mb-3">Complaint Analytics</h3>
            <p className="text-2xl font-bold text-green-600">{analytics.complaints.total}</p>
            <p className="text-xs text-gray-500">Total · {analytics.complaints.important} important · {analytics.complaints.verified} verified</p>
            <div className="h-48 mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.complaints.byCategory}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip />
                  <Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card p-4">
            <h3 className="text-sm font-semibold mb-3">Grievance Analytics</h3>
            <p className="text-2xl font-bold text-blue-600">{analytics.grievances.total}</p>
            <p className="text-xs text-gray-500">Total · {analytics.grievances.important} important · {analytics.grievances.escalated} escalated</p>
            <div className="h-48 mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.grievances.byCategory}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'reports' && report && (
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold">Monthly Issue Report — {report.month}</h3>
          <p className="text-xs text-gray-500">{report.classLabel} · {report.studentCount} students</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-lg font-bold text-green-700">{report.complaints.total}</p>
              <p className="text-xs text-gray-600">Complaints ({report.complaints.resolved} resolved)</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-lg font-bold text-blue-700">{report.grievances.total}</p>
              <p className="text-xs text-gray-600">Grievances ({report.grievances.resolved} resolved)</p>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-500 mb-2">COMPLAINTS THIS MONTH</h4>
            {report.complaints.items.map(c => (
              <div key={c.id} className="text-sm py-2 border-b flex justify-between">
                <span>{c.id} — {c.title}</span>
                <span className="badge bg-gray-100 text-gray-600">{c.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
