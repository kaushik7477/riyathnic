
import React, { useState, useEffect, useMemo } from 'react';
import { 
  RefreshCw, Package, ArrowRight, Truck, CheckCircle, XCircle, 
  MapPin, Clock, Search, Filter, MoreVertical, Eye, Image as ImageIcon,
  Check, X, ChevronRight, AlertTriangle, Phone, Mail, User as UserIcon,
  CreditCard, Calendar, ShoppingBag, MapPinned, Info, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchOrders, updateOrder, fetchUsers, fetchProducts, socket, mapOrder } from '../../src/api';
import { Order, User, Product, OrderStatus } from '../../types';

const AdminExchanges: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [notes, setNotes] = useState<{[key: string]: string}>({});
  
  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [modalNotes, setModalNotes] = useState('');

  useEffect(() => {
    loadData();

    socket.on('exchange_request_submitted', ({ orderId, exchangeRequest }: any) => {
      console.log("Exchange request submitted socket event:", orderId, exchangeRequest);
      setOrders(prev => {
        const exists = prev.find(o => (o.id === orderId || (o as any)._id === orderId));
        if (exists) {
          return prev.map(o => (o.id === orderId || (o as any)._id === orderId) ? { ...o, exchangeRequest } : o);
        }
        // Silent reload to get the full order object without showing loading spinner
        fetchOrders().then(o => {
          setOrders(o);
        });
        return prev;
      });
    });

    socket.on('order_updated', (updatedOrder: any) => {
      const mapped = mapOrder(updatedOrder);
      const mId = mapped.id || mapped._id;
      if (!mId) return;

      setOrders(prev => {
        const filtered = prev.filter(o => o.id !== mId && (o as any)._id !== mId);
        
        // Only add if it's an exchange-related order
        const isExchange = mapped.status?.startsWith('exchange-') || mapped.status === 'exchanged' || mapped.exchangeRequest || mapped.exchangeData;
        if (isExchange) {
          return [mapped, ...filtered];
        }
        return filtered;
      });
    });

    return () => {
      socket.off('exchange_request_submitted');
      socket.off('order_updated');
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [o, u, p] = await Promise.all([fetchOrders(), fetchUsers(), fetchProducts()]);
      
      // Filter out duplicates from API response
      const uniqueOrders = o.reduce((acc: Order[], current: Order) => {
        const x = acc.find(item => (item.id === current.id || (item as any)._id === (current as any)._id));
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, []);

      setOrders(uniqueOrders);
      setUsers(u);
      setProducts(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exchangeRequests = useMemo(() => {
    return orders.filter(o => {
      // Try to get exchange info from various fields
      let exchange = o.exchangeRequest || (o as any).exchange_request;
      
      // Fallback: Try to parse stringified exchangeData
      if (!exchange && o.exchangeData) {
        try {
          exchange = JSON.parse(o.exchangeData);
        } catch (e) {
          console.error("Failed to parse exchangeData", e);
        }
      }

      const isExchangeStatus = o.status?.startsWith('exchange-') || o.status === 'exchanged';
      
      if (!isExchangeStatus && !exchange) return false;
      
      const user = users.find(u => (u.id || (u as any)._id) === o.userId);
      const matchesSearch = (o.id || (o as any)._id || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (user?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const currentExchangeStatus = exchange?.status || (o.status === 'exchanged' ? 'exchanged' : o.status.replace('exchange-', ''));
      const matchesStatus = statusFilter === 'all' || currentExchangeStatus === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter, users]);

  const handleExchangeAction = async (orderId: string, action: 'approved' | 'rejected' | 'picked-up' | 'in-transit' | 'exchanged', adminNotes?: string) => {
    try {
      const order = orders.find(o => (o.id === orderId || (o as any)._id === orderId));
      if (!order) {
        console.error("Order not found:", orderId);
        return;
      }

      // Get current exchange info
      let currentExchange = order.exchangeRequest || (order as any).exchange_request;
      if (!currentExchange && order.exchangeData) {
        try {
          currentExchange = JSON.parse(order.exchangeData);
        } catch (e) {}
      }

      const updatedExchangeRequest = {
        ...(currentExchange || {}),
        status: action,
        adminNotes: adminNotes || currentExchange?.adminNotes || ''
      };

      // Determine the new order status
      let newOrderStatus: OrderStatus = `exchange-${action}` as any;
      if (action === 'exchanged') {
        newOrderStatus = 'exchanged';
      }

      const updatePayload = {
        status: newOrderStatus,
        exchangeRequest: updatedExchangeRequest,
        exchangeData: JSON.stringify(updatedExchangeRequest)
      };
      
      const apiOrderId = (order as any)._id || order.id;

      console.log(`Updating exchange action: ${action} for order ${apiOrderId}`);
      const updatedOrderFromServer = await updateOrder(apiOrderId, updatePayload);
      
      // Emit socket event with full mapped order
      socket.emit('order_updated', mapOrder(updatedOrderFromServer));
      
      // Update local state immediately
      setOrders(prev => {
        const mapped = mapOrder(updatedOrderFromServer);
        const filtered = prev.filter(o => o.id !== mapped.id && (o as any)._id !== mapped.id);
        return [mapped, ...filtered];
      });

      alert(`Exchange request ${action} successfully!`);
      if (showDetailsModal) setShowDetailsModal(false);
    } catch (err) {
      console.error("Exchange action error:", err);
      alert("Failed to update exchange request.");
    }
  };

  const handleBookPickup = async (orderId: string) => {
    if (!confirm("Book Shiprocket pickup for this exchange?")) return;
    
    try {
      const pickupTrackingId = `PU-${Math.floor(Math.random() * 1000000)}`;
      const order = orders.find(o => (o.id === orderId || (o as any)._id === orderId));
      if (!order) return;

      let currentExchange = order.exchangeRequest || (order as any).exchange_request;
      if (!currentExchange && order.exchangeData) {
        try {
          currentExchange = JSON.parse(order.exchangeData);
        } catch (e) {}
      }

      const updatedExchangeRequest = { 
        ...(currentExchange || {}), 
        status: 'picked-up' as const,
        pickupTrackingId 
      };

      const updatePayload = {
        status: 'exchange-picked-up' as OrderStatus,
        exchangeRequest: updatedExchangeRequest,
        exchangeData: JSON.stringify(updatedExchangeRequest)
      };
      
      const apiOrderId = (order as any)._id || order.id;

      const updatedOrderFromServer = await updateOrder(apiOrderId, updatePayload);
      socket.emit('order_updated', mapOrder(updatedOrderFromServer));
      
      // Update local state immediately
      setOrders(prev => {
        const mapped = mapOrder(updatedOrderFromServer);
        const filtered = prev.filter(o => o.id !== mapped.id && (o as any)._id !== mapped.id);
        return [mapped, ...filtered];
      });

      alert(`Pickup booked! Tracking ID: ${pickupTrackingId}`);
    } catch (err) {
      console.error("Pickup booking error:", err);
      alert("Failed to book pickup");
    }
  };

  if (loading) return <div className="p-10 text-center text-purple-500 animate-pulse">Scanning Exchange Channels...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Exchange Command</h1>
          <p className="text-zinc-500 text-sm font-medium">Manage returns, replacements, and swaps</p>
        </div>

        <div className="flex items-center space-x-4 bg-zinc-900 border border-white/5 p-2 rounded-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search Orders..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-black border border-white/5 pl-12 pr-4 py-2 rounded-xl text-xs focus:border-purple-500 transition-all w-64"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black border border-white/5 px-4 py-2 rounded-xl text-xs focus:border-purple-500 transition-all outline-none text-zinc-400"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="picked-up">Picked Up</option>
            <option value="in-transit">In Transit</option>
            <option value="exchanged">Exchanged</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {exchangeRequests.map(order => {
          const user = users.find(u => (u.id || (u as any)._id) === order.userId);
          const exchange = order.exchangeRequest || (order as any).exchange_request || {};
          const currentExchangeStatus = exchange?.status || (order.status === 'exchanged' ? 'exchanged' : order.status.replace('exchange-', ''));
          const orderId = order.id || (order as any)._id;
          const newProduct = exchange?.newProductId ? products.find(p => (p.id === exchange.newProductId || (p as any)._id === exchange.newProductId)) : null;

          return (
            <div 
              key={orderId} 
              onClick={() => {
                setSelectedOrder(order);
                setModalNotes(notes[orderId] || '');
                setShowDetailsModal(true);
              }}
              className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden hover:border-purple-500/20 transition-all cursor-pointer group"
            >
              <div className="p-6 flex flex-col md:flex-row gap-8">
                {/* Left: Request Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Order #{(orderId || '').slice(-6)}</span>
                      <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">{user?.name}</h3>
                      <p className="text-xs text-zinc-500">{new Date(exchange?.requestedAt || order.createdAt).toLocaleDateString()} at {new Date(exchange?.requestedAt || order.createdAt).toLocaleTimeString()}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        currentExchangeStatus === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                        currentExchangeStatus === 'approved' ? 'bg-green-500/10 text-green-500' :
                        currentExchangeStatus === 'rejected' ? 'bg-red-500/10 text-red-500' :
                        currentExchangeStatus === 'exchanged' ? 'bg-green-600/20 text-green-400' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {currentExchangeStatus || 'pending'}
                      </span>
                      <Eye className="w-4 h-4 text-zinc-600 group-hover:text-purple-500 transition-colors" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-black/20 p-4 rounded-xl">
                    <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Reason</p>
                      <p className="text-sm text-zinc-300">{exchange?.reason || 'No reason provided'}</p>
                    </div>
                    {exchange?.adminNotes && (
                      <div>
                        <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-1">Admin Notes</p>
                        <p className="text-sm text-zinc-300 italic">"{exchange.adminNotes}"</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {exchange?.photos?.map((photo: string, i: number) => (
                      <div key={i} className="w-20 h-20 rounded-lg overflow-hidden border border-white/10 group relative">
                        <img src={photo} className="w-full h-full object-cover" alt="Proof" />
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(photo, '_blank');
                          }}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <Eye className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Actions & Product */}
                <div className="w-full md:w-80 space-y-4">
                  {newProduct && (
                    <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Replacement Item</p>
                      <div className="flex items-center space-x-3">
                        <img src={newProduct?.images[0]} className="w-12 h-12 rounded-lg object-cover" alt="" />
                        <div>
                          <p className="text-sm font-bold text-white">{newProduct?.name}</p>
                          <p className="text-xs text-zinc-500">Size: <span className="text-white font-black">{exchange?.newSize}</span></p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!newProduct && exchange?.newSize && (
                    <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Replacement Size</p>
                      <p className="text-sm font-bold text-white">{exchange.newSize}</p>
                    </div>
                  )}

                  {(currentExchangeStatus === 'pending' || !currentExchangeStatus) && (
                    <div className="space-y-3">
                      <textarea 
                        placeholder="Add admin notes..."
                        value={notes[orderId] || ''}
                        onChange={(e) => setNotes(prev => ({ ...prev, [orderId]: e.target.value }))}
                        className="w-full bg-black border border-white/5 rounded-xl p-3 text-xs focus:border-purple-500 transition-all outline-none min-h-[80px]"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExchangeAction(orderId, 'approved', notes[orderId]);
                          }}
                          className="bg-green-500 hover:bg-green-400 text-black py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2"
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve</span>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExchangeAction(orderId, 'rejected', notes[orderId]);
                          }}
                          className="bg-red-500 hover:bg-red-400 text-black py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2"
                        >
                          <X className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {currentExchangeStatus === 'approved' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookPickup(orderId);
                      }}
                      className="w-full bg-purple-500 hover:bg-purple-400 text-black py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2"
                    >
                      <Truck className="w-4 h-4" />
                      <span>Book Shiprocket Pickup</span>
                    </button>
                  )}

                  {currentExchangeStatus === 'picked-up' && (
                    <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl space-y-2">
                      <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Pickup Booked</p>
                      <p className="text-xs text-zinc-300 font-mono">Tracking: {exchange.pickupTrackingId}</p>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExchangeAction(orderId, 'exchanged');
                        }}
                        className="w-full bg-white text-black py-2 mt-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all"
                      >
                        Mark as Exchanged
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {exchangeRequests.length === 0 && (
          <div className="text-center py-20 text-zinc-500 border border-dashed border-white/5 rounded-2xl">
            <RefreshCw className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <p className="text-sm">No exchange requests found.</p>
            <p className="text-[10px] mt-2 opacity-30 uppercase tracking-tighter">Total Orders in System: {orders.length}</p>
          </div>
        )}
      </div>

      {/* Detailed Exchange Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedOrder && (() => {
          const user = users.find(u => (u.id || (u as any)._id) === selectedOrder.userId);
          let exchange = selectedOrder.exchangeRequest || (selectedOrder as any).exchange_request;
          
          if (!exchange && selectedOrder.exchangeData) {
            try {
              exchange = typeof selectedOrder.exchangeData === 'string' 
                ? JSON.parse(selectedOrder.exchangeData) 
                : selectedOrder.exchangeData;
            } catch (e) {}
          }
          
          // Final fallback check for common missing fields
          if (exchange && !exchange.reason && (selectedOrder as any).exchange_reason) {
            exchange.reason = (selectedOrder as any).exchange_reason;
          }
          if (exchange && (!exchange.photos || exchange.photos.length === 0) && (selectedOrder as any).exchange_photos) {
            exchange.photos = (selectedOrder as any).exchange_photos;
          }
          
          // EXTRA FALLBACKS: If exchange object is still missing or has empty fields, try the payload directly
          const finalReason = exchange?.reason || (selectedOrder as any).reason || (selectedOrder as any).exchangeReason || (selectedOrder as any).exchange_reason || 'No reason provided';
          const finalPhotos = (exchange?.photos && exchange.photos.length > 0) ? exchange.photos : ((selectedOrder as any).photos || (selectedOrder as any).photoUrls || (selectedOrder as any).exchange_photos || []);
          const finalNewProductId = exchange?.newProductId || (selectedOrder as any).newProductId || (selectedOrder as any).exchange_product_id || (selectedOrder as any).new_product_id;
          const finalNewSize = exchange?.newSize || (selectedOrder as any).newSize || (selectedOrder as any).exchange_size || (selectedOrder as any).new_size || 'Not specified';
          
          if (!exchange) exchange = {};

          // Comprehensive address lookup
          const getFinalAddress = () => {
            if (exchange?.pickupAddress) {
              let a = exchange.pickupAddress as any;
              if (typeof a === 'string') {
                try { a = JSON.parse(a); } catch (e) {}
              }
              return a;
            }
            // 1. Check if order has a direct addressId and find it in user profile
            let addr = user?.addresses?.find(a => a.id === selectedOrder.addressId || (a as any)._id === selectedOrder.addressId);
            
            // 2. Check for direct address object in order
            if (!addr) addr = (selectedOrder as any).address || (selectedOrder as any).shippingAddress || (selectedOrder as any).shipping_address;
            
            // 3. Check for stringified address in order
            if (!addr && (selectedOrder as any).addressData) {
              try {
                addr = JSON.parse((selectedOrder as any).addressData);
              } catch (e) {}
            }

            // 4. Fallback to user's first address
            if (!addr && user?.addresses && user.addresses.length > 0) {
              addr = user.addresses[0];
            }

            // Parse if still a string
            if (typeof addr === 'string') {
              try {
                addr = JSON.parse(addr);
              } catch (e) {}
            }
            return addr;
          };

          const finalAddress = getFinalAddress();

          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDetailsModal(false)}
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
              />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-5xl bg-zinc-950 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                {/* Modal Header */}
                <div className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md border-b border-white/5 p-8 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Exchange Command Detail</h2>
                    <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest mt-1">Order #{(selectedOrder.id || (selectedOrder as any)._id || '').slice(-12)}</p>
                  </div>
                  <button 
                    onClick={() => setShowDetailsModal(false)}
                    className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl transition-all"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>

                <div className="p-8 space-y-12">
                  {/* 1. Reason & Photos Section */}
                  <section className="space-y-6">
                    <div className="flex items-center space-x-3 border-l-4 border-purple-500 pl-4">
                      <Info className="w-5 h-5 text-purple-500" />
                      <h3 className="text-sm font-black uppercase tracking-widest text-white">Reason & Verification</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-white/5 rounded-3xl p-6 space-y-3">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Customer Reason</p>
                        <p className="text-lg text-zinc-200 leading-relaxed font-medium italic">
                          "{finalReason}"
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Verification Photos</p>
                        <div className="flex flex-wrap gap-3">
                          {finalPhotos.map((photo: string, i: number) => (
                            <motion.div 
                              key={i} 
                              whileHover={{ scale: 1.05 }}
                              className="w-24 h-24 rounded-2xl overflow-hidden border border-white/10 cursor-zoom-in group relative"
                              onClick={() => window.open(photo, '_blank')}
                            >
                              <img src={photo} className="w-full h-full object-cover" alt="Proof" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Eye className="w-5 h-5 text-white" />
                              </div>
                            </motion.div>
                          ))}
                          {finalPhotos.length === 0 && (
                            <div className="w-full py-10 bg-black/20 rounded-2xl border border-dashed border-white/5 flex flex-col items-center justify-center text-zinc-600">
                              <ImageIcon className="w-8 h-8 mb-2 opacity-20" />
                              <p className="text-[10px] font-black uppercase tracking-widest">No Photos Uploaded</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 2. Product Swap Section */}
                  <section className="space-y-6">
                    <div className="flex items-center space-x-3 border-l-4 border-blue-500 pl-4">
                      <ShoppingBag className="w-5 h-5 text-blue-500" />
                      <h3 className="text-sm font-black uppercase tracking-widest text-white">Product Exchange</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Current Product */}
                      <div className="bg-black/40 border border-white/5 rounded-3xl p-6 flex items-center space-x-6">
                        <div className="w-20 h-28 bg-zinc-900 rounded-2xl overflow-hidden border border-white/5">
                          {selectedOrder.products[0] && products.find(p => (p.id === selectedOrder.products[0].productId || (p as any)._id === selectedOrder.products[0].productId))?.images[0] && (
                            <img src={products.find(p => (p.id === selectedOrder.products[0].productId || (p as any)._id === selectedOrder.products[0].productId))?.images[0]} className="w-full h-full object-cover" alt="" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Current Product</p>
                          <h4 className="text-lg font-bold text-white">{products.find(p => (p.id === selectedOrder.products[0].productId || (p as any)._id === selectedOrder.products[0].productId))?.name}</h4>
                          <p className="text-sm text-zinc-400">Size: <span className="text-white font-black">{selectedOrder.products[0].size}</span></p>
                        </div>
                      </div>

                      <div className="flex items-center justify-center">
                        <ArrowRight className="w-8 h-8 text-zinc-700 md:rotate-0 rotate-90" />
                      </div>

                      {/* New Product */}
                      <div className="bg-purple-500/5 border border-purple-500/10 rounded-3xl p-6 flex items-center space-x-6">
                        <div className="w-20 h-28 bg-zinc-900 rounded-2xl overflow-hidden border border-purple-500/20">
                          {(() => {
                            const sku = exchange?.exchangeProductSku || (selectedOrder as any).exchange_sku;
                            const byId = products.find(p => (p.id === finalNewProductId || (p as any)._id === finalNewProductId));
                            const req = byId || (sku ? products.find(p => p.sku === sku) : undefined);
                            const img = req?.images?.[0];
                            return img ? <img src={img} className="w-full h-full object-cover" alt="" /> : null;
                          })()}
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-1">Requested Exchange</p>
                          <h4 className="text-lg font-bold text-white">
                            {(() => {
                              const sku = exchange?.exchangeProductSku || (selectedOrder as any).exchange_sku;
                              const byId = products.find(p => (p.id === finalNewProductId || (p as any)._id === finalNewProductId));
                              const req = byId || (sku ? products.find(p => p.sku === sku) : undefined);
                              return req?.name || 'Same Product';
                            })()}
                          </h4>
                          <p className="text-sm text-zinc-400">Size: <span className="text-purple-400 font-black">{finalNewSize || 'Not specified'}</span></p>
                          <p className="text-[10px] text-zinc-500 font-mono">
                            SKU: {(() => {
                              const sku = exchange?.exchangeProductSku || (selectedOrder as any).exchange_sku;
                              const byId = products.find(p => (p.id === finalNewProductId || (p as any)._id === finalNewProductId));
                              return byId?.sku || sku || 'N/A';
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 3. Customer & Shipping Info */}
                  <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="flex items-center space-x-3 border-l-4 border-green-500 pl-4">
                        <UserIcon className="w-5 h-5 text-green-500" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-white">Customer Details</h3>
                      </div>
                      
                      <div className="bg-white/5 rounded-3xl p-6 space-y-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center">
                            <UserIcon className="w-6 h-6 text-green-500" />
                          </div>
                          <div>
                            <p className="text-lg font-bold text-white">{user?.name || 'Unknown Customer'}</p>
                            <p className="text-xs text-zinc-500 uppercase tracking-widest">Customer ID: {(user?.id || (user as any)._id || '').slice(-8)}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3 pt-4 border-t border-white/5">
                          <div className="flex items-center space-x-3 text-sm">
                            <Phone className="w-4 h-4 text-zinc-500" />
                            <span className="text-zinc-300">{user?.phone || 'No phone provided'}</span>
                          </div>
                          <div className="flex items-center space-x-3 text-sm">
                            <Mail className="w-4 h-4 text-zinc-500" />
                            <span className="text-zinc-300">{user?.email || 'No email provided'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center space-x-3 border-l-4 border-orange-500 pl-4">
                        <MapPinned className="w-5 h-5 text-orange-500" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-white">Pickup Address</h3>
                      </div>
                      
                      <div className="bg-white/5 rounded-3xl p-6">
                        {finalAddress ? (
                          <div className="space-y-4">
                            <div className="flex items-start space-x-4">
                              <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center shrink-0">
                                <MapPin className="w-5 h-5 text-orange-500" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-zinc-200 font-medium">
                                  {(finalAddress as any).apartment || (finalAddress as any).houseNo || (finalAddress as any).house || (finalAddress as any).addressLine1 || ''} 
                                  {(finalAddress as any).roadName || (finalAddress as any).street || (finalAddress as any).area || (finalAddress as any).addressLine2 || ''}
                                </p>
                                <p className="text-sm text-zinc-400">
                                  {finalAddress.city || ''}, {finalAddress.state || ''} - {(finalAddress as any).pincode || (finalAddress as any).zip || (finalAddress as any).postalCode || ''}
                                </p>
                                {(finalAddress.phone || user?.phone || (selectedOrder as any).phone) && (
                                  <p className="text-xs text-zinc-500 mt-2 font-mono">Contact: {finalAddress.phone || user?.phone || (selectedOrder as any).phone}</p>
                                )}
                              </div>
                            </div>
                            <div className="pt-4 border-t border-white/5">
                              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Company Delivery Hub</p>
                              <p className="text-xs text-zinc-400">Soul Web Logistics Center, New Delhi, India</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-6 text-zinc-500">
                            <AlertTriangle className="w-6 h-6 mb-2 opacity-20" />
                            <p className="text-xs italic">Address details not found in user profile or order.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* 4. Order & Payment Info */}
                  <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="flex items-center space-x-3 border-l-4 border-cyan-500 pl-4">
                        <Calendar className="w-5 h-5 text-cyan-500" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-white">Timeline & Order</h3>
                      </div>
                      
                      <div className="bg-white/5 rounded-3xl p-6 grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Ordered On</p>
                          <p className="text-sm text-zinc-200 font-medium">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{new Date(selectedOrder.createdAt).toLocaleTimeString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Exchange Requested</p>
                          <p className="text-sm text-zinc-200 font-medium">{new Date(exchange.requestedAt || selectedOrder.createdAt).toLocaleDateString()}</p>
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{new Date(exchange.requestedAt || selectedOrder.createdAt).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center space-x-3 border-l-4 border-yellow-500 pl-4">
                        <CreditCard className="w-5 h-5 text-yellow-500" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-white">Payment Status</h3>
                      </div>
                      
                      <div className="bg-white/5 rounded-3xl p-6 grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Amount</p>
                          <p className="text-xl font-black text-white">₹{selectedOrder.totalAmount}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Method</p>
                          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mt-1 ${
                            selectedOrder.paymentStatus === 'paid' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'
                          }`}>
                            {selectedOrder.paymentStatus === 'paid' ? 'Online / Paid' : 'Cash on Delivery'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 5. Admin Actions Section */}
                  <section className="bg-zinc-900 rounded-[2rem] p-8 border border-white/5 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <ShieldCheck className="w-5 h-5 text-purple-500" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-white">Command Control</h3>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                        exchange.status === 'pending' ? 'bg-yellow-500 text-black' :
                        exchange.status === 'approved' ? 'bg-green-500 text-black' :
                        exchange.status === 'rejected' ? 'bg-red-500 text-black' :
                        'bg-purple-500 text-white'
                      }`}>
                        Current Status: {exchange.status || 'Pending'}
                      </span>
                    </div>

                    {exchange.status === 'pending' && (
                      <div className="space-y-6">
                        <textarea 
                          placeholder="Type admin decision notes here..."
                          value={modalNotes}
                          onChange={(e) => setModalNotes(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-2xl p-6 text-sm text-white focus:border-purple-500 transition-all outline-none min-h-[120px] placeholder:text-zinc-700"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <button 
                            onClick={() => handleExchangeAction(selectedOrder.id || (selectedOrder as any)._id, 'approved', modalNotes)}
                            className="group bg-green-500 hover:bg-green-400 text-black py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center space-x-3"
                          >
                            <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span>Approve Protocol</span>
                          </button>
                          <button 
                            onClick={() => handleExchangeAction(selectedOrder.id || (selectedOrder as any)._id, 'rejected', modalNotes)}
                            className="group bg-red-500 hover:bg-red-400 text-black py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center space-x-3"
                          >
                            <XCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span>Reject Request</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {exchange.status === 'approved' && (
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-3xl p-8 text-center space-y-6">
                        <div className="space-y-2">
                          <p className="text-purple-400 font-black uppercase tracking-widest text-xs">Request Approved</p>
                          <p className="text-zinc-500 text-sm">Waiting for logistics initialization</p>
                        </div>
                        <button 
                          onClick={() => handleBookPickup(selectedOrder.id || (selectedOrder as any)._id)}
                          className="group w-full max-w-md mx-auto bg-purple-500 hover:bg-purple-400 text-black py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm transition-all flex items-center justify-center space-x-4 shadow-xl shadow-purple-500/20"
                        >
                          <Truck className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                          <span>Book Shiprocket Pickup</span>
                        </button>
                      </div>
                    )}

                    {exchange.status === 'picked-up' && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-8 text-center space-y-6">
                        <div className="space-y-2">
                          <p className="text-blue-400 font-black uppercase tracking-widest text-xs">Logistics in Progress</p>
                          <p className="text-zinc-300 font-mono text-lg">TRACKING: {exchange.pickupTrackingId}</p>
                        </div>
                        <button 
                          onClick={() => handleExchangeAction(selectedOrder.id || (selectedOrder as any)._id, 'exchanged')}
                          className="group w-full max-w-md mx-auto bg-white text-black py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm transition-all flex items-center justify-center space-x-4"
                        >
                          <Check className="w-6 h-6 group-hover:scale-110 transition-transform" />
                          <span>Finalize Exchange Complete</span>
                        </button>
                      </div>
                    )}

                    {exchange.status === 'exchanged' && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-3xl p-8 text-center">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Check className="w-8 h-8 text-black" />
                        </div>
                        <p className="text-green-500 font-black uppercase tracking-widest text-sm">Exchange Cycle Complete</p>
                      </div>
                    )}
                  </section>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};

export default AdminExchanges;
