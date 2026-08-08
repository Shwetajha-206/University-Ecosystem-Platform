import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Eye, EyeOff, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSessionState } from '../hooks/useSessionState'
import { apiJson } from '../lib/api'
import { COURSES, SEMESTERS, SECTIONS } from '../lib/classOptions'
import { useToast } from '../hooks/useToast'

const ALL_ROLES = [
  { id: 'student', label: 'Student', color: '#2563eb' },
  { id: 'cr', label: 'Class Representative', color: '#16a34a' },
  { id: 'vendor', label: 'Vendor', color: '#f97316' },
  { id: 'admin', label: 'Admin', color: '#9333ea' },
]
                         
const REGISTER_ROLES = ['student', 'vendor']
const VENDOR_SHOPS = ['Campus Canteen', 'Book Store', 'Stationery Shop', 'Photocopy Center', 'Medical Store']
const FALLBACK_BRANCHES = ['CSE', 'ECE', 'ME', 'CE', 'IT', 'EEE', 'Other']

/* helper: darken a hex color by a percentage */
function darkenColor(hex, percent = 20) {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, (num >> 16) - Math.round(2.55 * percent))
  const g = Math.max(0, ((num >> 8) & 0x00ff) - Math.round(2.55 * percent))
  const b = Math.max(0, (num & 0x0000ff) - Math.round(2.55 * percent))
  return `rgb(${r},${g},${b})`
}

/* shared inline style for every input / select to override the green focus ring */
const inputStyle = {
  outline: 'none',
  width: '100%',
  padding: '0.625rem 0.875rem',
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  borderRadius: '0.75rem',
  border: '1.5px solid #e2e8f0',
  backgroundColor: '#f8fafc',
  color: '#1e293b',
  transition: 'all 0.2s ease',
}

const inputFocusClass =
  'w-full px-3.5 py-2.5 text-sm rounded-xl border-[1.5px] border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200'

