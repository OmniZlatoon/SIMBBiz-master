import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Calendar } from '../components/MaterialIcon';
import { PageSkeleton } from '../components/PageSkeleton';

export default function Sales() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { activeStore } = useAuth();

  useEffect(() => {
    fetchSales();
  }, [activeStore]);

  const fetchSales = async () => {
    try {
      if (!activeStore) return setLoading(false);
      
      const res = await api.get(`/businesses/${activeStore._id}/sales`);
      setSales(res.data || []);
    } catch (error) {
      console.error('Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search sales by customer..." 
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <button className="bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 transition flex items-center gap-2">
          <Plus size={20} /> Record New Sale
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-600">Date</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Customer</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Type</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={4} className="p-5"><PageSkeleton variant="list" /></td></tr>
              ) : sales.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No sales recorded yet.</td></tr>
              ) : (
                sales.map((sale: any) => (
                  <tr key={sale._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-600 flex items-center gap-2">
                      <Calendar size={16} className="text-slate-400"/>
                      {new Date(sale.sale_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">{sale.customer_name || 'Walk-in'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase
                        ${sale.type === 'cash' ? 'bg-emerald-100 text-emerald-800' : 
                          sale.type === 'credit' ? 'bg-rose-100 text-rose-800' : 
                          'bg-blue-100 text-blue-800'}`}>
                        {sale.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">${sale.total}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
