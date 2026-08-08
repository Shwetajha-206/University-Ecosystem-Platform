const campusSpots = [
  {
    title: "Modern Canteen",
    description: "Hygienic food service with diverse menu options for students and staff",
    image: "/canteen.webp"
  },
  {
    title: "Smart Classrooms",
    description: "Technology-enabled learning spaces with modern infrastructure",
    image: "/classes.jpg"
  },
  {
    title: "Discussion Area",
    description: "Collaborative learning and project discussion zones",
    image: "/discussion.webp"
  },
  {
    title: "Hostel Facilities",
    description: "Comfortable and secure residential living experience",
    image: "/hostel.webp"
  },
  {
    title: "Library",
    description: "State-of-the-art research resources and silent reading spaces",
    image: "/library.webp"
  },
  {
    title: "Science Labs",
    description: "Advanced equipment for experimental learning and research",
    image: "/scincelab.webp"
  },
  {
    title: "Sports Complex",
    description: "Well-equipped indoor and outdoor sports facilities",
    image: "/sports.webp"
  },
  {
    title: "Computer Labs",
    description: "High-performance systems for coding and software development",
    image: "/krmulab.jpg"
  },
  {
    title: "Campus Corridor",
    description: "Aesthetically designed pathways and modern open spaces",
    image: "/corridor.jpg"
  }
];

export function CampusSpotlight() {
  // Duplicate spots to create infinite scroll effect
  const duplicatedSpots = [...campusSpots, ...campusSpots, ...campusSpots];

  return (
    <section className="py-24 bg-gradient-to-r from-[#0a2c52] via-[#4d0c2e] to-[#910520] relative overflow-hidden">
      {/* Decorative background glow circles */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <div className="container-custom relative z-10">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
            Our Campus Spotlight
          </h2>
          <p className="text-sm md:text-base text-white/80 max-w-2xl mx-auto leading-relaxed font-medium">
            Explore our world-class facilities designed to provide the best learning 
            and living experience for our students.
          </p>
        </div>

        {/* Auto-scrolling Container */}
        <div className="overflow-hidden py-4">
          <div className="flex gap-8 animate-scroll-left">
            {duplicatedSpots.map((spot, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden min-w-[280px] sm:min-w-[340px] flex-shrink-0 shadow-2xl transition-all duration-300 hover:scale-[1.03] hover:border-white/40 hover:bg-white/15"
              >
                <div className="h-52 overflow-hidden relative group">
                  <img 
                    src={spot.image} 
                    alt={spot.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
                </div>
                <div className="p-6 space-y-2">
                  <h3 className="text-lg font-extrabold text-white tracking-tight">
                    {spot.title}
                  </h3>
                  <p className="text-xs text-white/80 leading-relaxed font-normal">
                    {spot.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
