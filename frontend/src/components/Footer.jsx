import { Mail, Phone, MapPin } from "lucide-react";

/* Inline SVG social icons (lucide-react v1.x removed brand icons) */
const FacebookIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12z"/></svg>
);
const TwitterIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
);
const LinkedinIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
);
const InstagramIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
);

export function Footer() {
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  return (
    <footer className="text-gray-300" style={{ background: "linear-gradient(to right, #0A3A6A 40%, #B10428 100%)" }}>
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* About */}
          <div className="anim-card">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-12 w-12 mb-6 object-contain"
            />
            <p className="text-sm leading-relaxed text-gray-400">
              Empowering students and staff with a transparent platform for 
              addressing concerns and building a better campus community.
            </p>
          </div>

          {/* Quick Links */}
          <div className="anim-card">
            <h3 className="text-white font-semibold mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li><button onClick={() => scrollToSection('complaints')} className="text-sm hover:text-white transition-smooth">Register Complaint</button></li>
              <li><button onClick={() => scrollToSection('status')} className="text-sm hover:text-white transition-smooth">Track Status</button></li>
              <li><button onClick={() => scrollToSection('lost-found')} className="text-sm hover:text-white transition-smooth">Lost & Found</button></li>
              <li><button onClick={() => scrollToSection('community')} className="text-sm hover:text-white transition-smooth">Community</button></li>
            </ul>
          </div>

          {/* Support */}
          <div className="anim-card">
            <h3 className="text-white font-semibold mb-6">Support</h3>
            <ul className="space-y-3">
              <li><button onClick={() => window.open('/help', '_blank')} className="text-sm hover:text-white transition-smooth">Help Center</button></li>
              <li><button onClick={() => window.open('/faq', '_blank')} className="text-sm hover:text-white transition-smooth">FAQs</button></li>
              <li><button onClick={() => window.open('/privacy', '_blank')} className="text-sm hover:text-white transition-smooth">Privacy Policy</button></li>
              <li><button onClick={() => window.open('/terms', '_blank')} className="text-sm hover:text-white transition-smooth">Terms of Service</button></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="anim-card">
            <h3 className="text-white font-semibold mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm">KR Mangalam University, Gurugram, Haryana</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm">+91 124 2793000</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm">support@krmangalam.edu.in</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Social & Copyright */}
        <div className="mt-16 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm text-gray-400">
            © 2025 KR Mangalam University. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <button aria-label="Facebook" onClick={() => window.open('https://facebook.com', '_blank')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-smooth hover-lift text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-red-900">
              <FacebookIcon size={18} />
            </button>
            <button aria-label="X (Twitter)" onClick={() => window.open('https://twitter.com', '_blank')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-smooth hover-lift text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-red-900">
              <TwitterIcon size={18} />
            </button>
            <button aria-label="LinkedIn" onClick={() => window.open('https://linkedin.com', '_blank')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-smooth hover-lift text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-red-900">
              <LinkedinIcon size={18} />
            </button>
            <button aria-label="Instagram" onClick={() => window.open('https://instagram.com', '_blank')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-smooth hover-lift text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-red-900">
              <InstagramIcon size={18} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
