import React, { useState, useEffect, useRef } from 'react';
import { apiJson } from '../lib/api';
import { usePolling } from '../hooks/usePolling';
import { Plus, Star, X, Search, MessageSquare, User } from 'lucide-react';

const StarRating = ({ rating, setRating, readOnly = false }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`w-6 h-6 ${readOnly ? '' : 'cursor-pointer'} ${
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
          onClick={() => !readOnly && setRating(star)}
        />
      ))}
    </div>
  );
};

export default function Feedbacks({ user }) {
  const [activeTab, setActiveTab] = useState('my'); // 'my' or 'all'
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [allFeedbacks, setAllFeedbacks] = useState([]);
  const [teachers, setTeachers] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ subject: '', teacher: '', rating: 0, comments: '' });
  
  // Searchable dropdown state
  const [teacherSearch, setTeacherSearch] = useState('');
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const canSeeAll = user?.role === 'admin' || user?.role === 'cr';

  useEffect(() => {
    // Fetch teachers on mount
    apiJson('/auth/teachers').then(data => {
      if (Array.isArray(data)) setTeachers(data);
    }).catch(err => console.error("Error fetching teachers", err));
    
    // Close dropdown on outside click
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowTeacherDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchMyFeedbacks = async () => {
    try {
      const data = await apiJson('/feedbacks/my');
      if (Array.isArray(data)) setMyFeedbacks(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllFeedbacks = async () => {
    if (!canSeeAll) return;
    try {
      const data = await apiJson('/feedbacks');
      if (Array.isArray(data)) setAllFeedbacks(data);
    } catch (err) {
      console.error(err);
    }
  };

  usePolling(() => {
    fetchMyFeedbacks();
    if (activeTab === 'all') fetchAllFeedbacks();
  }, 10000);

  useEffect(() => {
    fetchMyFeedbacks();
    if (canSeeAll) fetchAllFeedbacks();
  }, [activeTab, canSeeAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.teacher) {
      alert("Please select a teacher");
      return;
    }
    if (formData.rating === 0) {
      alert("Please provide a rating");
      return;
    }
    
    try {
      await apiJson('/feedbacks', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setShowModal(false);
      setFormData({ subject: '', teacher: '', rating: 0, comments: '' });
      setTeacherSearch('');
      fetchMyFeedbacks();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to submit feedback');
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  const displayedFeedbacks = activeTab === 'my' ? myFeedbacks : allFeedbacks;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-gradient-to-r from-[#0f172a] via-[#0A3A6A] to-[#B10428] py-12 px-6 shadow-lg">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="text-white mb-6 md:mb-0">
            <h1 className="text-4xl font-bold font-['Plus_Jakarta_Sans'] flex items-center gap-3">
              <MessageSquare className="w-10 h-10" />
              Feedbacks
            </h1>
            <p className="mt-2 text-blue-100 text-lg">Share your thoughts on courses and teaching</p>
          </div>
          {!canSeeAll || user?.role === 'cr' ? (
            <button
              onClick={() => setShowModal(true)}
              className="bg-white text-[#0A3A6A] px-6 py-3 rounded-full font-semibold shadow-md hover:bg-blue-50 transition flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Submit Feedback
            </button>
          ) : null}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-8">
        {canSeeAll && (
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`py-3 px-6 font-medium text-lg border-b-2 transition-colors ${
                activeTab === 'my' ? 'border-[#0A3A6A] text-[#0A3A6A]' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('my')}
            >
              My Feedbacks
            </button>
            <button
              className={`py-3 px-6 font-medium text-lg border-b-2 transition-colors ${
                activeTab === 'all' ? 'border-[#0A3A6A] text-[#0A3A6A]' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('all')}
            >
              All Feedbacks
            </button>
          </div>
        )}

        {displayedFeedbacks.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-gray-100 mt-8">
            <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700">No feedbacks found</h3>
            <p className="text-gray-500 mt-2">
              {activeTab === 'my' ? "You haven't submitted any feedback yet." : "No feedback has been submitted."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayedFeedbacks.map(f => (
              <div key={f._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{f.subject}</h3>
                    <div className="flex items-center gap-2 text-gray-600 mt-1">
                      <User className="w-4 h-4" />
                      <span className="font-medium">{f.teacher}</span>
                    </div>
                  </div>
                  <StarRating rating={f.rating} readOnly />
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl mt-4">
                  <p className="text-gray-700 italic">"{f.comments}"</p>
                </div>
                
                <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                  <span>{new Date(f.createdAt).toLocaleDateString()}</span>
                  {activeTab === 'all' && f.studentId && (
                    <span className="bg-gray-100 px-3 py-1 rounded-full text-xs">Student ID: {f.studentId}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl shrink-0">
              <h2 className="text-2xl font-bold text-gray-800">Submit Feedback</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
              {teachers.length === 0 ? (
                <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl border border-yellow-200">
                  No teachers registered yet. Ask your admin to add faculty members.
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Subject / Course</label>
                    <input
                      required
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0A3A6A] focus:border-transparent outline-none"
                      value={formData.subject}
                      onChange={e => setFormData({...formData, subject: e.target.value})}
                      placeholder="e.g., Computer Networks"
                    />
                  </div>
                  
                  <div className="relative" ref={dropdownRef}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Teacher</label>
                    <div className="relative">
                      <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0A3A6A] focus:border-transparent outline-none"
                        placeholder="Search for a teacher..."
                        value={teacherSearch}
                        onChange={e => {
                          setTeacherSearch(e.target.value);
                          setShowTeacherDropdown(true);
                          setFormData({...formData, teacher: ''}); // reset selection if they type
                        }}
                        onFocus={() => setShowTeacherDropdown(true)}
                      />
                    </div>
                    
                    {showTeacherDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {filteredTeachers.length > 0 ? (
                          filteredTeachers.map(t => (
                            <div
                              key={t.email || t.name}
                              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                              onClick={() => {
                                setFormData({...formData, teacher: t.name});
                                setTeacherSearch(t.name);
                                setShowTeacherDropdown(false);
                              }}
                            >
                              <div className="font-medium text-gray-900">{t.name}</div>
                              {t.email && <div className="text-sm text-gray-500">{t.email}</div>}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-500 text-sm">No matching teachers found</div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                    <StarRating 
                      rating={formData.rating} 
                      setRating={r => setFormData({...formData, rating: r})} 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Comments</label>
                    <textarea
                      required
                      rows="4"
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0A3A6A] outline-none resize-none"
                      value={formData.comments}
                      onChange={e => setFormData({...formData, comments: e.target.value})}
                      placeholder="Share your thoughts on the course and teaching methodology..."
                    ></textarea>
                  </div>
                </>
              )}
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={teachers.length === 0}
                  className="px-6 py-2.5 bg-[#0A3A6A] text-white font-medium rounded-xl hover:bg-[#082a4d] shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}