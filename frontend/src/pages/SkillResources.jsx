import { useState, useEffect } from 'react'
import { apiJson, apiFetch } from '../lib/api'
import { Plus, Search, X, BookOpen, ExternalLink, User, ChevronDown, ChevronUp } from 'lucide-react'

const T = {
  headerBg: 'bg-gradient-to-r from-slate-900 via-[#0A3A6A] to-[#B10428]',
  cardBg: 'bg-white',
  text: 'text-slate-800',
  textMuted: 'text-slate-500',
  border: 'border-slate-200',
  inputBg: 'bg-slate-50',
  primary: 'bg-[#0A3A6A] hover:bg-[#082d53] text-white',
  danger: 'text-red-500 hover:bg-red-50'
}

const ensureUrl = (url) => {
  if (!url) return '#'
  const trimmed = url.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  return 'https://' + trimmed
}

const CATEGORIES = ['All', 'Computer Science', 'Artificial Intelligence', 'Web Development', 'Data Science', 'Soft Skills', 'Cloud']
const CAT_COLORS = {
  'Computer Science': 'bg-blue-100 text-blue-800',
  'Artificial Intelligence': 'bg-purple-100 text-purple-800',
  'Web Development': 'bg-teal-100 text-teal-800',
  'Data Science': 'bg-emerald-100 text-emerald-800',
  'Soft Skills': 'bg-orange-100 text-orange-800',
  'Cloud': 'bg-sky-100 text-sky-800',
  'default': 'bg-slate-100 text-slate-800'
}

const SEED_RESOURCES = [
  {
    _id: 'seed-1',
    title: 'CS50: Introduction to Computer Science',
    link: 'https://cs50.harvard.edu',
    category: 'Computer Science',
    description: "Harvard's legendary intro course covering C, Python, SQL, and more",
    addedBy: 'Harvard University',
    addedByRole: 'institution'
  },
  {
    _id: 'seed-2',
    title: 'fast.ai - Practical Deep Learning',
    link: 'https://course.fast.ai',
    category: 'Artificial Intelligence',
    description: 'Free courses making deep learning accessible to everyone',
    addedBy: 'fast.ai',
    addedByRole: 'institution'
  },
  {
    _id: 'seed-3',
    title: 'freeCodeCamp',
    link: 'https://www.freecodecamp.org',
    category: 'Web Development',
    description: 'Learn web development with free interactive coding challenges',
    addedBy: 'freeCodeCamp',
    addedByRole: 'institution'
  },
  {
    _id: 'seed-4',
    title: 'Kaggle Learn',
    link: 'https://www.kaggle.com/learn',
    category: 'Data Science',
    description: 'Micro-courses for practical data science and ML skills',
    addedBy: 'Kaggle',
    addedByRole: 'institution'
  },
  {
    _id: 'seed-5',
    title: 'Google Cloud Skills Boost',
    link: 'https://www.cloudskillsboost.google',
    category: 'Cloud',
    description: 'Hands-on labs and courses for Google Cloud technologies',
    addedBy: 'Google',
    addedByRole: 'institution'
  }
]

