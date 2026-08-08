import { useState } from 'react'
import { Mail, Hash, GraduationCap, BookMarked, Users, Edit3, Save, X, CheckCircle, User, Star, AlertTriangle, Shield } from 'lucide-react'
import { apiJson } from '../lib/api'
import { COURSES, SEMESTERS, SECTIONS } from '../lib/classOptions'

const T = {
  headerBg: 'bg-gradient-to-r from-slate-900 via-[#0A3A6A] to-[#B10428]',
  cardBg: 'bg-white',
  text: 'text-slate-800',
  textMuted: 'text-slate-500',
  border: 'border-slate-200',
  inputBg: 'bg-slate-50',
  primary: 'bg-[#0A3A6A] hover:bg-[#082d53] text-white',
}

export default function MyAccount({ user, onUserUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    enrollmentNumber: user?.enrollmentNumber || '',
    course: user?.course || '',
    branch: user?.branch || '',
    semester: user?.semester || '',
    section: user?.section || ''
  })
  
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const handleSave = async () => {
    try {
      setSaving(true)
      setMsg(null)
      const updatedUser = await apiJson('/api/auth/me', {
        method: 'PUT',
        body: JSON.stringify(formData)
      })
      onUserUpdate(updatedUser)
      setIsEditing(false)
      setMsg({ type: 'success', text: 'Profile updated successfully!' })
      setTimeout(() => setMsg(null), 3000)
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const roleLabels = {
    student: 'Student',
    cr: 'Class Representative',
    admin: 'Administrator'
  }
  const displayRole = roleLabels[user?.role] || user?.role

  const getRoleIcon = () => {
    if (user?.role === 'admin') return <Shield className="w-5 h-5 text-red-500" />
    if (user?.role === 'cr') return <Star className="w-5 h-5 text-yellow-500" />
    return <User className="w-5 h-5 text-blue-500" />
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-['Plus_Jakarta_Sans']">
      <div className={`${T.headerBg} text-white pt-12 pb-24 px-4 sm:px-6 lg:px-8`}>
        <div className="max-w-4xl mx-auto flex items-center gap-6">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold backdrop-blur-sm border-2 border-white/40 shadow-lg">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">{user?.name}</h1>
            <div className="flex items-center gap-2 text-blue-100 bg-black/20 w-fit px-3 py-1 rounded-full text-sm">
              {getRoleIcon()}
              <span>{displayRole}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12">
        <div className={`${T.cardBg} rounded-xl shadow-sm border ${T.border} overflow-hidden`}>
          
          <div className="p-6 sm:p-8 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-xl font-bold text-slate-800">Profile Details</h2>
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <Edit3 className="w-4 h-4" /> Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    setIsEditing(false)
                    setFormData({
                      name: user?.name || '',
                      enrollmentNumber: user?.enrollmentNumber || '',
                      course: user?.course || '',
                      branch: user?.branch || '',
                      semester: user?.semester || '',
                      section: user?.section || ''
                    })
                    setMsg(null)
                  }}
                  className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg ${T.primary} transition-colors shadow-sm ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          <div className="p-6 sm:p-8">
            {msg && (
              <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 border ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {msg.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
                <span className="font-medium">{msg.text}</span>
              </div>
            )}

            {!isEditing ? (
              <div className="space-y-8">
                {/* Personal Information */}
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Personal Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <InfoItem icon={<User />} label="Full Name" value={user?.name} />
                    <InfoItem icon={<Mail />} label="Email Address" value={user?.email} />
                    <InfoItem icon={<Hash />} label="Enrollment Number" value={user?.enrollmentNumber} />
                  </div>
                </div>

                {/* Academic Details */}
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Academic Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <InfoItem icon={<GraduationCap />} label="Course" value={user?.course} />
                    <InfoItem icon={<BookMarked />} label="Branch" value={user?.branch} />
                    <InfoItem icon={<Users />} label="Semester & Section" value={user?.semester && user?.section ? `Semester ${user?.semester} • Section ${user?.section}` : null} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className={`w-full p-2.5 rounded-lg border ${T.border} ${T.inputBg} focus:outline-none focus:ring-2 focus:ring-[#0A3A6A]`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email (Read Only)</label>
                  <input 
                    type="email" 
                    value={user?.email || ''} 
                    disabled
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Enrollment Number</label>
                  <input 
                    type="text" 
                    value={formData.enrollmentNumber} 
                    onChange={e => setFormData({...formData, enrollmentNumber: e.target.value})}
                    className={`w-full p-2.5 rounded-lg border ${T.border} ${T.inputBg} focus:outline-none focus:ring-2 focus:ring-[#0A3A6A]`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Course</label>
                  <select 
                    value={formData.course} 
                    onChange={e => setFormData({...formData, course: e.target.value})}
                    className={`w-full p-2.5 rounded-lg border ${T.border} ${T.inputBg} focus:outline-none focus:ring-2 focus:ring-[#0A3A6A]`}
                  >
                    <option value="">Select Course</option>
                    {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Branch</label>
                  <input 
                    type="text" 
                    value={formData.branch} 
                    onChange={e => setFormData({...formData, branch: e.target.value})}
                    placeholder="e.g. Computer Science"
                    className={`w-full p-2.5 rounded-lg border ${T.border} ${T.inputBg} focus:outline-none focus:ring-2 focus:ring-[#0A3A6A]`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Semester</label>
                  <select 
                    value={formData.semester} 
                    onChange={e => setFormData({...formData, semester: e.target.value})}
                    className={`w-full p-2.5 rounded-lg border ${T.border} ${T.inputBg} focus:outline-none focus:ring-2 focus:ring-[#0A3A6A]`}
                  >
                    <option value="">Select Semester</option>
                    {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Section</label>
                  <select 
                    value={formData.section} 
                    onChange={e => setFormData({...formData, section: e.target.value})}
                    className={`w-full p-2.5 rounded-lg border ${T.border} ${T.inputBg} focus:outline-none focus:ring-2 focus:ring-[#0A3A6A]`}
                  >
                    <option value="">Select Section</option>
                    {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex gap-4 p-4 rounded-xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-colors">
      <div className="mt-1 text-[#0A3A6A] opacity-80">
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-slate-800 font-medium break-all">{value || <span className="text-slate-400 italic">Not specified</span>}</p>
      </div>
    </div>
  )
}