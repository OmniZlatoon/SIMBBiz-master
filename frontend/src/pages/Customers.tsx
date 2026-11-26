import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Phone } from '../components/MaterialIcon';
import { PageSkeleton } from '../components/PageSkeleton';

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { activeStore } = useAuth();

  useEffect(() => {
    fetchCustomers();
  }, [activeStore]);

  const fetchCustomers = async () => {
    try {
      if (!activeStore) return setLoading(false);
      
      const res = await api.get(`/businesses/${activeStore._id}/customers`);
      setCustomers(res.data || []);
    } catch (error) {
      console.error('Failed to fetch customers');
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
            placeholder="Search customers..." 
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <button className="bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 transition flex items-center gap-2">
          <Plus size={20} /> Add Customer
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-600">Name</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Phone</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Customer Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={3} className="p-5"><PageSkeleton variant="list" /></td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">No customers found.</td></tr>
              ) : (
                customers.map((customer: any) => (
                  <tr key={customer._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{customer.name}</td>
                    <td className="px-6 py-4 text-slate-600 flex items-center gap-2">
                      {customer.phone && <Phone size={14} className="text-slate-400"/>}
                      {customer.phone || '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(customer.since_date).toLocaleDateString()}
                    </td>
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
