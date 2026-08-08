import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { useToast } from "../hooks/useToast";

export function NoticeSection() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const { error: showError } = useToast();

  useEffect(() => {
    fetch('http://localhost:5000/api/announcements', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load announcements');
        return res.json();
      })
      .then(data => setAnnouncements(data.slice(0, 4)))
      .catch((err) => {
        setAnnouncements([]);
        if (localStorage.getItem('token')) {
          showError(err.message || 'Could not load announcements');
        }
      })
      .finally(() => setLoading(false));
  }, [showError]);

  return (
    <section className="py-20 bg-white">
      <div className="container-custom">
        <div className="text-center mb-12 space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Latest Updates
          </h2>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            Stay informed about platform updates, new features, and important announcements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-5/6" />
                  </div>
                </div>
              </div>
            ))
          ) : announcements.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              No announcements yet
            </div>
          ) : (
            announcements.map((announcement, index) => (
              <div
                key={announcement._id}
                className={`bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md active:shadow-md active:scale-[0.98] transition-all animate-fade-in-up stagger-${(index % 4) + 1}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-red-600 flex items-center justify-center">
                    <Calendar size={18} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      {announcement.title}
                    </h3>
                    <p className="text-xs text-gray-600 mb-2">
                      {new Date(announcement.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {announcement.content}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
