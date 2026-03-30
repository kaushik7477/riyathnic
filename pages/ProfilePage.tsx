import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User as UserIcon, Package, MapPin, LogOut, ChevronRight, Settings, 
  Heart, ChevronLeft, Truck, CheckCircle, AlertCircle, Edit2, Trash2, 
  Plus, CreditCard, HelpCircle, Bell, Lock, Smartphone, Mail, X, RefreshCw, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Order, Address, Product } from '../types';
import { fetchOrders, fetchProducts, updateUser, logoutUser, mapOrder } from '../src/api';
import { INDIAN_STATES } from '../constants';
import { getThumbnailUrl } from '../src/utils/cloudinary';

interface ProfilePageProps {
  user: User;
  setUser: (user: User | null) => void;
  wishlistCount: number;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, setUser, wishlistCount }) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'orders' | 'addresses' | 'settings'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOrderIndex, setActiveOrderIndex] = useState(0);
  const [savedLocationIndex, setSavedLocationIndex] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: user.name || '',
    email: user.email || '',
  });

  // Sync profileFormData when user changes
  useEffect(() => {
    setProfileFormData({
        name: user.name || '',
        email: user.email || '',
    });
  }, [user.name, user.email]);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true); // Mock preference

  // Data Fetching
  useEffect(() => {
    const loadData = async () => {
      try {
        const [ordersData, productsData] = await Promise.all([
          fetchOrders(user.id),
          fetchProducts()
        ]);
        setOrders(ordersData);
        setProducts(productsData);
      } catch (error) {
        console.error("Failed to load profile data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    // Socket listeners for real-time updates
    const setupSocket = async () => {
        const { socket } = await import('../src/api');
        socket.on('order_updated', (updatedOrder: any) => {
            const mapped = mapOrder(updatedOrder);
            setOrders(prev => prev.map(o => (o._id === mapped._id || o.id === mapped.id) ? mapped : o));
        });
    };
    setupSocket();

    return () => {
        // We'd need a way to off it, but since it's dynamic import it's tricky. 
        // For now, the existing pattern in AdminOrders uses the exported socket.
    };
  }, [user.id]);

  // Derived Data
  const lastOrder = useMemo(() => 
    orders.length > 0 ? orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] : null,
  [orders]);

  const activeOrders = useMemo(() => 
    orders.filter(o => 
      ['pending', 'processing', 'shipped'].includes(o.status) || 
      o.status?.startsWith('exchange-') || 
      o.exchangeRequest
    ), 
  [orders]);

  // Active Transmissions Carousel
  useEffect(() => {
    if (activeOrders.length <= 1) return;
    const interval = setInterval(() => {
      setActiveOrderIndex(prev => (prev + 1) % activeOrders.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeOrders.length]);

  const [deleteAccountStep, setDeleteAccountStep] = useState<'initial' | 'otp'>('initial');
  const [deleteOtp, setDeleteOtp] = useState('');

  // Handlers
  const handleLogout = async (allDevices: boolean) => {
    console.log("Initiating logout...", { allDevices, userId: user?.id });
    
    // 1. Immediately close modal
    setShowLogoutModal(false);

    try {
        // 2. Clear local storage first to prevent auto-login on refresh
        localStorage.clear(); // Wipe everything for safety
        
        // 3. Clear app state
        setUser(null);

        // 4. Notify backend if possible (don't wait for it if it takes too long)
        if (user?.id) {
            logoutUser(user.id, allDevices).catch(err => console.error("Backend logout notification failed:", err));
        }

        console.log("Local state cleared, redirecting...");
        
        // 5. Navigate to auth page
        navigate('/auth', { replace: true });
        
        // 6. Force reload to ensure a completely clean state
        window.location.reload();
    } catch (error) {
        console.error("Logout error:", error);
        // Fallback: force reload anyway
        window.location.href = '/#/auth';
        window.location.reload();
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteAccountStep === 'initial') {
        // Mock sending OTP
        alert(`OTP sent to ${user.email}`);
        setDeleteAccountStep('otp');
    } else {
        // Mock verifying OTP and deleting account
        if (deleteOtp === '1234') { // Mock OTP
            try {
                // await deleteUser(user.id); // Assuming this API exists or mock it
                console.log("Account deleted");
                alert("Account deleted successfully");
                setUser(null);
                localStorage.removeItem('user');
                navigate('/');
            } catch (error) {
                alert("Failed to delete account");
            }
        } else {
            alert("Invalid OTP");
        }
    }
  };

  const handleProfileUpdate = async () => {
    try {
        const updatedUser = await updateUser(user.id, { 
            name: profileFormData.name, 
            email: profileFormData.email 
        });
        setUser(updatedUser);
        alert("Profile updated successfully!");
    } catch (error) {
        console.error("Failed to update profile", error);
        alert("Failed to update profile. Please try again.");
    }
  };

  const handleUpdateAddress = async (updatedAddresses: Address[]) => {
    try {
      const updatedUser = await updateUser(user.id, { addresses: updatedAddresses });
      setUser(updatedUser);
    } catch (error) {
      console.error("Failed to update addresses:", error);
      alert("Failed to update addresses");
    }
  };

  const handleDeleteAddress = (id: string) => {
    if (!id) return;
    if (confirm("Are you sure you want to delete this address?")) {
      const newAddresses = user.addresses.filter(a => (a.id || (a as any)._id) !== id);
      handleUpdateAddress(newAddresses);
    }
  };

  const handleSetDefaultAddress = (id: string) => {
    if (!id) return;
    const newAddresses = user.addresses.map(a => ({
      ...a,
      isDefault: (a.id || (a as any)._id) === id
    }));
    handleUpdateAddress(newAddresses);
  };

  const handleAddressSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const isDefault = formData.get('isDefault') === 'on';

    const addressId = editingAddress ? (editingAddress.id || (editingAddress as any)._id) : Date.now().toString();

    const newAddress: Address = {
      id: addressId,
      receiverName: formData.get('receiverName') as string,
      apartment: formData.get('apartment') as string,
      roadName: formData.get('roadName') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      pincode: formData.get('pincode') as string,
      phone: user.phone,
      isDefault: isDefault || (user.addresses.length === 0 && !editingAddress),
    };

    let updatedAddresses = [...user.addresses];
    if (editingAddress) {
      updatedAddresses = updatedAddresses.map(a => 
        (a.id || (a as any)._id) === (editingAddress.id || (editingAddress as any)._id) ? newAddress : a
      );
    } else {
      updatedAddresses.push(newAddress);
    }
    
    // If this address is set as default, clear other defaults
    if (newAddress.isDefault) {
        updatedAddresses = updatedAddresses.map(a => ({
            ...a,
            isDefault: (a.id || (a as any)._id) === newAddress.id
        }));
    }

    try {
        await handleUpdateAddress(updatedAddresses);
        setShowAddressModal(false);
        setEditingAddress(null);
    } catch (error) {
        console.error("Failed to save address:", error);
    }
  };

  const sortedAddresses = useMemo(() => {
    return [...user.addresses].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
  }, [user.addresses]);

  // Render Helpers
  const getProductDetails = (productId: string) => products.find(p => p.id === productId);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'delivered': return 'text-green-500';
      case 'shipped': return 'text-blue-500';
      case 'processing': return 'text-yellow-500';
      case 'cancelled': return 'text-red-500';
      case 'returned': return 'text-purple-500';
      case 'exchange-pending': return 'text-yellow-500';
      case 'exchange-approved': return 'text-blue-500';
      case 'exchange-rejected': return 'text-red-500';
      case 'exchange-picked-up': return 'text-indigo-500';
      case 'exchange-in-transit': return 'text-cyan-500';
      case 'exchanged': return 'text-green-500';
      default: return 'text-zinc-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'delivered': return CheckCircle;
      case 'shipped': return Truck;
      case 'processing': return Package;
      case 'cancelled': return X;
      case 'returned': return ChevronLeft; 
      case 'exchange-pending': return RefreshCw;
      case 'exchange-approved': return Check;
      case 'exchange-rejected': return X;
      case 'exchange-picked-up': return Package;
      case 'exchange-in-transit': return Truck;
      case 'exchanged': return CheckCircle;
      default: return AlertCircle;
    }
  };

  return (
    <div className="bg-white min-h-screen text-[#03401b] pt-10 pb-20 font-sans">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Sidebar */}
          <div className="w-full lg:w-72 space-y-6">
            <div className="p-8 bg-zinc-50 border border-[#03401b]/10 rounded-3xl flex flex-col items-center backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 border-2 border-[#03401b]/10 relative z-10">
                <UserIcon className="w-10 h-10 text-zinc-500" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tighter text-center relative z-10">
                {user.name || 'New User'}
              </h2>
              <div className="mt-6 w-full space-y-3 relative z-10">
                 {/* Navigation Items */}
                 {[
                  { id: 'orders', label: 'Orders', icon: Package },
                  { id: 'wishlist', label: 'Wishlist', icon: Heart, badge: wishlistCount },
                  { id: 'addresses', label: 'Addresses', icon: MapPin },
                  { id: 'settings', label: 'Settings', icon: Settings },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'wishlist') {
                        navigate('/wishlist');
                      } else {
                        setActiveSection(item.id as any);
                      }
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all border border-transparent ${
                      activeSection === item.id 
                        ? 'bg-white border-[#03401b]/10 text-[#03401b] shadow-lg shadow-[#03401b]/5' 
                        : 'hover:bg-white text-zinc-500 hover:text-[#03401b]'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className={`w-5 h-5 ${activeSection === item.id ? 'text-green-500' : ''}`} />
                      <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="bg-green-500 text-[#03401b] text-[10px] font-black px-2 py-0.5 rounded-full">{item.badge}</span>
                      )}
                    </div>
                    {activeSection === item.id && <ChevronRight className="w-4 h-4 text-green-500" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Widgets */}
            <div className="grid grid-cols-1 gap-6">
               {/* Contact Relay */}
               <div className="bg-zinc-50 border border-[#03401b]/10 p-6 rounded-3xl">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Contact Relay</h3>
                <div className="space-y-3">
                  {user.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-zinc-600" />
                      <p className="text-sm font-bold text-zinc-600">{user.email}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-4 h-4 text-zinc-600" />
                    <p className="text-sm font-bold text-zinc-600">+91 {user.phone}</p>
                  </div>
                </div>
              </div>

              {/* Saved Locations Widget */}
              <div className="bg-zinc-50 border border-[#03401b]/10 p-6 rounded-3xl relative">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Saved Locations</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSavedLocationIndex(prev => prev > 0 ? prev - 1 : sortedAddresses.length - 1)}
                      className="p-1 hover:bg-white rounded-full transition-colors"
                      disabled={sortedAddresses.length <= 1}
                    >
                      <ChevronLeft className="w-4 h-4 text-zinc-500" />
                    </button>
                    <button 
                      onClick={() => setSavedLocationIndex(prev => (prev + 1) % sortedAddresses.length)}
                      className="p-1 hover:bg-white rounded-full transition-colors"
                      disabled={sortedAddresses.length <= 1}
                    >
                      <ChevronRight className="w-4 h-4 text-zinc-500" />
                    </button>
                  </div>
                </div>
                {sortedAddresses.length > 0 ? (
                  <div className="bg-white shadow-sm p-4 rounded-xl border border-[#03401b]/10/50">
                    <div className="flex items-start gap-3">
                      <MapPin className={`w-5 h-5 mt-1 ${sortedAddresses[savedLocationIndex].isDefault ? 'text-green-500' : 'text-zinc-600'}`} />
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-zinc-600">{sortedAddresses[savedLocationIndex].receiverName}</p>
                        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                          {sortedAddresses[savedLocationIndex].apartment}, {sortedAddresses[savedLocationIndex].roadName}<br />
                          {sortedAddresses[savedLocationIndex].pincode}
                        </p>
                        {sortedAddresses[savedLocationIndex].isDefault && (
                          <span className="inline-block mt-2 text-[9px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Default</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                   <p className="text-xs text-zinc-500 italic">No locations encrypted in database.</p>
                )}
              </div>

              {/* Log Out Section */}
              <button 
                onClick={() => {
                  console.log("LOG-OUT clicked");
                  setShowLogoutModal(true);
                }}
                className="w-full flex items-center justify-center space-x-3 p-4 bg-zinc-50 border border-[#03401b]/10 rounded-3xl hover:bg-red-500/10 text-red-500 transition-all border-transparent hover:border-red-500/20 group"
              >
                <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">LOG-OUT</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-grow space-y-10">
            
            {/* Active Transmissions Header */}
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter mb-8 flex items-center gap-4">
                Active Transmissions
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></span>
              </h1>
              
              <div className="relative min-h-[160px]">
                <AnimatePresence mode="wait">
                  {activeOrders.length > 0 ? (
                    <motion.div
                      key={activeOrders[activeOrderIndex].id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.5 }}
                      className="bg-zinc-50 border border-[#03401b]/10 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl shadow-[#03401b]/5"
                    >
                      <div className="flex items-center space-x-6 w-full">
                        <div className="w-20 h-24 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-[#03401b]/10">
                          {/* Get first product image */}
                          <img 
                            src={getThumbnailUrl(getProductDetails(activeOrders[activeOrderIndex].products[0].productId)?.images[0])} 
                            className="w-full h-full object-cover" 
                            alt="" 
                            loading="lazy"
                          />
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-3 mb-2">
                             <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Order #{(activeOrders[activeOrderIndex].id || (activeOrders[activeOrderIndex] as any)._id || '').slice(-6)}</span>
                             <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                          </div>
                          <h4 className="font-bold uppercase tracking-tight text-lg truncate max-w-[200px] md:max-w-md">
                            {getProductDetails(activeOrders[activeOrderIndex].products[0].productId)?.name || 'Unknown Product'}
                            {activeOrders[activeOrderIndex].products.length > 1 && <span className="text-zinc-500 text-sm ml-2">+{activeOrders[activeOrderIndex].products.length - 1} more</span>}
                          </h4>
                          <div className="flex items-center gap-2 mt-2">
                            {(() => {
                               const order = activeOrders[activeOrderIndex];
                               if (order.exchangeRequest) {
                                 const exchange = order.exchangeRequest;
                                 const statusColors: {[key: string]: string} = {
                                   'pending': 'text-yellow-500',
                                   'approved': 'text-green-500',
                                   'rejected': 'text-red-500',
                                   'picked-up': 'text-blue-500',
                                   'in-transit': 'text-purple-500',
                                   'exchanged': 'text-zinc-500'
                                 };
                                 return (
                                   <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-2">
                                        <RefreshCw className={`w-4 h-4 animate-spin-slow ${statusColors[exchange.status] || 'text-zinc-500'}`} />
                                        <p className={`text-xs font-black tracking-widest uppercase ${statusColors[exchange.status] || 'text-zinc-500'}`}>
                                          Exchange {exchange.status.replace('-', ' ')}
                                        </p>
                                      </div>
                                      {exchange.pickupTrackingId && (
                                        <p className="text-[10px] font-mono text-zinc-500 bg-white px-2 py-0.5 rounded">
                                          TRK: {exchange.pickupTrackingId}
                                        </p>
                                      )}
                                   </div>
                                 );
                               }
                               const StatusIcon = getStatusIcon(order.status);
                               return (
                                 <div className="flex items-center gap-2">
                                   <StatusIcon className={`w-4 h-4 ${getStatusColor(order.status)}`} />
                                   <p className={`text-xs font-bold tracking-widest uppercase ${getStatusColor(order.status)}`}>
                                     {order.status.replace('-', ' ')}
                                   </p>
                                 </div>
                               );
                            })()}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 w-full md:w-auto">
                        <Link 
                          to={`/order/${activeOrders[activeOrderIndex].id || (activeOrders[activeOrderIndex] as any)._id}`}
                          className="bg-white text-[#03401b] px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-500 transition-all text-center"
                        >
                          Details
                        </Link>
                        <div className="text-right hidden md:block mb-2">
                           <p className="text-[10px] text-zinc-500 uppercase">Estimated Arrival</p>
                           <p className="text-sm font-bold">2 Days</p>
                        </div>
                      </div>
                    </motion.div>
                  ) : lastOrder ? (
                    <div className="bg-zinc-50 border border-[#03401b]/10 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 opacity-60 hover:opacity-100 transition-opacity">
                       <div className="flex items-center space-x-6 w-full">
                        <div className="w-16 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0 grayscale">
                          <img 
                            src={getThumbnailUrl(getProductDetails(lastOrder.products[0].productId)?.images[0])} 
                            className="w-full h-full object-cover" 
                            alt="" 
                            loading="lazy"
                          />
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">Last Order #{(lastOrder.id || (lastOrder as any)._id || '').slice(-6)}</p>
                          <h4 className="font-bold uppercase tracking-tight text-zinc-500">
                             {getProductDetails(lastOrder.products[0].productId)?.name}
                          </h4>
                          <p className="text-xs text-zinc-500 font-bold mt-1 tracking-widest uppercase">Delivered</p>
                        </div>
                      </div>
                      <Link to="/products" className="px-6 py-2 bg-white text-[#03401b] text-[10px] font-black uppercase tracking-widest hover:bg-green-500 transition-all rounded-lg">
                        Order Again
                      </Link>
                    </div>
                  ) : (
                    <div className="bg-white border border-dashed border-[#03401b]/10 p-8 rounded-3xl flex flex-col items-center justify-center text-center">
                      <p className="text-zinc-500 font-bold uppercase tracking-widest mb-2">No order records found</p>
                      <a 
                        href="https://www.shiprocket.in/shipment-tracking/" 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-green-500 hover:text-green-400 text-xs font-black uppercase tracking-widest flex items-center gap-2"
                      >
                        Track Order by ID <ChevronRight className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Dynamic Content Sections */}
            <div className="bg-zinc-50 border border-[#03401b]/10 rounded-3xl p-8 min-h-[500px]">
              {activeSection === 'orders' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-black uppercase tracking-tighter mb-6">Order History</h2>
                  {orders.length === 0 ? (
                    <p className="text-zinc-500">No orders found.</p>
                  ) : (
                    <div className="space-y-4">
                      {orders.map(order => (
                        <Link 
                          key={order.id} 
                          to={`/order/${order.id || (order as any)._id}`}
                          className="bg-white shadow-sm border border-[#03401b]/10 rounded-2xl p-6 hover:border-zinc-600 transition-colors group block"
                        >
                          <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
                            <div className="flex gap-4">
                              <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0">
                                <img 
                                  src={getThumbnailUrl(getProductDetails(order.products[0].productId)?.images[0])} 
                                  className="w-full h-full object-cover" 
                                  alt="" 
                                  loading="lazy"
                                />
                              </div>
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <span className="text-xs font-bold text-[#03401b]">#{(order.id || (order as any)._id || '').slice(-6)}</span>
                                  <span className="text-[10px] text-zinc-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  {order.products.map((p, i) => (
                                    <p key={i} className="text-sm text-zinc-500">
                                      {p.quantity}x {getProductDetails(p.productId)?.name} <span className="text-zinc-600 text-xs">({p.size})</span>
                                    </p>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 md:gap-8">
                               <div className="text-right">
                                 <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Total</p>
                                 <p className="font-bold">₹{order.totalAmount}</p>
                               </div>
                               <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 rounded-lg border border-[#03401b]/10">
                                  {(() => {
                                     if (order.exchangeRequest) {
                                       const statusColors: {[key: string]: string} = {
                                         'pending': 'text-yellow-500',
                                         'approved': 'text-green-500',
                                         'rejected': 'text-red-500',
                                         'picked-up': 'text-blue-500',
                                         'in-transit': 'text-purple-500',
                                         'exchanged': 'text-zinc-500'
                                       };
                                       return (
                                         <div className="flex items-center gap-2">
                                           <RefreshCw className={`w-3 h-3 animate-spin-slow ${statusColors[order.exchangeRequest.status]}`} />
                                           <span className={`text-[10px] font-black uppercase tracking-widest ${statusColors[order.exchangeRequest.status]}`}>
                                             Exchange {order.exchangeRequest.status}
                                           </span>
                                         </div>
                                       );
                                     }
                                     const StatusIcon = getStatusIcon(order.status);
                                     return (
                                       <div className="flex items-center gap-2">
                                         <StatusIcon className={`w-4 h-4 ${getStatusColor(order.status)}`} />
                                         <span className={`text-xs font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                                           {order.status}
                                         </span>
                                       </div>
                                     );
                                  })()}
                               </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'addresses' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black uppercase tracking-tighter">Addresses</h2>
                    <button 
                      className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-white text-[#03401b] px-4 py-2 rounded-lg hover:bg-green-500 transition-colors"
                      onClick={() => {
                        setEditingAddress(null);
                        setShowAddressModal(true);
                      }}
                    >
                      <Plus className="w-4 h-4" /> Add New
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {user.addresses.map(address => {
                      const id = address.id || (address as any)._id;
                      return (
                        <div key={id} className={`p-6 rounded-2xl border ${address.isDefault ? 'bg-white shadow-md border-green-500/50' : 'bg-white shadow-sm border-[#03401b]/10'} relative group`}>
                           {address.isDefault && (
                             <div className="absolute top-4 right-4 bg-green-500 text-[#03401b] text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                               Default
                             </div>
                           )}
                           <div className="flex items-start gap-4 mb-4">
                             <div className={`p-3 rounded-xl ${address.isDefault ? 'bg-green-500/10 text-green-500' : 'bg-white text-zinc-500'}`}>
                               <MapPin className="w-6 h-6" />
                             </div>
                             <div>
                               <h3 className="font-bold uppercase">{address.receiverName}</h3>
                               <p className="text-sm text-zinc-500 mt-1 leading-relaxed">
                                 {address.apartment}, {address.roadName}<br/>
                                 {address.city}, {address.state} - {address.pincode}
                               </p>
                               <p className="text-sm text-zinc-500 mt-2">Phone: {address.phone}</p>
                             </div>
                           </div>
                           <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#03401b]/10/50">
                              {!address.isDefault && (
                                <button 
                                  onClick={() => handleSetDefaultAddress(id)}
                                  className="flex-1 py-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-[#03401b] hover:bg-white rounded-lg transition-colors"
                                >
                                  Set Default
                                </button>
                              )}
                              <button 
                                onClick={() => {
                                  setEditingAddress(address);
                                  setShowAddressModal(true);
                                }}
                                className="p-2 text-zinc-500 hover:text-[#03401b] hover:bg-white rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteAddress(id)}
                                className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeSection === 'settings' && (
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter mb-8">Settings</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {/* Profile Settings */}
                     <div className="space-y-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 border-b border-[#03401b]/10 pb-2">Profile Information</h3>
                        <div className="space-y-4">
                           <div>
                             <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Full Name</label>
                             <input 
                               type="text" 
                               value={profileFormData.name}
                               onChange={(e) => setProfileFormData({...profileFormData, name: e.target.value})}
                               className="w-full bg-white border border-[#03401b]/10 rounded-xl p-3 text-sm focus:border-green-500 outline-none transition-colors" 
                             />
                           </div>
                           <div>
                             <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Email Address</label>
                             <div className="flex gap-2">
                               <input 
                                 type="email" 
                                 value={profileFormData.email}
                                 onChange={(e) => setProfileFormData({...profileFormData, email: e.target.value})}
                                 className="w-full bg-white border border-[#03401b]/10 rounded-xl p-3 text-sm focus:border-green-500 outline-none transition-colors" 
                               />
                               {/* <button className="bg-white px-4 rounded-xl text-xs font-bold uppercase hover:bg-zinc-700">Verify</button> */}
                             </div>
                           </div>
                           <button 
                             onClick={handleProfileUpdate}
                             className="w-full bg-white text-[#03401b] font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-green-500 transition-colors"
                           >
                             Save Changes
                           </button>
                        </div>
                     </div>

                     {/* Other Settings */}
                     <div className="space-y-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 border-b border-[#03401b]/10 pb-2">Preferences & Security</h3>
                        <div className="space-y-3">
                           <button 
                             onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                             className="w-full flex items-center justify-between p-4 bg-white shadow-sm border border-[#03401b]/10 rounded-xl hover:border-zinc-600 transition-colors group"
                           >
                              <div className="flex items-center gap-3">
                                 <Bell className="w-4 h-4 text-zinc-500 group-hover:text-green-500" />
                                 <span className="text-sm font-medium">Notifications</span>
                              </div>
                              <div className={`w-8 h-4 bg-white rounded-full relative transition-colors ${notificationsEnabled ? 'bg-zinc-700' : ''}`}>
                                <div className={`absolute top-0 bottom-0 w-4 rounded-full transition-all ${notificationsEnabled ? 'right-0 bg-green-500' : 'left-0 bg-zinc-500'}`}></div>
                              </div>
                           </button>
                           
                           <a 
                             href="mailto:support@soulstich.com"
                             className="w-full flex items-center justify-between p-4 bg-white shadow-sm border border-[#03401b]/10 rounded-xl hover:border-zinc-600 transition-colors group"
                           >
                              <div className="flex items-center gap-3">
                                 <HelpCircle className="w-4 h-4 text-zinc-500 group-hover:text-green-500" />
                                 <span className="text-sm font-medium">Help Center</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-zinc-600" />
                           </a>

                           <div className="pt-4 border-t border-[#03401b]/10 mt-4">
                               {deleteAccountStep === 'initial' ? (
                                   <button 
                                     onClick={handleDeleteAccount}
                                     className="w-full flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors group text-red-500"
                                   >
                                      <div className="flex items-center gap-3">
                                         <Trash2 className="w-4 h-4" />
                                         <span className="text-sm font-bold uppercase tracking-wide">Delete Account</span>
                                      </div>
                                      <ChevronRight className="w-4 h-4" />
                                   </button>
                               ) : (
                                   <div className="space-y-3 bg-red-500/5 p-4 rounded-xl border border-red-500/20">
                                       <p className="text-xs text-red-400">Enter OTP sent to your email to confirm deletion.</p>
                                       <input 
                                         type="text" 
                                         placeholder="Enter OTP (1234)" 
                                         value={deleteOtp}
                                         onChange={(e) => setDeleteOtp(e.target.value)}
                                         className="w-full bg-white border border-red-500/30 rounded-lg p-2 text-sm text-[#03401b] focus:border-red-500 outline-none"
                                       />
                                       <div className="flex gap-2">
                                           <button 
                                             onClick={handleDeleteAccount}
                                             className="flex-1 bg-red-500 text-[#03401b] font-bold uppercase text-xs py-2 rounded-lg hover:bg-red-400"
                                           >
                                             Confirm Delete
                                           </button>
                                           <button 
                                             onClick={() => {
                                                 setDeleteAccountStep('initial');
                                                 setDeleteOtp('');
                                             }}
                                             className="px-4 bg-white text-[#03401b] font-bold uppercase text-xs py-2 rounded-lg hover:bg-zinc-700"
                                           >
                                             Cancel
                                           </button>
                                       </div>
                                   </div>
                               )}
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Address Modal */}
      <AnimatePresence>
        {showAddressModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-[#03401b]/10 p-8 rounded-3xl max-w-lg w-full relative"
            >
              <button 
                onClick={() => setShowAddressModal(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-[#03401b]"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-xl font-black uppercase tracking-tighter mb-6">{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
              
              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <div>
                   <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Receiver Name</label>
                   <input required name="receiverName" defaultValue={editingAddress?.receiverName} className="w-full bg-white border border-[#03401b]/10 rounded-xl p-3 text-sm focus:border-green-500 outline-none transition-colors" />
                </div>
                <div>
                   <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Flat / House No / Building</label>
                   <input required name="apartment" defaultValue={editingAddress?.apartment} className="w-full bg-white border border-[#03401b]/10 rounded-xl p-3 text-sm focus:border-green-500 outline-none transition-colors" />
                </div>
                <div>
                   <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Street / Colony / Area</label>
                   <input required name="roadName" defaultValue={editingAddress?.roadName} className="w-full bg-white border border-[#03401b]/10 rounded-xl p-3 text-sm focus:border-green-500 outline-none transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">City</label>
                     <input required name="city" defaultValue={editingAddress?.city} className="w-full bg-white border border-[#03401b]/10 rounded-xl p-3 text-sm focus:border-green-500 outline-none transition-colors" />
                  </div>
                  <div>
                     <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">State</label>
                     <select 
                        required 
                        name="state" 
                        defaultValue={editingAddress?.state} 
                        className="w-full bg-white border border-[#03401b]/10 rounded-xl p-3 text-sm focus:border-green-500 outline-none transition-colors appearance-none cursor-pointer"
                     >
                        <option value="" disabled>Select State</option>
                        {INDIAN_STATES.map(state => (
                           <option key={state} value={state}>{state}</option>
                        ))}
                     </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Pincode</label>
                     <input required name="pincode" defaultValue={editingAddress?.pincode} className="w-full bg-white border border-[#03401b]/10 rounded-xl p-3 text-sm focus:border-green-500 outline-none transition-colors" />
                  </div>
                  {/* Phone number comes from OTP-verified login; remove phone field from address form */}
                </div>

                <div className="flex items-center gap-3 bg-[#FAF9F6] p-3 rounded-xl border border-[#03401b]/10">
                    <input type="checkbox" name="isDefault" id="isDefault" defaultChecked={editingAddress?.isDefault} className="w-4 h-4 rounded bg-white border-[#03401b]/10 text-green-500 focus:ring-green-500 accent-green-500" />
                    <label htmlFor="isDefault" className="text-xs font-bold uppercase tracking-wider text-zinc-600 cursor-pointer">Set as Default Address</label>
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full bg-white text-[#03401b] font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-green-500 transition-colors">
                    {editingAddress ? 'Update Address' : 'Save Address'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-[#03401b]/10 p-8 rounded-3xl max-w-md w-full relative"
            >
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-[#03401b]"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogOut className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Terminate Session?</h3>
                <p className="text-zinc-500 text-sm">Select how you want to disconnect from the Soul Stich network.</p>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => handleLogout(false)}
                  className="w-full py-4 bg-white hover:bg-zinc-700 text-[#03401b] rounded-xl font-bold uppercase tracking-widest text-xs transition-colors"
                >
                  Logout Current Device
                </button>
                <button 
                  onClick={() => handleLogout(true)}
                  className="w-full py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-[#03401b] border border-red-500/20 hover:border-transparent rounded-xl font-bold uppercase tracking-widest text-xs transition-colors"
                >
                  Logout All Devices
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;
