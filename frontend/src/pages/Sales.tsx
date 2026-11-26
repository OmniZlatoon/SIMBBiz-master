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
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
        <button className="bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 transition flex items-center gap-2">
          <Plus size={20} /> Record New Sale
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-950">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Date</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Customer</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Type</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={4} className="p-5"><PageSkeleton variant="list" /></td></tr>
              ) : sales.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">No sales recorded yet.</td></tr>
              ) : (
                sales.map((sale: any) => (
                  <tr key={sale._id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900">
                    <td className="flex items-center gap-2 px-6 py-4 text-slate-600 dark:text-slate-300">
                      <Calendar size={16} className="text-slate-400"/>
                      {new Date(sale.sale_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{sale.customer_name || 'Walk-in'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase
                        ${sale.type === 'cash' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          sale.type === 'credit' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                        {sale.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">${sale.total}</td>
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
