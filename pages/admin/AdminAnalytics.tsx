
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, 
  PieChart as RePieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  MapPin, TrendingUp, ShoppingBag, XCircle, RefreshCcw, 
  ChevronRight, Filter, Download, ArrowUpRight, ArrowDownRight,
  Target, Zap, Users, Wallet, Activity, PieChart
} from 'lucide-react';
import { fetchOrders, fetchUsers, fetchProducts } from '../../src/api';
import { Order, User, Product, Address } from '../../types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AdminAnalytics: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [selectedState, setSelectedState] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [o, u, p] = await Promise.all([
        fetchOrders(),
        fetchUsers(),
        fetchProducts()
      ]);
      setOrders(o);
      setUsers(u);
      setProducts(p);
    } catch (err) {
      console.error("Analytics data load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get address from order
  const getOrderAddress = (order: Order, user?: User): Address | null => {
    const o: any = order;
    const u: any = user;
    let addr: any;

    if (u?.addresses && u.addresses.length > 0) {
      addr = u.addresses.find((a: any) => a.id === o.addressId || a._id === o.addressId);
    }

    if (!addr) addr = o.address || o.shippingAddress || o.shipping_address;

    if (!addr && o.addressData) {
      try {
        addr = JSON.parse(o.addressData);
      } catch (e) {}
    }

    if (!addr && u?.addresses && u.addresses.length > 0) {
      addr = u.addresses[0];
    }

    if (typeof addr === 'string') {
      try {
        addr = JSON.parse(addr);
      } catch (e) {}
    }

    return addr;
  };

  // --- Geographic Processing ---
  const geoStats = useMemo(() => {
    const stats: Record<string, { 
      orders: number, 
      cancelled: number, 
      returned: number, 
      revenue: number,
      pincodes: Record<string, number> 
    }> = {};

    orders.forEach(order => {
      const user = users.find(u => (u.id || (u as any)._id) === order.userId);
      const address = getOrderAddress(order, user);
      
      const state = address?.state || 'Unknown';
      const pincode = address?.pincode || 'N/A';

      if (!stats[state]) {
        stats[state] = { orders: 0, cancelled: 0, returned: 0, revenue: 0, pincodes: {} };
      }

      stats[state].orders++;
      stats[state].revenue += order.totalAmount;
      if (order.status === 'cancelled') stats[state].cancelled++;
      if (order.status === 'returned') stats[state].returned++;
      
      stats[state].pincodes[pincode] = (stats[state].pincodes[pincode] || 0) + 1;
    });

    return stats;
  }, [orders, users]);

  const stateChartData = useMemo(() => {
    return Object.entries(geoStats).map(([name, data]) => ({
      name,
      orders: data.orders,
      cancelled: data.cancelled,
      returned: data.returned,
      revenue: data.revenue
    })).sort((a, b) => b.orders - a.orders);
  }, [geoStats]);

  const pincodeChartData = useMemo(() => {
    if (!selectedState || !geoStats[selectedState]) return [];
    return Object.entries(geoStats[selectedState].pincodes)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [selectedState, geoStats]);

  // --- Growth Metrics ---
  const metrics = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? o.totalAmount : 0), 0);
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    const returnRate = orders.length > 0 ? (orders.filter(o => o.status === 'returned').length / orders.length) * 100 : 0;
    
    return {
      totalRevenue,
      avgOrderValue,
      returnRate,
      totalUsers: users.length,
      conversionRate: (orders.length / users.length) * 100
    };
  }, [orders, users]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <Activity className="w-12 h-12 text-green-500 animate-spin" />
        <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Decrypting Neural Signals...</span>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-black min-h-full text-white">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">Command Analytics</h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Real-time business intelligence & neural patterns</p>
        </div>
        <div className="flex gap-2 bg-zinc-900 p-1 rounded-xl border border-white/5">
          {(['7d', '30d', 'all'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                timeRange === range ? 'bg-green-500 text-black' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* High Level Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Revenue', value: `₹${metrics.totalRevenue.toLocaleString()}`, icon: Wallet, color: 'text-green-500', trend: '+12.5%' },
          { label: 'Orders', value: orders.length, icon: ShoppingBag, color: 'text-blue-500', trend: '+8.2%' },
          { label: 'Return Rate', value: `${metrics.returnRate.toFixed(1)}%`, icon: RefreshCcw, color: 'text-orange-500', trend: '-2.1%' },
          { label: 'Customers', value: metrics.totalUsers, icon: Users, color: 'text-purple-500', trend: '+15.3%' },
        ].map((stat, i) => (
          <div key={i} className="bg-zinc-900 border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl bg-black border border-white/5 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-full ${stat.trend.startsWith('+') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {stat.trend}
              </span>
            </div>
            <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</h3>
            <p className="text-2xl font-black italic">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Geographic Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Heat Map Table / State List */}
        <div className="lg:col-span-2 bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" /> Geographic Penetration
            </h3>
            <button className="text-[10px] font-black uppercase text-zinc-500 hover:text-white flex items-center gap-1">
              <Download className="w-3 h-3" /> Export CSV
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-white/5">
                  <th className="p-6">State / Territory</th>
                  <th className="p-6 text-center">Orders</th>
                  <th className="p-6 text-center text-red-500">Cancellations</th>
                  <th className="p-6 text-center text-orange-500">Returns</th>
                  <th className="p-6 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stateChartData.map((state) => (
                  <tr 
                    key={state.name} 
                    className={`hover:bg-white/5 cursor-pointer transition-colors ${selectedState === state.name ? 'bg-blue-500/10' : ''}`}
                    onClick={() => setSelectedState(state.name)}
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          state.orders > 50 ? 'bg-blue-500' : 
                          state.orders > 20 ? 'bg-blue-500/60' : 'bg-blue-500/20'
                        }`} />
                        <span className="font-bold uppercase text-xs">{state.name}</span>
                      </div>
                    </td>
                    <td className="p-6 text-center font-black text-xs">{state.orders}</td>
                    <td className="p-6 text-center">
                      <div className={`inline-block px-2 py-1 rounded text-[10px] font-black ${
                        state.cancelled > 5 ? 'bg-red-500/20 text-red-500' : 'text-zinc-600'
                      }`}>
                        {state.cancelled}
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className={`inline-block px-2 py-1 rounded text-[10px] font-black ${
                        state.returned > 5 ? 'bg-orange-500/20 text-orange-500' : 'text-zinc-600'
                      }`}>
                        {state.returned}
                      </div>
                    </td>
                    <td className="p-6 text-right font-black text-xs text-green-500">₹{state.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Drill Down Side Panel */}
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-white/5 p-6 rounded-3xl h-full">
            <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
              <Target className="w-4 h-4 text-green-500" /> 
              {selectedState ? `${selectedState} Hotspots` : 'Select a State'}
            </h3>
            
            {selectedState ? (
              <div className="space-y-6">
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pincodeChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="code" hide />
                      <YAxis hide />
                      <ReTooltip 
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        itemStyle={{ color: '#10b981', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-2">Top Pincodes</h4>
                  {pincodeChartData.map((pin, i) => (
                    <div key={pin.code} className="flex justify-between items-center group">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-zinc-700">{i+1}</span>
                        <span className="text-xs font-bold text-white tracking-widest">{pin.code}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-zinc-400">{pin.count} Orders</span>
                        <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500" 
                            style={{ width: `${(pin.count / pincodeChartData[0].count) * 100}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-white/5">
                  <button className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-green-500 transition-colors">
                    Launch Campaign for {selectedState} <Zap className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-zinc-700">
                <MapPin className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-[10px] font-black uppercase text-center max-w-[150px]">Select a state to see deep pincode patterns</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Growth Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Revenue Patterns */}
        <div className="bg-zinc-900 border border-white/5 p-8 rounded-[2rem]">
          <h3 className="text-lg font-black uppercase tracking-tight mb-8 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-500" /> Revenue Growth Neural Map
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stateChartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#52525b" fontSize={10} fontWeight="bold" tickFormatter={(v) => v.substring(0, 3)} />
                <YAxis stroke="#52525b" fontSize={10} fontWeight="bold" />
                <ReTooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Business Distribution */}
        <div className="bg-zinc-900 border border-white/5 p-8 rounded-[2rem]">
          <h3 className="text-lg font-black uppercase tracking-tight mb-8 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-orange-500" /> Market Share Distribution
          </h3>
          <div className="h-[300px] flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={stateChartData.slice(0, 5)}
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="orders"
                >
                  {stateChartData.slice(0, 5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ReTooltip 
                   contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
              </RePieChart>
            </ResponsiveContainer>
            <div className="w-1/2 space-y-4">
              {stateChartData.slice(0, 5).map((state, i) => (
                <div key={state.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-[10px] font-black uppercase text-zinc-400">{state.name}</span>
                  </div>
                  <span className="text-[10px] font-black text-white">{((state.orders / orders.length) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
