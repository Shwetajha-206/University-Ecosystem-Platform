import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, User, ChevronRight, MapPin, Phone, Mail, AlertTriangle, Search, Users, BookOpen, ArrowDown, Shield, Award, TrendingUp, CheckCircle, Star, Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Register Complaint', action: 'login' },
  { label: 'View Status', action: 'login' },
  { label: 'Lost & Found', action: 'login' },
  { label: 'Community', action: 'scroll', target: 'announcements' },
  { label: 'Contact', action: 'scroll', target: 'footer' },
]

const FACILITIES = [
  { name: 'Modern Canteen', desc: 'Hygienic food service with diverse menu options for students and staff', img: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=400&q=80' },
  { name: 'Clean Washrooms', desc: 'Well-maintained facilities with regular cleaning and maintenance', img: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&q=80' },
  { name: 'Smart Classrooms', desc: 'Technology-enabled learning spaces with modern infrastructure', img: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&q=80' },
  { name: 'Library & Labs', desc: 'State-of-the-art research facilities and extensive book collection', img: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&q=80' },
]

const TESTIMONIALS = [
  { name: 'Priya Sharma', role: 'Administrative Officer', initial: 'P', text: 'As a staff member, I can now quickly address issues and communicate directly with students. It has made my job much more effective.' },
  { name: 'Arjun Mehta', role: '4th Year Student', initial: 'A', text: 'Finally, a platform where our voices are heard! I have seen real changes happen because of complaints raised here. It is empowering.' },
  { name: 'Neha Gupta', role: '2nd Year Student', initial: 'N', text: 'The lost and found feature has been incredibly helpful. I recovered my laptop within 24 hours of reporting it missing.' },
  { name: 'Dr. Rajesh Kumar', role: 'Dean of Student Affairs', initial: 'R', text: 'This platform has revolutionized how we handle student concerns. The transparency and efficiency have improved our response time by 70%.' },
]

const ANNOUNCEMENTS = [
  { title: 'New Complaint Categories Added', date: 'May 2, 2025', desc: 'New categories for better complaint classification including Infrastructure, Academic, and Hostel facilities.', tag: 'Update', tagColor: '#1e3a8a' },
  { title: 'Improved Response Time', date: 'April 28, 2025', desc: 'Complaint handling process optimized. Average response time reduced to 24 hours for all categories.', tag: 'Improvement', tagColor: '#166534' },
  { title: 'Community Chat Feature Live', date: 'April 25, 2025', desc: 'Connect with fellow students and staff through our new community chat feature. Share ideas and collaborate.', tag: 'New Feature', tagColor: '#6b21a8' },
  { title: 'Monthly Maintenance Schedule', date: 'April 20, 2025', desc: 'Platform maintenance scheduled for first Sunday of every month from 2 AM to 4 AM.', tag: 'Notice', tagColor: '#9a3412' },
]

const STATS = [
  { val: '10,000+', label: 'Students', icon: Users },
  { val: '500+', label: 'Faculty', icon: Award },
  { val: '98%', label: 'Resolution Rate', icon: TrendingUp },
  { val: '24hrs', label: 'Avg Response', icon: CheckCircle },
]

const FEATURES = [
  { icon: AlertTriangle, label: 'Register Complaints', desc: 'Submit and track campus issues in real time' },
  { icon: Search, label: 'Lost & Found', desc: 'Report and recover lost items instantly' },
  { icon: Users, label: 'Community Forum', desc: 'Connect and collaborate with peers' },
  { icon: BookOpen, label: 'Skill Resources', desc: 'Access curated learning materials' },
]

// ── Particle Canvas ───────────────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId, particles = []
    const COUNT = 75, MAX_DIST = 130

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    window.addEventListener('resize', resize)

    class Particle {
      constructor() { this.reset() }
      reset() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.vx = (Math.random() - 0.5) * 0.35
        this.vy = (Math.random() - 0.5) * 0.35
        this.r = Math.random() * 1.8 + 0.8
        this.alpha = Math.random() * 0.4 + 0.15
        this.pulse = Math.random() * Math.PI * 2
        this.pulseSpeed = Math.random() * 0.012 + 0.004
      }
      update() {
        this.x += this.vx; this.y += this.vy
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1
        this.pulse += this.pulseSpeed
        this.ca = this.alpha * (0.55 + 0.45 * Math.sin(this.pulse))
      }
      draw() {
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 5)
        g.addColorStop(0, `rgba(147,197,253,${this.ca})`)
        g.addColorStop(1, `rgba(147,197,253,0)`)
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r * 5, 0, Math.PI * 2)
        ctx.fillStyle = g; ctx.fill()
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(219,234,254,${Math.min(this.ca + 0.3, 1)})`; ctx.fill()
      }
    }

    for (let i = 0; i < COUNT; i++) particles.push(new Particle())

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => { p.update(); p.draw() })
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MAX_DIST) {
            const op = (1 - dist / MAX_DIST) * 0.15
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(147,197,253,${op})`
            ctx.lineWidth = 0.6; ctx.stroke()
          }
        }
      }
      animId = requestAnimationFrame(animate)
    }
    animate()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10" style={{ pointerEvents: 'none' }} />
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()
  const goLogin = () => navigate('/login')
  const goRegister = () => navigate('/login')
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const scrollTo = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMobileOpen(false) }

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div className="min-h-screen font-sans" style={{ background: '#f8fafc', color: '#0f172a' }}>

      {/* ═══════════════════════ NAVBAR ═══════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(30,58,138,0.1)',
          boxShadow: scrolled ? '0 4px 24px rgba(30,58,138,0.08)' : 'none',
        }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-black leading-tight" style={{ color: '#1e3a8a' }}>KR Mangalam University</p>
              <p className="text-xs leading-tight font-medium" style={{ color: '#64748b' }}>Campus Ecosystem Platform</p>
            </div>
            <div className="relative">
              <img src="/krm-logo.jpg" alt="KRM Logo" className="w-11 h-11 object-contain rounded-xl" style={{ border: '2px solid #dbeafe' }} />
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <button key={link.label}
                onClick={() => link.action === 'login' ? goLogin() : scrollTo(link.target)}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{ color: '#475569' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#1e3a8a'; e.currentTarget.style.background = '#eff6ff' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'transparent' }}>
                {link.label}
              </button>
            ))}
          </div>

          {/* Auth buttons */}
          <div className="hidden lg:flex items-center gap-2">
            <button onClick={goLogin}
              className="px-5 py-2 text-sm font-semibold rounded-xl border transition-all duration-200"
              style={{ color: '#1e3a8a', borderColor: '#bfdbfe' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#1e3a8a' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#bfdbfe' }}>
              Login
            </button>
            <button onClick={goRegister}
              className="px-5 py-2 text-sm font-bold rounded-xl text-white transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', boxShadow: '0 2px 12px rgba(37,99,235,0.35)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.45)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(37,99,235,0.35)' }}>
              Register Free
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button className="lg:hidden p-2 rounded-lg" onClick={() => setMobileOpen(!mobileOpen)}
            style={{ color: '#1e3a8a' }}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden px-6 pb-4 border-t" style={{ borderColor: '#e2e8f0', background: '#fff' }}>
            {NAV_LINKS.map(link => (
              <button key={link.label}
                onClick={() => link.action === 'login' ? (goLogin(), setMobileOpen(false)) : scrollTo(link.target)}
                className="block w-full text-left py-3 text-sm font-medium border-b transition-colors"
                style={{ color: '#475569', borderColor: '#f1f5f9' }}
                onMouseEnter={e => e.currentTarget.style.color = '#1e3a8a'}
                onMouseLeave={e => e.currentTarget.style.color = '#475569'}>
                {link.label}
              </button>
            ))}
            <div className="flex gap-3 mt-4">
              <button onClick={goLogin} className="flex-1 py-2.5 text-sm font-semibold rounded-xl border" style={{ color: '#1e3a8a', borderColor: '#bfdbfe' }}>Login</button>
              <button onClick={goRegister} className="flex-1 py-2.5 text-sm font-bold rounded-xl text-white" style={{ background: '#1e3a8a' }}>Register</button>
            </div>
          </div>
        )}
      </nav>

      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 overflow-hidden">

        {/* Background image + overlay */}
        <div className="absolute inset-0 z-0">
          <img src="/campus.png" alt="KR Mangalam University" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(10,20,70,0.93) 0%, rgba(20,50,140,0.87) 45%, rgba(10,25,80,0.93) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.18) 0%, transparent 65%)' }} />
        </div>

        {/* Particles */}
        <ParticleCanvas />

        {/* Content */}
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto w-full">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-8 text-xs font-bold tracking-widest uppercase"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#93c5fd', backdropFilter: 'blur(10px)' }}>
            <Shield size={12} style={{ color: '#60a5fa' }} />
            Official University Digital Platform
            <span className="flex items-center gap-1" style={{ color: '#86efac' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
              Live
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-black mb-5 tracking-tight leading-none" style={{ fontSize: 'clamp(2.8rem, 7vw, 5.5rem)' }}>
            <span className="block text-white" style={{ textShadow: '0 2px 30px rgba(0,0,0,0.4)' }}>Campus Ecosystem</span>
            <span className="block" style={{
              background: 'linear-gradient(90deg, #60a5fa 0%, #a5b4fc 50%, #818cf8 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>Platform</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base lg:text-lg mb-10 leading-relaxed max-w-2xl mx-auto" style={{ color: '#cbd5e1' }}>
            A unified digital platform for KR Mangalam University — register complaints, track resolutions, find lost items, and stay connected with your campus community.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 flex-wrap mb-16">
            <button onClick={goRegister}
              className="flex items-center gap-2 px-8 py-4 text-white font-bold rounded-2xl text-sm transition-all duration-300"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', boxShadow: '0 8px 28px rgba(59,130,246,0.5)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(59,130,246,0.65)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(59,130,246,0.5)' }}>
              Get Started Free <ChevronRight size={18} />
            </button>
            <button onClick={goLogin}
              className="flex items-center gap-2 px-8 py-4 font-semibold rounded-2xl text-sm transition-all duration-300"
              style={{ color: '#fff', border: '2px solid rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(10px)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)' }}>
              <User size={15} /> Login to Portal
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden max-w-2xl mx-auto"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(14px)' }}>
            {STATS.map((s, i) => (
              <div key={s.label} className="py-5 px-4 text-center relative" style={{ background: 'rgba(255,255,255,0.04)' }}>
                {i < STATS.length - 1 && (
                  <div className="absolute right-0 top-4 bottom-4 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                )}
                <p className="text-2xl font-black text-white">{s.val}</p>
                <p className="text-xs mt-1 font-medium" style={{ color: '#94a3b8' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="relative z-20 mt-12 animate-bounce cursor-pointer" onClick={() => scrollTo('features')}>
          <ArrowDown className="w-10 h-10 text-white opacity-80" />
        </div>
      </section>

      {/* ═══════════════════════ FEATURES ═══════════════════════ */}
      <section style={{ background: '#1e3a8a' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <button key={label} onClick={goLogin}
              className="flex items-center gap-3 p-4 rounded-xl text-left group transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(96,165,250,0.18)' }}>
                <Icon size={18} style={{ color: '#93c5fd' }} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{label}</p>
                <p className="text-xs mt-0.5" style={{ color: '#93c5fd' }}>{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ═══════════════════════ CAMPUS SPOTLIGHT ═══════════════════════ */}
      <section className="py-24" style={{ background: '#fff' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-4"
              style={{ background: '#eff6ff', color: '#1e3a8a', border: '1px solid #bfdbfe' }}>
              Our Campus
            </span>
            <h2 className="text-4xl font-black mb-4" style={{ color: '#0f172a' }}>World-Class Facilities</h2>
            <p className="max-w-xl mx-auto text-base" style={{ color: '#64748b' }}>
              Explore our state-of-the-art infrastructure designed for the best academic experience.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FACILITIES.map((f, i) => (
              <div key={f.name}
                className="rounded-2xl overflow-hidden group cursor-pointer transition-all duration-400"
                style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 24px 48px rgba(30,58,138,0.13)'; e.currentTarget.style.borderColor = '#bfdbfe' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = '#e2e8f0' }}>
                <div className="relative h-48 overflow-hidden">
                  <img src={f.img} alt={f.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)' }} />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-black text-white"
                    style={{ background: 'rgba(30,58,138,0.85)', backdropFilter: 'blur(4px)' }}>
                    0{i + 1}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-bold mb-1.5" style={{ color: '#0f172a' }}>{f.name}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ WHY US ═══════════════════════ */}
      <section className="py-24" style={{ background: '#f8fafc' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-5"
                style={{ background: '#eff6ff', color: '#1e3a8a', border: '1px solid #bfdbfe' }}>
                Why This Platform
              </span>
              <h2 className="text-4xl font-black mb-6 leading-tight" style={{ color: '#0f172a' }}>
                Designed for a<br />
                <span style={{ color: '#1e3a8a' }}>Better Campus Life</span>
              </h2>
              <p className="text-base leading-relaxed mb-8" style={{ color: '#64748b' }}>
                KR Mangalam University's Ecosystem Platform bridges the gap between students, faculty, and administration — making campus life more transparent, efficient, and connected.
              </p>
              <div className="space-y-4">
                {[
                  'Submit and track complaints in real-time with unique IDs',
                  'Lost & Found system to recover belongings quickly',
                  'Direct feedback to faculty for academic improvement',
                  'Community forum to collaborate and share ideas',
                  'Vendor ratings and canteen service feedback',
                ].map((point, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: '#dbeafe' }}>
                      <CheckCircle size={12} style={{ color: '#1e3a8a' }} />
                    </div>
                    <p className="text-sm" style={{ color: '#475569' }}>{point}</p>
                  </div>
                ))}
              </div>
              <button onClick={goRegister}
                className="mt-8 flex items-center gap-2 px-7 py-3.5 text-white font-bold rounded-xl text-sm transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', boxShadow: '0 4px 16px rgba(30,58,138,0.3)', display: 'inline-flex' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(30,58,138,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(30,58,138,0.3)' }}>
                Join Now <ChevronRight size={16} />
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-5">
              {[
                { val: '10,000+', label: 'Active Students', desc: 'Registered on the platform', color: '#eff6ff', accent: '#1e3a8a' },
                { val: '500+', label: 'Faculty Members', desc: 'Engaged with the system', color: '#f0fdf4', accent: '#166534' },
                { val: '98%', label: 'Resolution Rate', desc: 'Complaints resolved on time', color: '#faf5ff', accent: '#6b21a8' },
                { val: '24 hrs', label: 'Avg Response', desc: 'For all submissions', color: '#fff7ed', accent: '#9a3412' },
              ].map(s => (
                <div key={s.label} className="p-6 rounded-2xl transition-all duration-300"
                  style={{ background: s.color, border: `1px solid ${s.accent}20` }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = `0 8px 24px ${s.accent}18` }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}>
                  <p className="text-3xl font-black mb-1" style={{ color: s.accent }}>{s.val}</p>
                  <p className="font-bold text-sm mb-1" style={{ color: '#0f172a' }}>{s.label}</p>
                  <p className="text-xs" style={{ color: '#64748b' }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ TESTIMONIALS ═══════════════════════ */}
      <section className="py-24" style={{ background: '#fff' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-4"
              style={{ background: '#eff6ff', color: '#1e3a8a', border: '1px solid #bfdbfe' }}>
              Testimonials
            </span>
            <h2 className="text-4xl font-black mb-4" style={{ color: '#0f172a' }}>Voices from Our Community</h2>
            <p className="max-w-xl mx-auto text-base" style={{ color: '#64748b' }}>
              Hear from students, faculty, and administrators who use the platform every day.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name}
                className="rounded-2xl p-6 flex flex-col justify-between transition-all duration-300"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', aspectRatio: '1 / 1' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(30,58,138,0.1)'; e.currentTarget.style.borderColor = '#bfdbfe'; e.currentTarget.style.transform = 'translateY(-4px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)' }}>
                {/* Stars */}
                <div>
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => <Star key={i} size={13} fill="#fbbf24" style={{ color: '#fbbf24' }} />)}
                  </div>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: '#475569' }}>"{t.text}"</p>
                </div>
                <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid #f1f5f9' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)' }}>
                    {t.initial}
                  </div>
                  <div>
                    <p className="text-xs font-black" style={{ color: '#0f172a' }}>{t.name}</p>
                    <p className="text-xs font-medium" style={{ color: '#1e3a8a' }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ ANNOUNCEMENTS ═══════════════════════ */}
      <section id="announcements" className="py-24" style={{ background: '#f8fafc' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-4"
              style={{ background: '#eff6ff', color: '#1e3a8a', border: '1px solid #bfdbfe' }}>
              Latest
            </span>
            <h2 className="text-4xl font-black mb-4" style={{ color: '#0f172a' }}>Announcements</h2>
            <p className="max-w-xl mx-auto text-base" style={{ color: '#64748b' }}>
              Stay informed about platform updates, new features, and important campus news.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {ANNOUNCEMENTS.map(a => (
              <div key={a.title}
                className="flex gap-4 p-6 rounded-2xl transition-all duration-300 cursor-pointer"
                style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 32px rgba(30,58,138,0.1)'; e.currentTarget.style.borderColor = '#bfdbfe'; e.currentTarget.style.transform = 'translateY(-3px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${a.tagColor}12`, border: `1.5px solid ${a.tagColor}25` }}>
                  <Bell size={18} style={{ color: a.tagColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold"
                      style={{ background: `${a.tagColor}12`, color: a.tagColor }}>
                      {a.tag}
                    </span>
                    <span className="text-xs" style={{ color: '#94a3b8' }}>{a.date}</span>
                  </div>
                  <h3 className="font-bold text-sm mb-1.5" style={{ color: '#0f172a' }}>{a.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ CTA SECTION ═══════════════════════ */}
      <section className="py-20 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f1f5c 0%, #1e3a8a 55%, #1e40af 100%)' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(59,130,246,0.15) 0%, transparent 60%)' }} />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-white mb-4">Ready to Get Started?</h2>
          <p className="text-base mb-8" style={{ color: '#93c5fd' }}>
            Join thousands of KR Mangalam University students and staff on the official campus platform.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button onClick={goRegister}
              className="px-8 py-3.5 text-sm font-black rounded-2xl text-white transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.3)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'translateY(0)' }}>
              Create Free Account
            </button>
            <button onClick={goLogin}
              className="px-8 py-3.5 text-sm font-black rounded-2xl transition-all duration-200"
              style={{ background: '#fff', color: '#1e3a8a', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)' }}>
              Login to Portal →
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FOOTER ═══════════════════════ */}
      <footer id="footer" style={{ background: '#0a0f2e', borderTop: '1px solid #1e293b' }}>
        <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 sm:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <img src="/krm-logo.jpg" alt="KRM Logo" className="w-11 h-11 object-contain rounded-xl"
                style={{ border: '2px solid rgba(30,58,138,0.5)' }} />
              <div>
                <p className="text-sm font-black text-white">KR Mangalam University</p>
                <p className="text-xs" style={{ color: '#475569' }}>Campus Ecosystem Platform</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>
              Empowering students and staff with a unified digital platform for a smarter campus experience.
            </p>
          </div>
          <div>
            <h4 className="font-black mb-5 text-sm text-white uppercase tracking-wider">Quick Links</h4>
            {NAV_LINKS.map(l => (
              <button key={l.label}
                onClick={() => l.action === 'login' ? goLogin() : scrollTo(l.target)}
                className="block text-sm mb-3 transition-colors text-left"
                style={{ color: '#475569' }}
                onMouseEnter={e => e.target.style.color = '#60a5fa'}
                onMouseLeave={e => e.target.style.color = '#475569'}>
                → {l.label}
              </button>
            ))}
          </div>
          <div>
            <h4 className="font-black mb-5 text-sm text-white uppercase tracking-wider">Contact</h4>
            <div className="space-y-4">
              {[
                { icon: MapPin, text: 'KR Mangalam University, Sohna Road, Gurugram, Haryana' },
                { icon: Phone, text: '+91 98765 43210' },
                { icon: Mail, text: 'support@krmangalam.edu.in' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3 text-sm" style={{ color: '#475569' }}>
                  <Icon size={14} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-5 flex items-center justify-between flex-wrap gap-3"
          style={{ borderTop: '1px solid #1e293b' }}>
          <p className="text-xs" style={{ color: '#334155' }}>© 2025 KR Mangalam University. All rights reserved.</p>
          <p className="text-xs" style={{ color: '#334155' }}>Campus Ecosystem Platform v2.0</p>
        </div>
      </footer>

    </div>
  )
}