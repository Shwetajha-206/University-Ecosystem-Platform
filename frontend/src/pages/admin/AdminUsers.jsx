import { useState, useEffect } from 'react'
import { Search, UserCheck, UserX, Shield, Eye, AlertOctagon, Plus, X } from 'lucide-react'
import { apiJson } from '../../lib/api'
import LoadingState from '../../components/admin/LoadingState'
import EmptyState from '../../components/admin/EmptyState'

const ROLE_TABS = [
  { id: 'all', label: 'All Users' },
  { id: 'student', label: 'Students' },
  { id: 'cr', label: 'Class Reps' },
  { id: 'vendor', label: 'Vendors' },
]

const ROLE_BADGE = {
  student: 'bg-blue-100 text-blue-700',
  cr: 'bg-green-100 text-green-700',
  vendor: 'bg-orange-100 text-orange-700',
  admin: 'bg-purple-100 text-purple-700',
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [suspicious, setSuspicious] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleTab, setRoleTab] = useState('all')
  const [selected, setSelected] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'student', shop: '' })
  const [showSuspicious, setShowSuspicious] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [u, s] = await Promise.all([
        apiJson('/auth/users'),
        apiJson('/auth/users/suspicious'),
      ])
      setUsers(Array.isArray(u) ? u : [])
      setSuspicious(Array.isArray(s) ? s : [])
    } catch { setUsers([]) }
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const filtered = users.filter(u => {
    const matchRole = roleTab === 'all' || u.role === roleTab
    const q = search.toLowerCase()
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    return matchRole && matchSearch
  })

  const toggleBlock = async (id, blocked) => {
    try {
      await apiJson(`/auth/users/${id}/block`, { method: 'PATCH', body: JSON.stringify({ blocked: !blocked }) })
      fetchAll()
      if (selected?._id === id) setSelected(prev => ({ ...prev, blocked: !blocked }))
    } catch (err) { alert(err.message) }
  }

  const flagSuspicious = async (id, reasons) => {
    try {
      await apiJson(`/auth/users/${id}/suspicious`, {
        method: 'PATCH',
        body: JSON.stringify({ suspicious: true, suspiciousReason: reasons.join(', ') }),
      })
      fetchAll()
    } catch (err) { alert(err.message) }
  }

  const createUser = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) return alert('Fill all required fields')
    try {
      await apiJson('/auth/users', { method: 'POST', body: JSON.stringify(createForm) })
      setShowCreate(false)
      setCreateForm({ name: '', email: '', password: '', role: 'student', shop: '' })
      fetchAll()
    } catch (err) { alert(err.message) }
  }

  if (loading) return <LoadingState />

  if (selected) {
    return (
      <div className="space-y-4">
        <button onClick={() => setSelected(null)} className="text-sm text-purple-600 font-medium hover:underline">← Back to users</button>
        <div className="card p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {selected.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-gray-900">{selected.name}</h2>
                <span className={`badge ${ROLE_BADGE[selected.role]}`}>{selected.role}</span>
                {selected.blocked && <span className="badge bg-red-100 text-red-700">Blocked</span>}
                {selected.suspicious && <span className="badge bg-amber-100 text-amber-700">Suspicious</span>}
              </div>
              <p className="text-sm text-gray-500 mt-1">{selected.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
            {selected.enrollmentNumber && <Detail label="Enrollment" value={selected.enrollmentNumber} />}
            {selected.course && <Detail label="Course" value={selected.course} />}
            {selected.branch && <Detail label="Branch" value={selected.branch} />}
            {selected.semester && <Detail label="Semester" value={selected.semester} />}
            {selected.section && <Detail label="Section" value={selected.section} />}
            {selected.shop && <Detail label="Shop" value={selected.shop} />}
            <Detail label="Joined" value={new Date(selected.createdAt).toLocaleDateString()} />
            {selected.suspiciousReason && <Detail label="Flag Reason" value={selected.suspiciousReason} />}
          </div>
          <div className="flex gap-2 mt-6 flex-wrap">
            <button onClick={() => toggleBlock(selected._id, selected.blocked)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selected.blocked ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-50 hover:bg-red-100 text-red-600'}`}>
              {selected.blocked ? <><UserCheck size={15} /> Activate Account</> : <><UserX size={15} /> Deactivate Account</>}
            </button>
            {!selected.suspicious && selected.role === 'student' && (
              <button onClick={() => flagSuspicious(selected._id, ['Manually flagged by admin'])}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-amber-50 hover:bg-amber-100 text-amber-700">
                <AlertOctagon size={15} /> Flag as Suspicious
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h2 className="page-title">User Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} registered users · {suspicious.length} flagged as suspicious</p>
        </div>
        <div className="sm:ml-auto flex gap-2">
          <button onClick={() => setShowSuspicious(s => !s)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${showSuspicious ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}>
            <AlertOctagon size={15} /> Fake Users ({suspicious.length})
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700">
            <Plus size={15} /> Add User
          </button>
        </div>
      </div>

      {showSuspicious && suspicious.length > 0 && (
        <div className="card p-4 border-amber-200 bg-amber-50/50">
          <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2"><AlertOctagon size={16} /> Detected Suspicious Users</h3>
          <div className="space-y-2">
            {suspicious.map(u => (
              <div key={u._id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">{u.name} <span className="text-gray-400 font-normal">({u.email})</span></p>
                  <p className="text-xs text-amber-600 mt-0.5">{u.suspiciousReasons?.join(' · ')}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelected(u)} className="p-1.5 rounded-lg hover:bg-gray-100"><Eye size={14} className="text-gray-500" /></button>
                  <button onClick={() => flagSuspicious(u._id, u.suspiciousReasons)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700">Block</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreate && (
        <div className="card p-5 border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Create New Account</h3>
            <button onClick={() => setShowCreate(false)}><X size={16} className="text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className="input" placeholder="Full Name" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} />
            <input className="input" placeholder="Email" type="email" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} />
            <input className="input" placeholder="Password" type="password" value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} />
            <select className="input" value={createForm.role} onChange={e => setCreateForm({ ...createForm, role: e.target.value })}>
              <option value="student">Student</option>
              <option value="cr">Class Representative</option>
              <option value="vendor">Vendor</option>
              <option value="admin">Admin</option>
            </select>
            {createForm.role === 'vendor' && (
              <input className="input sm:col-span-2" placeholder="Shop Name" value={createForm.shop} onChange={e => setCreateForm({ ...createForm, shop: e.target.value })} />
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button onClick={createUser} className="btn-primary bg-purple-600 hover:bg-purple-700">Create Account</button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 flex-wrap">
          {ROLE_TABS.map(t => (
            <button key={t.id} onClick={() => setRoleTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${roleTab === t.id ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-400 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700">{u.name?.charAt(0)}</div>
                      <span className="font-medium text-gray-900">{u.name}</span>
                      {u.suspicious && <AlertOctagon size={12} className="text-amber-500" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                  <td className="px-4 py-3"><span className={`badge capitalize ${ROLE_BADGE[u.role]}`}>{u.role}</span></td>
                  <td className="px-4 py-3">
                    <span className={`badge ${u.blocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {u.blocked ? 'Inactive' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelected(u)} className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600" title="View"><Eye size={14} /></button>
                      <button onClick={() => toggleBlock(u._id, u.blocked)} className="p-1.5 rounded-lg hover:bg-gray-100" title={u.blocked ? 'Activate' : 'Deactivate'}>
                        {u.blocked ? <UserCheck size={14} className="text-green-600" /> : <UserX size={14} className="text-red-500" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6}><EmptyState title="No users found" description="Try adjusting your search or filter." icon={Shield} /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-gray-900 mt-0.5">{value}</p>
    </div>
  )
}
