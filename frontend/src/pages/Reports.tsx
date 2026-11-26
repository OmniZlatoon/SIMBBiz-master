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
        <h2 className="text-2xl font-bold text-slate-800">Financial Overview</h2>
        <div className="flex gap-2">
          <select className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-700 outline-none focus:border-teal-500">
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Year</option>
            <option>All Time</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-600">Gross Revenue</h3>
            <div className="p-2 bg-teal-50 rounded-lg text-teal-600"><TrendingUp size={20} /></div>
          </div>
          <p className="text-3xl font-bold text-slate-800">${summary?.total_revenue || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-600">Total Costs</h3>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600"><TrendingDown size={20} /></div>
          </div>
          <p className="text-3xl font-bold text-slate-800">${summary?.total_costs || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-600">Estimated Profit</h3>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><DollarSign size={20} /></div>
          </div>
          <p className="text-3xl font-bold text-slate-800">${summary?.estimated_profit || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <PieChart size={20} className="text-teal-600" /> Top Selling Products
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-600">Product Name</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Units Sold</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Revenue Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {!summary?.top_products || summary.top_products.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">No data available for this period.</td></tr>
              ) : (
                summary.top_products.map((product: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{product.name}</td>
                    <td className="px-6 py-4 text-slate-600">{product.units}</td>
                    <td className="px-6 py-4 font-semibold text-teal-600">${product.revenue}</td>
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
