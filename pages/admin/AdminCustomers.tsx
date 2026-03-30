
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, UserPlus, Mail, Phone, MoreHorizontal, Ban, 
  MapPin, Clock, ShoppingBag, Download, MessageCircle, 
  PhoneCall, Send, Trash2, Filter, ChevronDown, ChevronUp,
  X, Check, AlertCircle, RefreshCw, ExternalLink, Share2,
  ChevronRight, CreditCard, Banknote, Heart, Tag as TagIcon,
  Plus, Edit3, Save, Info
} from 'lucide-react';
import { fetchUsers, fetchOrders, updateUser, resetUser, deleteUser, fetchProducts, updateOrder } from '../../src/api';
import { User, Order, Product } from '../../types';
import * as XLSX from 'xlsx';

const AdminCustomers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Modals
  const [showOrderModal, setShowOrderModal] = useState<User | null>(null);
  const [showBlockModal, setShowBlockModal] = useState<User | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [singleUserOffer, setSingleUserOffer] = useState<User | null>(null);
  const [editingRefundOrderId, setEditingRefundOrderId] = useState<string | null>(null);
  const [showNotesModal, setShowNotesModal] = useState<User | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [newTag, setNewTag] = useState('');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [refundForm, setRefundForm] = useState({
    upiId: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: ''
  });
  
  // Filters
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [orderFilter, setOrderFilter] = useState<string>('all'); // all, 1, 1-5, 5+
  const [spentFilter, setSpentFilter] = useState<string>('all'); // all, 500+, 1000+, 5000+
  const [statusFilter, setStatusFilter] = useState<string>('all'); // all, active, blocked

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userData, orderData, productData] = await Promise.all([
        fetchUsers(),
        fetchOrders(),
        fetchProducts()
      ]);
      setUsers(userData);
      setOrders(orderData);
      setProducts(productData);
    } catch (err) {
      console.error("Failed to load customer data", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Calculate user metrics
  const getUserMetrics = (userId: string) => {
    const userOrders = orders.filter(o => o.userId === userId);
    const spent = userOrders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    return {
      orderCount: userOrders.length,
      spent,
      lastOrder: userOrders[0]?.createdAt
    };
  };

  // Sorting and Filtering Logic
  const filteredUsers = useMemo(() => {
    let result = users.filter(user => 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Filter by Order Count
    if (orderFilter !== 'all') {
      result = result.filter(user => {
        const { orderCount } = getUserMetrics(user.id);
        if (orderFilter === '1') return orderCount === 1;
        if (orderFilter === '1-5') return orderCount >= 1 && orderCount <= 5;
        if (orderFilter === '5+') return orderCount > 5;
        return true;
      });
    }

    // Filter by Spent Amount
    if (spentFilter !== 'all') {
      result = result.filter(user => {
        const { spent } = getUserMetrics(user.id);
        if (spentFilter === '0') return spent === 0;
        const min = parseInt(spentFilter);
        return spent >= min;
      });
    }

    // Filter by Status
    if (statusFilter !== 'all') {
      result = result.filter(user => user.status === statusFilter);
    }

    // Sort
    if (sortConfig) {
      result.sort((a, b) => {
        let aVal: any, bVal: any;
        if (sortConfig.key === 'name') {
          aVal = a.name || '';
          bVal = b.name || '';
        } else if (sortConfig.key === 'orders') {
          aVal = getUserMetrics(a.id).orderCount;
          bVal = getUserMetrics(b.id).orderCount;
        } else if (sortConfig.key === 'spent') {
          aVal = getUserMetrics(a.id).spent;
          bVal = getUserMetrics(b.id).spent;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [users, orders, searchTerm, orderFilter, spentFilter, sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const handleReset = async (userId: string) => {
    if (window.confirm("This will clear all user profile data (name, email, addresses) and force logout. The phone number will be preserved. Proceed?")) {
      try {
        await resetUser(userId);
        loadData();
      } catch (err) {
        alert("Failed to reset user");
      }
    }
  };

  const handleBlock = async () => {
    if (!showBlockModal) return;
    try {
      await updateUser(showBlockModal.id, { 
        status: 'blocked',
        blockReason: blockReason 
      });
      setShowBlockModal(null);
      setBlockReason('');
      loadData();
    } catch (err) {
      alert("Failed to block user");
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      await updateUser(userId, { status: 'active', blockReason: '' });
      loadData();
    } catch (err) {
      alert("Failed to unblock user");
    }
  };

  const handleUpdateRefund = async (orderId: string) => {
    try {
      await updateOrder(orderId, { refundDetails: refundForm });
      setEditingRefundOrderId(null);
      loadData();
    } catch (err) {
      alert("Failed to update refund details");
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedUsers.length} users? This action is permanent!`)) {
      try {
        await Promise.all(selectedUsers.map(id => deleteUser(id)));
        setSelectedUsers([]);
        loadData();
      } catch (err) {
        alert("Failed to delete some users");
      }
    }
  };

  const handleUpdateNotes = async () => {
    if (!showNotesModal) return;
    try {
      await updateUser(showNotesModal.id, { adminNotes });
      setShowNotesModal(null);
      loadData();
    } catch (err) {
      alert("Failed to update notes");
    }
  };

  const handleAddTag = async (user: User) => {
    if (!newTag.trim()) return;
    const updatedTags = [...(user.tags || []), newTag.trim()];
    try {
      await updateUser(user.id, { tags: updatedTags });
      setNewTag('');
      loadData();
    } catch (err) {
      alert("Failed to add tag");
    }
  };

  const handleRemoveTag = async (user: User, tagToRemove: string) => {
    const updatedTags = (user.tags || []).filter(t => t !== tagToRemove);
    try {
      await updateUser(user.id, { tags: updatedTags });
      loadData();
    } catch (err) {
      alert("Failed to remove tag");
    }
  };

  const exportToExcel = () => {
    const exportData = filteredUsers.map(user => {
      const metrics = getUserMetrics(user.id);
      return {
        Name: user.name || 'N/A',
        Email: user.email || 'N/A',
        Phone: user.phone,
        Status: user.status,
        Orders: metrics.orderCount,
        TotalSpent: metrics.spent,
        LastActive: new Date(user.lastActive).toLocaleDateString(),
        Addresses: user.addresses?.map(a => `${a.receiverName}: ${a.apartment}, ${a.roadName}`).join(' | ') || 'N/A'
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, "SoulStitch_Customers.xlsx");
  };

  const sendWhatsAppOffer = (phone: string, template: string) => {
    const message = encodeURIComponent(template);
    window.open(`https://wa.me/91${phone}?text=${message}`, '_blank');
  };

  const sendEmailOffer = (email: string, template: string) => {
    const subject = encodeURIComponent("Special Offer from Soul Stitch");
    const body = encodeURIComponent(template);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  const shareUserDetails = (user: User) => {
    const metrics = getUserMetrics(user.id);
    const text = `*Customer Details - Soul Stitch*\n\n` +
                 `*Name:* ${user.name || 'N/A'}\n` +
                 `*Phone:* ${user.phone}\n` +
                 `*Email:* ${user.email || 'N/A'}\n` +
                 `*Orders:* ${metrics.orderCount}\n` +
                 `*Total Spent:* ₹${metrics.spent.toLocaleString()}\n` +
                 `*Last Active:* ${new Date(user.lastActive).toLocaleDateString()}\n` +
                 `*Address:* ${user.addresses?.find(a => a.isDefault)?.roadName || user.addresses?.[0]?.roadName || 'N/A'}`;
    const message = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const templates = [
    { name: "10% OFF Welcome", text: "Hey! Welcome to Soul Stitch. Use code WELCOME10 for 10% off on your first order!" },
    { name: "15% Summer Sale", text: "Summer is here! Enjoy 15% off on our entire Summer Collection with code SUMMER15." },
    { name: "Miss You Offer", text: "We haven't seen you in a while! Come back and use code MISSYOU20 for 20% off." }
  ];

  if (loading) return <div className="p-10 text-center animate-pulse">Loading Citizens...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Citizen Database</h1>
          <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Managing the collective ({filteredUsers.length} active nodes)</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBulkDelete}
            disabled={selectedUsers.length === 0}
            className="bg-red-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center space-x-2 hover:bg-red-500 transition-all disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Selected ({selectedUsers.length})</span>
          </button>
          <button 
            onClick={() => setShowOfferModal(true)}
            disabled={selectedUsers.length === 0}
            className="bg-green-500 text-black px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center space-x-2 hover:bg-white transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Send Bulk Offer ({selectedUsers.length})</span>
          </button>
          <button 
            onClick={exportToExcel}
            className="bg-zinc-800 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center space-x-2 hover:bg-zinc-700 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search by Name, Phone, or Email..."
            className="w-full bg-zinc-900 border border-white/5 px-12 py-4 rounded-xl focus:border-green-500 transition-all text-sm text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="bg-zinc-900 border border-white/5 px-4 py-4 rounded-xl text-xs font-bold uppercase text-zinc-400 focus:border-green-500"
          value={orderFilter}
          onChange={(e) => setOrderFilter(e.target.value)}
        >
          <option value="all">Filter: Order Count</option>
          <option value="0">0 Orders</option>
          <option value="1">1 Order</option>
          <option value="1-5">1 - 5 Orders</option>
          <option value="5+">5+ Orders</option>
        </select>
        <select 
          className="bg-zinc-900 border border-white/5 px-4 py-4 rounded-xl text-xs font-bold uppercase text-zinc-400 focus:border-green-500"
          value={spentFilter}
          onChange={(e) => setSpentFilter(e.target.value)}
        >
          <option value="all">Filter: Total Spent</option>
          <option value="0">₹0 Spent</option>
          <option value="500">₹500+</option>
          <option value="1000">₹1000+</option>
          <option value="5000">₹5000+</option>
          <option value="10000">₹10000+</option>
        </select>
        <select 
          className="bg-zinc-900 border border-white/5 px-4 py-4 rounded-xl text-xs font-bold uppercase text-zinc-400 focus:border-green-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Filter: Status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              <th className="p-6">
                <input 
                  type="checkbox" 
                  className="accent-green-500"
                  onChange={(e) => {
                    if (e.target.checked) setSelectedUsers(filteredUsers.map(u => u.id));
                    else setSelectedUsers([]);
                  }}
                />
              </th>
              <th className="p-6 cursor-pointer hover:text-white" onClick={() => handleSort('name')}>
                Citizen {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="p-6">Recent Item</th>
              <th className="p-6">Contact & Address</th>
              <th className="p-6 cursor-pointer hover:text-white" onClick={() => handleSort('orders')}>
                Activity {sortConfig?.key === 'orders' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="p-6 cursor-pointer hover:text-white" onClick={() => handleSort('spent')}>
                Revenue {sortConfig?.key === 'spent' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="p-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredUsers.map(user => {
              const metrics = getUserMetrics(user.id);
              const isSelected = selectedUsers.includes(user.id);
              const isExpanded = expandedUserId === user.id;

              return (
                <React.Fragment key={user.id}>
                  <tr 
                    className={`hover:bg-zinc-800/30 transition-colors group cursor-pointer ${user.status === 'blocked' ? 'opacity-50' : ''} ${isExpanded ? 'bg-white/5' : ''}`}
                    onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                  >
                    <td className="p-6" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      className="accent-green-500"
                      onChange={() => {
                        if (isSelected) setSelectedUsers(prev => prev.filter(id => id !== user.id));
                        else setSelectedUsers(prev => [...prev, user.id]);
                      }}
                    />
                  </td>
                  <td className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center font-bold text-xs uppercase text-zinc-400">
                        {user.name ? user.name.substring(0, 2) : '??'}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold uppercase tracking-tight text-sm text-white">{user.name || 'Anonymous'}</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="text-[10px] text-zinc-500 font-medium mr-2">Joined {new Date(user.createdAt as string).toLocaleDateString()}</span>
                          {user.tags?.map(tag => (
                            <span key={tag} className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 text-[8px] font-bold uppercase rounded border border-white/5 flex items-center gap-1">
                              <TagIcon className="w-2 h-2" /> {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    {(() => {
                      const userOrders = orders.filter(o => o.userId === user.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                      const lastItem = userOrders[0]?.products[0];
                      if (!lastItem) return <span className="text-[10px] text-zinc-600 font-bold uppercase">No Orders</span>;
                      const product = products.find(p => p.id === lastItem.productId || p.sku === lastItem.productId);
                      return (
                        <div className="flex items-center gap-2">
                          {product?.images?.[0] ? (
                            <img src={product.images[0]} alt="" className="w-8 h-8 rounded object-cover border border-white/5" />
                          ) : (
                            <div className="w-8 h-8 bg-zinc-800 rounded border border-white/5 flex items-center justify-center">
                              <ShoppingBag className="w-3 h-3 text-zinc-600" />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-[10px] text-white font-bold uppercase truncate w-24">{product?.name || 'Item'}</span>
                            <span className="text-[8px] text-zinc-500 font-medium">{new Date(userOrders[0].createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col text-[10px] space-y-1.5">
                      <div className="flex items-center space-x-2 text-zinc-400"><Mail className="w-3 h-3" /> <span>{user.email || 'No email provided'}</span></div>
                      <div className="flex items-center space-x-2 text-zinc-400"><Phone className="w-3 h-3" /> <span>+91 {user.phone}</span></div>
                      <div className="flex items-center space-x-2 text-zinc-400"><MapPin className="w-3 h-3" /> 
                        <span className="truncate max-w-[150px]">
                          {user.addresses?.find(a => a.isDefault)?.roadName || user.addresses?.[0]?.roadName || 'No address saved'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowOrderModal(user);
                      }}
                      className="flex flex-col text-left group-hover:bg-white/5 p-2 -m-2 rounded-lg transition-colors"
                    >
                      <span className="font-bold text-sm text-white flex items-center gap-2">
                        {metrics.orderCount} Orders <ChevronRight className="w-3 h-3" />
                      </span>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-2 h-2" /> Active {new Date(user.lastActive).toLocaleDateString()}
                      </span>
                    </button>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="font-black text-sm text-green-500">₹{metrics.spent.toLocaleString()}</span>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-tighter">Net Lifetime Value</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 text-[8px] font-black uppercase rounded-full ${
                        user.status === 'blocked' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                      }`}>
                        {user.status}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                    </div>
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan={8} className="p-0 border-b border-white/5 bg-zinc-800/20">
                      <div className="p-6 flex flex-wrap items-center gap-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2 pr-6 border-r border-white/5">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Contact:</span>
                          <button 
                            onClick={() => window.open(`tel:+91${user.phone}`)}
                            className="p-2.5 bg-zinc-800 hover:bg-white hover:text-black rounded-xl transition-all border border-white/5"
                            title="Call User"
                          >
                            <PhoneCall className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setSingleUserOffer(user)}
                            className="p-2.5 bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-black rounded-xl transition-all border border-green-500/20"
                            title="Send Offer Templates"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => shareUserDetails(user)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-green-500 hover:text-black rounded-xl transition-all border border-white/5 text-[10px] font-black uppercase tracking-widest"
                            title="Share Details via WhatsApp"
                          >
                            <Share2 className="w-4 h-4" />
                            <span>Share Info</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2 px-6 border-r border-white/5">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">CRM Tools:</span>
                          <button 
                            onClick={() => {
                              setShowNotesModal(user);
                              setAdminNotes(user.adminNotes || '');
                            }}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all border ${
                              user.adminNotes 
                                ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500 hover:text-black' 
                                : 'bg-zinc-800 hover:bg-white hover:text-black border-white/5'
                            } text-[10px] font-black uppercase tracking-widest`}
                            title="Admin Notes"
                          >
                            <Edit3 className="w-4 h-4" />
                            <span>Notes</span>
                          </button>
                          <button 
                            onClick={() => setShowOrderModal(user)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-white hover:text-black rounded-xl transition-all border border-white/5 text-[10px] font-black uppercase tracking-widest"
                          >
                            <ShoppingBag className="w-4 h-4" />
                            <span>Full History</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2 pl-6 border-r border-white/5 pr-6">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Security:</span>
                          <button 
                            onClick={() => handleReset(user.id)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-blue-500 hover:text-white rounded-xl transition-all border border-white/5 text-[10px] font-black uppercase tracking-widest"
                            title="Reset User Profile"
                          >
                            <RefreshCw className="w-4 h-4" />
                            <span>Reset Node</span>
                          </button>
                          {user.status === 'blocked' ? (
                            <button 
                              onClick={() => handleUnblock(user.id)}
                              className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-black rounded-xl transition-all border border-green-500/20 text-[10px] font-black uppercase tracking-widest"
                              title="Unblock User"
                            >
                              <Check className="w-4 h-4" />
                              <span>Unblock Access</span>
                            </button>
                          ) : (
                            <button 
                              onClick={() => setShowBlockModal(user)}
                              className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-500/20 text-[10px] font-black uppercase tracking-widest"
                              title="Block User"
                            >
                              <Ban className="w-4 h-4" />
                              <span>Restrict Access</span>
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              if (window.confirm(`Delete ${user.name || 'this user'} permanently?`)) {
                                deleteUser(user.id).then(() => loadData());
                              }
                            }}
                            className="p-2.5 bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all border border-red-600/10"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Wishlist Section */}
                        <div className="flex-1 min-w-[300px] pl-6">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                              <Heart className="w-3 h-3 text-red-500" /> Wishlist ({user.wishlist?.length || 0})
                            </span>
                            {user.wishlist?.length > 0 && (
                              <button 
                                onClick={() => setSingleUserOffer(user)}
                                className="text-[10px] font-bold text-green-500 hover:underline"
                              >
                                Send Offer for Items
                              </button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {user.wishlist?.length > 0 ? (
                              user.wishlist.slice(0, 4).map(pid => {
                                const product = products.find(p => p.id === pid);
                                if (!product) return null;
                                return (
                                  <div key={pid} className="group/item relative">
                                    <img 
                                      src={product.images?.[0] || ''} 
                                      alt="" 
                                      className="w-10 h-10 rounded-lg object-cover border border-white/5"
                                    />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/item:block z-50">
                                      <div className="bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap border border-white/10">
                                        {product.name}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <span className="text-[10px] text-zinc-600 italic">No items in wishlist</span>
                            )}
                            {user.wishlist?.length > 4 && (
                              <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-white/5 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                                +{user.wishlist.length - 4}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowOrderModal(null)}></div>
          <div className="bg-zinc-900 border border-white/10 w-full max-w-4xl rounded-3xl overflow-hidden relative shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter">Orders: {showOrderModal.name || showOrderModal.phone}</h2>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Transaction History & Status Tracker</p>
              </div>
              <button onClick={() => setShowOrderModal(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-8">
              <div className="space-y-6">
                {orders.filter(o => o.userId === showOrderModal.id).length === 0 ? (
                  <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <ShoppingBag className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No orders found for this node</p>
                  </div>
                ) : (
                  orders.filter(o => o.userId === showOrderModal.id).map(order => (
                    <div key={order.id} className="bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start">
                      <div className="flex-grow space-y-4 w-full">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Order ID</span>
                            <span className="text-sm font-bold text-white">{(order as any).orderCode || ('#' + order.id.slice(-8).toUpperCase())}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Date</span>
                            <span className="text-sm font-bold text-white">{new Date(order.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-zinc-900 rounded-xl">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Total Pay</span>
                            <span className="text-lg font-black text-green-500">₹{order.totalAmount.toLocaleString()}</span>
                          </div>
                          <div className="p-4 bg-zinc-900 rounded-xl">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Status</span>
                            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                              order.status === 'delivered' ? 'bg-green-500/20 text-green-500' :
                              order.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                              order.status === 'returned' ? 'bg-orange-500/20 text-orange-500' :
                              'bg-blue-500/20 text-blue-500'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                           <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">Items Ordered</span>
                           <div className="divide-y divide-white/5">
                             {order.products.map((p, idx) => (
                               <div key={idx} className="py-2 flex justify-between text-xs font-medium">
                                 <span className="text-zinc-400">SKU: {p.productId} (Size: {p.size}) x {p.quantity}</span>
                                 <span className="text-white">₹{p.price}</span>
                               </div>
                             ))}
                           </div>
                        </div>

                        {/* Refund Details Section */}
                        {(order.status === 'returned' || order.status === 'cancelled') && (
                          <div className="mt-4 p-4 bg-zinc-800/50 rounded-xl border border-white/5">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                <Banknote className="w-3 h-3" /> Refund Details
                              </h4>
                              {editingRefundOrderId !== order.id ? (
                                <button 
                                  onClick={() => {
                                    setEditingRefundOrderId(order.id);
                                    setRefundForm({
                                      upiId: order.refundDetails?.upiId || '',
                                      bankName: order.refundDetails?.bankName || '',
                                      accountNumber: order.refundDetails?.accountNumber || '',
                                      ifscCode: order.refundDetails?.ifscCode || '',
                                      accountHolderName: order.refundDetails?.accountHolderName || ''
                                    });
                                  }}
                                  className="text-[10px] font-bold uppercase text-green-500 hover:text-white"
                                >
                                  Edit Details
                                </button>
                              ) : (
                                <div className="flex gap-2">
                                  <button onClick={() => setEditingRefundOrderId(null)} className="text-[10px] font-bold uppercase text-zinc-500">Cancel</button>
                                  <button onClick={() => handleUpdateRefund(order.id)} className="text-[10px] font-bold uppercase text-green-500">Save</button>
                                </div>
                              )}
                            </div>

                            {editingRefundOrderId === order.id ? (
                              <div className="grid grid-cols-2 gap-3">
                                <input 
                                  placeholder="UPI ID"
                                  className="bg-zinc-900 border border-white/10 p-2 rounded text-[10px] text-white"
                                  value={refundForm.upiId}
                                  onChange={e => setRefundForm({...refundForm, upiId: e.target.value})}
                                />
                                <input 
                                  placeholder="Account Holder"
                                  className="bg-zinc-900 border border-white/10 p-2 rounded text-[10px] text-white"
                                  value={refundForm.accountHolderName}
                                  onChange={e => setRefundForm({...refundForm, accountHolderName: e.target.value})}
                                />
                                <input 
                                  placeholder="Bank Name"
                                  className="bg-zinc-900 border border-white/10 p-2 rounded text-[10px] text-white"
                                  value={refundForm.bankName}
                                  onChange={e => setRefundForm({...refundForm, bankName: e.target.value})}
                                />
                                <input 
                                  placeholder="Account Number"
                                  className="bg-zinc-900 border border-white/10 p-2 rounded text-[10px] text-white"
                                  value={refundForm.accountNumber}
                                  onChange={e => setRefundForm({...refundForm, accountNumber: e.target.value})}
                                />
                                <input 
                                  placeholder="IFSC Code"
                                  className="bg-zinc-900 border border-white/10 p-2 rounded text-[10px] text-white"
                                  value={refundForm.ifscCode}
                                  onChange={e => setRefundForm({...refundForm, ifscCode: e.target.value})}
                                />
                              </div>
                            ) : (
                              <div className="text-[10px] space-y-1">
                                {order.refundDetails?.upiId ? (
                                  <p className="text-white font-medium">UPI: <span className="text-zinc-400">{order.refundDetails.upiId}</span></p>
                                ) : order.refundDetails?.accountNumber ? (
                                  <>
                                    <p className="text-white font-medium">Bank: <span className="text-zinc-400">{order.refundDetails.bankName}</span></p>
                                    <p className="text-white font-medium">A/C: <span className="text-zinc-400">{order.refundDetails.accountNumber}</span></p>
                                    <p className="text-white font-medium">IFSC: <span className="text-zinc-400">{order.refundDetails.ifscCode}</span></p>
                                    <p className="text-white font-medium">Holder: <span className="text-zinc-400">{order.refundDetails.accountHolderName}</span></p>
                                  </>
                                ) : (
                                  <p className="text-zinc-500 italic">No refund details provided yet.</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Wishlist Section */}
              <div className="mt-12 pt-8 border-t border-white/5">
                <h3 className="text-xl font-black uppercase tracking-tighter mb-6 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" /> Wishlist Items
                </h3>
                {!showOrderModal.wishlist || showOrderModal.wishlist.length === 0 ? (
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest italic">Wishlist is empty</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {showOrderModal.wishlist.map(sku => {
                      const product = products.find(p => p.sku === sku || p.id === sku || p._id === sku);
                      const productName = product?.name || 'Unknown Product';
                      const productImage = product?.images?.[0];
                      const productSku = product?.sku || sku;
                      
                      const promoMessage = `Hi ${showOrderModal.name || 'there'}! We noticed you have the "${productName}" in your wishlist. ✨ Use code SOUL10 for 10% OFF if you order today! Shop here: ${window.location.origin}/#/product/${sku}`;

                      return (
                        <div key={sku} className="group/wish bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center relative overflow-hidden transition-all hover:bg-white/10 hover:border-green-500/30">
                          {productImage ? (
                            <img src={productImage} alt={sku} className="w-20 h-20 object-cover rounded-xl mb-3 shadow-2xl" />
                          ) : (
                            <div className="w-20 h-20 bg-zinc-800 rounded-xl mb-3 flex items-center justify-center">
                              <ShoppingBag className="w-8 h-8 text-zinc-600" />
                            </div>
                          )}
                          <div className="space-y-1 w-full">
                            <span className="text-[10px] font-black uppercase tracking-tighter text-white block truncate px-2">{productName}</span>
                            <span className="text-[8px] text-zinc-500 font-bold uppercase block">SKU: {productSku}</span>
                          </div>

                          {/* Hover WhatsApp Action */}
                          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover/wish:opacity-100 transition-all flex flex-col items-center justify-center p-4">
                            <p className="text-[8px] text-zinc-300 font-medium leading-tight mb-3 line-clamp-3 italic">"{promoMessage}"</p>
                            <button 
                              onClick={() => sendWhatsAppOffer(showOrderModal.phone, promoMessage)}
                              className="w-full bg-green-500 text-black py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-colors"
                            >
                              <MessageCircle className="w-3 h-3" /> Send Offer
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tags Section in Modal */}
              <div className="mt-12 pt-8 border-t border-white/5">
                <h3 className="text-xl font-black uppercase tracking-tighter mb-6 flex items-center gap-2">
                  <TagIcon className="w-5 h-5 text-zinc-400" /> Citizen Tags
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {showOrderModal.tags?.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-zinc-800 text-zinc-300 text-[10px] font-black uppercase rounded-full border border-white/10 flex items-center gap-2">
                      {tag}
                      <button onClick={() => handleRemoveTag(showOrderModal, tag)} className="hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 max-w-xs">
                  <input 
                    type="text" 
                    placeholder="New tag..." 
                    className="flex-grow bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white focus:border-green-500 outline-none"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddTag(showOrderModal)}
                  />
                  <button 
                    onClick={() => handleAddTag(showOrderModal)}
                    className="p-2 bg-green-500 text-black rounded-lg hover:bg-white transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowBlockModal(null)}></div>
          <div className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-3xl overflow-hidden relative shadow-2xl p-8">
            <div className="flex flex-col items-center text-center space-y-4 mb-8">
              <div className="p-4 bg-red-500/20 rounded-full">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">Restrict Access?</h2>
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest leading-relaxed">
                Provide a reason for blocking {showBlockModal.name || showBlockModal.phone}. 
                This will be visible to the user upon login attempt.
              </p>
            </div>
            
            <textarea 
              className="w-full bg-zinc-800 border border-white/5 rounded-2xl p-4 text-sm text-white focus:border-red-500 transition-all mb-6 min-h-[120px]"
              placeholder="Ex: Multiple fraudulent orders, Violating terms of service..."
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
            />

            <div className="flex gap-4">
              <button 
                onClick={() => setShowBlockModal(null)}
                className="flex-grow py-4 rounded-xl text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleBlock}
                disabled={!blockReason.trim()}
                className="flex-grow bg-red-500 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-50"
              >
                Confirm Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowNotesModal(null)} />
          <div className="relative bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-800/50">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-yellow-500" /> Admin Notes
                </h2>
                <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">For {showNotesModal.name || showNotesModal.phone}</p>
              </div>
              <button onClick={() => setShowNotesModal(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <textarea 
                className="w-full h-40 bg-zinc-950 border border-white/10 rounded-xl p-4 text-xs text-white focus:border-yellow-500 outline-none resize-none"
                placeholder="Write private notes about this customer here..."
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
              />
              <div className="mt-6 flex gap-3">
                <button 
                  onClick={() => setShowNotesModal(null)}
                  className="flex-1 py-3 bg-zinc-800 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateNotes}
                  className="flex-1 py-3 bg-yellow-500 text-black text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offer Modal */}
      {(showOfferModal || singleUserOffer) && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => { setShowOfferModal(false); setSingleUserOffer(null); }}></div>
          <div className="bg-zinc-900 border border-white/10 w-full max-w-xl rounded-3xl overflow-hidden relative shadow-2xl p-8">
            <div className="flex flex-col items-center text-center space-y-2 mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Broadcast Offer</h2>
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">
                Select a template to send to {singleUserOffer ? (singleUserOffer.name || singleUserOffer.phone) : `${selectedUsers.length} selected nodes`}
              </p>
            </div>
            
            <div className="space-y-4 mb-8">
              {templates.map((tpl, i) => (
                <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl group hover:border-green-500/50 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-black uppercase tracking-widest text-green-500">{tpl.name}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          if (singleUserOffer) {
                            sendWhatsAppOffer(singleUserOffer.phone, tpl.text);
                          } else {
                            selectedUsers.forEach(id => {
                              const u = users.find(user => user.id === id);
                              if (u) sendWhatsAppOffer(u.phone, tpl.text);
                            });
                          }
                          setShowOfferModal(false);
                          setSingleUserOffer(null);
                        }}
                        className="p-1.5 bg-green-500 text-black rounded-lg hover:scale-110 transition-transform"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button 
                         onClick={() => {
                          if (singleUserOffer) {
                            if (singleUserOffer.email) sendEmailOffer(singleUserOffer.email, tpl.text);
                          } else {
                            selectedUsers.forEach(id => {
                              const u = users.find(user => user.id === id);
                              if (u?.email) sendEmailOffer(u.email, tpl.text);
                            });
                          }
                          setShowOfferModal(false);
                          setSingleUserOffer(null);
                        }}
                        className="p-1.5 bg-white text-black rounded-lg hover:scale-110 transition-transform"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed italic">"{tpl.text}"</p>
                </div>
              ))}
            </div>

            <button 
              onClick={() => { setShowOfferModal(false); setSingleUserOffer(null); }}
              className="w-full py-4 rounded-xl text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Quick Action Floating Bar */}
      {selectedUsers.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white text-black px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom duration-500 z-50">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Selection Active</span>
            <span className="text-sm font-black">{selectedUsers.length} Customers Selected</span>
          </div>
          <div className="h-8 w-px bg-black/10"></div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowOfferModal(true)}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:text-green-600 transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>Send Offer</span>
            </button>
            <button 
              onClick={() => setSelectedUsers([])}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:text-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Deselect</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
