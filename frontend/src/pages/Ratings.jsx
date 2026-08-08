import React, { useState, useEffect } from 'react';
import { apiJson } from '../lib/api';
import { Plus, Star, X, Camera, User } from 'lucide-react';

const compressImage = (file) => new Promise((resolve) => {
  if (!file.type.startsWith('image/')) { resolve(''); return; }
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const MAX = 600; 
    let w = img.width, h = img.height;
    if (w > h && w > MAX) { h = (h * MAX) / w; w = MAX; }
    else if (h > MAX) { w = (w * MAX) / h; h = MAX; }
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(url);
    resolve(canvas.toDataURL('image/jpeg', 0.6));
  };
  img.src = url;
});

const VENDORS = ['Campus Canteen', 'Book Store', 'Stationery Shop', 'Photocopy Center', 'Medical Store'];

export default function Ratings({ user }) {
  const [vendorData, setVendorData] = useState([]);
  const [allRatings, setAllRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ vendorName: VENDORS[0], rating: 5, comments: '', photo: '' });
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'mine'

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const results = await Promise.all(
        VENDORS.map(v => apiJson(`/ratings/vendor/${encodeURIComponent(v)}`).catch(() => []))
      );
      
      const combined = [];
      const summaries = VENDORS.map((v, i) => {
        const ratingsList = Array.isArray(results[i]) ? results[i] : [];
        ratingsList.forEach(r => combined.push({ ...r, vendorName: v }));
        const avg = ratingsList.length > 0 
          ? ratingsList.reduce((acc, curr) => acc + (curr.rating || 0), 0) / ratingsList.length 
          : 0;
        return { vendorName: v, avgRating: avg, count: ratingsList.length };
      });
      
      setVendorData(summaries);
      setAllRatings(combined.sort((a, b) => new Date(b.date || Date.now()) - new Date(a.date || Date.now())));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, []);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await compressImage(file);
      setFormData(prev => ({ ...prev, photo: base64 }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiJson('/ratings', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setShowForm(false);
      setFormData({ vendorName: VENDORS[0], rating: 5, comments: '', photo: '' });
      fetchRatings();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to submit review');
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star 
            key={star} 
            className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} 
          />
        ))}
      </div>
    );
  };

  const displayRatings = activeTab === 'mine' 
    ? allRatings.filter(r => r.studentID === user?.email)
    : allRatings;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#0f172a] via-[#0A3A6A] to-[#B10428] rounded-xl p-8 text-white shadow-xl flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-plus-jakarta mb-2">Campus Services Ratings</h1>
          <p className="text-blue-100 max-w-xl">Rate and review campus facilities. Your feedback helps improve university services.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="hidden sm:flex items-center gap-2 bg-white text-slate-900 px-5 py-2.5 rounded-lg hover:bg-slate-100 transition-colors shadow-sm font-medium"
        >
          <Plus className="w-5 h-5" /> Write Review
        </button>
      </div>
      
      <button
        onClick={() => setShowForm(true)}
        className="sm:hidden w-full flex justify-center items-center gap-2 bg-[#B10428] text-white px-5 py-2.5 rounded-lg hover:bg-[#900320] transition-colors shadow-sm font-medium"
      >
        <Plus className="w-5 h-5" /> Write Review
      </button>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {vendorData.map(v => (
          <div key={v.vendorName} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col items-center text-center">
            <h3 className="font-semibold text-slate-900 mb-2 line-clamp-1" title={v.vendorName}>{v.vendorName}</h3>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-2xl font-bold text-slate-900">{v.avgRating.toFixed(1)}</span>
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            </div>
            <span className="text-xs text-slate-500">{v.count} {v.count === 1 ? 'review' : 'reviews'}</span>
          </div>
        ))}
      </div>

      <div className="border-b border-slate-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-4 text-sm font-medium transition-colors relative ${
              activeTab === 'all' ? 'text-[#B10428]' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            All Ratings
            {activeTab === 'all' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#B10428] rounded-t-md"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('mine')}
            className={`pb-4 text-sm font-medium transition-colors relative ${
              activeTab === 'mine' ? 'text-[#B10428]' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            My Ratings
            {activeTab === 'mine' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#B10428] rounded-t-md"></span>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading reviews...</div>
      ) : displayRatings.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm">
          <Star className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No reviews found</h3>
          <p className="text-slate-500">Be the first to share your experience.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {displayRatings.map(rating => (
            <div key={rating._id || Math.random()} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col md:flex-row gap-5">
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-slate-900">{rating.vendorName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(rating.rating)}
                      <span className="text-xs text-slate-400">• {new Date(rating.date || Date.now()).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <p className="text-slate-600 text-sm mt-3">{rating.comments || 'No comments provided.'}</p>
                <div className="flex items-center gap-2 mt-4 text-sm text-slate-500">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                    <User className="w-3 h-3" />
                  </div>
                  <span>{rating.studentName || 'Student'}</span>
                </div>
              </div>
              {rating.photo && (
                <div className="w-full md:w-32 h-32 flex-shrink-0">
                  <img src={rating.photo} alt="Review" className="w-full h-full object-cover rounded-lg border border-slate-100" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Write Review Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Write a Review</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select Service</label>
                  <select
                    value={formData.vendorName}
                    onChange={e => setFormData({...formData, vendorName: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B10428]/20 focus:border-[#B10428] bg-white"
                  >
                    {VENDORS.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setFormData({...formData, rating: num})}
                        className="p-1 focus:outline-none"
                      >
                        <Star className={`w-8 h-8 ${num <= formData.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200 hover:text-yellow-200'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Comments</label>
                  <textarea
                    rows={4}
                    value={formData.comments}
                    onChange={e => setFormData({...formData, comments: e.target.value})}
                    placeholder="Share your experience..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B10428]/20 focus:border-[#B10428] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Add Photo (Optional)</label>
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer flex items-center justify-center w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                      {formData.photo ? (
                        <img src={formData.photo} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <div className="flex flex-col items-center text-slate-400">
                          <Camera className="w-6 h-6 mb-1" />
                          <span className="text-xs">Upload</span>
                        </div>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                    {formData.photo && (
                      <button type="button" onClick={() => setFormData({...formData, photo: ''})} className="text-sm text-red-600 hover:text-red-700">
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-[#B10428] hover:bg-[#900320] text-white rounded-lg font-medium transition-colors">
                    Submit Review
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}