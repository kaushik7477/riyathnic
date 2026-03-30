import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { 
  TrendingUp, ShoppingBag, Users, Wallet, AlertCircle, RefreshCw, 
  MapPin, Clock, Activity, ArrowUpRight, ArrowDownRight, Package, Truck,
  X, MessageCircle, ExternalLink, Calendar, RotateCcw
} from 'lucide-react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { fetchOrders, fetchProducts, fetchUsers, fetchAllCarts, socket } from '../../src/api';
import { Order, Product, User } from '../../types';

// --- Constants & Types ---
const INDIA_TOPO_JSON = "/india.json";

// Simplified Pincode to State/City Coordinate Mapping (Approximate Centers)
const PINCODE_REGIONS: { [key: number]: { state: string, coords: [number, number] } } = {
  11: { state: "Delhi", coords: [77.1025, 28.7041] },
  12: { state: "Haryana", coords: [76.0856, 29.0588] },
  13: { state: "Haryana", coords: [76.0856, 29.0588] },
  14: { state: "Punjab", coords: [75.3412, 31.1471] },
  15: { state: "Punjab", coords: [75.3412, 31.1471] },
  16: { state: "Chandigarh", coords: [76.7794, 30.7333] },
  17: { state: "Himachal Pradesh", coords: [77.1734, 31.1048] },
  18: { state: "Jammu & Kashmir", coords: [74.7973, 34.0837] },
  19: { state: "Jammu & Kashmir", coords: [74.7973, 34.0837] },
  20: { state: "Uttar Pradesh", coords: [80.9462, 26.8467] },
  21: { state: "Uttar Pradesh", coords: [80.9462, 26.8467] },
  22: { state: "Uttar Pradesh", coords: [80.9462, 26.8467] },
  23: { state: "Uttar Pradesh", coords: [80.9462, 26.8467] },
  24: { state: "Uttarakhand", coords: [79.0193, 30.0668] },
  25: { state: "Uttar Pradesh", coords: [80.9462, 26.8467] },
  26: { state: "Uttar Pradesh", coords: [80.9462, 26.8467] },
  27: { state: "Uttar Pradesh", coords: [80.9462, 26.8467] },
  28: { state: "Uttar Pradesh", coords: [80.9462, 26.8467] },
  30: { state: "Rajasthan", coords: [74.2179, 27.0238] },
  31: { state: "Rajasthan", coords: [74.2179, 27.0238] },
  32: { state: "Rajasthan", coords: [74.2179, 27.0238] },
  33: { state: "Rajasthan", coords: [74.2179, 27.0238] },
  34: { state: "Rajasthan", coords: [74.2179, 27.0238] },
  36: { state: "Gujarat", coords: [71.1924, 22.2587] },
  37: { state: "Gujarat", coords: [71.1924, 22.2587] },
  38: { state: "Gujarat", coords: [71.1924, 22.2587] },
  39: { state: "Gujarat", coords: [71.1924, 22.2587] },
  40: { state: "Maharashtra", coords: [75.7139, 19.7515] },
  41: { state: "Maharashtra", coords: [75.7139, 19.7515] },
  42: { state: "Maharashtra", coords: [75.7139, 19.7515] },
  43: { state: "Maharashtra", coords: [75.7139, 19.7515] },
  44: { state: "Maharashtra", coords: [75.7139, 19.7515] },
  45: { state: "Madhya Pradesh", coords: [78.6569, 22.9734] },
  46: { state: "Madhya Pradesh", coords: [78.6569, 22.9734] },
  47: { state: "Madhya Pradesh", coords: [78.6569, 22.9734] },
  48: { state: "Madhya Pradesh", coords: [78.6569, 22.9734] },
  49: { state: "Chhattisgarh", coords: [81.8661, 21.2787] },
  50: { state: "Telangana", coords: [79.0193, 18.1124] },
  51: { state: "Andhra Pradesh", coords: [79.7400, 15.9129] },
  52: { state: "Andhra Pradesh", coords: [79.7400, 15.9129] },
  53: { state: "Andhra Pradesh", coords: [79.7400, 15.9129] },
  56: { state: "Karnataka", coords: [75.7139, 15.3173] },
  57: { state: "Karnataka", coords: [75.7139, 15.3173] },
  58: { state: "Karnataka", coords: [75.7139, 15.3173] },
  59: { state: "Karnataka", coords: [75.7139, 15.3173] },
  60: { state: "Tamil Nadu", coords: [78.6569, 11.1271] },
  61: { state: "Tamil Nadu", coords: [78.6569, 11.1271] },
  62: { state: "Tamil Nadu", coords: [78.6569, 11.1271] },
  63: { state: "Tamil Nadu", coords: [78.6569, 11.1271] },
  64: { state: "Tamil Nadu", coords: [78.6569, 11.1271] },
  67: { state: "Kerala", coords: [76.2711, 10.8505] },
  68: { state: "Kerala", coords: [76.2711, 10.8505] },
  69: { state: "Kerala", coords: [76.2711, 10.8505] },
  70: { state: "West Bengal", coords: [87.8550, 22.9868] },
  71: { state: "West Bengal", coords: [87.8550, 22.9868] },
  72: { state: "West Bengal", coords: [87.8550, 22.9868] },
  73: { state: "West Bengal", coords: [87.8550, 22.9868] },
  74: { state: "West Bengal", coords: [87.8550, 22.9868] },
  75: { state: "Odisha", coords: [85.0985, 20.9517] },
  76: { state: "Odisha", coords: [85.0985, 20.9517] },
  77: { state: "Odisha", coords: [85.0985, 20.9517] },
  78: { state: "Assam", coords: [92.9376, 26.2006] },
  79: { state: "North East", coords: [93.9376, 24.2006] },
  80: { state: "Bihar", coords: [85.3131, 25.0961] },
  81: { state: "Bihar", coords: [85.3131, 25.0961] },
  82: { state: "Bihar", coords: [85.3131, 25.0961] },
  83: { state: "Jharkhand", coords: [85.3377, 23.6102] },
  84: { state: "Bihar", coords: [85.3131, 25.0961] },
  85: { state: "Bihar", coords: [85.3131, 25.0961] }
};

