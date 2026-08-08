import { useNavigate } from 'react-router-dom';
import { Navbar }                from "../components/Navbar";
import { HeroSection }           from "../components/HeroSection";
import { CampusSpotlight }       from "../components/CampusSpotlight";

import { Footer }                from "../components/Footer";
import { useAnimations }         from "../hooks/useAnimations";

export default function Landing() {
  const navigate = useNavigate();
  
  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleRegisterClick = () => {
    navigate('/login');
  };

  // Initialize ALL animation effects (Lenis, GSAP ScrollTrigger, custom cursor, etc.)
  useAnimations();

  return (
    <div className="min-h-screen">
      {/* ═══════ SCROLL PROGRESS BAR ═══════ */}
      <div className="scroll-progress">
        <div className="scroll-progress-bar" />
      </div>

      <Navbar onLoginClick={handleLoginClick} onRegisterClick={handleRegisterClick} />

      {/* id="home" is inside HeroSection */}
      <HeroSection onLoginClick={handleLoginClick} onRegisterClick={handleRegisterClick} />



      {/* id="complaints" — scrolled to from nav */}
      <section id="complaints" className="py-16 bg-white section-transition">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 anim-heading">Register a Complaint</h2>
          <p className="text-sm text-gray-600 mb-8 max-w-xl mx-auto anim-heading">
            Login or create an account to submit a grievance. Your voice matters.
          </p>
          <button
            onClick={handleRegisterClick}
            className="px-6 py-3 rounded-lg text-sm font-medium text-white transition-smooth hover-lift"
            style={{ background: "linear-gradient(to right, #0A3A6A 40%, #B10428 100%)" }}
          >
            Create Account & Submit
          </button>
        </div>
      </section>

      {/* id="community" */}
      <section id="community" className="section-transition">
        <CampusSpotlight />
      </section>




      {/* id="lost-found" placeholder */}
      <section id="lost-found" className="py-16 bg-gray-50 section-transition">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 anim-heading">Lost & Found</h2>
          <p className="text-sm text-gray-600 mb-8 max-w-xl mx-auto anim-heading">
            Report lost items or browse found items on campus. Login to access the full board.
          </p>
          <button
            onClick={handleLoginClick}
            className="px-6 py-3 rounded-lg text-sm font-medium text-white transition-smooth hover-lift"
            style={{ background: "linear-gradient(to right, #0A3A6A 40%, #B10428 100%)" }}
          >
            Login to Access
          </button>
        </div>
      </section>

      {/* id="contact" is inside Footer */}
      <section id="contact" className="section-transition">
        <Footer />
      </section>
    </div>
  );
}