export default function SkillResources({ user }) {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({ title: '', link: '', category: 'Computer Science', description: '', subject: '' })
  const [submitting, setSubmitting] = useState(false)
  
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    fetchResources()
  }, [])

  const fetchResources = async () => {
    try {
      setLoading(true)
      const data = await apiJson('/skillresources')
      setResources(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.link.trim()) {
      alert("Title and link are required");
      return;
    }
    
    setSubmitting(true)
    try {
      const payload = { ...formData };
      let link = payload.link.trim();
      if (!link.startsWith('http://') && !link.startsWith('https://')) {
        link = 'https://' + link;
      }
      payload.link = link;
      
      await apiJson('/skillresources', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      setShowAddModal(false)
      setFormData({ title: '', link: '', category: 'Computer Science', description: '', subject: '' })
      fetchResources()
    } catch (err) {
      console.error(err)
      alert(err.message || 'Failed to add resource. Make sure the link is a valid URL.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resource?')) return
    try {
      await apiFetch(`/skillresources/${id}`, { method: 'DELETE' })
      setResources(resources.filter(r => r._id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  const filtered = resources.filter(r => {
    const mSearch = search.toLowerCase()
    const matchSearch = r.title.toLowerCase().includes(mSearch) || (r.description && r.description.toLowerCase().includes(mSearch))
    const matchCat = categoryFilter === 'All' || r.category === categoryFilter
    return matchSearch && matchCat
  })
  
  const displayResources = (resources.length === 0 && search === '' && categoryFilter === 'All') 
    ? SEED_RESOURCES 
    : filtered

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-['Plus_Jakarta_Sans']">
      <div className={`${T.headerBg} text-white pt-12 pb-24 px-4 sm:px-6 lg:px-8`}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-8 h-8 text-blue-200" />
            <h1 className="text-3xl font-bold">Skill Resources</h1>
          </div>
          <p className="text-blue-100 max-w-2xl">
            Curated learning materials, tutorials, and tools to upgrade your skills. 
            Contribute your favorite resources to help the community.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12">
        <div className={`${T.cardBg} rounded-xl shadow-sm border ${T.border} p-4 sm:p-6 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between`}>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search resources..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 rounded-lg border ${T.border} ${T.inputBg} focus:outline-none focus:ring-2 focus:ring-[#0A3A6A]`}
              />
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${T.primary} font-medium transition-colors whitespace-nowrap`}
          >
            <Plus className="w-4 h-4" />
            Add Resource
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                categoryFilter === c 
                  ? 'bg-[#0A3A6A] text-white' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading resources...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500 bg-red-50 rounded-xl border border-red-100">{error}</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayResources.map(r => (
              <div key={r._id} className={`${T.cardBg} rounded-xl border ${T.border} overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col`}>
                <div 
                  className="p-5 cursor-pointer flex-1 flex flex-col"
                  onClick={() => setExpandedId(expandedId === r._id ? null : r._id)}
                >
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${CAT_COLORS[r.category] || CAT_COLORS.default}`}>
                      {r.category}
                    </span>
                    {expandedId === r._id ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                  </div>
                  <h3 className={`font-semibold ${T.text} mb-2 line-clamp-2`}>{r.title}</h3>
                  
                  <div className="mt-auto pt-4 flex items-center justify-between text-sm text-slate-500">
                    <div className="flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5" />
                      <span className="truncate">{r.addedBy || 'Unknown'} {r.addedByRole ? `(${r.addedByRole})` : ''}</span>
                    </div>
                  </div>
                </div>

                {expandedId === r._id && (
                  <div className={`p-5 border-t ${T.border} bg-slate-50 text-sm flex flex-col gap-3`}>
                    {r.description && (
                      <div>
                        <span className="font-semibold text-slate-700 block mb-1">Description</span>
                        <p className="text-slate-600">{r.description}</p>
                      </div>
                    )}
                    {r.subject && (
                      <div>
                        <span className="font-semibold text-slate-700 block mb-1">Subject</span>
                        <p className="text-slate-600">{r.subject}</p>
                      </div>
                    )}
                    <div className="pt-2 flex justify-between items-center">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(ensureUrl(r.link), '_blank');
                        }}
                        className="flex items-center gap-1.5 text-[#0A3A6A] hover:text-blue-800 font-medium bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        <ExternalLink size={14} />
                        Open Resource
                      </button>
                      
                      {!r._id.startsWith('seed-') && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(r._id) }}
                          className={`px-3 py-1.5 rounded-md ${T.danger} transition-colors font-medium text-sm`}
                          title="Delete resource"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {displayResources.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
                No resources found matching your criteria.
              </div>
            )}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`${T.cardBg} rounded-xl shadow-xl w-full max-w-md overflow-hidden`}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Add New Resource</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full p-2.5 rounded-lg border ${T.border} ${T.inputBg} focus:outline-none focus:ring-2 focus:ring-[#0A3A6A]`}
                  placeholder="e.g. React Official Docs"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">URL / Link *</label>
                <input
                  required
                  type="text"
                  value={formData.link}
                  onChange={e => setFormData({ ...formData, link: e.target.value })}
                  className={`w-full p-2.5 rounded-lg border ${T.border} ${T.inputBg} focus:outline-none focus:ring-2 focus:ring-[#0A3A6A]`}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className={`w-full p-2.5 rounded-lg border ${T.border} ${T.inputBg} focus:outline-none focus:ring-2 focus:ring-[#0A3A6A]`}
                >
                  {CATEGORIES.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject (Optional)</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  className={`w-full p-2.5 rounded-lg border ${T.border} ${T.inputBg} focus:outline-none focus:ring-2 focus:ring-[#0A3A6A]`}
                  placeholder="e.g. CS101"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full p-2.5 rounded-lg border ${T.border} ${T.inputBg} focus:outline-none focus:ring-2 focus:ring-[#0A3A6A] resize-none`}
                  placeholder="What is this resource about?"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={`px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${submitting ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : T.primary}`}
                >
                  {submitting ? 'Adding...' : 'Add Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}