export default function Login() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const [email, setEmail] = useSessionState('login:email', '')
  const [password, setPassword] = useState('')
  const form = { email, password }
  const setForm = (next) => {
    if (typeof next === 'function') {
      const updated = next({ email, password })
      setEmail(updated.email ?? email)
      setPassword(updated.password ?? password)
    } else {
      if (next.email !== undefined) setEmail(next.email)
      if (next.password !== undefined) setPassword(next.password)
    }
  }
  const [showPass, setShowPass] = useState(false)
  const [selectedRole, setSelectedRole] = useState('student')
  const [showDropdown, setShowDropdown] = useState(false)
  const [name, setName] = useState('')
  const [selectedShop, setSelectedShop] = useState('Campus Canteen')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [enrollmentNumber, setEnrollmentNumber] = useState('')
  const [course, setCourse] = useState('B.Tech')
  const [branch, setBranch] = useState('CSE')
  const [semester, setSemester] = useState('1')
  const [section, setSection] = useState('A')
  const [branches, setBranches] = useState(FALLBACK_BRANCHES)

  useEffect(() => {
    apiJson('/class/registration-options')
      .then(data => {
        if (data.branches?.length) setBranches(data.branches)
      })
      .catch(() => {})
  }, [])

  const visibleRoles = isRegister
    ? ALL_ROLES.filter(r => REGISTER_ROLES.includes(r.id))
    : ALL_ROLES

  const selectedRoleObj = ALL_ROLES.find(r => r.id === selectedRole)
  const isStudentOrCR = selectedRole === 'student' || selectedRole === 'cr'

  const handleRoleSwitch = (toRegister) => {
    setIsRegister(toRegister)
    setError('')
    if (toRegister && !REGISTER_ROLES.includes(selectedRole)) {
      setSelectedRole('student')
    }
  }

  const handleSubmit = async () => {
    setError('')
    if (!form.email || !form.password) { setError('Enter email and password both'); return }
    if (isRegister && selectedRole !== 'vendor' && !name.trim()) { setError('Full name Fill '); return }
    if (isRegister && isStudentOrCR && !enrollmentNumber.trim()) { setError('Enrollment number Fill '); return }
    setLoading(true)
    try {
      if (isRegister) {
        const loginName = selectedRole === 'vendor' ? selectedShop : name.trim()
        const body = {
          name: loginName,
          email: form.email,
          password: form.password,
          role: selectedRole,
          shop: selectedRole === 'vendor' ? selectedShop : null,
          ...(isStudentOrCR && { enrollmentNumber, course, branch, semester, section })
        }
        const user = await register(body)
        success('Account created successfully!')
        navigate(`/${user.role}/dashboard`, { replace: true })
      } else {
        const user = await login(form.email, form.password)
        success('Login successful!')
        navigate(`/${user.role}/dashboard`, { replace: true })
      }
    } catch (err) {
      showError(err.message || 'Server se connect nahi ho pa raha. Backend chal raha hai?')
      setError(err.message || 'Server se connect nahi ho pa raha. Backend chal raha hai?')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex bg-slate-50 font-plus-jakarta">
      {/* ── Left Side: Image with branding overlay ── */}
      <div className="relative hidden md:flex md:w-1/2 lg:w-3/5 flex-col justify-between p-12 text-white">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img src="/krmu.png" alt="KR Mangalam University" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-slate-950/20 backdrop-brightness-95" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-slate-950/30" />
        </div>

        {/* Branding top-left */}
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 focus:outline-none text-left">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-lg">
              <img
                src="/logo.png"
                alt="KRM Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-extrabold tracking-tight drop-shadow-sm">KR Mangalam University</span>
              <span className="text-xs text-white/95 font-medium tracking-wide drop-shadow-sm">Campus Ecosystem Platform</span>
            </div>
          </button>
        </div>

        {/* Branding quote bottom */}
        <div className="relative z-10 max-w-lg">
          <h2 className="text-3xl font-extrabold tracking-tight mb-2 drop-shadow">Your Digital Campus Companion</h2>
          <p className="text-sm text-white/90 leading-relaxed drop-shadow-sm">
            Access notices, report lost items, voice grievances, and interact with the campus ecosystem seamlessly.
          </p>
        </div>
      </div>

      {/* ── Right Side: Form card ── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 md:w-1/2 lg:w-2/5 bg-white">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Branding (only visible on small screens) */}
          <div className="flex items-center gap-3 md:hidden mb-2">
            <button onClick={() => navigate('/')} className="flex items-center gap-3 focus:outline-none text-left">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center p-1 shadow">
                <img
                  src="/logo.png"
                  alt="KRM Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-bold text-gray-900">KR Mangalam University</span>
                <span className="text-[10px] text-gray-500 font-medium">Campus Ecosystem Platform</span>
              </div>
            </button>
          </div>

          {/* Form Header */}
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {isRegister ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-xs text-gray-400">
              {isRegister ? 'Register your account to continue' : 'Login to your account to continue'}
            </p>
          </div>

          {/* Tabs switch */}
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => handleRoleSwitch(false)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                !isRegister ? 'bg-[#0A3A6A] text-white shadow' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => handleRoleSwitch(true)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                isRegister ? 'bg-[#0A3A6A] text-white shadow' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Register
            </button>
          </div>

          {/* Role Dropdown */}
          <div className="relative">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Select Role</label>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold transition-all duration-200 hover:bg-slate-50"
              style={{ color: selectedRoleObj?.color }}
            >
              <span>{selectedRoleObj?.label}</span>
              <ChevronDown size={16} className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
                {visibleRoles.map(role => (
                  <button
                    key={role.id}
                    onClick={() => { setSelectedRole(role.id); setShowDropdown(false) }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 transition-colors duration-150 ${selectedRole === role.id ? 'bg-slate-50/55' : ''}`}
                    style={{ color: role.color }}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Vendor Shop */}
            {selectedRole === 'vendor' && (
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Select Your Shop</label>
                <select className={inputFocusClass} style={inputStyle} value={selectedShop} onChange={e => setSelectedShop(e.target.value)}>
                  {VENDOR_SHOPS.map(shop => <option key={shop}>{shop}</option>)}
                </select>
              </div>
            )}

            {/* Full Name */}
            {isRegister && selectedRole !== 'vendor' && (
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Full Name</label>
                <input className={inputFocusClass} style={inputStyle} placeholder="e.g. Rahul Sharma"
                  value={name} onChange={e => setName(e.target.value)} />
              </div>
            )}

            {/* Student/CR fields */}
            {isRegister && isStudentOrCR && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Enrollment Number</label>
                  <input className={inputFocusClass} style={inputStyle} placeholder="e.g. 2401201127"
                    value={enrollmentNumber} onChange={e => setEnrollmentNumber(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Course</label>
                    <select className={inputFocusClass} style={inputStyle} value={course} onChange={e => setCourse(e.target.value)}>
                      {COURSES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Branch</label>
                    <select className={inputFocusClass} style={inputStyle} value={branch} onChange={e => setBranch(e.target.value)}>
                      {branches.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Semester</label>
                    <select className={inputFocusClass} style={inputStyle} value={semester} onChange={e => setSemester(e.target.value)}>
                      {SEMESTERS.map(s => <option key={s}>Sem {s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Section</label>
                    <select className={inputFocusClass} style={inputStyle} value={section} onChange={e => setSection(e.target.value)}>
                      {SECTIONS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
              <input className={inputFocusClass} style={inputStyle} type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input className={inputFocusClass + ' pr-10'} style={inputStyle} type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })} />
                <button onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl px-4 py-2.5 font-medium">
                ⚠️ {error}
              </div>
            )}

            {/* Submit Button */}
            <button onClick={handleSubmit} disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 mt-2 disabled:opacity-60 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
              style={{
                background: `linear-gradient(135deg, ${selectedRoleObj?.color} 0%, ${darkenColor(selectedRoleObj?.color || '#2563eb', 25)} 100%)`,
                boxShadow: `0 4px 14px ${selectedRoleObj?.color}40`,
              }}
            >
              {loading ? '⏳ Please wait...' : isRegister ? '🎓 Register' : `Login`}
            </button>
          </div>

          {/* Toggle Login/Register footer */}
          <div className="text-center pt-2">
            <p className="text-xs text-gray-400">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}
              <button onClick={() => handleRoleSwitch(!isRegister)} className="text-blue-600 font-bold ml-1 hover:underline transition-colors">
                {isRegister ? 'Login' : 'Register'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}