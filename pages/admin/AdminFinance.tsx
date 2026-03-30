
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, TrendingUp, TrendingDown, Receipt, FileText, 
  Package, Truck, IndianRupee, Download, Plus, 
  AlertCircle, CheckCircle2, Clock, Filter, ChevronRight,
  ArrowUpRight, ArrowDownRight, CreditCard, PieChart, Activity,
  Settings, Lock, Save, X, Eye, EyeOff, Edit, Trash2
} from 'lucide-react';
import { fetchOrders, fetchProducts, fetchExpenses, createExpense, updateExpense, deleteExpense, socket } from '../../src/api';
import { Order, FinanceConfig, Product, Expense } from '../../types';

const DEFAULT_CONFIG: FinanceConfig = {
  password: 'admin', // Default password
  razorpayFeeType: 'percentage',
  razorpayFeeValue: 0.02, // 2%
  productGstPercentage: 12,
  packagingCosts: {
    small: 45,
    medium: 65,
    large: 85
  },
  shippingBaseRate: 40 // ₹40 per kg
};

const AdminFinance: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'invoices'>('overview');
  
  // Finance Configuration State
  const [config, setConfig] = useState<FinanceConfig>(() => {
    const saved = localStorage.getItem('finance_config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });
  
  // Modal States
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  // Form States
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    category: 'Operations',
    description: '',
    amount: 0,
    date: new Date().toISOString()
  });

  useEffect(() => {
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
    socket.on('expense_created', handleUpdate);
    socket.on('expense_updated', handleUpdate);
    socket.on('expense_deleted', handleUpdate);

    return () => {
      socket.off('order_created', handleUpdate);
      socket.off('order_updated', handleUpdate);
      socket.off('product_created', handleUpdate);
      socket.off('product_updated', handleUpdate);
      socket.off('product_deleted', handleUpdate);
      socket.off('expense_created', handleUpdate);
      socket.off('expense_updated', handleUpdate);
      socket.off('expense_deleted', handleUpdate);
    };
  }, []);

  const loadData = async () => {
    try {
      const [o, p, e] = (await Promise.all([
        fetchOrders(),
        fetchProducts(),
        fetchExpenses(),
      ])) as [Order[], Product[], Expense[]];
      setOrders(o);
      setProducts(p);
      setExpenses(e.map((expense) => ({
        ...expense,
        date: expense.date ? new Date(expense.date).toISOString() : new Date().toISOString(),
      })));
    } catch (err) {
      console.error("Finance data load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = (newConfig: FinanceConfig) => {
    setConfig(newConfig);
    localStorage.setItem('finance_config', JSON.stringify(newConfig));
    setShowConfigModal(false);
  };

  const resetExpenseForm = () => {
    setEditingExpense(null);
    setNewExpense({ category: 'Operations', description: '', amount: 0, date: new Date().toISOString() });
  };

  const openExpenseModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setNewExpense({
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        date: expense.date || new Date().toISOString(),
      });
    } else {
      resetExpenseForm();
    }
    setShowExpenseModal(true);
  };

  const handleSaveExpense = async () => {
    if (!newExpense.description || !newExpense.amount) return;

    const payload = {
      category: newExpense.category,
      description: newExpense.description,
      amount: Number(newExpense.amount),
      date: newExpense.date,
    };

    try {
      if (editingExpense) {
        const updated = await updateExpense(editingExpense.id, payload);
        setExpenses(prev => prev.map(e => (e.id === updated.id ? {
          ...updated,
          id: updated.id || updated._id,
          date: updated.date ? new Date(updated.date).toISOString() : new Date().toISOString(),
        } : e)));
      } else {
        const created = await createExpense(payload);
        setExpenses(prev => [
          {
            ...created,
            id: created.id || created._id,
            date: created.date ? new Date(created.date).toISOString() : new Date().toISOString(),
          },
          ...prev,
        ]);
      }
      setShowExpenseModal(false);
      resetExpenseForm();
    } catch (err) {
      console.error('Expense save failed:', err);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Delete this expense? This action cannot be undone.')) return;
    try {
      await deleteExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  };

  const downloadInvoice = (order: Order) => {
    // In a real app, this would generate a PDF
    alert(`Generating Invoice PDF for Order #${order.id.slice(-6).toUpperCase()}...`);
  };

  // --- Financial Calculations ---
  const financeData = useMemo(() => {
    let grossRevenue = 0;
    let totalRazorpayFees = 0;
    let totalPackaging = 0;
    let totalShipping = 0;
    let totalProductGst = 0;
    let totalProductionCost = 0;
    let refundAmount = 0;

    orders.forEach(order => {
      if (order.paymentStatus === 'paid') {
        const amount = order.totalAmount;
        
        if (order.status === 'returned' || order.status === 'cancelled') {
          refundAmount += amount;
        } else {
          grossRevenue += amount;
          
          // Production Cost
          order.products.forEach(item => {
            const product = products.find(p => p.id === item.productId || p.sku === item.productId);
            if (product && product.productionCost) {
              totalProductionCost += product.productionCost * item.quantity;
            }
          });
          
          // Razorpay Fees
          let fee = 0;
          if (config.razorpayFeeType === 'percentage') {
            fee = amount * config.razorpayFeeValue;
          } else {
            fee = config.razorpayFeeValue;
          }
          const feeGst = fee * 0.18; // 18% GST on the fee itself is standard
          totalRazorpayFees += (fee + feeGst);
          
          // Logistics (Using real-life logic from order if available, otherwise defaults)
          if (order.logistics) {
            totalPackaging += order.logistics.packagingCost;
            totalShipping += order.logistics.shippingCost;
          } else {
            // Default logic if logistics not set yet
            totalPackaging += config.packagingCosts.small;
            totalShipping += config.shippingBaseRate; // 1kg default
          }
          
          // GST Calculation based on admin config
          const gstRate = config.productGstPercentage / 100;
          const baseAmount = amount / (1 + gstRate);
          totalProductGst += (amount - baseAmount);
        }
      }
    });

    const totalOperationalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalBurn = totalRazorpayFees + totalPackaging + totalShipping + totalProductGst + totalOperationalExpenses + totalProductionCost;
    const netProfit = grossRevenue - totalBurn;

    return {
      grossRevenue,
      totalRazorpayFees,
      totalPackaging,
      totalShipping,
      totalProductGst,
      totalProductionCost,
      refundAmount,
      totalOperationalExpenses,
      totalBurn,
      netProfit,
      profitMargin: grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0
    };
  }, [orders, expenses, config, products]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <Activity className="w-12 h-12 text-blue-500 animate-spin" />
        <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Syncing Financial Ledger...</span>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-black min-h-full text-white">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">Financial Nexus</h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Revenue, Burn & Profitability Matrix</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowPasswordModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
          >
            <Settings className="w-4 h-4" /> Edit Costs
          </button>
          <button 
            onClick={() => openExpenseModal()}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-8 border-b border-white/5">
        {[
          { id: 'overview', label: 'Financial Overview', icon: Wallet },
          { id: 'ledger', label: 'Expense Ledger', icon: Receipt },
          { id: 'invoices', label: 'Billing & Invoices', icon: FileText },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
              activeTab === tab.id ? 'text-blue-500' : 'text-zinc-500 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Top Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Gross Revenue', value: financeData.grossRevenue, icon: IndianRupee, color: 'text-blue-500', sub: 'Before deductions' },
              { label: 'Net Profit', value: financeData.netProfit, icon: TrendingUp, color: 'text-green-500', sub: `${financeData.profitMargin.toFixed(1)}% Margin` },
              { label: 'Total Burn', value: financeData.totalBurn, icon: TrendingDown, color: 'text-red-500', sub: 'Fees, Taxes & Ops' },
              { label: 'Refunds/Returns', value: financeData.refundAmount, icon: ArrowDownRight, color: 'text-orange-500', sub: 'Non-realized revenue' },
            ].map((stat, i) => (
              <div key={i} className="bg-zinc-900 border border-white/5 p-6 rounded-3xl group hover:border-white/10 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl bg-black border border-white/5 ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</h3>
                <p className="text-2xl font-black italic mb-1">₹{stat.value.toLocaleString()}</p>
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Burn Breakdown vs Revenue */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-zinc-900 border border-white/5 rounded-[2.5rem] p-8">
              <h3 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center gap-2">
                <PieChart className="w-6 h-6 text-blue-500" /> Revenue vs Burn Matrix
              </h3>
              
              <div className="space-y-6">
                <div className="relative h-12 bg-zinc-800 rounded-2xl overflow-hidden flex">
                  <div 
                    className="h-full bg-blue-500 flex items-center px-4 font-black text-[10px] uppercase italic shadow-[inset_0_0_20px_rgba(0,0,0,0.3)]" 
                    style={{ width: `${financeData.grossRevenue > 0 ? (financeData.netProfit / financeData.grossRevenue) * 100 : 0}%` }}
                  >
                    Profit
                  </div>
                  <div 
                    className="h-full bg-red-500/50 flex items-center px-4 font-black text-[10px] uppercase italic" 
                    style={{ width: `${financeData.grossRevenue > 0 ? (financeData.totalBurn / financeData.grossRevenue) * 100 : 0}%` }}
                  >
                    Burn
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4">
                  {[
                    { label: `Razorpay Fees (${config.razorpayFeeType === 'percentage' ? (config.razorpayFeeValue * 100) + '%' : '₹' + config.razorpayFeeValue})`, value: financeData.totalRazorpayFees, icon: CreditCard, color: 'bg-blue-500/10 text-blue-500' },
                    { label: 'Packaging Costs', value: financeData.totalPackaging, icon: Package, color: 'bg-purple-500/10 text-purple-500' },
                    { label: 'Shipping Logistics', value: financeData.totalShipping, icon: Truck, color: 'bg-orange-500/10 text-orange-500' },
                    { label: 'Production Cost', value: financeData.totalProductionCost, icon: Wallet, color: 'bg-yellow-500/10 text-yellow-500' },
                    { label: `Product GST (${config.productGstPercentage}%)`, value: financeData.totalProductGst, icon: FileText, color: 'bg-green-500/10 text-green-500' },
                    { label: 'Operating Expenses', value: financeData.totalOperationalExpenses, icon: Activity, color: 'bg-zinc-800 text-zinc-400' },
                    { label: 'Total Deductions', value: financeData.totalBurn, icon: TrendingDown, color: 'bg-red-500/10 text-red-500' },
                  ].map((item, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${item.color}`}>
                          <item.icon className="w-3 h-3" />
                        </div>
                        <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">{item.label}</span>
                      </div>
                      <p className="text-sm font-black italic">₹{item.value.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Remittance Schedule */}
            <div className="bg-zinc-900 border border-white/5 rounded-[2.5rem] p-8">
              <h3 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center gap-2">
                <Clock className="w-6 h-6 text-orange-500" /> Remittance Nexus
              </h3>
              <div className="space-y-6">
                {[
                  { label: 'Next Payout', date: 'Feb 15, 2026', amount: financeData.grossRevenue * 0.4, status: 'Processing' },
                  { label: 'Last Settlement', date: 'Feb 10, 2026', amount: 45000, status: 'Settled' },
                  { label: 'Pending Reserve', date: 'Ongoing', amount: financeData.grossRevenue * 0.1, status: 'Held' },
                ].map((item, i) => (
                  <div key={i} className="p-4 bg-black border border-white/5 rounded-2xl transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black uppercase text-zinc-500">{item.label}</span>
                      <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full ${
                        item.status === 'Settled' ? 'bg-green-500/10 text-green-500' :
                        item.status === 'Processing' ? 'bg-blue-500/10 text-blue-500' : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-lg font-black italic mb-1">₹{item.amount.toLocaleString()}</p>
                    <p className="text-[9px] font-bold text-zinc-600 uppercase">{item.date}</p>
                  </div>
                ))}
                <div className="pt-4">
                  <a
                    href="https://dashboard.razorpay.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full"
                  >
                    <button className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-500 transition-all">
                      View Razorpay Dashboard
                    </button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ledger' && (
        <div className="bg-zinc-900 border border-white/5 rounded-[2.5rem] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-8 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-xl font-black uppercase tracking-tight">Operational Ledger</h3>
            <div className="flex gap-2">
              <button className="p-3 bg-black border border-white/5 rounded-xl text-zinc-500 hover:text-white">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-white/5">
                <th className="p-8">Description</th>
                <th className="p-8">Category</th>
                <th className="p-8">Date</th>
                <th className="p-8 text-right">Amount</th>
                <th className="p-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-bold text-xs">
              {expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-8 text-white uppercase">{exp.description}</td>
                  <td className="p-8">
                    <span className="px-3 py-1 bg-zinc-800 rounded-full text-[10px] text-zinc-400">
                      {exp.category}
                    </span>
                  </td>
                  <td className="p-8 text-zinc-500">{new Date(exp.date).toLocaleDateString()}</td>
                  <td className="p-8 text-right text-red-500">₹{exp.amount.toLocaleString()}</td>
                  <td className="p-8 text-right flex justify-end gap-2">
                    <button
                      onClick={() => openExpenseModal(exp)}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-wider text-blue-300 hover:text-white transition-all"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-xs font-black uppercase tracking-wider text-red-300 hover:text-white transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="bg-blue-500/5 italic">
                <td className="p-8 text-blue-500 uppercase">System Generated: Total Packaging</td>
                <td className="p-8"><span className="px-3 py-1 bg-blue-500/10 rounded-full text-[10px] text-blue-500">Auto</span></td>
                <td className="p-8 text-zinc-500">Aggregate</td>
                <td className="p-8 text-right text-blue-500">₹{financeData.totalPackaging.toLocaleString()}</td>
              </tr>
              <tr className="bg-blue-500/5 italic">
                <td className="p-8 text-blue-500 uppercase">System Generated: Total Shipping</td>
                <td className="p-8"><span className="px-3 py-1 bg-blue-500/10 rounded-full text-[10px] text-blue-500">Auto</span></td>
                <td className="p-8 text-zinc-500">Aggregate</td>
                <td className="p-8 text-right text-blue-500">₹{financeData.totalShipping.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {orders.slice(0, 9).map(order => (
            <div key={order.id} className="bg-zinc-900 border border-white/5 p-6 rounded-[2rem] group hover:border-blue-500/50 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-black border border-white/5 rounded-2xl">
                  <FileText className="w-5 h-5 text-zinc-400" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Invoice #{order.id.slice(-6).toUpperCase()}</p>
                  <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full ${
                    order.paymentStatus === 'paid' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {order.paymentStatus}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500 font-bold uppercase">Customer ID</span>
                  <span className="text-white font-black">{order.userId.slice(-6).toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500 font-bold uppercase">Amount Paid</span>
                  <span className="text-white font-black">₹{order.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500 font-bold uppercase">Tax ({config.productGstPercentage}% GST)</span>
                  <span className="text-zinc-400 font-bold">₹{(order.totalAmount * (config.productGstPercentage / 100)).toLocaleString()}</span>
                </div>
              </div>

              <button 
                onClick={() => downloadInvoice(order)}
                className="w-full py-4 bg-zinc-800 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2"
              >
                Download PDF <Download className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* --- Modals --- */}

      {/* Password Protection Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-zinc-900 border border-white/10 p-8 rounded-[2.5rem] w-full max-w-md space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-black uppercase italic">Authentication Required</h3>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Enter password to modify costs</p>
            </div>
            
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="PASSWORD"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-black border border-white/5 rounded-2xl p-4 text-xs font-black uppercase tracking-widest focus:border-blue-500 outline-none transition-all pr-12"
              />
              <button 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => { setShowPasswordModal(false); setPasswordInput(''); }}
                className="flex-1 py-4 bg-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (passwordInput === config.password) {
                    setShowPasswordModal(false);
                    setShowConfigModal(true);
                    setPasswordInput('');
                  } else {
                    alert('Incorrect Password');
                  }
                }}
                className="flex-1 py-4 bg-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.3)]"
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finance Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-white/10 p-8 rounded-[2.5rem] w-full max-w-2xl space-y-8 my-auto">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black uppercase italic">Cost Configuration</h3>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Global Financial Variables</p>
              </div>
              <button onClick={() => setShowConfigModal(false)} className="p-3 bg-black rounded-xl text-zinc-500 hover:text-white transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Razorpay Fees */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Razorpay Settlement</h4>
                <div className="flex gap-2 p-1 bg-black rounded-xl border border-white/5">
                  <button 
                    onClick={() => setConfig({...config, razorpayFeeType: 'percentage'})}
                    className={`flex-1 py-2 text-[8px] font-black uppercase rounded-lg transition-all ${config.razorpayFeeType === 'percentage' ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-white'}`}
                  >
                    Percentage
                  </button>
                  <button 
                    onClick={() => setConfig({...config, razorpayFeeType: 'fixed'})}
                    className={`flex-1 py-2 text-[8px] font-black uppercase rounded-lg transition-all ${config.razorpayFeeType === 'fixed' ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-white'}`}
                  >
                    Fixed Price
                  </button>
                </div>
                <input
                  type="number"
                  placeholder={config.razorpayFeeType === 'percentage' ? "0.02 (for 2%)" : "FIXED AMOUNT"}
                  value={config.razorpayFeeValue}
                  onChange={(e) => setConfig({...config, razorpayFeeValue: Number(e.target.value)})}
                  className="w-full bg-black border border-white/5 rounded-xl p-3 text-[10px] font-black outline-none focus:border-blue-500"
                />
              </div>

              {/* Product GST */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-green-500 tracking-widest">Taxation (GST)</h4>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="GST PERCENTAGE (e.g. 12)"
                    value={config.productGstPercentage}
                    onChange={(e) => setConfig({...config, productGstPercentage: Number(e.target.value)})}
                    className="w-full bg-black border border-white/5 rounded-xl p-3 text-[10px] font-black outline-none focus:border-green-500 pr-10"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-600">%</span>
                </div>
              </div>

              {/* Packaging Costs */}
              <div className="space-y-4 md:col-span-2">
                <h4 className="text-[10px] font-black uppercase text-purple-500 tracking-widest">Packaging Inventory Costs</h4>
                <div className="grid grid-cols-3 gap-4">
                  {(['small', 'medium', 'large'] as const).map(size => (
                    <div key={size} className="space-y-2">
                      <label className="text-[8px] font-black uppercase text-zinc-500">{size} box</label>
                      <input
                        type="number"
                        value={config.packagingCosts[size]}
                        onChange={(e) => setConfig({
                          ...config, 
                          packagingCosts: { ...config.packagingCosts, [size]: Number(e.target.value) }
                        })}
                        className="w-full bg-black border border-white/5 rounded-xl p-3 text-[10px] font-black outline-none focus:border-purple-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Base Rate */}
              <div className="space-y-4 md:col-span-2">
                <h4 className="text-[10px] font-black uppercase text-orange-500 tracking-widest">Logistics Base Rate (Per 1KG)</h4>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-600">₹</span>
                  <input
                    type="number"
                    placeholder="BASE RATE (e.g. 40)"
                    value={config.shippingBaseRate}
                    onChange={(e) => setConfig({...config, shippingBaseRate: Number(e.target.value)})}
                    className="w-full bg-black border border-white/5 rounded-xl p-3 pl-10 text-[10px] font-black outline-none focus:border-orange-500"
                  />
                </div>
                <p className="text-[8px] font-bold text-zinc-600 uppercase">Pro-rata calculation will apply for weights above 1kg (e.g. 1.5kg = 1.5x Base Rate)</p>
              </div>
              
              {/* New Password */}
              <div className="space-y-4 md:col-span-2">
                <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">System Password</h4>
                <input
                  type="text"
                  placeholder="NEW ACCESS PASSWORD"
                  value={config.password}
                  onChange={(e) => setConfig({...config, password: e.target.value})}
                  className="w-full bg-black border border-white/5 rounded-xl p-3 text-[10px] font-black outline-none focus:border-white/20"
                />
              </div>
            </div>

            <div className="pt-4">
              <button 
                onClick={() => saveConfig(config)}
                className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Financial Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-zinc-900 border border-white/10 p-8 rounded-[2.5rem] w-full max-w-md space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black uppercase italic">
                {editingExpense ? 'Edit Expense' : 'New Expense'}
              </h3>
              <button onClick={() => { setShowExpenseModal(false); resetExpenseForm(); }} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-zinc-500">Category</label>
                <select 
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({...newExpense, category: e.target.value as any})}
                  className="w-full bg-black border border-white/5 rounded-xl p-3 text-[10px] font-black uppercase outline-none focus:border-blue-500 appearance-none"
                >
                  <option value="Marketing">Marketing (Meta Ads, etc.)</option>
                  <option value="Operations">Operations (Rent, Utility)</option>
                  <option value="Salary">Salary (Staff)</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-zinc-500">Description</label>
                <input 
                  type="text"
                  placeholder="e.g. Meta Ads Campaign Feb"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  className="w-full bg-black border border-white/5 rounded-xl p-3 text-[10px] font-black outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-zinc-500">Amount (₹)</label>
                <input 
                  type="number"
                  placeholder="0.00"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                  className="w-full bg-black border border-white/5 rounded-xl p-3 text-[10px] font-black outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-zinc-500">Date</label>
                <input
                  type="date"
                  value={newExpense.date ? new Date(newExpense.date).toISOString().slice(0, 10) : ''}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                  className="w-full bg-black border border-white/5 rounded-xl p-3 text-[10px] font-black outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button 
              onClick={handleSaveExpense}
              className="w-full py-4 bg-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.3)]"
            >
              {editingExpense ? 'Save Changes' : 'Post to Ledger'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFinance;
