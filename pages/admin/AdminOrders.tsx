import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, Eye, Truck, CheckCircle, XCircle, AlertTriangle, 
  MapPin, CreditCard, RefreshCw, Package, ArrowRight, Printer, FileText,
  MoreVertical, ShieldAlert, Activity, DollarSign, Calendar, Image as ImageIcon,
  Check, X, ChevronRight, Box, Lock
} from 'lucide-react';
import { fetchOrders, updateOrder, fetchUsers, fetchProducts, socket, uploadImage, mapOrder, bookShiprocket } from '../../src/api';
import { Order, User, Product, OrderStatus } from '../../types';
import { downloadInvoice } from '@/src/utils/pdfGenerator';

// --- Types ---
type Tab = 'radar' | 'kanban' | 'list' | 'billing';

// --- Helpers ---
const validatePincode = async (pincode: string): Promise<boolean> => {
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await res.json();
    return data[0].Status === 'Success';
  } catch (e) {
    return false;
  }
};

const getFraudScore = (order: Order): { score: number, reasons: string[] } => {
  let score = 0;
  const reasons = [];
  
  // High quantity
  const totalQty = order.products.reduce((acc, p) => acc + p.quantity, 0);
  if (totalQty > 5) {
    score += 30;
    reasons.push('High Quantity (>5)');
  }

  // High Value COD
  if (order.totalAmount > 5000 && order.paymentStatus === 'unpaid') {
    score += 40;
    reasons.push('High Value COD (>₹5000)');
  }

  return { score, reasons };
};

// --- Components ---

