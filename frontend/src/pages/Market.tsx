import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { Store, MapPin, Search, ChevronRight, LayoutGrid, Zap } from '../components/MaterialIcon';
import { PageSkeleton } from '../components/PageSkeleton';

export default function Market() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const res = await api.get('/shop');
      if (res.success) setStores(res.data);
    } catch (error) {
      console.error('Failed to fetch stores', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...Array.from(new Set(stores.map(s => s.category).filter(Boolean)))];

  const filteredStores = stores.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (store.location && store.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || store.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white sticky top-0 z-50 w-full shadow-lg">
        <div className="w-full px-4 lg:px-8 py-4 flex items-center justify-between gap-4 md:gap-8 flex-wrap lg:flex-nowrap">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded bg-teal-500 flex items-center justify-center text-slate-900">
              <Zap size={20} className="fill-current" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight">SIMBBiz</span>
          </Link>

          <div className="order-last lg:order-none flex-1 w-full lg:max-w-3xl flex items-center bg-white rounded-lg overflow-hidden focus-within:ring-2 ring-teal-500 h-11 shadow-sm mt-3 lg:mt-0">
            <input 
              type="text" 
              placeholder="Search for stores by name or location..." 
              className="flex-1 h-full px-4 text-slate-900 focus:outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="bg-teal-500 hover:bg-teal-600 transition-colors h-full px-6 flex items-center justify-center text-slate-900">
              <Search size={20} />
            </button>
          </div>

          <div className="flex items-center gap-6 flex-shrink-0">
            <Link to="/" className="font-semibold text-sm hover:text-teal-400 transition">Home</Link>
            <Link to="/signup" className="bg-teal-500 text-slate-900 px-4 py-2 rounded-lg font-bold text-sm hover:bg-teal-400 transition">Start Selling</Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full px-4 lg:px-8 py-8 flex gap-8">
        
        {/* Sidebar Filters */}
        <aside className="w-64 flex-shrink-0 hidden md:block">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sticky top-28">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 pb-3 border-b border-slate-100">
              <LayoutGrid size={18} className="text-teal-600"/> Categories
            </h3>
            <ul className="space-y-1">
              {categories.map((cat, i) => (
                <li key={i}>
                  <button 
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left text-sm px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between ${
                      selectedCategory === cat ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-teal-600'
                    }`}
                  >
                    {cat}
                    {selectedCategory === cat && <ChevronRight size={14} />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Store Grid */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-900">All Stores</h1>
              <p className="text-slate-500 mt-1">Discover {filteredStores.length} premium independent sellers.</p>
            </div>
          </div>

          {loading ? (
             <PageSkeleton variant="list" />
          ) : filteredStores.length === 0 ? (
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center flex flex-col items-center">
               <Store size={48} className="text-slate-300 mb-4" />
               <h3 className="text-xl font-bold text-slate-800 mb-2">No stores found</h3>
               <p className="text-slate-500">Try adjusting your search or category filter.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-20">
              {filteredStores.map(store => (
                <Link 
                  key={store._id} 
                  to={`/shop/${store.slug}`}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 hover:border-teal-300 transition-all duration-300 group flex flex-col h-full"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-slate-100 group-hover:bg-teal-50 transition-colors rounded-xl flex items-center justify-center text-slate-400 flex-shrink-0">
                      <Store size={32} className="group-hover:text-teal-500 transition-colors" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 group-hover:text-teal-600 transition-colors leading-tight line-clamp-2">{store.name}</h2>
                      {store.category && (
                        <span className="inline-block mt-1.5 text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                          {store.category}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-500 line-clamp-3 mb-6 flex-1">
                    {store.description || 'Welcome to our store! Browse our selection of premium products.'}
                  </p>
                  
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium truncate pr-4">
                      <MapPin size={12} className="flex-shrink-0" />
                      <span className="truncate">{store.location || 'Online'}</span>
                    </div>
                    <span className="text-xs font-bold text-teal-600 flex items-center gap-1 flex-shrink-0">
                      Visit Store <ChevronRight size={12} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm mt-auto">
        <p>© 2026 SIMBBiz Marketplace. Built for scale.</p>
      </footer>
    </div>
  );
}
