import { Button } from "./ui/button";
import { ArrowRight, FileText, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export function HeroSection({ onRegisterClick, onLoginClick }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Ken Burns zoom */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat anim-ken-burns"
        style={{
          backgroundImage:
            "url('https://www.krmangalam.edu.in/_next/image?url=https%3A%2F%2Ftruthful-cabbage-82fd27e8f6.media.strapiapp.com%2Fwebsite_image_02_5e163bfc52.png&w=2048&q=75')",
          backgroundAttachment: 'fixed',
        }}
      />
      {/* Overlay */}
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(10, 58, 106, 0.65)" }} />

      {/* Floating decorative elements with mouse parallax */}
      <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden">
        <div className="anim-mouse-parallax anim-float absolute top-24 left-[10%] w-20 h-20 rounded-full opacity-30"
          data-parallax-strength="25"
          style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.4), transparent)' }} />
        <div className="anim-mouse-parallax anim-float-delay absolute top-[40%] right-[8%] w-28 h-28 rounded-full opacity-20"
          data-parallax-strength="15"
          style={{ background: 'radial-gradient(circle, rgba(165,180,252,0.3), transparent)' }} />
        <div className="anim-mouse-parallax anim-float-slow absolute bottom-[25%] left-[15%] w-16 h-16 rounded-full opacity-25"
          data-parallax-strength="30"
          style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.3), transparent)' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 container-custom text-center text-white">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight drop-shadow-lg anim-entrance anim-words">
            University Ecosystem Platform
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-white/95 max-w-2xl mx-auto leading-relaxed drop-shadow-md anim-entrance anim-letters">
            A unified platform to voice concerns, track resolutions, connect with the community,
            and build a better campus experience together.
          </p>

          {/* Main CTAs */}
          <div className="flex items-center justify-center gap-3 pt-4 flex-wrap anim-entrance">
            {user ? (
              <Button
                size="sm"
                className="bg-white text-gray-900 hover:bg-gray-100 px-5 py-2 text-xs hover-lift"
                onClick={() => navigate(`/${user.role}/dashboard`)}
              >
                Go to Dashboard
                <ArrowRight size={14} />
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  className="bg-white text-gray-900 hover:bg-gray-100 px-5 py-2 text-xs hover-lift"
                  onClick={onRegisterClick}
                >
                  Get Started
                  <ArrowRight size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border border-white text-white hover:bg-white/10 px-5 py-2 text-xs hover-lift"
                  onClick={onLoginClick}
                >
                  Login
                </Button>
              </>
            )}
          </div>

          {/* Quick action links */}
          <div className="flex items-center justify-center gap-6 pt-2 flex-wrap anim-entrance">
            <button
              onClick={() => scrollTo("complaints")}
              className="flex items-center gap-1.5 text-xs text-white/80 hover:text-white underline underline-offset-2 transition-smooth"
            >
              <FileText size={13} />
              Register a Complaint
            </button>
            <button
              onClick={() => scrollTo("track")}
              className="flex items-center gap-1.5 text-xs text-white/80 hover:text-white underline underline-offset-2 transition-smooth"
            >
              <Search size={13} />
              Track Grievance by ID
            </button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator — floating animation */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 anim-float">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-white/50 rounded-full" />
        </div>
      </div>
    </section>
  );
}
