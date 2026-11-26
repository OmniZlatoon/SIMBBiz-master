import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Store, Menu, TrendingUp, Tag, ChevronRight, Zap, Moon, Sun, Smartphone, ShoppingBag } from '../components/MaterialIcon';
import { api } from '../utils/api';
import { useTheme } from '../context/ThemeContext';
import { PageSkeleton } from '../components/PageSkeleton';

export default function Home() {
  const [data, setData] = useState<any>({ randomProducts: [], latestProducts: [], topStores: [], promoProducts: [], techProducts: [], fashionProducts: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('All');
  const [activeSlide, setActiveSlide] = useState(0);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/shop/discover');
        if (res.success) setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const slides = [
    {
      title: "Discover Premium Stores",
      desc: "Shop directly from independent sellers worldwide.",
      img: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&auto=format&fit=crop&q=80",
      tag: "MEGA SALE"
    },
    {
      title: "Real Estate & Luxury",
      desc: "Find your dream home with top realtors.",
      img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&auto=format&fit=crop&q=80",
      tag: "NEW LISTINGS"
    },
    {
      title: "Tech Gadgets Galore",
      desc: "Upgrade your lifestyle with next-gen technology.",
      img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1600&auto=format&fit=crop&q=80",
      tag: "TECH WEEK"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const categories = ["Electronics & Tech", "Fashion & Apparel", "Home & Garden", "Real-Estate", "Health & Beauty", "Automotive", "Services", "Groceries"];

  // Search filtering
  const getFilteredProducts = (productsArray: any[]) => {
    if (!productsArray || !searchQuery) return productsArray;
    const lowerQuery = searchQuery.toLowerCase();
    return productsArray.filter(p => 
      p.name?.toLowerCase().includes(lowerQuery) || 
      p.business?.name?.toLowerCase().includes(lowerQuery) ||
      p.description?.toLowerCase().includes(lowerQuery)
    );
  };

  const getFilteredStores = (storesArray: any[]) => {
    if (!storesArray || !searchQuery) return storesArray;
    const lowerQuery = searchQuery.toLowerCase();
    return storesArray.filter(s => 
      s.name?.toLowerCase().includes(lowerQuery) || 
      s.category?.toLowerCase().includes(lowerQuery) ||
      s.location?.toLowerCase().includes(lowerQuery)
    );
  };

  return (
    <div className="min-h-screen bg-transparent font-sans text-slate-800 dark:text-slate-200 flex flex-col w-full overflow-x-hidden transition-colors">
      {/* Top Navbar */}
      <header className="bg-slate-900 dark:bg-slate-950 text-white sticky top-0 z-50 w-full border-b border-slate-800 transition-colors">
        <div className="w-full px-2 lg:px-4 py-3 flex items-center justify-between gap-2 md:gap-4 flex-wrap lg:flex-nowrap">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded bg-teal-500 flex items-center justify-center text-slate-900">
              <Zap size={20} className="fill-current" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight hidden sm:block">SIMBBiz</span>
          </Link>

          {/* Advanced Search Bar */}
          <div className="order-last lg:order-none flex-1 w-full lg:max-w-4xl flex items-center bg-white dark:bg-slate-800 rounded-lg overflow-hidden focus-within:ring-2 ring-teal-500 h-10 shadow-sm mt-3 lg:mt-0 transition-colors">
            <select 
              className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 h-full px-2 md:px-3 text-xs md:text-sm border-r border-slate-300 dark:border-slate-600 focus:outline-none cursor-pointer transition-colors"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            >
              <option>All</option>
              <option>Products</option>
              <option>Stores</option>
              <option>Location</option>
            </select>
            <input 
              type="text" 
              placeholder="Search for products, brands, or stores..." 
              className="flex-1 h-full px-3 md:px-4 text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none text-sm placeholder-slate-400 dark:placeholder-slate-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="bg-teal-500 hover:bg-teal-600 transition-colors h-full px-4 md:px-6 flex items-center justify-center text-slate-900">
              <Search size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <div className="hidden xl:flex flex-col text-sm mr-2">
              <span className="text-slate-400 text-xs">Deliver to</span>
              <span className="font-bold flex items-center gap-1"><MapPin size={14}/> Worldwide</span>
            </div>
            
            <button 
              onClick={toggleTheme} 
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <Link to="/login" className="font-semibold text-sm md:text-base hover:text-teal-400 transition hidden sm:block">Login</Link>
            <Link to="/signup" className="bg-teal-500 text-slate-900 px-2.5 py-1.5 md:px-4 md:py-2 rounded-lg font-bold text-xs md:text-base hover:bg-teal-400 transition whitespace-nowrap">Start Selling</Link>
          </div>
        </div>
        
        {/* Secondary Navbar */}
        <div className="bg-slate-800 dark:bg-slate-900 border-t border-slate-700 dark:border-slate-800 text-sm px-4 lg:px-8 py-2 flex items-center gap-6 overflow-x-auto whitespace-nowrap hide-scrollbar transition-colors">
          <button className="flex items-center gap-1 font-bold hover:text-teal-400 transition"><Menu size={16}/> All</button>
          <Link to="/market" className="font-medium hover:text-teal-400 transition">All Stores</Link>
          <span className="font-medium hover:text-teal-400 cursor-pointer transition text-rose-400">Promotions</span>
          <span className="font-medium hover:text-teal-400 cursor-pointer transition">Customer Service</span>
          <span className="font-medium hover:text-teal-400 cursor-pointer transition">New Releases</span>
        </div>
      </header>

      {/* Main Layout - using wider layout for massive data viewing */}
      <main className="flex-1 w-full px-2 sm:px-4 lg:px-6 py-6 flex gap-4 md:gap-6">
        
        {/* Left Sidebar (Categories) */}
        <aside className="w-56 lg:w-64 flex-shrink-0 hidden xl:block">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sticky top-36 transition-colors">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2"><Menu size={18} /> Categories</h3>
            <ul className="space-y-2">
              {categories.map((cat, i) => (
                <li key={i}>
                  <button className="w-full text-left text-sm text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-2.5 rounded-lg transition flex items-center justify-between group">
                    {cat}
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Center Content */}
        <div className="flex-1 flex flex-col gap-10 min-w-0 w-full overflow-hidden">
          
          {loading ? (
            <PageSkeleton variant="list" />
          ) : (
            <>
              {/* Hero Promotional Banner (Carousel) */}
              <div className="w-full h-[350px] md:h-[400px] lg:h-[450px] bg-slate-900 rounded-2xl overflow-hidden relative group shadow-xl">
                {slides.map((slide, idx) => (
                  <div key={idx} className={`absolute inset-0 transition-opacity duration-1000 ${idx === activeSlide ? 'opacity-100 z-20' : 'opacity-0 z-10'}`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-transparent z-10" />
                    <img src={slide.img} alt={slide.title} className="w-full h-full object-cover opacity-60" />
                    <div className="absolute z-20 inset-0 p-5 sm:p-8 md:p-12 lg:p-16 flex flex-col justify-center max-w-3xl">
                      <span className="text-teal-400 font-bold mb-2 md:mb-3 text-xs md:text-base tracking-widest">{slide.tag}</span>
                      <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-3 md:mb-6 leading-tight">{slide.title}</h2>
                      <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-300 mb-6 md:mb-8 max-w-xl line-clamp-2 md:line-clamp-none">{slide.desc}</p>
                      <button className="bg-teal-500 text-slate-900 px-6 py-2.5 md:px-8 md:py-3.5 rounded-full font-bold w-max hover:bg-teal-400 transition-colors shadow-lg text-sm md:text-base">Shop Now</button>
                    </div>
                  </div>
                ))}
                
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                  {slides.map((_, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setActiveSlide(idx)}
                      className={`w-3 h-3 rounded-full transition-all ${idx === activeSlide ? 'bg-teal-500 w-8' : 'bg-white/40 hover:bg-white/70'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Top Stores Row */}
              <section className="w-full">
                <div className="flex flex-wrap items-center justify-between mb-4 md:mb-5 px-2 gap-2">
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2"><Store className="text-teal-600 dark:text-teal-400 w-5 h-5 md:w-6 md:h-6"/> Discover Top Stores</h3>
                  <Link to="/market" className="text-xs md:text-sm font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center">See all stores <ChevronRight className="w-4 h-4 md:w-5 md:h-5"/></Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
                  {getFilteredStores(data.topStores)?.map((store: any) => (
                    <Link key={store._id} to={`/shop/${store.slug}`} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-lg hover:border-teal-300 dark:hover:border-teal-600 transition-all flex items-start gap-5 group">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0 text-slate-400 dark:text-slate-500 group-hover:bg-teal-50 dark:group-hover:bg-teal-900/30 transition-colors">
                        <Store size={32} className="group-hover:text-teal-500 dark:group-hover:text-teal-400 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100 leading-tight truncate">{store.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{store.description || 'Independent Seller'}</p>
                        <div className="flex items-center gap-2 mt-3">
                          {store.category && <span className="inline-block text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md font-bold">{store.category}</span>}
                          {store.location && <span className="flex items-center gap-1 text-[10px] text-slate-400"><MapPin size={10}/> {store.location}</span>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              {/* NEW: Promotional Products (Continuous Marquee) */}
              {data.promoProducts && data.promoProducts.length > 0 && (
                <section className="bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/20 dark:to-orange-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-sm w-full overflow-hidden relative py-8 transition-colors">
                  <div className="absolute top-6 left-6 z-20 bg-white dark:bg-slate-900 shadow-lg px-4 py-2 rounded-full flex items-center gap-2 border border-slate-100 dark:border-slate-800">
                    <Tag size={18} className="text-rose-500"/>
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Super Promotions</h3>
                  </div>
                  
                  <div className="w-full overflow-hidden flex hide-scrollbar pt-12 pb-4">
                    <div className="flex gap-4 animate-marquee min-w-max hover:[animation-play-state:paused] pl-4">
                      {/* Double the list to create a seamless infinite loop effect */}
                      {[...(getFilteredProducts(data.promoProducts) || []), ...(getFilteredProducts(data.promoProducts) || [])].map((product: any, idx: number) => (
                        <ProductCard key={product._id + idx + 'promo'} product={product} business={product.business_id} compact={true} />
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* NEW: Tech & Gadgets Row */}
              {data.techProducts && data.techProducts.length > 0 && (
                <section className="w-full">
                  <div className="flex flex-wrap items-center justify-between mb-4 md:mb-5 px-2 gap-2">
                    <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2"><Smartphone className="text-blue-500 w-5 h-5 md:w-6 md:h-6"/> Tech & Gadgets</h3>
                    <Link to="/market" className="text-xs md:text-sm font-semibold text-blue-500 hover:underline flex items-center">View Tech <ChevronRight className="w-4 h-4 md:w-5 md:h-5"/></Link>
                  </div>
                  
                  <div className="w-full overflow-x-auto hide-scrollbar pb-6">
                    <div className="flex gap-4 w-max px-2">
                      {getFilteredProducts(data.techProducts).map((product: any) => (
                        <ProductCard key={product._id} product={product} business={product.business_id} compact={true} />
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* NEW: Fashion & Apparel Row */}
              {data.fashionProducts && data.fashionProducts.length > 0 && (
                <section className="w-full">
                  <div className="flex flex-wrap items-center justify-between mb-4 md:mb-5 px-2 gap-2">
                    <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2"><ShoppingBag className="text-fuchsia-500 w-5 h-5 md:w-6 md:h-6"/> Fashion & Apparel</h3>
                    <Link to="/market" className="text-xs md:text-sm font-semibold text-fuchsia-500 hover:underline flex items-center">View Fashion <ChevronRight className="w-4 h-4 md:w-5 md:h-5"/></Link>
                  </div>
                  
                  <div className="w-full overflow-x-auto hide-scrollbar pb-6">
                    <div className="flex gap-4 w-max px-2">
                      {getFilteredProducts(data.fashionProducts).map((product: any) => (
                        <ProductCard key={product._id} product={product} business={product.business_id} compact={true} />
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Latest Deals (Scrollable Row) */}
              <section className="w-full bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">Newest Additions</h3>
                </div>
                
                <div className="w-full overflow-x-auto hide-scrollbar pb-2">
                  <div className="flex gap-4 w-max">
                    {getFilteredProducts(data.latestProducts)?.map((product: any) => (
                      <ProductCard key={product._id} product={product} business={product.business_id} compact={true} />
                    ))}
                  </div>
                </div>
              </section>

              {/* Just For You (Masonry Grid) */}
              <section className="w-full">
                <div className="flex items-center justify-between mb-4 md:mb-6 px-2">
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2"><TrendingUp className="text-teal-500 w-5 h-5 md:w-6 md:h-6"/> Recommended For You</h3>
                </div>
                
                {/* CSS Columns Masonry */}
                <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-3 md:gap-4 w-full pb-20 px-1 md:px-2">
                  {getFilteredProducts(data.randomProducts)?.map((product: any) => (
                    <ProductCard key={product._id} product={product} business={product.business} isMasonry={true} />
                  ))}
                </div>
              </section>

            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800 w-full mt-auto">
        <div className="w-full px-4 lg:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h4 className="text-white font-bold mb-4">Get to Know Us</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:underline">Careers</a></li>
              <li><a href="#" className="hover:underline">Blog</a></li>
              <li><a href="#" className="hover:underline">About SIMBBiz</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Make Money with Us</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/signup" className="hover:underline">Sell on SIMBBiz</Link></li>
              <li><a href="#" className="hover:underline">Become an Affiliate</a></li>
              <li><a href="#" className="hover:underline">Advertise Your Products</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Payment Products</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:underline">Business Card</a></li>
              <li><a href="#" className="hover:underline">Shop with Points</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Let Us Help You</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:underline">Your Account</a></li>
              <li><a href="#" className="hover:underline">Your Orders</a></li>
              <li><a href="#" className="hover:underline">Help & Support</a></li>
            </ul>
          </div>
        </div>
        <div className="text-center text-sm border-t border-slate-800 pt-8 w-full">
          © 2026 SIMBBiz Marketplace. Built for scale.
        </div>
      </footer>
    </div>
  );
}

function ProductCard({ product, business, compact = false, isMasonry = false }: any) {
  const handleOrder = (e: any) => {
    e.preventDefault();
    if (!business?.phone) return alert('This store has no phone number attached.');
    const text = encodeURIComponent(`Hi, I found this on SIMBBiz and I'd like to order: ${product.name} - $${product.price}`);
    window.open(`https://wa.me/${business.phone.replace(/\D/g, '')}?text=${text}`, '_blank');
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all duration-300 flex flex-col group 
      ${compact ? 'min-w-[200px] w-[200px] md:min-w-[240px] md:w-[240px] flex-shrink-0' : 'w-full'}
      ${isMasonry ? 'break-inside-avoid mb-4' : ''}
    `}>
      {/* Image Container */}
      <div className={`relative bg-slate-50 dark:bg-slate-800 overflow-hidden ${compact ? 'aspect-square' : ''}`}>
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name} 
            className={`w-full block ${isMasonry ? 'h-auto object-cover' : 'h-full object-cover'} transition-transform duration-700 group-hover:scale-105`} 
            loading="lazy"
          />
        ) : (
          <div className="w-full aspect-square flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
            <Store size={48} className="opacity-30 mb-2" />
            <span className="text-xs">No Image</span>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {product.is_promotion && (
            <span className="bg-teal-500 text-slate-900 text-[10px] font-black px-2 py-1 rounded-full shadow-md uppercase tracking-wider">
              Promo
            </span>
          )}
          {product.discount > 0 && (
            <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md">
              -{product.discount}% OFF
            </span>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="p-4 flex-1 flex flex-col border-t border-slate-100 dark:border-slate-800">
        
        {/* Store Name */}
        <Link to={`/shop/${business?.slug}`} className="text-[11px] md:text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:underline mb-1.5 flex items-center gap-1 max-w-full">
          <Store size={12} className="flex-shrink-0" /> <span className="truncate">{business?.name || 'Independent Store'}</span>
        </Link>
        
        {/* Product Name */}
        <h4 className="text-[14px] md:text-[15px] font-semibold text-slate-800 dark:text-slate-100 leading-snug mb-2 line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{product.name}</h4>
        
        {/* Description (Masonry Only) */}
        {isMasonry && product.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{product.description}</p>
        )}

        {/* Location */}
        {business?.location && (
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1">
            <MapPin size={10}/> {business.location}
          </p>
        )}
        
        {/* Price & Action */}
        <div className="mt-auto pt-2">
          <div className="flex items-end gap-2 mb-3">
            <span className="text-xl font-black text-slate-900 dark:text-white">${product.price.toFixed(2)}</span>
            {product.discount > 0 && (
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 line-through mb-1">${(product.price / (1 - product.discount/100)).toFixed(2)}</span>
            )}
          </div>
          
          <button 
            onClick={handleOrder}
            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-teal-500 dark:hover:bg-teal-500 hover:text-slate-900 dark:hover:text-slate-900 font-bold py-2 md:py-2.5 rounded-lg transition-colors text-[11px] md:text-sm shadow-sm"
          >
            Buy on WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
