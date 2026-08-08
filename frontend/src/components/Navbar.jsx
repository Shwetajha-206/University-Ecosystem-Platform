import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, User, Menu, X, Home, FileText, Search, Package, Phone } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "../hooks/useToast";
import { apiJson } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const NAV_LINKS = [
  { href: "#complaints", label: "Register Complaint", icon: FileText },
  { href: "#status",     label: "View Status",       icon: Search },
  { href: "#lost-found", label: "Lost & Found",      icon: Package },
  { href: "#community",  label: "Community",         icon: Home },
  { href: "#contact",    label: "Contact",           icon: Phone },
];

const NOTIFICATION_TYPES = {
  notice: { color: 'bg-blue-100 text-blue-800', icon: '📢' },
  announcement: { color: 'bg-purple-100 text-purple-800', icon: '📣' },
  emergency: { color: 'bg-red-100 text-red-800', icon: '🚨' },
  alert: { color: 'bg-orange-100 text-orange-800', icon: '⚠️' },
};

export function Navbar({ onLoginClick, onRegisterClick }) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const [open, setOpen]         = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { error: showError } = useToast();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    if (user) {
      fetchUnreadCount();
    }
    return () => window.removeEventListener("scroll", onScroll);
  }, [user]);

  // lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('http://localhost:5000/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      } else {
        throw new Error('Failed to load notifications');
      }
    } catch (err) {
      showError('Could not load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleNotifClick = () => {
    if (!notifOpen) {
      fetchNotifications();
    }
    setNotifOpen(!notifOpen);
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUnreadCount();
      fetchNotifications();
    } catch (err) {
      showError('Failed to mark notification as read');
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    await logout();
    window.location.reload();
  };

  const gradientStyle = { background: "linear-gradient(to right, #0A3A6A 40%, #B10428 100%)" };

  const isNotifRead = (notif) => {
    return user && notif.readBy && notif.readBy.includes(user.email);
  };

  return (
    <>
      {/* ── NAVBAR with glassmorphism scroll transition ── */}
      <nav
        id="main-navbar"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "shadow-lg"
            : ""
        }`}
        style={
          scrolled
            ? {
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(10,58,106,0.08)',
              }
            : gradientStyle
        }
      >
        <div className="h-1" style={gradientStyle} />
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-3 focus:outline-none"
              aria-label="Go to home"
            >
              <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
              <div className="flex flex-col leading-tight">
                <span className={`text-sm font-bold transition-colors duration-300 ${scrolled ? "text-gray-900" : "text-white"}`}>
                  Ecosystem Of
                </span>
                <span className={`text-xs font-medium transition-colors duration-300 ${scrolled ? "text-gray-700" : "text-white/90"}`}>
                  KR Mangalam University
                </span>
              </div>
            </button>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-6">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className={`text-xs font-medium transition-all duration-300 ${
                    scrolled
                      ? "text-gray-900 hover:text-blue-600"
                      : "text-white hover:text-white/80"
                  }`}
                >
                  {l.label}
                </a>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              {user ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(`/${user.role}/dashboard`)}
                    className={`p-2 rounded-full border transition-all duration-300 focus:outline-none ${
                      scrolled 
                        ? "border-gray-300 text-gray-900 hover:bg-gray-100" 
                        : "border-white/20 text-white hover:bg-white/10"
                    }`}
                    title="Go to Dashboard"
                  >
                    <User size={18} />
                  </button>
                  <Button
                    size="sm"
                    onClick={handleLogout}
                    className={`px-4 py-1.5 text-xs ${
                      scrolled ? "text-white" : "bg-white text-gray-900 hover:bg-gray-100"
                    }`}
                    style={scrolled ? gradientStyle : {}}
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onLoginClick}
                    className={`border px-4 py-1.5 text-xs hidden sm:flex transition-all duration-300 ${
                      scrolled
                        ? "border-gray-300 text-gray-900 hover:bg-gray-50"
                        : "border-white text-white hover:bg-white/10"
                    }`}
                  >
                    Login
                  </Button>
                  <Button
                    size="sm"
                    onClick={onRegisterClick}
                    className={`px-4 py-1.5 text-xs hidden sm:flex transition-all duration-300 ${
                      scrolled ? "text-white" : "bg-white text-gray-900 hover:bg-gray-100"
                    }`}
                    style={scrolled ? gradientStyle : {}}
                  >
                    Register
                  </Button>
                </>
              )}

              {/* Hamburger — mobile only */}
              <button
                aria-label="Open menu"
                onClick={() => setOpen(true)}
                className={`lg:hidden p-2 rounded-lg transition-smooth focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  scrolled ? "hover:bg-gray-100" : "hover:bg-white/10"
                }`}
              >
                <Menu size={18} className={scrolled ? "text-gray-900" : "text-white"} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── MOBILE DRAWER ── */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[60] bg-black/50"
          />

          {/* Drawer panel */}
          <div className="fixed top-0 right-0 h-full w-72 z-[70] bg-white flex flex-col shadow-xl">

            {/* Drawer header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={gradientStyle}
            >
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
                <span className="text-white text-sm font-semibold">KR Mangalam</span>
              </div>
              <button
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {NAV_LINKS.map((l) => {
                const Icon = l.icon;
                return (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-smooth"
                  >
                    <Icon size={16} className="text-gray-400" />
                    {l.label}
                  </a>
                );
              })}
            </nav>

            {/* Drawer footer — auth buttons */}
            <div className="px-4 pb-6 pt-4 border-t space-y-2">
              {user ? (
                <>
                  <p className="text-xs text-gray-500 px-3 mb-2 truncate">{user.email}</p>
                  <button
                    onClick={() => { setOpen(false); navigate(`/${user.role}/dashboard`); }}
                    className="w-full py-2.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-smooth mb-2"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-smooth"
                    style={gradientStyle}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setOpen(false); onLoginClick(); }}
                    className="w-full py-2.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-smooth"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => { setOpen(false); onRegisterClick(); }}
                    className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-smooth"
                    style={gradientStyle}
                  >
                    Register
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
