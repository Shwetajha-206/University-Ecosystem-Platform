import { useState, useEffect } from 'react'
import { Plus, Search, X, ShoppingBag, Star } from 'lucide-react'
import { apiJson, apiFetch } from '../lib/api'
const CATEGORIES = ['All', 'Food & Beverages', 'Books & Stationery', 'Services', 'Healthcare', 'Sports & Fitness']
const CAT_COLORS = {
  'Food & Beverages': 'bg-orange-100 text-orange-700',
  'Books & Stationery': 'bg-blue-100 text-blue-700',
  'Services': 'bg-purple-100 text-purple-700',
  'Healthcare': 'bg-green-100 text-green-700',
  'Sports & Fitness': 'bg-red-100 text-red-700',
}

export default function Vendors({ user }) {
  const [vendors, setVendors] = useState([])
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'Food & Beverages' })

  useEffect(() => {
    apiJson('/vendors')
      .then(data => { if (Array.isArray(data)) setVendors(data) })
      .catch(() => {})
  }, [])

  const filtered = vendors.filter(v => {
    const matchCat = filterCat === 'All' || v.category === filterCat
    const matchSearch = v.name?.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const handleSubmit = async () => {
    if (!form.name.trim()) return
    try {
      const data = await apiJson('/vendors', { method: 'POST', body: JSON.stringify(form) })
      setVendors([...vendors, data])
      setForm({ name: '', category: 'Food & Beverages' })
      setShowForm(false)
    } catch (err) {
      alert(err.message || 'Server se connect nahi ho pa raha')
    }
  }

  const handleDelete = async (id) => {
    try {
      await apiFetch(`/vendors/${id}`, { method: 'DELETE' })
      setVendors(vendors.filter(v => v._id !== id))
    } catch {
      alert('Error deleting vendor')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h2 className="page-title">Vendors</h2>
          <p className="text-sm text-gray-500 mt-0.5">{vendors.filter(v => v.status === 'active').length} active vendors on campus</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 sm:ml-auto">
            <Plus size={16} /> Add Vendor
          </button>
        )}
      </div>

      {showForm && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Register New Vendor</h3>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded">
              <X size={16} className="text-gray-400" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Vendor Name</label>
              <input className="input" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. New Canteen" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select className="input" value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit} className="btn-primary">Add Vendor</button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search vendors..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)}
              style={filterCat === cat
                ? { padding: '6px 14px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #0A3A6A, #B10428)', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(177,4,40,0.25)' }
                : { padding: '6px 14px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }
              }>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(v => (
          <div key={v._id} className="card p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(10,58,106,0.08)' }}>
                <ShoppingBag size={18} style={{ color: '#0A3A6A' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-gray-900">{v.name}</h4>
                  <span className={`badge ${v.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {v.status}
                  </span>
                </div>
                <span className={`badge mt-1 ${CAT_COLORS[v.category] || 'bg-gray-100 text-gray-600'}`}>{v.category}</span>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="flex">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={12} className={s <= Math.round(v.avgRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-gray-700">{v.avgRating > 0 ? v.avgRating : 'No ratings'}</span>
                  {v.totalRatings > 0 && <span className="text-xs text-gray-400">({v.totalRatings} reviews)</span>}
                </div>
                {user?.role === 'admin' && (
                  <button onClick={() => handleDelete(v._id)}
                    className="text-xs text-red-400 hover:text-red-600 font-medium mt-2">
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-400">No vendors found</div>
        )}
      </div>
    </div>
  )
}