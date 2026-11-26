import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Store, MapPin, Phone } from '../components/MaterialIcon';

export default function CreateStore() {
  const [formData, setFormData] = useState({ name: '', location: '', phone: '', category: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshStores, user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/user/businesses', formData);
      if (res.success) {
        await refreshStores(); // This will fetch the new store and set it as active
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create store');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Auto-generate preview slug
  const previewSlug = formData.name ? formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'your-store';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center text-teal-600">
            <Store size={32} />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Create your store
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Welcome {user?.name}! Let's set up your first storefront.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm">{error}</div>}
            
            <div>
              <label className="block text-sm font-medium text-slate-700">Store Name</label>
              <div className="mt-1">
                <input name="name" type="text" required value={formData.name} onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                  placeholder="E.g. Jane's Coffee Shop"
                />
              </div>
              {formData.name && (
                <p className="mt-2 text-xs text-teal-600 font-medium">
                  Your public URL will be: simbbiz.com/shop/{previewSlug}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Category</label>
              <div className="mt-1">
                <select name="category" required value={formData.category} onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm bg-white"
                >
                  <option value="" disabled>Select a category</option>
                  <option value="Real-Estate">Real-Estate</option>
                  <option value="Fashion & Apparel">Fashion & Apparel</option>
                  <option value="Electronics & Tech">Electronics & Tech</option>
                  <option value="Food & Beverages">Food & Beverages</option>
                  <option value="Health & Beauty">Health & Beauty</option>
                  <option value="Services">Services</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Description</label>
              <div className="mt-1">
                <textarea name="description" rows={3} value={formData.description} onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm resize-none"
                  placeholder="Tell customers what your store is about..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Location (Optional)</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin size={16} className="text-slate-400" />
                </div>
                <input name="location" type="text" value={formData.location} onChange={handleChange}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                  placeholder="City, Country"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">WhatsApp Phone Number (Optional)</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone size={16} className="text-slate-400" />
                </div>
                <input name="phone" type="text" value={formData.phone} onChange={handleChange}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                  placeholder="+1234567890"
                />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition"
            >
              {loading ? 'Creating store...' : 'Launch Store'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