const StatusBadge = ({ status }: { status: string }) => {
  const colors: {[key: string]: string} = {
    pending: 'bg-yellow-500/10 text-yellow-500',
    processing: 'bg-blue-500/10 text-blue-500',
    shipped: 'bg-purple-500/10 text-purple-500',
    delivered: 'bg-green-500/10 text-green-500',
    cancelled: 'bg-red-500/10 text-red-500',
    returned: 'bg-orange-500/10 text-orange-500',
    'exchange-pending': 'bg-yellow-500/10 text-yellow-500',
    'exchange-approved': 'bg-blue-500/10 text-blue-500',
    'exchange-rejected': 'bg-red-500/10 text-red-500',
    'exchange-picked-up': 'bg-indigo-500/10 text-indigo-500',
    'exchange-in-transit': 'bg-cyan-500/10 text-cyan-500',
    exchanged: 'bg-green-500/10 text-green-500'
  };
  return (
    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${colors[status] || 'bg-zinc-800 text-zinc-400'}`}>
      {status}
    </span>
  );
};

const getOrderAddress = (order: Order, user?: User) => {
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

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('kanban');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [logisticsData, setLogisticsData] = useState({
    packageSize: 'small' as 'small' | 'medium' | 'large',
    packageWeight: 1,
  });
  const [addressErrors, setAddressErrors] = useState<{[key: string]: boolean}>({});
  const [modalSource, setModalSource] = useState<'kanban' | 'all' | null>(null);
  const [shiprocketLabels, setShiprocketLabels] = useState<{[key: string]: string}>({});
  
  // Billing Selection
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();

    // Socket listeners for real-time updates
    socket.on('order_created', (newOrder: any) => {
      const mapped = mapOrder(newOrder);
      const mId = mapped.id || mapped._id;
      if (!mId) return;

      setOrders(prev => {
        // Remove existing version(s) of this order and add the new one
        const filtered = prev.filter(o => o.id !== mId && (o as any)._id !== mId);
        return [mapped, ...filtered];
      });
    });

    socket.on('order_updated', (updatedOrder: any) => {
      const mapped = mapOrder(updatedOrder);
      const mId = mapped.id || mapped._id;
      if (!mId) return;

      setOrders(prev => {
        // Remove existing version(s) of this order and add the new one
        const filtered = prev.filter(o => o.id !== mId && (o as any)._id !== mId);
        return [mapped, ...filtered];
      });
    });

    socket.on('product_updated', (updatedProduct: any) => {
      const mapped = { ...updatedProduct, id: updatedProduct._id };
      setProducts(prev => prev.map(p => (p._id === mapped._id || p.id === mapped.id) ? mapped : p));
    });

    socket.on('exchange_request_submitted', ({ orderId, exchangeRequest }: any) => {
      console.log("Exchange request received:", orderId, exchangeRequest);
      setOrders(prev => {
        // Check if the order exists in our current state
        const exists = prev.find(o => (o.id === orderId || (o as any)._id === orderId));
        if (exists) {
          // If it exists, update it in place to avoid duplicate keys
          return prev.map(o => {
            const oId = o.id || (o as any)._id;
            if (oId === orderId) {
              return { ...o, exchangeRequest };
            }
            return o;
          });
        }
        // If it doesn't exist, we don't add it here because we don't have the full order object.
        // The 'order_updated' event will handle adding it if it's new to this view.
        return prev;
      });
    });

    return () => {
      socket.off('order_created');
      socket.off('order_updated');
      socket.off('product_updated');
      socket.off('exchange_request_submitted');
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [o, u, p] = await Promise.all([fetchOrders(), fetchUsers(), fetchProducts()]);
      setOrders(o);
      setUsers(u);
      setProducts(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    if (!orderId) {
      alert("Error: Order ID is missing");
      console.error("handleStatusChange: orderId is undefined");
      return;
    }

    const orderIdStr = String(orderId);

    // Optimistic update
    setOrders(prev => {
      return prev.map(o => {
        const oId = String(o.id || (o as any)._id || '');
        if (oId === orderIdStr) {
          return { ...o, status: newStatus };
        }
        return o;
      });
    });

    try {
      console.log(`Sending update request for order ${orderId} with status ${newStatus}`);
      const updatedOrder = await updateOrder(orderId, { status: newStatus });
      console.log("Update successful");
      
      // Ensure the state is in sync with server response
      const mapped = mapOrder(updatedOrder);
      const mId = mapped.id || mapped._id;
      
      setOrders(prev => {
        // Remove existing version(s) of this order and add the new one
        const filtered = prev.filter(o => o.id !== mId && (o as any)._id !== mId);
        return [mapped, ...filtered];
      });
    } catch (err) {
      console.error("Failed to update status on server:", err);
      alert("Failed to update status on server. Reverting changes.");
      loadData();
    }
  };

  const handlePincodeCheck = async (order: Order) => {
    const orderId = order.id || (order as any)._id;
    const user = users.find(u => (u.id || (u as any)._id) === order.userId);
    const addr: any = getOrderAddress(order, user);
    if (!addr) return;
    
    const isValid = await validatePincode(addr.pincode);
    setAddressErrors(prev => ({ ...prev, [orderId]: !isValid }));
  };

  const generateInvoice = async (order: Order) => {
    const user = users.find(u => (u.id || (u as any)._id) === order.userId);
    if (!user) {
      alert("Customer details not found.");
      return;
    }
    await downloadInvoice(order, user, products);
  };

  const handleBookShiprocket = async (orderIds: string[]) => {
    if (orderIds.length === 0) {
        alert('No orders selected');
        return;
    }
    if (!confirm(`Book ${orderIds.length} orders on Shiprocket?`)) return;
    
    setLoading(true);
    try {
        let successCount = 0;
        let failCount = 0;
        const bookings = orderIds.map(async id => {
          try {
            const res = await bookShiprocket(id);
            const mapped = mapOrder(res.order || {});
            const mId = mapped.id || mapped._id || id;
            if (res.labelUrl) {
              setShiprocketLabels(prev => ({ ...prev, [mId]: res.labelUrl }));
            }
            setOrders(prev => {
              const filtered = prev.filter(o => o.id !== mId && (o as any)._id !== mId);
              return [mapped, ...filtered];
            });
            setSelectedOrder(prev => {
              if (!prev) return prev;
              const prevId = (prev as any).id || (prev as any)._id;
              if (prevId === mId) {
                return mapped as Order;
              }
              return prev;
            });
            successCount++;
            if (res.warning) {
              const w = res.warning;
              const wMsg = typeof w === 'string'
                ? w
                : (w.error || w.message || JSON.stringify(w));
              alert(`Shiprocket booked with warning: ${wMsg}`);
            }
          } catch (err: any) {
            const msg = err?.response?.data?.error || err?.message || 'Booking failed';
            alert(`Shiprocket booking failed: ${msg}`);
            failCount++;
          }
        });
        await Promise.all(bookings);
        if (successCount > 0 && failCount === 0) {
          alert(`Shiprocket booking successful for ${successCount} order(s).`);
        } else if (successCount > 0 && failCount > 0) {
          alert(`Shiprocket booking finished: ${successCount} success, ${failCount} failed. Check alerts for details.`);
        } else {
          alert(`Shiprocket booking failed for all selected orders. Check previous alerts for details.`);
        }
        setSelectedOrderIds([]); // Clear selection
    } catch (e) {
        alert('Failed to book orders');
        console.error("Shiprocket booking error:", e);
    } finally {
        setLoading(false);
    }
  };

  const handleSizeSwap = async (orderId: string) => {
    if (!orderId) {
        console.error("handleSizeSwap: orderId is undefined");
        return;
    }
    if (confirm('Initiate Size Swap? This will mark the current order as Returned and generate a return label.')) {
        try {
            console.log("Initiating size swap for order:", orderId);
            await updateOrder(orderId, { status: 'returned' });
            await loadData();
            alert('Return initiated. Please use the "Exchanges" section to manage the replacement if a request was submitted.');
            setSelectedOrder(null);
        } catch (e) {
            alert('Failed to update order');
            console.error("Size swap error:", e);
        }
    }
  };

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return orders;
    return orders.filter(o => {
      const idStr = (o.id || (o as any)._id || '').toLowerCase();
      const user = users.find(u => (u.id || (u as any)._id) === o.userId);
      const name = (user?.name || '').toLowerCase();
      const phone = (user?.phone || '').toLowerCase();
      const skuList = o.products.map(p => {
        const prod = products.find(pr => (pr.id || (pr as any)._id) === p.productId);
        return (prod?.sku || '').toLowerCase();
      });
      return idStr.includes(term) || name.includes(term) || phone.includes(term) || skuList.some(s => s.includes(term));
    });
  }, [orders, users, products, searchTerm]);

  const handleProcessOrder = async () => {
    if (!selectedOrder) return;
    
    try {
      const config = JSON.parse(localStorage.getItem('finance_config') || '{}');
      const packagingCost = config.packagingCosts?.[logisticsData.packageSize] || 0;
      const shippingCost = (config.shippingBaseRate || 0) * logisticsData.packageWeight;
      
      const orderId = selectedOrder.id || (selectedOrder as any)._id;
      const updatedOrder = await updateOrder(orderId, {
        status: 'processing',
        // @ts-ignore
        logistics: {
          ...logisticsData,
          packagingCost,
          shippingCost
        }
      });
      
      const mapped = mapOrder(updatedOrder);
      const mId = mapped.id || mapped._id;
      
      setOrders(prev => {
        // Remove existing version(s) of this order and add the new one
        const filtered = prev.filter(o => o.id !== mId && (o as any)._id !== mId);
        return [mapped, ...filtered];
      });
      setShowProcessModal(false);
      setSelectedOrder(null);
    } catch (err) {
      console.error('Processing failed:', err);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    const orderId = selectedOrder.id || (selectedOrder as any)._id;
    const refundId = prompt('Enter Refund ID/reference (from payment gateway):');
    if (refundId === null) return;
    try {
      const updatedOrder = await updateOrder(orderId, { 
        status: 'cancelled', 
        refundDetails: { refundId, amount: selectedOrder.totalAmount }
      });
      const mapped = mapOrder(updatedOrder);
      const mId = mapped.id || mapped._id;
      setOrders(prev => {
        const filtered = prev.filter(o => o.id !== mId && (o as any)._id !== mId);
        return [mapped, ...filtered];
      });
      setSelectedOrder(null);
    } catch (err) {
      alert('Failed to cancel order');
      console.error('Cancel failed:', err);
    }
  };
  const handleBulkAction = (action: 'print_label' | 'invoice' | 'shiprocket') => {
    if (selectedOrderIds.length === 0) return;

    if (action === 'invoice') {
        const ordersToPrint = orders.filter(o => selectedOrderIds.includes(o.id || (o as any)._id));
        ordersToPrint.forEach(o => generateInvoice(o));
    } else if (action === 'shiprocket') {
        handleBookShiprocket(selectedOrderIds);
    } else if (action === 'print_label') {
        alert(`Labels sent to printer for ${selectedOrderIds.length} orders.`);
    }
  };

  // --- Views ---

  const ProblemRadar = () => {
    const problematicOrders = orders.filter(o => {
        const orderId = o.id || (o as any)._id;
        const fraud = getFraudScore(o);
        const isAddressError = addressErrors[orderId];
        const isPaymentIssue = o.paymentStatus === 'unpaid' && o.status !== 'cancelled' && o.status !== 'returned' && o.status !== 'delivered'; // Basic COD check or failed
        // In real app, 'failed' payment status would be distinct from 'unpaid' (COD)
        return fraud.score > 0 || isAddressError || (isPaymentIssue && o.status === 'pending');
    });

    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="flex items-center space-x-3 text-red-500 mb-6">
            <Activity className="w-6 h-6 animate-pulse" />
            <h2 className="text-lg font-black uppercase tracking-widest">Problem Radar - Critical Attention Needed</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {problematicOrders.map(order => {
                const fraud = getFraudScore(order);
                const user = users.find(u => (u.id || (u as any)._id) === order.userId);
                const orderId = order.id || (order as any)._id;
                return (
                    <div key={orderId} className="bg-red-500/5 border border-red-500/20 p-6 rounded-2xl relative overflow-hidden hover:border-red-500/40 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <span className="font-mono text-xs text-red-400">{(order as any).orderCode || ('#' + (order.id || (order as any)._id || '').slice(-6))}</span>
                            <StatusBadge status={order.status} />
                        </div>
                        
                        <div className="space-y-3 mb-4">
                            {fraud.score > 0 && (
                                <div className="flex items-start space-x-2 text-red-400">
                                    <ShieldAlert className="w-4 h-4 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold uppercase">Fraud Risk: {fraud.score}</p>
                                        <p className="text-[10px] opacity-75">{fraud.reasons.join(', ')}</p>
                                    </div>
                                </div>
                            )}
                            
                            {addressErrors[orderId] && (
                                <div className="flex items-start space-x-2 text-orange-400">
                                    <MapPin className="w-4 h-4 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold uppercase">Invalid Pincode</p>
                                        <p className="text-[10px] opacity-75">RTO Risk High</p>
                                    </div>
                                </div>
                            )}

                             {order.paymentStatus === 'unpaid' && order.status === 'pending' && (
                                <div className="flex items-start space-x-2 text-yellow-400">
                                    <CreditCard className="w-4 h-4 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold uppercase">Payment Pending / COD</p>
                                        <p className="text-[10px] opacity-75">Verify before shipping</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-red-500/10">
                            <div className="text-xs text-zinc-400">
                                <p className="font-bold text-white">{user?.name || 'Unknown'}</p>
                                <p>₹{order.totalAmount}</p>
                            </div>
                            <button 
                                onClick={() => handlePincodeCheck(order)}
                                className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-1 rounded-lg font-bold uppercase transition-colors"
                            >
                                Validate Addr
                            </button>
                        </div>
                    </div>
                );
            })}
             {problematicOrders.length === 0 && (
                <div className="col-span-full text-center py-20 text-zinc-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500/20" />
                    <p>All systems normal. No critical issues detected.</p>
                </div>
            )}
        </div>
      </div>
    );
  };

  const KanbanBoard = () => {
    const columns = ['pending', 'processing', 'shipped', 'delivered', 'exchange'] as const;
    
    return (
      <div className="flex overflow-x-auto gap-6 pb-6 h-[calc(100vh-250px)]">
        {columns.map(status => (
            <div key={status} className="min-w-[300px] bg-zinc-900/30 border border-white/5 rounded-2xl flex flex-col">
                <div className="p-4 border-b border-white/5 flex justify-between items-center sticky top-0 bg-zinc-900/95 backdrop-blur-sm z-10 rounded-t-2xl">
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">{status}</h3>
                    <span className="bg-zinc-800 text-zinc-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {status === 'exchange' 
                          ? orders.filter(o => (o.status?.startsWith('exchange') || o.status === 'exchanged' || (o as any).exchangeRequest || (o as any).exchangeData)).length
                          : orders.filter(o => o.status === status).length}
                    </span>
                </div>
                
                <div className="p-4 space-y-4 overflow-y-auto flex-grow custom-scrollbar">
                    {(status === 'exchange' 
                        ? orders.filter(o => (o.status?.startsWith('exchange') || o.status === 'exchanged' || (o as any).exchangeRequest || (o as any).exchangeData))
                        : orders.filter(o => o.status === status)
                      ).map(order => {
                         const user = users.find(u => (u.id || (u as any)._id) === order.userId);
                         const orderId = order.id || (order as any)._id;
                         return (
                            <div 
                                key={orderId} 
                                className="bg-black/40 border border-white/5 p-4 rounded-xl hover:border-white/20 transition-all cursor-pointer group"
                                onClick={() => { setSelectedOrder(order); setModalSource('kanban'); }}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-mono text-[10px] text-zinc-500">{(order as any).orderCode || ('#' + (order.id || (order as any)._id || '').slice(-6))}</span>
                                    <span className="text-[10px] font-bold text-white">₹{order.totalAmount}</span>
                                </div>
                                <p className="text-sm font-bold text-white mb-1">{user?.name || 'Unknown'}</p>
                                <p className="text-[10px] text-zinc-500 mb-3">{new Date(order.createdAt).toLocaleDateString()}</p>
                                
                                {status === 'exchange' && (
                                  <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3 text-[11px] space-y-1">
                                    <p className="font-bold text-yellow-500">Exchange</p>
                                    <p className="text-zinc-300">
                                      {(() => {
                                        const ex = (order as any).exchangeRequest || ((order as any).exchangeData ? JSON.parse((order as any).exchangeData) : null);
                                        if (!ex) return 'No details';
                                        const prod = products.find(pr => (pr.id || (pr as any)._id) === (ex.newProductId || order.products[0]?.productId));
                                        const name = prod?.name || 'Unknown';
                                        const size = ex.newSize || order.products[0]?.size;
                                        return `${name} • Size: ${size}`;
                                      })()}
                                    </p>
                                    <p className="text-zinc-500">Status: {order.status.replace('exchange-', '') || 'pending'}</p>
                                  </div>
                                )}
                                
                                {/* Quick Actions */}
                                 <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                     {status === 'pending' && (
                                         <button 
                                             onClick={(e) => { 
                                                 e.stopPropagation(); 
                                                 setSelectedOrder(order);
                                                 setShowProcessModal(true);
                                             }}
                                             className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 py-1 rounded text-[10px] font-bold uppercase"
                                         >
                                             Process
                                         </button>
                                     )}
                                    {status === 'processing' && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleStatusChange(orderId, 'shipped'); }}
                                            className="flex-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 py-1 rounded text-[10px] font-bold uppercase"
                                        >
                                            Ship
                                        </button>
                                    )}
                                     {status === 'shipped' && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleStatusChange(orderId, 'delivered'); }}
                                            className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-500 py-1 rounded text-[10px] font-bold uppercase"
                                        >
                                            Deliver
                                        </button>
                                    )}
                                </div>
                            </div>
                         );
                    })}
                </div>
            </div>
        ))}
      </div>
    );
  };

  const AllOrdersSection = () => {
    return (
      <div className="space-y-6 mt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 border-l-2 border-green-500 pl-4">All Orders</h3>
          <div className="flex items-center gap-2 bg-zinc-900 border border-white/10 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-zinc-500" />
            <input 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by ID, name, phone, SKU..."
              className="bg-transparent text-sm text-white outline-none w-64"
            />
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-800/50 text-[10px] font-black uppercase tracking-widest text-zinc-500">
              <tr>
                <th className="p-4 w-10"></th>
                <th className="p-4">Citizen</th>
                <th className="p-4">Recent Item</th>
                <th className="p-4">Contact & Address</th>
                <th className="p-4">Activity</th>
                <th className="p-4">Revenue</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrders.map(order => {
                const user = users.find(u => (u.id || (u as any)._id) === order.userId);
                const orderId = order.id || (order as any)._id;
                const first = order.products[0];
                const prod = products.find(p => (p.id || (p as any)._id) === first?.productId);
                const userOrderCount = orders.filter(o => o.userId === order.userId).length;
                return (
                  <tr key={orderId} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => { setSelectedOrder(order); setModalSource('all'); }}>
                    <td className="p-4 font-mono text-[10px] text-zinc-500">{(order as any).orderCode || ('#' + (orderId || '').slice(-8))}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                          {(user?.name || 'U').slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{user?.name || 'Unknown'}</p>
                          <p className="text-[10px] text-zinc-500">Joined {new Date(user?.createdAt || order.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {prod?.images?.[0] && <img src={prod.images[0]} className="w-10 h-10 rounded-lg object-cover" alt="" />}
                        <div>
                          <p className="text-xs font-bold text-white">{prod?.name || 'Unknown'}</p>
                          <p className="text-[10px] text-zinc-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-zinc-300">
                      <p>{user?.email || 'N/A'}</p>
                      <p>+91 {user?.phone || 'N/A'}</p>
                      <p>
                        {user?.addresses.find(a => (a.id || (a as any)._id) === order.addressId)?.apartment}, {user?.addresses.find(a => (a.id || (a as any)._id) === order.addressId)?.roadName}, {user?.addresses.find(a => (a.id || (a as any)._id) === order.addressId)?.city}, {user?.addresses.find(a => (a.id || (a as any)._id) === order.addressId)?.state} - {user?.addresses.find(a => (a.id || (a as any)._id) === order.addressId)?.pincode}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-xs font-bold">{userOrderCount} Orders</p>
                      <p className="text-[10px] text-zinc-500">Active {new Date(order.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="p-4 text-green-500 font-black">₹{order.totalAmount}</td>
                    <td className="p-4"><StatusBadge status={order.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const BillingSection = () => {
    const toggleSelect = (id: string) => {
        if (selectedOrderIds.includes(id)) {
            setSelectedOrderIds(prev => prev.filter(i => i !== id));
        } else {
            setSelectedOrderIds(prev => [...prev, id]);
        }
    };

    return (
        <div className="space-y-6">
            {/* Bulk Actions Bar */}
            {selectedOrderIds.length > 0 && (
                <div className="bg-zinc-800 border border-white/10 p-4 rounded-xl flex items-center justify-between sticky top-0 z-20 animate-in slide-in-from-top-4">
                    <div className="flex items-center space-x-4">
                        <span className="text-sm font-bold text-white">{selectedOrderIds.length} Selected</span>
                        <div className="h-4 w-px bg-white/10"></div>
                        <button onClick={() => handleBulkAction('invoice')} className="text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Invoice
                        </button>
                         <button onClick={() => handleBulkAction('print_label')} className="text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-2">
                            <Printer className="w-4 h-4" /> Labels
                        </button>
                         <button onClick={() => handleBulkAction('shiprocket')} className="text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-2">
                            <Truck className="w-4 h-4" /> Shiprocket
                        </button>
                    </div>
                    <button onClick={() => setSelectedOrderIds([])} className="text-zinc-500 hover:text-white">
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>
            )}

            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-zinc-800/50 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        <tr>
                            <th className="p-4 w-10">
                                <input type="checkbox" onChange={(e) => {
                                    if (e.target.checked) setSelectedOrderIds(orders.map(o => o.id || (o as any)._id));
                                    else setSelectedOrderIds([]);
                                }} />
                            </th>
                            <th className="p-4">Order</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Customer</th>
                            <th className="p-4">Payment</th>
                            <th className="p-4">Total</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
                        {orders.map(order => {
                             const user = users.find(u => (u.id || (u as any)._id) === order.userId);
                             const orderId = order.id || (order as any)._id;
                             return (
                                <tr key={orderId} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedOrderIds.includes(orderId)}
                                            onChange={() => toggleSelect(orderId)}
                                        />
                                    </td>
                                    <td className="p-4 font-mono text-xs">{(order as any).orderCode || ('#' + (order.id || (order as any)._id || '').slice(-6))}</td>
                                    <td className="p-4 text-xs text-zinc-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td className="p-4 font-medium text-white">{user?.name || 'Unknown'}</td>
                                    <td className="p-4">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded border ${order.paymentStatus === 'paid' ? 'border-green-500/20 text-green-500' : 'border-yellow-500/20 text-yellow-500'}`}>
                                            {order.paymentStatus.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-4 font-bold">₹{order.totalAmount}</td>
                                    <td className="p-4"><StatusBadge status={order.status} /></td>
                                    <td className="p-4">
                                        <button className="text-zinc-500 hover:text-white" onClick={() => setSelectedOrder(order)}>
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                             );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
  };

  // --- Main Render ---

  if (loading) return <div className="p-10 text-center text-green-500 animate-pulse">Initializing Command Center...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Order Command</h1>
                <p className="text-zinc-500 text-sm font-medium">Manage flow, billing, and exceptions</p>
            </div>
            
            {/* Tabs */}
            <div className="flex bg-zinc-900 border border-white/10 p-1 rounded-xl">
                {(['kanban', 'radar', 'billing'] as Tab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === tab 
                            ? 'bg-zinc-800 text-white shadow-lg' 
                            : 'text-zinc-500 hover:text-white'
                        }`}
                    >
                        {tab === 'radar' ? 'Problem Radar' : tab}
                    </button>
                ))}
            </div>
        </div>

        {/* Content Area */}
        {activeTab === 'kanban' && (
          <>
            <KanbanBoard />
            <AllOrdersSection />
          </>
        )}
        {activeTab === 'radar' && <ProblemRadar />}
        {activeTab === 'billing' && <BillingSection />}

        {/* Process Order Modal */}
        {showProcessModal && selectedOrder && (
            <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-black uppercase text-white tracking-tighter">Process Order</h3>
                        <button onClick={() => setShowProcessModal(false)} className="text-zinc-500 hover:text-white">
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Package Size</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['small', 'medium', 'large'] as const).map(size => (
                                    <button
                                        key={size}
                                        onClick={() => setLogisticsData(prev => ({ ...prev, packageSize: size }))}
                                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                            logisticsData.packageSize === size
                                            ? 'bg-blue-500/10 border-blue-500 text-blue-500'
                                            : 'bg-zinc-800 border-white/5 text-zinc-500 hover:border-white/10'
                                        }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Package Weight (KG)</label>
                            <input 
                                type="number" 
                                step="0.1"
                                className="w-full bg-zinc-800 border border-white/10 px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                                value={logisticsData.packageWeight}
                                onChange={e => setLogisticsData(prev => ({ ...prev, packageWeight: parseFloat(e.target.value) || 0 }))}
                            />
                        </div>

                        <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl space-y-2">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                <span className="text-zinc-500">Estimated Logistics Cost</span>
                                <span className="text-blue-500">
                                    {(() => {
                                        const config = JSON.parse(localStorage.getItem('finance_config') || '{}');
                                        const pkg = config.packagingCosts?.[logisticsData.packageSize] || 0;
                                        const ship = (config.shippingBaseRate || 0) * logisticsData.packageWeight;
                                        return `₹${(pkg + ship).toFixed(2)}`;
                                    })()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleProcessOrder}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all"
                    >
                        Confirm & Start Processing
                    </button>
                </div>
            </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-zinc-900 z-10">
                        <div>
                            <h2 className="text-xl font-black uppercase text-white">Order Details</h2>
                            <p className="text-zinc-500 text-xs font-mono">ID: {(selectedOrder as any).orderCode || ('#' + (selectedOrder.id || (selectedOrder as any)._id))}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => generateInvoice(selectedOrder)} 
                            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2">
                            <Printer className="w-4 h-4" /> Download Invoice (PDF)
                          </button>
                          <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-zinc-800 rounded-lg">
                              <XCircle className="w-6 h-6 text-zinc-500" />
                          </button>
                        </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left: Products */}
                        <div className="space-y-6 lg:col-span-2">
                            <div>
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Items</h3>
                                <div className="space-y-4">
                                    {selectedOrder.products.map((item, i) => {
                                        const product = products.find(p => (p.id || (p as any)._id) === item.productId);
                                        return (
                                            <div key={`${item.productId}-${i}`} className="flex gap-4 bg-zinc-800/30 p-3 rounded-xl border border-white/5">
                                                <img src={product?.images[0]} alt="" className="w-16 h-16 rounded-lg object-cover bg-zinc-800" />
                                                <div>
                                                    <p className="font-bold text-white text-sm">{product?.name || 'Unknown Item'}</p>
                                                    <p className="text-zinc-500 text-xs">Size: {item.size} | Qty: {item.quantity}</p>
                                                    <p className="text-green-500 text-xs font-bold mt-1">₹{item.price}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Exchange Details */}
                            {selectedOrder.exchangeRequest && (
                              <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-xl">
                                <h3 className="text-[10px] font-black uppercase tracking-widest mb-2 text-yellow-500">Exchange Details</h3>
                                {(() => {
                                  const ex = (selectedOrder as any).exchangeRequest || ((selectedOrder as any).exchangeData ? JSON.parse((selectedOrder as any).exchangeData) : null);
                                  const prod = products.find(pr => (pr.id || (pr as any)._id) === (ex?.newProductId || selectedOrder.products[0]?.productId));
                                  return (
                                    <div className="text-xs text-zinc-300 space-y-1">
                                      <p>Requested: {new Date(ex?.requestedAt || (selectedOrder as any).updatedAt || selectedOrder.createdAt).toLocaleString()}</p>
                                      <p>Product: {prod?.name || 'Unknown'} • Size: {ex?.newSize || selectedOrder.products[0]?.size}</p>
                                      <p>Status: {selectedOrder.status.replace('exchange-', '') || ex?.status || 'pending'}</p>
                                      {ex?.reason && <p>Reason: {ex.reason}</p>}
                                      {ex?.pickupTrackingId && <p>Pickup ID: {ex.pickupTrackingId}</p>}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}

                            {/* Quick Actions (Left side, only for Kanban-opened modal) */}
                            {modalSource === 'kanban' && (
                              <div className="bg-zinc-800/30 p-4 rounded-xl border border-white/5 space-y-3">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Quick Actions</h3>
                                {selectedOrder.status === 'pending' && (
                                  <div className="grid grid-cols-2 gap-2">
                                    <button 
                                      onClick={() => setShowProcessModal(true)}
                                      className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 py-2 rounded text-[10px] font-bold uppercase"
                                    >
                                      Start Processing
                                    </button>
                                    <button 
                                      onClick={handleCancelOrder}
                                      className="bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2 rounded text-[10px] font-bold uppercase"
                                    >
                                      Cancel Order
                                    </button>
                                  </div>
                                )}
                                {selectedOrder.status === 'processing' && (
                                  <button 
                                    onClick={() => handleStatusChange(selectedOrder.id || (selectedOrder as any)._id, 'shipped')}
                                    className="w-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 py-2 rounded text-[10px] font-bold uppercase"
                                  >
                                    Mark Shipped
                                  </button>
                                )}
                                {selectedOrder.status === 'shipped' && (
                                  <button 
                                    onClick={() => handleStatusChange(selectedOrder.id || (selectedOrder as any)._id, 'delivered')}
                                    className="w-full bg-green-500/10 hover:bg-green-500/20 text-green-500 py-2 rounded text-[10px] font-bold uppercase"
                                  >
                                    Mark Delivered
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleBookShiprocket([selectedOrder.id || (selectedOrder as any)._id])}
                                  disabled={Boolean(selectedOrder.trackingId)}
                                  className={`w-full py-2 rounded text-[10px] font-bold uppercase flex items-center justify-center gap-2 transition-all ${
                                    selectedOrder.trackingId 
                                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                      : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                                  }`}
                                >
                                  {selectedOrder.trackingId ? <Lock className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                                  {selectedOrder.trackingId ? 'Shipment Booked' : 'Book Shiprocket'}
                                </button>
                              </div>
                            )}
                        </div>

                        {/* Right: Order, Payment, Address, Customer */}
                        <div className="space-y-6">
                             <div className="bg-zinc-800/30 p-4 rounded-xl border border-white/5">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Order & Customer</h3>
                                {(() => {
                                    const user = users.find(u => (u.id || (u as any)._id) === selectedOrder.userId);
                                    const addr: any = getOrderAddress(selectedOrder, user);
                                    const orderId = selectedOrder.id || (selectedOrder as any)._id;
                                    return (
                                        <div className="text-sm text-zinc-300 space-y-2">
                                            <p><span className="text-zinc-500">Order Date:</span> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                                            <p><span className="text-zinc-500">Status:</span> <span><StatusBadge status={selectedOrder.status} /></span></p>
                                            <p><span className="text-zinc-500">Name:</span> {user?.name}</p>
                                            <p><span className="text-zinc-500">Phone:</span> {user?.phone || addr?.phone}</p>
                                            <p><span className="text-zinc-500">Email:</span> {user?.email || 'N/A'}</p>
                                            <p><span className="text-zinc-500">Address:</span> {addr ? `${addr.apartment || addr.houseNo || addr.house || addr.addressLine1 || ''}, ${addr.roadName || addr.street || addr.area || addr.addressLine2 || ''}, ${addr.city || ''}, ${addr.state || ''}` : 'N/A'}</p>
                                            <p className="flex items-center gap-2"><span className="text-zinc-500">Pincode:</span> {(addr && (addr.pincode || addr.zip || addr.postalCode)) || ''}
                                              <button onClick={() => handlePincodeCheck(selectedOrder)} className="text-[10px] text-blue-500 hover:underline">Verify</button>
                                            </p>
                                            {addressErrors[orderId] && <p className="text-red-500 text-xs font-bold">⚠️ Invalid Pincode Detected</p>}
                                        </div>
                                    );
                                })()}
                             </div>

                             <div className="bg-zinc-800/30 p-4 rounded-xl border border-white/5">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Payment</h3>
                                <div className="text-sm text-zinc-300 space-y-2">
                                  <p><span className="text-zinc-500">Mode:</span> {selectedOrder.paymentStatus === 'paid' ? 'Online' : 'COD'}</p>
                                  <p><span className="text-zinc-500">Total:</span> ₹{selectedOrder.totalAmount}</p>
                                  {(selectedOrder as any).refundDetails?.refundId && (
                                    <p><span className="text-zinc-500">Refund ID:</span> {(selectedOrder as any).refundDetails.refundId}</p>
                                  )}
                                </div>
                             </div>
                     <div className="bg-zinc-800/30 p-4 rounded-xl border border-white/5">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Shipment</h3>
                        <div className="text-sm text-zinc-300 space-y-2">
                          <p><span className="text-zinc-500">AWB:</span> {selectedOrder.trackingId || 'Not booked'}</p>
                          {selectedOrder.trackingId && (
                            <>
                              <p>
                                <a 
                                  href={`https://www.shiprocket.in/shipment-tracking/${selectedOrder.trackingId}`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-blue-500 hover:underline text-xs font-bold"
                                >
                                  Track Shipment
                                </a>
                              </p>
                              {(() => {
                                const oid = selectedOrder.id || (selectedOrder as any)._id || '';
                                const label = shiprocketLabels[oid] || '';
                                return label ? (
                                  <p>
                                    <a href={label} target="_blank" rel="noreferrer" className="text-green-500 hover:underline text-xs font-bold">
                                      Print Label
                                    </a>
                                  </p>
                                ) : null;
                              })()}
                            </>
                          )}
                        </div>
                      </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default AdminOrders;