const getRegionFromPincode = (pincode: string) => {
  if (!pincode || pincode.length < 2) return null;
  const prefix = parseInt(pincode.substring(0, 2));
  return PINCODE_REGIONS[prefix] || null;
};

const COLORS = {
  primary: '#22c55e', // Green-500
  secondary: '#3b82f6', // Blue-500
  accent: '#a855f7', // Purple-500
  danger: '#ef4444', // Red-500
  warning: '#f97316', // Orange-500
  dark: '#18181b', // Zinc-900
  text: '#71717a', // Zinc-500
  textLight: '#f4f4f5' // Zinc-100
};

const CHART_COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f97316', '#ef4444'];

// --- Helper Components ---

const StatCard = ({ title, value, change, icon: Icon, isPositive, subtext }: any) => (
  <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl hover:border-zinc-700 transition-all group relative overflow-hidden">
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
      <Icon className="w-16 h-16 text-white" />
    </div>
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className={`p-3 rounded-xl bg-zinc-800 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        <Icon className="w-6 h-6" />
      </div>
      {change && (
        <span className={`text-[10px] font-black px-2 py-1 rounded-full flex items-center space-x-1 ${isPositive ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          <span>{change}</span>
        </span>
      )}
    </div>
    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
    <h3 className="text-3xl font-black text-white group-hover:scale-105 transition-transform origin-left">{value}</h3>
    {subtext && <p className="text-zinc-600 text-[10px] mt-2 font-medium">{subtext}</p>}
  </div>
);

const SectionHeader = ({ title, subtitle, action }: any) => (
  <div className="flex justify-between items-end mb-6">
    <div>
      <h3 className="text-lg font-black uppercase tracking-widest text-white">{title}</h3>
      {subtitle && <p className="text-zinc-500 text-xs font-medium mt-1">{subtitle}</p>}
    </div>
    {action}
  </div>
);

// --- Main Component ---

const AdminDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [carts, setCarts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Date Range State (Default: Last 30 Days)
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [showNetProfit, setShowNetProfit] = useState(false);
  const [showAbandonedCarts, setShowAbandonedCarts] = useState(false);

  // Mock Real-time Data
  const [activeUsers, setActiveUsers] = useState(42);
  const [liveTraffic, setLiveTraffic] = useState<{ coordinates: [number, number], intensity: 'high' | 'low' }[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ordersData, productsData, usersData, cartsData] = await Promise.all([
          fetchOrders(),
          fetchProducts(),
          fetchUsers(),
          fetchAllCarts()
        ]);
        setOrders(ordersData);
        setProducts(productsData);
        setUsers(usersData);
        setCarts(cartsData);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Socket listeners for real-time updates
    const handleUpdate = () => {
      loadData();
    };

    socket.on('order_created', handleUpdate);
    socket.on('order_updated', handleUpdate);
    socket.on('product_created', handleUpdate);
    socket.on('product_updated', handleUpdate);
    socket.on('product_deleted', handleUpdate);

    return () => {
      socket.off('order_created', handleUpdate);
      socket.off('order_updated', handleUpdate);
      socket.off('product_created', handleUpdate);
      socket.off('product_updated', handleUpdate);
      socket.off('product_deleted', handleUpdate);
    };
  }, []);

  // Real-time Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers(prev => Math.max(10, prev + Math.floor(Math.random() * 5) - 2));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // --- Derived Metrics ---

  const metrics = useMemo(() => {
    // 1. Date Filtering
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    // Adjust end date to include the full day
    endDate.setHours(23, 59, 59, 999);

    const filteredOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });

    // 2. Top Card Metrics (Some are specific to Today)
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => o.createdAt.startsWith(today));
    const exchangeRequests = filteredOrders.filter(o => o.status === 'returned').length;
    
    // Total Revenue (Filtered)
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    
    // 3. Transit Details (From Filtered Orders)
    // Assuming 'shipped' = In Transit, 'delivered' = Delivered, 'returned' = Returned
    const transitDetails = {
      inTransit: filteredOrders.filter(o => o.status === 'shipped').length,
      delivered: filteredOrders.filter(o => o.status === 'delivered').length,
      returned: filteredOrders.filter(o => o.status === 'returned').length
    };

    // 4. Return & Refund (Lost Revenue)
    const lostRevenue = filteredOrders
      .filter(o => o.status === 'returned')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    // 5. Category/Tag Sales (Pie Chart)
    const categorySales: { [key: string]: number } = {};
    filteredOrders.forEach(order => {
      order.products.forEach(p => {
        const product = products.find(prod => prod.id === p.productId || prod._id === p.productId);
        if (product && product.category) {
          // Use the first category/tag as the primary one for the chart
          const cat = product.category[0] || 'Uncategorized';
          categorySales[cat] = (categorySales[cat] || 0) + p.quantity;
        }
      });
    });
    
    const pieChartData = Object.entries(categorySales)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 categories

    // 6. Map Data (Lifetime)
    const regionCounts: { [key: string]: number } = {};
    const regionCoords: { [key: string]: [number, number] } = {};

    orders.forEach(order => {
      // Find address
      let pincode = '';
      const user = users.find(u => u.id === order.userId);
      if (user && user.addresses) {
         // Try to find the specific address used, or fallback to first
         const addr = user.addresses.find(a => a.id === order.addressId) || user.addresses[0];
         if (addr) pincode = addr.pincode;
      }

      if (pincode) {
        const region = getRegionFromPincode(pincode);
        if (region) {
          regionCounts[region.state] = (regionCounts[region.state] || 0) + 1;
          regionCoords[region.state] = region.coords;
        }
      }
    });

    // Calculate intensity for map dots
    const maxOrdersInRegion = Math.max(...Object.values(regionCounts), 1);
    const mapPoints = Object.entries(regionCounts).map(([state, count]) => ({
      name: state,
      coordinates: regionCoords[state],
      count,
      intensity: count > (maxOrdersInRegion / 2) ? 'high' : 'low' // Dark green vs Light green
    }));

    // 7. Sales Trend (Filtered Date Range - Grouped by Day)
    const salesTrendMap: { [key: string]: { revenue: number, profit: number, orders: number } } = {};
    
    // Initialize map with 0 for all days in range (if range < 30 days to avoid huge loops, or just map existing data)
    // For simplicity, we just map existing data in range
    filteredOrders.forEach(o => {
        const dateStr = o.createdAt.split('T')[0];
        if (!salesTrendMap[dateStr]) salesTrendMap[dateStr] = { revenue: 0, profit: 0, orders: 0 };
        salesTrendMap[dateStr].revenue += o.totalAmount;
        salesTrendMap[dateStr].orders += 1;
        salesTrendMap[dateStr].profit += o.totalAmount * 0.2; // Mock profit
    });

    const salesTrend = Object.entries(salesTrendMap)
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .map(([date, data]) => ({
            name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            ...data
        }));

    // 8. Top Products (Filtered)
    const productSales: {[key: string]: number} = {};
    filteredOrders.forEach(order => {
      order.products.forEach(p => {
        productSales[p.productId] = (productSales[p.productId] || 0) + p.quantity;
      });
    });
    const topProducts = Object.entries(productSales)
      .map(([id, qty]) => {
        const product = products.find(p => p.id === id || p._id === id);
        return { name: product?.name || 'Unknown', value: qty, revenue: qty * (product?.offerPrice || 0) };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // 9. Low Stock (Global)
    const lowStockItems = products.filter(p => {
      const totalStock = Object.values(p.sizes).reduce((a: number, b: number) => a + b, 0);
      return totalStock < 10;
    }).map(p => ({
      name: p.name,
      stock: Object.values(p.sizes).reduce((a: number, b: number) => a + b, 0),
      image: p.images[0]
    }));

    const pendingOrders = orders.filter(o => ['pending', 'processing'].includes(o.status)).length;
    const abandonedCartsCount = carts.filter((c: any) => c.items && c.items.length > 0).length;

    return {
      todayRevenue: todayOrders.reduce((sum, o) => sum + o.totalAmount, 0), // Kept "Today Revenue" for consistency with request? No, user said "Total Revenue between two date".
      // Wait, User said: "Animal can see total revenue between to date." (Admin can see...).
      // But user ALSO said "For admin Can view Today order. And today exchange request."
      // So Top Cards: Today Order, Today Exchange.
      // And "Total Revenue" -> Is this the filtered one?
      // "Like admin can choose to date... and we can see every Details... Total revenue between to date"
      // So I will put "Total Revenue (Range)" in a card, and "Today Orders" in another.
      
      totalRevenueRange: totalRevenue,
      todayOrdersCount: todayOrders.length,
      exchangeRequests,
      
      salesTrend,
      topProducts,
      lowStockItems,
      pendingOrders,
      abandonedCartsCount,
      transitDetails,
      lostRevenue,
      pieChartData,
      mapPoints,
      returnRate: filteredOrders.length > 0 ? ((filteredOrders.filter(o => o.status === 'returned').length / filteredOrders.length) * 100).toFixed(1) : "0"
    };
  }, [orders, products, carts, users, dateRange]);

  const detailedCarts = useMemo(() => {
    return carts
        .filter((c: any) => c.items && c.items.length > 0)
        .map((c: any) => {
            const user = users.find((u: any) => u.id === c.userId);
            const cartItems = c.items.map((item: any) => {
                const product = products.find((p: any) => p.id === item.productId);
                return { ...item, product };
            }).filter((item: any) => item.product);
            
            const totalValue = cartItems.reduce((acc: number, item: any) => acc + (item.product.offerPrice * item.quantity), 0);
            
            return {
                ...c,
                user: user ? { ...user, phone: user.phone || user.addresses?.[0]?.phone } : null,
                items: cartItems,
                totalValue
            };
        });
  }, [carts, users, products]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-green-500">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Safety fallback if metrics is somehow null (shouldn't happen with updated logic)
  if (!metrics) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Command Center</h1>
          <p className="text-zinc-500 text-sm font-medium">Soul Stich Performance Overview</p>
        </div>
        
        <div className="flex items-center space-x-4">
            {/* Date Range Picker */}
            <div className="flex items-center space-x-2 bg-zinc-900 border border-white/10 p-1 rounded-lg">
                <input 
                    type="date" 
                    value={dateRange.start}
                    onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                    className="bg-transparent text-white text-xs font-bold px-2 py-1 outline-none"
                />
                <span className="text-zinc-500">-</span>
                <input 
                    type="date" 
                    value={dateRange.end}
                    onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                    className="bg-transparent text-white text-xs font-bold px-2 py-1 outline-none"
                />
            </div>

          <div className="bg-zinc-900 border border-blue-500/20 px-4 py-2 rounded-lg flex items-center space-x-3 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Total Users</p>
              <p className="text-lg font-black text-white leading-none">{users.length}</p>
            </div>
          </div>
          <button className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center space-x-2 transition-all">
            <TrendingUp className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 1. Top Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`₹${metrics.totalRevenueRange.toLocaleString()}`} 
          icon={Wallet}
          subtext="Selected Date Range"
          isPositive={true}
        />
        <StatCard 
          title="Today's Orders" 
          value={metrics.todayOrdersCount} 
          icon={ShoppingBag}
          subtext="Orders placed today"
          isPositive={true}
        />
        <StatCard 
          title="Exchange Requests" 
          value={metrics.exchangeRequests} 
          icon={RotateCcw}
          subtext="In selected range"
          isPositive={false}
        />
        {/* Transit Details Custom Card */}
        <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl hover:border-zinc-700 transition-all group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Truck className="w-16 h-16 text-white" />
            </div>
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-3 rounded-xl bg-zinc-800 text-blue-500">
                    <Truck className="w-6 h-6" />
                </div>
            </div>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Transit Details</p>
            <div className="space-y-1">
                <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">In Transit</span>
                    <span className="text-white font-bold">{metrics.transitDetails.inTransit}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Delivered</span>
                    <span className="text-green-500 font-bold">{metrics.transitDetails.delivered}</span>
                </div>
                 <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Returned</span>
                    <span className="text-red-500 font-bold">{metrics.transitDetails.returned}</span>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 2. Revenue Trend & Lost Revenue */}
        <div className="lg:col-span-8 space-y-6">
            <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-2xl">
            <SectionHeader 
                title="Revenue Trend" 
                subtitle="Performance over selected range"
                action={
                <div className="flex items-center space-x-2 bg-black border border-white/10 rounded-lg p-1">
                    <button 
                    onClick={() => setShowNetProfit(false)}
                    className={`px-3 py-1 text-xs font-bold rounded ${!showNetProfit ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}
                    >
                    Revenue
                    </button>
                    <button 
                    onClick={() => setShowNetProfit(true)}
                    className={`px-3 py-1 text-xs font-bold rounded ${showNetProfit ? 'bg-green-500/20 text-green-500' : 'text-zinc-500 hover:text-white'}`}
                    >
                    Net Profit
                    </button>
                </div>
                }
            />
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.salesTrend}>
                    <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                    />
                    <Area 
                    type="monotone" 
                    dataKey={showNetProfit ? "profit" : "revenue"} 
                    stroke={showNetProfit ? "#3b82f6" : "#22c55e"} 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill={`url(#${showNetProfit ? 'colorProfit' : 'colorSales'})`} 
                    />
                </AreaChart>
                </ResponsiveContainer>
            </div>
            </div>

            {/* Lost Revenue & Category Sales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Lost Revenue</p>
                        <p className="text-zinc-400 text-[10px] mt-1">Due to Returns</p>
                        <h3 className="text-2xl font-black text-red-500 mt-2">₹{metrics.lostRevenue.toLocaleString()}</h3>
                    </div>
                    <div className="p-4 bg-red-500/10 rounded-full">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                </div>
                 {/* Top Category Pie Chart */}
                <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl">
                     <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Best Selling Categories</p>
                     <div className="h-40 flex items-center">
                         <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                                <Pie
                                    data={metrics.pieChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={60}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {metrics.pieChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize: '10px'}} />
                             </PieChart>
                         </ResponsiveContainer>
                     </div>
                </div>
            </div>
        </div>

        {/* Predictive AI Box & Low Stock */}
        <div className="lg:col-span-4 space-y-6">
          {/* AI Box */}
          <div className="bg-gradient-to-br from-purple-900/20 to-zinc-900 border border-purple-500/20 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Users className="w-24 h-24 text-purple-500" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center space-x-2 mb-4">
                <span className="bg-purple-500 text-white text-[10px] font-black px-2 py-1 rounded">AI INSIGHT</span>
                <span className="text-zinc-500 text-xs">Updated 2m ago</span>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Inventory Spike Predicted</h3>
              <p className="text-zinc-400 text-sm mb-4">
                Based on current traffic trends, demand for <strong>"DTF Prints"</strong> is expected to rise by <strong>15%</strong> this weekend.
              </p>
              <button className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg text-sm font-bold transition-colors">
                Restock Now
              </button>
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl flex-grow">
             <SectionHeader title="Low Stock Alert" subtitle="Products with < 10 units" />
             <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
               {metrics.lowStockItems.length === 0 ? (
                 <p className="text-zinc-500 text-sm">Stock levels are healthy.</p>
               ) : (
                 metrics.lowStockItems.map((item, i) => (
                   <div key={i} className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                     <div className="flex items-center space-x-3">
                       <img src={item.image} alt={item.name} className="w-10 h-10 rounded bg-zinc-800 object-cover" />
                       <div>
                         <p className="text-white text-sm font-bold line-clamp-1">{item.name}</p>
                         <p className="text-red-400 text-xs font-bold">{item.stock} Remaining</p>
                       </div>
                     </div>
                     <button className="text-zinc-400 hover:text-white transition-colors">
                       <ArrowUpRight className="w-4 h-4" />
                     </button>
                   </div>
                 ))
               )}
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 3. Customer & Marketing Insights */}
        <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-2xl">
           <SectionHeader title="Customer Loyalty" subtitle="New vs Returning" />
           <div className="h-60">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={[
                     { name: 'New', value: 65 },
                     { name: 'Returning', value: 35 }
                   ]}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   <Cell fill="#22c55e" />
                   <Cell fill="#3b82f6" />
                 </Pie>
                 <Legend verticalAlign="bottom" height={36}/>
                 <RechartsTooltip />
               </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="mt-4 grid grid-cols-2 gap-4">
             <div className="p-3 bg-zinc-800/50 rounded-lg text-center">
               <p className="text-zinc-500 text-xs uppercase font-bold">Traffic Source</p>
               <p className="text-white font-bold mt-1">Instagram (45%)</p>
             </div>
             <div 
               className="p-3 bg-zinc-800/50 rounded-lg text-center cursor-pointer hover:bg-zinc-800 transition-colors"
               onClick={() => setShowAbandonedCarts(true)}
             >
               <p className="text-zinc-500 text-xs uppercase font-bold">Active Carts</p>
               <p className="text-white font-bold mt-1">{metrics.abandonedCartsCount}</p>
             </div>
           </div>
        </div>

        {/* 4. Operations & Map - Updated to use Real Metrics */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-white/5 p-8 rounded-2xl relative overflow-hidden">
          <SectionHeader title="Order Density Map" subtitle="Geospatial distribution of orders" />
          
          <div className="absolute top-8 right-8 z-10 bg-black/80 backdrop-blur-md p-4 rounded-xl border border-white/10">
             <div className="flex items-center space-x-8">
               <div>
                 <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Pending Orders</p>
                 <p className="text-2xl font-black text-yellow-500">{metrics.pendingOrders}</p>
               </div>
               <div>
                 <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Return Rate</p>
                 <p className="text-2xl font-black text-red-500">{metrics.returnRate}%</p>
               </div>
             </div>
          </div>

          <div className="h-[300px] w-full flex items-center justify-center bg-zinc-900/30 rounded-xl overflow-hidden mt-4">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                scale: 1000,
                center: [78.9629, 22.5937] // India Center
              }}
              className="w-full h-full"
            >
              <Geographies geography={INDIA_TOPO_JSON}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#27272a"
                      stroke="#3f3f46"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: { fill: "#3f3f46", outline: "none" },
                        pressed: { outline: "none" },
                      }}
                    />
                  ))
                }
              </Geographies>
              {metrics.mapPoints.map((point, i) => (
                <Marker key={i} coordinates={point.coordinates}>
                  <circle 
                    r={point.intensity === 'high' ? 6 : 4} 
                    fill={point.intensity === 'high' ? '#16a34a' : '#22c55e'} 
                    className="opacity-75 hover:opacity-100 transition-opacity" 
                  />
                  <circle r={2} fill="#ffffff" />
                </Marker>
              ))}
            </ComposableMap>
          </div>
          <div className="mt-4 flex justify-between items-center text-xs text-zinc-500">
             <span>*Dark Green: High Density, Light Green: Low Density</span>
          </div>
        </div>

      </div>

      {/* Top Products Table */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <SectionHeader title="Top Performing Products" subtitle="Best sellers by volume (Selected Range)" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-800/50 text-zinc-500 uppercase font-bold text-xs">
              <tr>
                <th className="p-4">Product Name</th>
                <th className="p-4">Units Sold</th>
                <th className="p-4">Revenue Generated</th>
                <th className="p-4">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300">
              {metrics.topProducts.map((p, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-medium text-white">{p.name}</td>
                  <td className="p-4">{p.value}</td>
                  <td className="p-4 text-green-400 font-bold">₹{p.revenue.toLocaleString()}</td>
                  <td className="p-4">
                    <div className="w-20 h-1 bg-zinc-700 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${Math.random() * 60 + 40}%` }}></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAbandonedCarts && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-widest text-white">Active Abandoned Carts</h2>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mt-1">{detailedCarts.length} Pending Checkouts</p>
                    </div>
                    <button onClick={() => setShowAbandonedCarts(false)} className="text-zinc-500 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto p-6 custom-scrollbar">
                    {detailedCarts.length === 0 ? (
                        <div className="text-center py-20 text-zinc-500">
                            <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No active carts found.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {detailedCarts.map((cart: any) => (
                                <div key={cart._id || cart.userId} className="bg-black/40 border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors">
                                    <div className="flex flex-col lg:flex-row gap-6 justify-between">
                                        {/* User Info */}
                                        <div className="flex items-start space-x-4 min-w-[200px]">
                                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold">
                                                {cart.user?.name?.[0] || '?'}
                                            </div>
                                            <div>
                                                <p className="text-white font-bold">{cart.user?.name || 'Unknown User'}</p>
                                                <p className="text-zinc-500 text-xs">{cart.user?.email}</p>
                                                {cart.user?.phone ? (
                                                    <p className="text-zinc-400 text-xs mt-1 flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                        {cart.user.phone}
                                                    </p>
                                                ) : (
                                                    <p className="text-red-500/50 text-xs mt-1 italic">No phone number</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Cart Items */}
                                        <div className="flex-grow">
                                            <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-2">Cart Items ({cart.items.length})</p>
                                            <div className="flex -space-x-3 overflow-hidden py-1">
                                                {cart.items.slice(0, 5).map((item: any, idx: number) => (
                                                    <img 
                                                        key={idx}
                                                        src={item.product.images[0]} 
                                                        alt={item.product.name}
                                                        title={`${item.product.name} (x${item.quantity})`}
                                                        className="w-10 h-10 rounded-full border-2 border-zinc-900 object-cover"
                                                    />
                                                ))}
                                                {cart.items.length > 5 && (
                                                    <div className="w-10 h-10 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white">
                                                        +{cart.items.length - 5}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-zinc-400 text-xs mt-2 line-clamp-1">
                                                {cart.items.map((i: any) => i.product.name).join(', ')}
                                            </p>
                                        </div>

                                        {/* Value & Action */}
                                        <div className="flex flex-col items-end gap-3 min-w-[150px]">
                                            <div className="text-right">
                                                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Cart Value</p>
                                                <p className="text-xl font-black text-white">₹{cart.totalValue.toLocaleString()}</p>
                                            </div>
                                            
                                            {cart.user?.phone && (
                                                <button 
                                                    onClick={() => {
                                                        const productNames = cart.items.map((i: any) => i.product.name).join(', ');
                                                        const message = `Hey ${cart.user.name.split(' ')[0]}! 👋 We noticed you left some awesome items like ${productNames} in your Soul Stich cart. \n\nWe saved them for you! Use code *COMEBACK5* for an extra 5% off if you complete your order today. 🛍️\n\nCheckout here: https://soulstich.com/cart`;
                                                        const url = `https://wa.me/${cart.user.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                                                        window.open(url, '_blank');
                                                    }}
                                                    className="bg-green-500 hover:bg-green-400 text-black px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center space-x-2 transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)]"
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                    <span>WhatsApp</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
