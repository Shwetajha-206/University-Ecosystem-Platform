const testimonials = [
  {
    quote: "This platform has revolutionized how we handle student concerns. The transparency and efficiency have improved our response time by 70%.",
    author: "Dr. Rajesh Kumar",
    role: "Dean of Student Affairs",
  },
  {
    quote: "As a staff member, I can now quickly address issues and communicate directly with students. It's made my job much more effective.",
    author: "Priya Sharma",
    role: "Administrative Officer",
  },
  {
    quote: "Finally, a platform where our voices are heard! I've seen real changes happen because of complaints raised here. It's empowering.",
    author: "Arjun Mehta",
    role: "4th Year Student",
  },
  {
    quote: "The lost and found feature has been incredibly helpful. I recovered my laptop within 24 hours of reporting it missing.",
    author: "Neha Gupta",
    role: "2nd Year Student",
  }
];

export function TestimonialsSection() {
  // Duplicate for infinite loop (4 items × 3 = 12 total)
  const duplicatedTestimonials = [...testimonials, ...testimonials, ...testimonials];

  return (
    <section className="py-20 overflow-hidden" style={{ background: "linear-gradient(to right, #0A3A6A 40%, #B10428 100%)" }}>
      <div className="container-custom text-center mb-12 space-y-3">
        <h2 className="text-3xl md:text-4xl font-bold text-white">
          Voices from Campus
        </h2>
        <p className="text-sm text-white/80 max-w-2xl mx-auto">
          Hear what our community members have to say about their experience 
          with the platform.
        </p>
      </div>

      {/* Auto-scrolling Container - Always animating */}
      <div className="overflow-hidden">
        <div className="flex gap-6 animate-scroll-always px-6">
          {duplicatedTestimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden min-w-[80vw] sm:min-w-[320px] flex-shrink-0 shadow-sm"
            >
              <div className="p-6 h-full flex flex-col">
                <p className="text-sm text-white/90 leading-relaxed italic mb-6 flex-1">
                  "{testimonial.quote}"
                </p>
                <div>
                  <p className="font-semibold text-white text-sm">
                    {testimonial.author}
                  </p>
                  <p className="text-xs text-white/70 mt-1">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
