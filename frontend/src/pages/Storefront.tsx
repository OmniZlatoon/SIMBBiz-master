import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../utils/api';
import { Search, MapPin, Menu, ShoppingBag, Package, Users, Star, Copy, Share2, MessageCircle } from 'lucide-react';

export default function Storefront() {
  const { slug } = useParams();
  const [shopData, setShopData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchShop();
  }, [slug]);

  const fetchShop = async () => {
    try {
      const res = await api.get(`/shop/${slug}`);
      setShopData(res.data);
    } catch (error) {
      console.error('Failed to fetch shop data');
    } finally {
      setLoading(false);
    }
  };

  const storeUrl = `${window.location.origin}${window.location.pathname}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    if (!shopData?.business?.phone) return;
    const text = encodeURIComponent(`Hi, I'm visiting your store on SIMBBiz.`);
    window.open(`https://wa.me/${shopData.business.phone.replace(/\D/g, '')}?text=${text}`, '_blank');
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading shop...</div>;
  if (!shopData) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-rose-500">Shop not found.</div>;

  const { business, categories, uncategorised } = shopData;
  const allProducts = [
    ...(categories?.flatMap((c: any) => c.products || []) || []),
    ...(uncategorised || [])
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col mx-auto max-w-md relative pb-20 shadow-xl border-x border-slate-200 overflow-x-hidden">
      {/* Top Navbar */}
      <header className="bg-white flex items-center justify-between px-4 py-3 sticky top-0 z-30">
        <button className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <Menu size={24} />
        </button>
        <div className="font-extrabold text-xl tracking-tight text-slate-800">
          SIMB<span className="text-teal-600">Biz</span>
        </div>
        <button className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <ShoppingBag size={24} />
        </button>
      </header>

      {/* Hero Section */}
      <div className="relative">
        {/* Banner Image */}
        <div className="h-48 bg-slate-800 w-full relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-900 to-slate-900 opacity-90"></div>
          <div className="relative z-10 text-center px-6">
            <h2 className="text-2xl font-bold text-white mb-2">{business.name.toUpperCase()}</h2>
            <p className="text-teal-100 text-sm">Quality. Affordable. Accessible.</p>
          </div>
        </div>

        {/* Profile Info */}
        <div className="bg-white px-4 pt-12 pb-6 relative rounded-b-3xl shadow-sm mb-6">
          {/* Logo overlapping banner */}
          <div className="absolute -top-12 left-4 w-24 h-24 rounded-full border-4 border-white bg-teal-50 flex items-center justify-center overflow-hidden shadow-md">
            <div className="text-teal-600 font-bold text-3xl">
              {business.name.charAt(0)}
            </div>
          </div>

          <div className="mt-2">
            <h1 className="text-2xl font-bold text-slate-900">{business.name}</h1>
            <p className="text-slate-500 text-sm mt-1">{business.description || 'Welcome to our store. Check out our amazing products.'}</p>
            
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                <ShoppingBag size={14} className="text-teal-600" /> Store
              </span>
              {business.location && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                  <MapPin size={14} className="text-teal-600" /> {business.location}
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="text-center">
              <div className="flex justify-center mb-1"><Package size={20} className="text-slate-400" /></div>
              <div className="font-bold text-slate-800">{allProducts.length}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Products</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-1"><Users size={20} className="text-slate-400" /></div>
              <div className="font-bold text-slate-800">1.2K+</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Customers</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-1"><Star size={20} className="text-slate-400" /></div>
              <div className="font-bold text-slate-800">98%</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Positive</div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">Featured Products</h2>
          <button className="text-sm font-medium text-teal-600 hover:text-teal-700">View all</button>
        </div>
        
        <div className="flex overflow-x-auto pb-4 -mx-4 px-4 gap-4 snap-x hide-scrollbar">
          {allProducts.slice(0, 5).map((product: any) => (
            <div key={product._id} className="min-w-[140px] w-[140px] snap-start bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
              <div className="aspect-square bg-slate-100 relative">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">No Image</div>
                )}
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <h3 className="font-medium text-slate-800 text-xs leading-tight mb-1 truncate">{product.name}</h3>
                <div className="mt-auto font-bold text-teal-600 text-sm">
                  {product.price} <span className="text-[10px] text-slate-400 font-normal">FCFA</span>
                </div>
              </div>
            </div>
          ))}
          {allProducts.length === 0 && (
            <div className="text-slate-500 text-sm py-4">No products available yet.</div>
          )}
        </div>
      </div>

      {/* Order Button */}
      <div className="px-4 mb-6">
        <button 
          onClick={handleWhatsApp}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-3.5 px-4 flex flex-col items-center justify-center shadow-lg shadow-teal-200 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-2 font-bold text-lg">
            <MessageCircle size={22} className="fill-white" />
            ORDER ON WHATSAPP
          </div>
          <div className="text-teal-100 text-xs mt-0.5">Chat with us to place your order</div>
        </button>
      </div>

      {/* Store Link & Social */}
      <div className="px-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm mb-1">Your Store Link</h3>
          <p className="text-xs text-slate-500 mb-3">Share your store with anyone, anywhere.</p>
          
          <div className="flex items-center gap-2 mb-6">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 truncate">
              {storeUrl}
            </div>
            <button 
              onClick={handleCopyLink}
              className="bg-teal-50 text-teal-600 p-2 rounded-lg border border-teal-100 hover:bg-teal-100 transition-colors shrink-0"
            >
              {copied ? <span className="text-xs font-bold px-1">Copied!</span> : <Copy size={20} />}
            </button>
          </div>

          <h3 className="font-bold text-slate-800 text-sm mb-1">Share on Social Media</h3>
          <p className="text-xs text-slate-500 mb-3">Grow your business by sharing your store.</p>
          
          <div className="flex items-center justify-between gap-2">
            <button className="flex-1 py-2 flex flex-col items-center justify-center bg-[#25D366] text-white rounded-xl gap-1 hover:opacity-90">
              <MessageCircle size={20} className="fill-white" />
              <span className="text-[10px] font-medium">WhatsApp</span>
            </button>
            <button className="flex-1 py-2 flex flex-col items-center justify-center bg-[#1877F2] text-white rounded-xl gap-1 hover:opacity-90">
              <Share2 size={20} className="fill-white" />
              <span className="text-[10px] font-medium">Facebook</span>
            </button>
            <button className="flex-1 py-2 flex flex-col items-center justify-center bg-black text-white rounded-xl gap-1 hover:opacity-90">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.34 2.88 2.88 0 0 1 2.31-4.53 2.66 2.66 0 0 1 1.04.2v-3.2A5.85 5.85 0 0 0 5.4 12.5a5.83 5.83 0 0 0 9.87 4.17V8.81a8.1 8.1 0 0 0 4.32 1.24v-3.36Z"/>
              </svg>
              <span className="text-[10px] font-medium">TikTok</span>
            </button>
            <button className="flex-1 py-2 flex flex-col items-center justify-center bg-slate-100 text-slate-600 rounded-xl gap-1 hover:bg-slate-200">
              <div className="flex gap-0.5">
                <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
                <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
                <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
              </div>
              <span className="text-[10px] font-medium">More</span>
            </button>
          </div>
        </div>
      </div>

      {/* Fake Bottom Navigation to match the screenshot for public storefront feel, though typically for owner */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-200 flex justify-between px-6 py-2 z-40 pb-safe">
        <button className="flex flex-col items-center p-1 text-teal-600">
          <div className="mb-1"><Search size={20} /></div>
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button className="flex flex-col items-center p-1 text-slate-400 hover:text-slate-600">
          <div className="mb-1"><ShoppingBag size={20} /></div>
          <span className="text-[10px] font-medium">Products</span>
        </button>
        <button className="flex flex-col items-center p-1 text-slate-400 hover:text-slate-600">
          <div className="mb-1"><Package size={20} /></div>
          <span className="text-[10px] font-medium">Orders</span>
        </button>
        <button className="flex flex-col items-center p-1 text-slate-400 hover:text-slate-600">
          <div className="mb-1"><Users size={20} /></div>
          <span className="text-[10px] font-medium">Customers</span>
        </button>
        <button className="flex flex-col items-center p-1 text-slate-400 hover:text-slate-600">
          <div className="mb-1"><Star size={20} /></div>
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
