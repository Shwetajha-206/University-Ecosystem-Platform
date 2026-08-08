import React, { useState, useEffect } from 'react';
import { apiJson } from '../lib/api';
import { 
  Plus, 
  Search, 
  X, 
  Package, 
  MapPin, 
  Camera, 
  Mail, 
  Clock, 
  Eye,
  User
} from 'lucide-react';

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

export default function LostItems({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('lost'); // 'lost' or 'found'
  const [formData, setFormData] = useState({ itemName: '', description: '', location: '', photo: '' });
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  
  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await apiJson('/lostitems');
      setItems(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
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
    if (!formData.itemName) return;
    try {
      const payload = { ...formData, type: formMode };
      await apiJson('/lostitems', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setShowForm(false);
      setFormData({ itemName: '', description: '', location: '', photo: '' });
      fetchItems();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to submit report');
    }
  };

  const filteredItems = items.filter(i => {
    if (filter !== 'all' && i.type !== filter && i.status !== filter) return false;
    if (search && !i.itemName?.toLowerCase().includes(search.toLowerCase()) && 
        !i.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const lostCount = items.filter(i => i.type === 'lost').length;
  const foundCount = items.filter(i => i.type === 'found').length;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#0f172a] via-[#0A3A6A] to-[#B10428] rounded-xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold font-plus-jakarta mb-2">Lost & Found</h1>
        <p className="text-blue-100 mb-6">Report lost items or help return found items to their owners.</p>
        <div className="flex flex-wrap gap-4">
          <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-lg border border-white/20">
            <span className="block text-sm text-blue-200">Lost Items</span>
            <span className="text-2xl font-bold">{lostCount}</span>
          </div>
          <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-lg border border-white/20">
            <span className="block text-sm text-blue-200">Found Items</span>
            <span className="text-2xl font-bold">{foundCount}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border border-slate-200">
          {['all', 'lost', 'found', 'claimed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === f ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="flex w-full sm:w-auto gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#B10428]/20 focus:border-[#B10428]"
            />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#B10428] hover:bg-[#900320] text-white px-4 py-2 rounded-lg transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Report Item
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No items found</h3>
          <p className="text-slate-500">No items match your current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <div 
              key={item._id || Math.random()} 
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col"
              onClick={() => setSelectedItem(item)}
            >
              {item.photo ? (
                <div className="h-48 w-full bg-slate-100 relative">
                  <img src={item.photo} alt={item.itemName} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium bg-white/90 shadow ${
                      item.type === 'lost' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {item.type?.toUpperCase()}
                    </span>
                    {item.status === 'claimed' && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 shadow">
                        CLAIMED
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-48 w-full bg-slate-50 flex items-center justify-center relative">
                  <Package className="w-12 h-12 text-slate-300" />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium bg-white shadow ${
                      item.type === 'lost' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {item.type?.toUpperCase()}
                    </span>
                    {item.status === 'claimed' && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 shadow">
                        CLAIMED
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-slate-900 mb-1">{item.itemName}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-3 flex-1">{item.description}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-auto pt-2 border-t border-slate-50">
                  <span className="flex items-center gap-1 text-slate-600 font-medium"><User className="w-3 h-3" /> {item.reporterName || item.studentID || 'Student'}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.location || 'Unknown'}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(item.dateReported || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Report Item</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <div className="flex gap-2 p-1 bg-slate-100 rounded-lg mb-4">
                <button
                  type="button"
                  onClick={() => setFormMode('lost')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    formMode === 'lost' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  I Lost Something
                </button>
                <button
                  type="button"
                  onClick={() => setFormMode('found')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    formMode === 'found' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  I Found Something
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Item Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.itemName}
                    onChange={e => setFormData({...formData, itemName: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B10428]/20 focus:border-[#B10428]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B10428]/20 focus:border-[#B10428] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location ({formMode === 'lost' ? 'Where lost?' : 'Where found?'})</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B10428]/20 focus:border-[#B10428]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Photo (Optional)</label>
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
                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-[#B10428] hover:bg-[#900320] text-white rounded-lg font-medium transition-colors">
                    Submit Report
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-900">Item Details</h2>
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                  selectedItem.type === 'lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {selectedItem.type}
                </span>
                {selectedItem.status === 'claimed' && (
                  <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-blue-100 text-blue-700">
                    CLAIMED
                  </span>
                )}
              </div>
              <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-600 p-1 bg-white rounded-full shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto">
              {selectedItem.photo && (
                <div className="w-full bg-slate-100 border-b border-slate-200">
                  <img src={selectedItem.photo} alt={selectedItem.itemName} className="w-full max-h-80 object-contain" />
                </div>
              )}
              
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{selectedItem.itemName}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {selectedItem.location || 'Location not specified'}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Reported on {new Date(selectedItem.dateReported || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {selectedItem.description && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Description</h4>
                    <p className="text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-100">{selectedItem.description}</p>
                  </div>
                )}
                
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" /> Contact Reporter
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold">
                      {(selectedItem.reporterName || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{selectedItem.reporterName || 'Student'}</div>
                      <a href={`mailto:${selectedItem.studentID}`} className="text-sm text-blue-600 hover:underline">
                        {selectedItem.studentID || 'No email provided'}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setSelectedItem(null)} 
                className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}