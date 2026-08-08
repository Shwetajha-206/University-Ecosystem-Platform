import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export function useAnimations() {
  const lenisRef = useRef(null);

  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // ═══════════════════════════════════════════════════════════════
    // 1. LENIS SMOOTH SCROLLING with inertia & easing
    // ═══════════════════════════════════════════════════════════════
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });
    lenisRef.current = lenis;

    // Sync Lenis with GSAP's ticker
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // Update ScrollTrigger on Lenis scroll
    lenis.on('scroll', ScrollTrigger.update);

    // ═══════════════════════════════════════════════════════════════
    // 2. SCROLL PROGRESS BAR
    // ═══════════════════════════════════════════════════════════════
    const progressBar = document.querySelector('.scroll-progress-bar');
    if (progressBar) {
      gsap.to(progressBar, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.3,
        },
      });
    }


    // ═══════════════════════════════════════════════════════════════
    // 4. NAVBAR GLASSMORPHISM ON SCROLL
    // ═══════════════════════════════════════════════════════════════
    const navbar = document.getElementById('main-navbar');
    if (navbar) {
      ScrollTrigger.create({
        start: 'top -80',
        onUpdate: (self) => {
          const progress = Math.min(self.scroll() / 200, 1);
          navbar.style.backdropFilter = `blur(${progress * 20}px)`;
          navbar.style.webkitBackdropFilter = `blur(${progress * 20}px)`;
          navbar.style.backgroundColor = `rgba(255,255,255,${progress * 0.92})`;
          navbar.style.boxShadow = progress > 0.1
            ? `0 4px 30px rgba(10,58,106,${progress * 0.08})`
            : 'none';
        },
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // 5. SEQUENTIAL PAGE ENTRANCE ANIMATIONS (on initial load)
    // ═══════════════════════════════════════════════════════════════
    const entranceElements = gsap.utils.toArray('.anim-entrance');
    if (entranceElements.length) {
      gsap.fromTo(
        entranceElements,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
          delay: 0.3,
        }
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // 6. CARD FADE-UP SCROLL REVEAL
    // ═══════════════════════════════════════════════════════════════
    gsap.utils.toArray('.anim-card').forEach((card, i) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: i * 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    // ═══════════════════════════════════════════════════════════════
    // 7. HEADING FADE-IN-UP ENTRANCE ON SCROLL
    // ═══════════════════════════════════════════════════════════════
    gsap.utils.toArray('.anim-heading').forEach((heading) => {
      gsap.fromTo(
        heading,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: heading,
            start: 'top 90%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    // ═══════════════════════════════════════════════════════════════
    // 8. STAGGERED WORD ANIMATION
    // ═══════════════════════════════════════════════════════════════
    gsap.utils.toArray('.anim-words').forEach((el) => {
      const text = el.textContent;
      const words = text.split(' ');
      el.innerHTML = words
        .map((word) => `<span class="anim-word-wrap" style="display:inline-block;overflow:hidden;"><span class="anim-word" style="display:inline-block;">${word}</span></span>`)
        .join(' ');

      const wordSpans = el.querySelectorAll('.anim-word');
      gsap.fromTo(
        wordSpans,
        { y: '100%', opacity: 0 },
        {
          y: '0%',
          opacity: 1,
          duration: 0.6,
          stagger: 0.05,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    // ═══════════════════════════════════════════════════════════════
    // 9. STAGGERED LETTER REVEAL
    // ═══════════════════════════════════════════════════════════════
    gsap.utils.toArray('.anim-letters').forEach((el) => {
      const text = el.textContent;
      el.innerHTML = text
        .split('')
        .map((char) =>
          char === ' '
            ? ' '
            : `<span class="anim-letter" style="display:inline-block;opacity:0;">${char}</span>`
        )
        .join('');

      const letters = el.querySelectorAll('.anim-letter');
      gsap.fromTo(
        letters,
        { opacity: 0, y: 20, rotateX: -90 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.4,
          stagger: 0.02,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    // ═══════════════════════════════════════════════════════════════
    // 10. IMAGE SCALE-UP + FADE-IN
    // ═══════════════════════════════════════════════════════════════
    gsap.utils.toArray('.anim-image').forEach((img) => {
      gsap.fromTo(
        img,
        { scale: 0.8, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: img,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    // ═══════════════════════════════════════════════════════════════
    // 11. SECTION PINNING
    // ═══════════════════════════════════════════════════════════════
    gsap.utils.toArray('.anim-pin').forEach((section) => {
      const content = section.querySelector('.anim-pin-content');
      if (content) {
        ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          pin: content,
          pinSpacing: false,
        });
      }
    });

    // ═══════════════════════════════════════════════════════════════
    // 12. BACKGROUND PARALLAX
    // ═══════════════════════════════════════════════════════════════
    gsap.utils.toArray('.anim-parallax').forEach((el) => {
      const speed = parseFloat(el.dataset.speed) || 0.3;
      gsap.to(el, {
        yPercent: speed * 100,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      });
    });

    // ═══════════════════════════════════════════════════════════════
    // 13. MOUSE PARALLAX for floating elements
    // ═══════════════════════════════════════════════════════════════
    const mouseParallaxElements = gsap.utils.toArray('.anim-mouse-parallax');
    if (mouseParallaxElements.length && !isTouchDevice) {
      const onMouseMoveParallax = (e) => {
        const { clientX, clientY } = e;
        const xPercent = (clientX / window.innerWidth - 0.5) * 2;
        const yPercent = (clientY / window.innerHeight - 0.5) * 2;
        mouseParallaxElements.forEach((el) => {
          const strength = parseFloat(el.dataset.parallaxStrength) || 20;
          gsap.to(el, {
            x: xPercent * strength,
            y: yPercent * strength,
            duration: 1,
            ease: 'power2.out',
          });
        });
      };
      document.addEventListener('mousemove', onMouseMoveParallax);
      // Store cleanup ref
      mouseParallaxElements._cleanupMouse = () =>
        document.removeEventListener('mousemove', onMouseMoveParallax);
    }

    // ═══════════════════════════════════════════════════════════════
    // 14. COUNT-UP STATISTICS
    // ═══════════════════════════════════════════════════════════════
    gsap.utils.toArray('.anim-countup').forEach((el) => {
      const target = parseFloat(el.dataset.target) || 0;
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      const decimals = parseInt(el.dataset.decimals) || 0;

      const obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration: 2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        onUpdate: () => {
          el.textContent = prefix + obj.val.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix;
        },
      });
    });

    // ═══════════════════════════════════════════════════════════════
    // 15. SECTION TRANSITIONS (opacity + translateY)
    // ═══════════════════════════════════════════════════════════════
    gsap.utils.toArray('.section-transition').forEach((section) => {
      gsap.fromTo(
        section,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    // ═══════════════════════════════════════════════════════════════
    // 16. KEN BURNS ZOOM on hero background
    // ═══════════════════════════════════════════════════════════════
    const kenBurnsEl = document.querySelector('.anim-ken-burns');
    if (kenBurnsEl) {
      gsap.fromTo(
        kenBurnsEl,
        { scale: 1 },
        {
          scale: 1.15,
          duration: 20,
          ease: 'none',
          repeat: -1,
          yoyo: true,
        }
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════
    return () => {
      lenis.destroy();
      ScrollTrigger.getAll().forEach((st) => st.kill());
      gsap.ticker.remove(lenis.raf);

      if (mouseParallaxElements._cleanupMouse) mouseParallaxElements._cleanupMouse();
    };
  }, []);

  return lenisRef;
}
