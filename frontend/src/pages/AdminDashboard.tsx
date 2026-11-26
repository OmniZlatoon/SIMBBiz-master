import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Users, Store, TrendingUp, DollarSign, ArrowLeft, Shield, Trash2, CheckCircle, XCircle, LayoutDashboard, CreditCard, Megaphone, Server, MessageSquare, Power, Package } from '../components/MaterialIcon';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { PageSkeleton } from '../components/PageSkeleton';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [stats, setStats] = useState({ users: 0, stores: 0, total_sales: 0, total_revenue: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({ salesByDay: [], signupsByDay: [] });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);

  // Form State
  const [annForm, setAnnForm] = useState({ title: '', message: '', type: 'info' });
  const [planForm, setPlanForm] = useState({ name: '', price: 0, slots: 0, description: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, busRes, subRes, anaRes, annRes, planRes, tickRes] = await Promise.all([
        api.get('/admin/stats'), api.get('/admin/users'), api.get('/admin/businesses'),
        api.get('/admin/subscriptions'), api.get('/admin/analytics'), api.get('/announcements'),
        api.get('/plans'), api.get('/tickets')
      ]);
      if (statsRes.success) setStats(statsRes.data);
      if (usersRes.success) setUsers(usersRes.data);
      if (busRes.success) setBusinesses(busRes.data);
      if (subRes.success) setSubscriptions(subRes.data);
      if (anaRes.success) setAnalytics(anaRes.data);
      if (annRes.success) setAnnouncements(annRes.data);
      if (planRes.success) setPlans(planRes.data);
      if (tickRes.success) setTickets(tickRes.data);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // Handlers
  const handleToggleSuspend = async (id: string) => {
    await api.patch(`/admin/businesses/${id}/suspend`, {});
    fetchData();
  };
  
  const handleCreateAnnouncement = async (e: any) => {
    e.preventDefault();
    await api.post('/admin/announcements', annForm);
    setAnnForm({ title: '', message: '', type: 'info' });
    fetchData();
  };

  const handleDeleteAnnouncement = async (id: string) => {
    await api.delete(`/admin/announcements/${id}`);
    fetchData();
  };

  const handleCreatePlan = async (e: any) => {
    e.preventDefault();
    await api.post('/admin/plans', planForm);
    setPlanForm({ name: '', price: 0, slots: 0, description: '' });
    fetchData();
  };

  const handleDeletePlan = async (id: string) => {
    await api.delete(`/admin/plans/${id}`);
    fetchData();
  };

  const handleReplyTicket = async (id: string, status: string) => {
    const msg = prompt('Enter reply message:');
    if (!msg) return;
    await api.post(`/tickets/${id}/reply`, { message: msg, status });
    fetchData();
  };
  
  const handleUpdateRole = async (userId: string, newRole: string) => {
    await api.patch(`/admin/users/${userId}/role`, { role: newRole });
    fetchData();
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      await api.delete(`/admin/users/${userId}`);
      fetchData();
    }
  };

  const handleUpdateSubStatus = async (subId: string, status: string) => {
    await api.patch(`/admin/subscriptions/${subId}/status`, { status });
    fetchData();
  };

  if (loading) return <PageSkeleton variant="dashboard" />;

  const tabs = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'businesses', name: 'Stores', icon: Store },
    { id: 'subscriptions', name: 'Payments', icon: CreditCard },
    { id: 'plans', name: 'Plans', icon: Server },
    { id: 'announcements', name: 'Alerts', icon: Megaphone },
    { id: 'tickets', name: 'Support', icon: MessageSquare }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 font-sans text-slate-300">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <div className="max-w-[95rem] mx-auto p-6 md:p-10 relative z-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 border-b border-white/5 pb-8">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-gradient-to-br from-teal-500/20 to-indigo-500/20 rounded-2xl border border-white/10 backdrop-blur-md shadow-lg shadow-teal-500/10">
              <Shield className="text-teal-400 drop-shadow-md" size={36} />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">Admin Console</h1>
              <p className="text-teal-400 text-sm font-bold mt-2 uppercase tracking-[0.2em]">Platform Command Center</p>
            </div>
          </div>
          <Link to="/dashboard" className="flex items-center w-max gap-3 text-white bg-white/5 hover:bg-white/10 px-6 py-3.5 rounded-2xl transition border border-white/10 backdrop-blur-md shadow-lg hover:shadow-xl font-medium">
            <ArrowLeft size={18} /> Exit to App
          </Link>
        </header>

        <div className="flex gap-4 mb-10 overflow-x-auto pb-4 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex whitespace-nowrap items-center gap-3 px-7 py-4 rounded-2xl font-bold tracking-wide transition-all duration-300 ${activeTab === tab.id ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-xl shadow-teal-500/25 border-transparent transform scale-[1.02]' : 'bg-white/[0.03] text-slate-400 hover:bg-white/10 hover:text-white border border-white/5 backdrop-blur-md hover:scale-[1.02]'}`}
            >
              <tab.icon size={20} />
              {tab.name}
            </button>
          ))}
        </div>

        <main className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <PremiumStatCard title="Total Users" value={stats.users.toString()} icon={Users} color="text-indigo-400" gradient="from-indigo-500/10 to-purple-500/10" border="border-indigo-500/20" />
              <PremiumStatCard title="Active Stores" value={stats.stores.toString()} icon={Store} color="text-amber-400" gradient="from-amber-500/10 to-orange-500/10" border="border-amber-500/20" />
              <PremiumStatCard title="Platform Sales" value={stats.total_sales.toString()} icon={TrendingUp} color="text-emerald-400" gradient="from-emerald-500/10 to-teal-500/10" border="border-emerald-500/20" />
              <PremiumStatCard title="Gross Revenue" value={`$${stats.total_revenue.toLocaleString()}`} icon={DollarSign} color="text-blue-400" gradient="from-blue-500/10 to-cyan-500/10" border="border-blue-500/20" />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <ChartCard title="Platform Revenue (30 Days)" gradient="from-emerald-500/5 to-teal-500/5">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.salesByDay}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--button-primary)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--button-primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="_id" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(val) => `$${val}`} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--surface-dark-sidebar)', borderColor: 'var(--border-subtle)', borderRadius: '4px' }} itemStyle={{ color: 'var(--text-dark)' }} />
                    <Area type="monotone" dataKey="total" stroke="var(--button-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title="User Acquisition (30 Days)" gradient="from-indigo-500/5 to-purple-500/5">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.signupsByDay}>
                    <defs>
                      <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4b91f1" />
                        <stop offset="100%" stopColor="#0b57d0" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="_id" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--surface-dark-sidebar)', borderColor: 'var(--border-subtle)', borderRadius: '4px' }} cursor={{ fill: 'var(--surface-hover)' }} />
                    <Bar dataKey="count" fill="url(#colorSignups)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}

          {activeTab === 'users' && (
            <DataGrid>
              <thead className="bg-white/5 border-b border-white/10">
                <tr><th className="px-8 py-6 font-bold text-slate-400 text-xs tracking-[0.2em] uppercase">Name</th><th className="px-8 py-6 font-bold text-slate-400 text-xs tracking-[0.2em] uppercase">Email</th><th className="px-8 py-6 font-bold text-slate-400 text-xs tracking-[0.2em] uppercase">Role</th><th className="px-8 py-6 font-bold text-slate-400 text-xs tracking-[0.2em] uppercase text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-8 py-6 text-white font-semibold text-lg">{u.name}</td>
                    <td className="px-8 py-6 text-slate-400">{u.email}</td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-lg shadow-purple-500/10' : 'bg-white/10 text-slate-300 border border-white/10'}`}>{u.role}</span>
                    </td>
                    <td className="px-8 py-6 flex justify-end gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleUpdateRole(u._id, u.role === 'admin' ? 'user' : 'admin')} className="text-xs px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition font-bold tracking-wider uppercase border border-white/10">{u.role === 'admin' ? 'Demote' : 'Promote'}</button>
                      <button onClick={() => handleDeleteUser(u._id)} className="text-rose-400 hover:text-rose-300 p-2.5 rounded-xl hover:bg-rose-500/20 transition border border-transparent hover:border-rose-500/30"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataGrid>
          )}

          {activeTab === 'businesses' && (
            <DataGrid>
              <thead className="bg-white/5 border-b border-white/10">
                <tr><th className="px-8 py-6 font-bold text-slate-400 text-xs tracking-[0.2em] uppercase">Store Name</th><th className="px-8 py-6 font-bold text-slate-400 text-xs tracking-[0.2em] uppercase">Link</th><th className="px-8 py-6 font-bold text-slate-400 text-xs tracking-[0.2em] uppercase">Status</th><th className="px-8 py-6 font-bold text-slate-400 text-xs tracking-[0.2em] uppercase">Capacity</th><th className="px-8 py-6 font-bold text-slate-400 text-xs tracking-[0.2em] uppercase text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {businesses.map(b => (
                  <tr key={b._id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-8 py-6 text-white font-semibold text-lg">{b.name}</td>
                    <td className="px-8 py-6 text-teal-400 font-mono text-sm bg-teal-500/5 px-4 rounded-lg">/shop/{b.slug}</td>
                    <td className="px-8 py-6">
                      {b.isSuspended ? <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">Suspended</span> : <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">Active</span>}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <span className="text-amber-400 text-xs font-black uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">{b.subscription_plan}</span>
                        <span className="text-slate-400 font-medium">{b.item_slots_available} items</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 flex justify-end">
                      <button onClick={() => handleToggleSuspend(b._id)} className={`flex items-center gap-2 text-xs px-5 py-2.5 rounded-xl transition font-black tracking-wider uppercase shadow-lg ${b.isSuspended ? 'bg-emerald-500 text-slate-900 hover:bg-emerald-400 shadow-emerald-500/20' : 'bg-rose-500 text-white hover:bg-rose-400 shadow-rose-500/20'}`}>
                        <Power size={16} strokeWidth={3} /> {b.isSuspended ? 'Restore Store' : 'Kill Switch'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataGrid>
          )}

          {activeTab === 'subscriptions' && (
            <DataGrid>
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-8 py-6 font-bold text-slate-400 text-xs tracking-[0.2em] uppercase">Store</th>
                  <th className="px-8 py-6 font-bold text-slate-400 text-xs tracking-[0.2em] uppercase">Method & Ref</th>
                  <th className="px-8 py-6 font-bold text-slate-400 text-xs tracking-[0.2em] uppercase">Amount Paid</th>
                  <th className="px-8 py-6 font-bold text-slate-400 text-xs tracking-[0.2em] uppercase">Package</th>
                  <th className="px-8 py-6 font-bold text-slate-400 text-xs tracking-[0.2em] uppercase">Status</th>
                  <th className="px-8 py-6 font-bold text-slate-400 text-xs tracking-[0.2em] uppercase text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {subscriptions.map(s => (
                  <tr key={s._id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-8 py-6 text-white font-semibold text-lg">{s.business_id?.name || 'Unknown'}</td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">{s.payment_method}</span>
                        <span className="text-xs text-slate-500 font-mono tracking-wider bg-black/20 px-2 py-1 rounded w-max">{s.transaction_reference || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 font-black text-xl text-emerald-400">{s.amount?.toLocaleString()} FCFA</td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col items-start gap-2">
                        <span className="text-indigo-300 text-sm font-bold uppercase tracking-wider">{s.plan_or_spaces}</span>
                        <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-md text-xs font-bold tracking-wider">+{s.slots_added} slots</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center w-max gap-2 border shadow-lg ${s.payment_status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10' : s.payment_status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-amber-500/10' : 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-rose-500/10'}`}>
                        {s.payment_status === 'completed' ? <CheckCircle size={16} strokeWidth={3}/> : s.payment_status === 'failed' ? <XCircle size={16} strokeWidth={3}/> : <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"/>}
                        {s.payment_status || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="px-8 py-6 flex justify-end gap-3">
                      {s.payment_status === 'pending' && (
                        <>
                          <button onClick={() => handleUpdateSubStatus(s._id, 'successful')} className="text-xs px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black tracking-widest uppercase transition shadow-lg shadow-emerald-500/20">Verify</button>
                          <button onClick={() => handleUpdateSubStatus(s._id, 'failed')} className="text-xs px-5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold tracking-widest uppercase transition border border-rose-500/30">Reject</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {subscriptions.length === 0 && (
                  <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-500 font-medium text-xl">No payment records found.</td></tr>
                )}
              </tbody>
            </DataGrid>
          )}

          {activeTab === 'plans' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl shadow-2xl col-span-1 h-max relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-colors" />
                <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3"><Server className="text-indigo-400"/> Add Tier</h3>
                <form onSubmit={handleCreatePlan} className="space-y-6 relative z-10">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5 block">Plan Name</label>
                    <input required value={planForm.name} onChange={e => setPlanForm({...planForm, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition" placeholder="e.g. Enterprise Tier" />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5 block">Price (XAF)</label>
                      <input type="number" required value={planForm.price} onChange={e => setPlanForm({...planForm, price: Number(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5 block">Total Slots</label>
                      <input type="number" required value={planForm.slots} onChange={e => setPlanForm({...planForm, slots: Number(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5 block">Description</label>
                    <input value={planForm.description} onChange={e => setPlanForm({...planForm, description: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition" placeholder="Short tagline for this plan" />
                  </div>
                  <button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-black tracking-widest uppercase py-4 rounded-2xl transition shadow-xl shadow-indigo-500/20 mt-4">Deploy Plan</button>
                </form>
              </div>
              
              <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                {plans.map(p => (
                  <div key={p._id} className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-8 rounded-[2rem] relative shadow-2xl hover:-translate-y-2 transition-transform duration-300 backdrop-blur-xl flex flex-col">
                    <button onClick={() => handleDeletePlan(p._id)} className="absolute top-6 right-6 text-slate-500 hover:text-rose-400 bg-black/20 hover:bg-rose-500/20 p-2.5 rounded-xl transition"><Trash2 size={20}/></button>
                    <h4 className="text-2xl font-black text-white">{p.name}</h4>
                    <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400 mt-4">{p.price.toLocaleString()} <span className="text-xl text-slate-500 font-bold uppercase tracking-wider">FCFA</span></p>
                    <p className="text-base text-slate-400 mt-4 mb-8 flex-1">{p.description}</p>
                    <div className="w-full py-4 bg-black/30 border border-white/5 rounded-2xl text-center text-white font-black tracking-[0.2em] uppercase text-sm flex items-center justify-center gap-3">
                      <Package size={20} className="text-teal-400" /> {p.slots} Store Slots
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl shadow-2xl col-span-1 h-max group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-colors" />
                <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3 relative z-10"><Megaphone className="text-amber-400"/> Broadcast</h3>
                <form onSubmit={handleCreateAnnouncement} className="space-y-6 relative z-10">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5 block">Headline</label>
                    <input required value={annForm.title} onChange={e => setAnnForm({...annForm, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white font-medium focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5 block">Message Body</label>
                    <textarea required rows={4} value={annForm.message} onChange={e => setAnnForm({...annForm, message: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white font-medium focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5 block">Alert Level</label>
                    <select value={annForm.type} onChange={e => setAnnForm({...annForm, type: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white font-medium focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition appearance-none cursor-pointer">
                      <option value="info">System Info (Blue)</option>
                      <option value="warning">Important Warning (Yellow)</option>
                      <option value="success">Success News (Green)</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-black tracking-widest py-4 rounded-2xl transition shadow-xl shadow-amber-500/20 mt-4 uppercase">Push Alert</button>
                </form>
              </div>
              
              <div className="col-span-2 space-y-6">
                {announcements.map(ann => (
                  <div key={ann._id} className={`p-8 rounded-[2rem] border backdrop-blur-xl shadow-2xl flex justify-between items-start transition-all hover:scale-[1.02] ${ann.type === 'info' ? 'bg-blue-500/10 border-blue-500/20' : ann.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                    <div>
                      <h4 className={`text-2xl font-black flex items-center gap-3 ${ann.type === 'info' ? 'text-blue-400' : ann.type === 'warning' ? 'text-amber-400' : 'text-emerald-400'}`}>
                        <Megaphone size={24}/> {ann.title}
                      </h4>
                      <p className="mt-3 text-slate-300 leading-relaxed text-lg">{ann.message}</p>
                      <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] opacity-50 text-white">{new Date(ann.createdAt).toLocaleString()}</p>
                    </div>
                    <button onClick={() => handleDeleteAnnouncement(ann._id)} className="p-4 bg-black/20 hover:bg-black/40 text-white rounded-xl transition"><Trash2 size={20}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tickets.map(t => (
                <div key={t._id} className="bg-white/5 border border-white/10 rounded-[2rem] p-8 shadow-2xl backdrop-blur-xl flex flex-col h-[500px]">
                  <div className="flex justify-between items-start mb-6 pb-6 border-b border-white/10">
                    <div>
                      <h3 className="text-xl font-black text-white mb-2 leading-tight">{t.subject}</h3>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{t.user_id?.name || 'Unknown User'}</p>
                    </div>
                    <span className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl border shadow-lg ${t.status === 'open' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-amber-500/10' : t.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10' : 'bg-white/10 text-slate-300 border-white/20'}`}>{t.status}</span>
                  </div>
                  
                  <div className="space-y-4 mb-8 flex-1 overflow-y-auto pr-3 custom-scrollbar">
                    {t.replies.map((r: any, idx: number) => (
                      <div key={idx} className={`p-4 rounded-2xl max-w-[85%] shadow-md ${r.sender === 'admin' ? 'bg-gradient-to-br from-teal-500/20 to-teal-600/10 text-teal-50 ml-auto border border-teal-500/30 rounded-tr-sm' : 'bg-black/40 text-slate-200 border border-white/5 rounded-tl-sm'}`}>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-2">{r.sender}</p>
                        <p className="text-sm leading-relaxed">{r.message}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4 mt-auto pt-6 border-t border-white/10">
                    <button onClick={() => handleReplyTicket(t._id, 'in-progress')} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl text-sm font-black tracking-widest uppercase transition border border-white/5">Reply</button>
                    {t.status !== 'resolved' && (
                      <button onClick={() => handleReplyTicket(t._id, 'resolved')} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-900 py-4 rounded-2xl text-sm font-black tracking-widest uppercase transition shadow-xl shadow-emerald-500/20">Resolve</button>
                    )}
                  </div>
                </div>
              ))}
              {tickets.length === 0 && <div className="col-span-full py-32 text-center text-slate-500 font-bold tracking-wider uppercase text-2xl">No support tickets found.</div>}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

function PremiumStatCard({ title, value, icon: Icon, color, gradient, border }: any) {
  return (
    <div className={`bg-gradient-to-br ${gradient} p-8 rounded-[2rem] border ${border} shadow-2xl backdrop-blur-xl flex items-center space-x-6 hover:-translate-y-2 transition-transform duration-300`}>
      <div className={`p-5 rounded-2xl bg-black/20 backdrop-blur-md shadow-inner border border-white/5 ${color}`}>
        <Icon size={36} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{title}</p>
        <p className="text-4xl font-black text-white mt-2">{value}</p>
      </div>
    </div>
  );
}

function ChartCard({ title, children, gradient }: any) {
  return (
    <div className={`bg-gradient-to-br ${gradient} p-10 rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-xl h-[450px] flex flex-col`}>
      <h3 className="text-2xl font-black text-white mb-8 tracking-tight">{title}</h3>
      <div className="flex-1 w-full">
        {children}
      </div>
    </div>
  );
}

function DataGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-black/20 border border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-2xl shadow-2xl">
      <table className="w-full text-left text-sm text-slate-300">
        {children}
      </table>
    </div>
  );
}
