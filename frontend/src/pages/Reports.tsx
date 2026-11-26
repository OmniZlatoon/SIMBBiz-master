import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { PieChart, TrendingUp, TrendingDown, DollarSign } from '../components/MaterialIcon';
import { PageSkeleton } from '../components/PageSkeleton';

export default function Reports() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { activeStore } = useAuth();

  useEffect(() => {
    fetchReports();
  }, [activeStore]);

  const fetchReports = async () => {
    try {
      if (!activeStore) return setLoading(false);
      
      const res = await api.get(`/businesses/${activeStore._id}/reports/summary`);
      setSummary(res.data);
    } catch (error) {
      console.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageSkeleton variant="dashboard" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Financial Overview</h2>
        <div className="flex gap-2">
          <select className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-700 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Year</option>
            <option>All Time</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-600 dark:text-slate-300">Gross Revenue</h3>
            <div className="rounded-lg bg-teal-50 p-2 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400"><TrendingUp size={20} /></div>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">${summary?.total_revenue || 0}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-600 dark:text-slate-300">Total Costs</h3>
            <div className="rounded-lg bg-rose-50 p-2 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"><TrendingDown size={20} /></div>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">${summary?.total_costs || 0}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-600 dark:text-slate-300">Estimated Profit</h3>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"><DollarSign size={20} /></div>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">${summary?.estimated_profit || 0}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-950">
        <div className="border-b border-slate-200 p-6 dark:border-slate-800">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
            <PieChart size={20} className="text-teal-600" /> Top Selling Products
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Product Name</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Units Sold</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Revenue Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {!summary?.top_products || summary.top_products.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">No data available for this period.</td></tr>
              ) : (
                summary.top_products.map((product: any, idx: number) => (
                  <tr key={idx} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900">
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{product.name}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{product.units}</td>
                    <td className="px-6 py-4 font-semibold text-teal-600 dark:text-teal-400">${product.revenue}</td>
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
