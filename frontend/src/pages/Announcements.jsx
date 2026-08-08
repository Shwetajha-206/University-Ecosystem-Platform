import React, { useState, useEffect } from 'react';
import { apiJson, apiFetch } from '../lib/api';
import { usePolling } from '../hooks/usePolling';
import { Plus, X, Megaphone, Search, ChevronDown, ChevronUp, Clock, User } from 'lucide-react';

const CATEGORIES = ['All', 'Academic', 'Administrative', 'Event', 'Other'];

export default function Announcements({ user }) {
  const [announcements, setAnnouncements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', category: 'Academic' });
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [readAnnouncements, setReadAnnouncements] = useState([]);
  
  const canPost = user?.role === 'admin' || user?.role === 'cr';

  useEffect(() => {
    if (user?.readAnnouncements) {
      setReadAnnouncements(user.readAnnouncements);
    }
  }, [user]);

  const fetchAnnouncements = async () => {
    try {
      const data = await apiJson('/announcements');
      if (Array.isArray(data)) {
        // Sort by createdAt desc
        setAnnouncements(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  usePolling(fetchAnnouncements, 10000);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiJson('/announcements', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setShowModal(false);
      setFormData({ title: '', content: '', category: 'Academic' });
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      alert('Failed to post announcement');
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // prevent expanding
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await apiFetch(`/announcements/${id}`, { method: 'DELETE' });
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      alert('Failed to delete announcement');
    }
  };

  const toggleExpand = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      if (!readAnnouncements.includes(id)) {
        setReadAnnouncements(prev => [...prev, id]);
        try {
          await apiFetch(`/auth/read-announcement/${id}`, { method: 'PUT' });
        } catch (e) {
          console.error('Failed to save read status', e);
        }
      }
    }
  };

  const filtered = announcements.filter(a => {
    const matchSearch = (a.title || '').toLowerCase().includes(search.toLowerCase()) || 
                        (a.content || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === 'All' || a.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const getCategoryColor = (cat) => {
    switch(cat) {
      case 'Academic': return 'bg-blue-100 text-blue-800';
      case 'Administrative': return 'bg-purple-100 text-purple-800';
      case 'Event': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-gradient-to-r from-[#0f172a] via-[#0A3A6A] to-[#B10428] py-12 px-6 shadow-lg">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="text-white mb-6 md:mb-0">
            <h1 className="text-4xl font-bold font-['Plus_Jakarta_Sans'] flex items-center gap-3">
              <Megaphone className="w-10 h-10" />
              Announcements
            </h1>
            <p className="mt-2 text-blue-100 text-lg">Stay updated with university news and events</p>
          </div>
          {canPost && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-white text-[#0A3A6A] px-6 py-3 rounded-full font-semibold shadow-md hover:bg-blue-50 transition flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Announcement
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition ${
                  selectedCategory === cat 
                    ? 'bg-[#0A3A6A] text-white shadow-md' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-gray-100">
              <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700">No announcements found</h3>
              <p className="text-gray-500 mt-2">Try adjusting your filters or check back later.</p>
            </div>
          ) : (
            filtered.map(a => {
              const isRead = readAnnouncements.includes(a._id);
              const isExpanded = expandedId === a._id;
              
              return (
                <div 
                  key={a._id} 
                  className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition cursor-pointer hover:shadow-md ${isRead ? 'opacity-70' : 'opacity-100'}`}
                  onClick={() => toggleExpand(a._id)}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-3 mb-2">
                          {!isRead && <span className="w-3 h-3 bg-blue-500 rounded-full inline-block"></span>}
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(a.category)}`}>
                            {a.category || 'General'}
                          </span>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(a.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 leading-tight">{a.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {canPost && (
                          <button 
                            onClick={(e) => handleDelete(e, a._id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition"
                            title="Delete"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                        {isExpanded ? <ChevronUp className="w-6 h-6 text-gray-400" /> : <ChevronDown className="w-6 h-6 text-gray-400" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-6 pt-6 border-t border-gray-100 animate-fadeIn">
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{a.content}</p>
                        
                        <div className="mt-6 bg-gray-50 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between text-sm text-gray-500 gap-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>Posted by <span className="font-semibold text-gray-700">{a.postedBy?.name || 'Admin'}</span> ({a.postedBy?.role || 'System'})</span>
                          </div>
                          <div>
                            {new Date(a.createdAt).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-800">Post Announcement</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                <input
                  required
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0A3A6A] focus:border-transparent outline-none"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g., Final Exam Schedule"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0A3A6A] outline-none"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option value="Academic">Academic</option>
                  <option value="Administrative">Administrative</option>
                  <option value="Event">Event</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Content</label>
                <textarea
                  required
                  rows="5"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0A3A6A] outline-none resize-none"
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  placeholder="Detailed information..."
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#0A3A6A] text-white font-medium rounded-xl hover:bg-[#082a4d] shadow-md transition"
                >
                  Post Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}