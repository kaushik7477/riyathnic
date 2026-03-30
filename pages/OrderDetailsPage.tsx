import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, Package, Truck, CheckCircle, AlertCircle, 
  Download, RefreshCw, X, Upload, Camera, ShoppingBag, CreditCard,
  FileText, ShieldCheck, MapPin, Smartphone, Mail, Info, Lock,
  Box, ChevronRight, Clock, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Order, Product, User, Address } from '../types';
import { fetchOrders, fetchProducts, updateOrder, uploadImage, mapOrder } from '../src/api';
import { downloadInvoice } from '@/src/utils/pdfGenerator';

interface OrderDetailsPageProps {
  user: User;
  products: Product[];
}

const OrderDetailsPage: React.FC<OrderDetailsPageProps> = ({ user, products }) => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [exchangeStep, setExchangeStep] = useState<'reason' | 'product' | 'address' | 'confirm'>('reason');
  
  // Exchange Form State
  const [exchangeReason, setExchangeReason] = useState('');
  const [exchangePhotos, setExchangePhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [selectedExchangeProduct, setSelectedExchangeProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const orders = await fetchOrders(user.id);
        const found = orders.find((o: any) => (o.id === orderId || o._id === orderId));
        setOrder(found || null);
      } catch (err) {
        console.error("Failed to load order", err);
      } finally {
        setLoading(false);
      }
    };
    if (orderId) loadOrder();
  }, [orderId, user.id]);

  useEffect(() => {
    if (order) {
      const addr = user.addresses.find(a => a.id === order.addressId || (a as any)._id === order.addressId) || null;
      if (addr) setSelectedAddress(addr);
      else if (user.addresses && user.addresses.length > 0) setSelectedAddress(user.addresses[0]);
    }
  }, [order, user.addresses]);

  const getProduct = (id: string) => products.find(p => p.id === id || (p as any)._id === id);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'delivered': return 'text-[#03401b] bg-[#03401b]/10';
      case 'shipped': return 'text-blue-500 bg-blue-500/10';
      case 'processing': return 'text-yellow-500 bg-yellow-500/10';
      case 'cancelled': return 'text-red-500 bg-red-500/10';
      case 'returned': return 'text-purple-500 bg-purple-500/10';
      case 'exchange-pending': return 'text-yellow-500 bg-yellow-500/10';
      case 'exchange-approved': return 'text-blue-500 bg-blue-500/10';
      case 'exchange-rejected': return 'text-red-500 bg-red-500/10';
      case 'exchange-picked-up': return 'text-indigo-500 bg-indigo-500/10';
      case 'exchange-in-transit': return 'text-cyan-500 bg-cyan-500/10';
      case 'exchanged': return 'text-[#03401b] bg-[#03401b]/10';
      default: return 'text-zinc-600 bg-zinc-500/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'delivered': return CheckCircle;
      case 'shipped': return Truck;
      case 'processing': return Package;
      case 'cancelled': return X;
      case 'returned': return RefreshCw;
      case 'exchange-pending': return RefreshCw;
      case 'exchange-approved': return Check;
      case 'exchange-rejected': return X;
      case 'exchange-picked-up': return Package;
      case 'exchange-in-transit': return Truck;
      case 'exchanged': return CheckCircle;
      default: return AlertCircle;
    }
  };

  const isExchangeEligible = useMemo(() => {
    if (!order || order.status !== 'delivered') return false;
    
    // Check first product's exchange policy (assuming same for order)
    const firstProd = getProduct(order.products[0].productId);
    if (!firstProd || firstProd.exchangePolicy?.type === 'no-exchange') return false;
    
    const deliveryDate = new Date(order.createdAt); // Mocking delivery date as createdAt for now
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - deliveryDate.getTime()) / (1000 * 3600 * 24));
    
    return diffDays <= (firstProd.exchangePolicy?.days || 7);
  }, [order, products]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).filter(f => {
      if (f.size > 5 * 1024 * 1024) {
        alert(`${f.name} exceeds 5MB. Please upload smaller images.`);
        return false;
      }
      return true;
    });
    setUploadingPhotos(true);
    try {
        const urls = await Promise.all(files.map(file => uploadImage(file)));
        setPhotoUrls(prev => [...prev, ...urls]);
    } catch (err) {
        alert("Photo upload failed");
    } finally {
        setUploadingPhotos(false);
    }
  };

  const submitExchangeRequest = async () => {
    if (!order || !selectedExchangeProduct || !selectedSize) return;

    const reasonText = exchangeReason || (selectedReasons.length > 0 ? selectedReasons.join(', ') : '');
    const exchangeRequest = {
        status: 'pending' as const,
        reason: reasonText,
        photos: photoUrls,
        newProductId: selectedExchangeProduct.id,
        newSize: selectedSize,
        requestedAt: new Date().toISOString(),
        pickupAddress: selectedAddress || undefined,
        exchangeProductSku: selectedExchangeProduct.sku
    };

    try {
        const orderIdStr = order.id || (order as any)._id;
        
        // Use top-level status for visibility and stringified data for persistence
        const updatePayload = {
          status: 'exchange-pending',
          exchangeRequest: exchangeRequest,
          exchangeData: JSON.stringify(exchangeRequest),
          // Legacy mirrors for backend compatibility
          exchange_reason: reasonText,
          exchange_photos: photoUrls,
          exchange_product_id: selectedExchangeProduct.id,
          exchange_size: selectedSize,
          exchange_sku: selectedExchangeProduct.sku
        };

        await updateOrder(orderIdStr, updatePayload);
        
        // Emit socket event for real-time update in admin view
        const { socket } = await import('../src/api');
        socket.emit('exchange_request_submitted', { 
          orderId: orderIdStr, 
          exchangeRequest: exchangeRequest 
        });

        // Also emit a general order_updated event for broader compatibility
        socket.emit('order_updated', {
          ...order,
          ...updatePayload,
          _id: orderIdStr
        });

        alert("Exchange request submitted successfully!");
        setShowExchangeModal(false);
        
        // Refresh order data
        const updatedOrders = await fetchOrders(user.id);
        const newOrder = updatedOrders.find((o: any) => (o.id === orderIdStr || o._id === orderIdStr));
        if (newOrder) setOrder(newOrder);
    } catch (err) {
        alert("Failed to submit exchange request");
    }
  };

  const generateInvoice = async () => {
    if (!order) return;
    await downloadInvoice(order, user, products);
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#03401b] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-zinc-50 text-[#03401b] flex flex-col items-center justify-center p-4">
      <AlertCircle className="w-16 h-16 text-zinc-800 mb-6" />
      <h1 className="text-2xl font-black uppercase tracking-tighter mb-4">Transmission Lost</h1>
      <p className="text-zinc-600 mb-8">The order you're looking for doesn't exist in our archives.</p>
      <Link to="/profile" className="bg-[#03401b] !text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors">Return to Base</Link>
    </div>
  );

  return (
    <div className="bg-zinc-50 min-h-screen text-[#03401b] pt-24 pb-20 font-sans">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <button onClick={() => navigate('/profile')} className="flex items-center gap-2 text-zinc-600 hover:text-[#03401b] transition-colors mb-10 group">
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Back to Profile</span>
        </button>

        <div className="space-y-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-[#03401b]/10 pb-12">
            <div>
              <div className="flex items-center gap-3 mb-3">
                {/* <span className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">Transmission ID</span> */}
                {/* <span className="px-2 py-0.5 bg-white border border-[#03401b]/10 rounded text-[10px] font-mono text-zinc-700">{(order as any).orderCode || ('#' + (order.id || (order as any)._id).toUpperCase())}</span> */}
              </div>
              <h1 className="text-4xl font-black uppercase tracking-tighter">Order Details</h1>
              <p className="text-2xl font-black text-[#03401b] mt-2">{(order as any).orderCode || ('#' + (order.id || (order as any)._id))}</p>
              <p className="text-zinc-600 text-xs mt-2 uppercase tracking-widest font-bold">Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            
            <div className="flex flex-col items-end gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${getStatusColor(order.status)}`}>
                {React.createElement(getStatusIcon(order.status), { className: "w-4 h-4" })}
                <span className="text-xs font-black uppercase tracking-widest">{order.status === 'pending' ? 'Order Placed' : order.status.replace('-', ' ')}</span>
              </div>
              <button onClick={generateInvoice} className="flex items-center gap-2 text-zinc-700 hover:text-[#03401b] transition-colors text-[10px] font-black uppercase tracking-widest">
                <Download className="w-4 h-4" />
                Download Invoice
              </button>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Left: Products & Exchange */}
            <div className="md:col-span-2 space-y-10">
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-600 border-l-2 border-[#03401b] pl-4">Manifest</h3>
                <div className="space-y-4">
                  {order.products.map((item, idx) => {
                    const prod = getProduct(item.productId);
                    return (
                      <div key={idx} className="bg-white shadow-sm border border-[#03401b]/10 rounded-3xl p-6 flex gap-6 hover:bg-white transition-colors group">
                        <div className="w-24 h-32 bg-white rounded-2xl overflow-hidden flex-shrink-0 border border-[#03401b]/10">
                          <img src={prod?.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-bold text-lg uppercase tracking-tight">{prod?.name || 'Artifact'}</h4>
                          <div className="flex flex-wrap gap-4 mt-3">
                            <div className="bg-zinc-100 px-3 py-1 rounded-lg">
                              <p className="text-[9px] text-zinc-600 uppercase font-black">Size</p>
                              <p className="text-sm font-bold">{item.size}</p>
                            </div>
                            <div className="bg-zinc-100 px-3 py-1 rounded-lg">
                              <p className="text-[9px] text-zinc-600 uppercase font-black">Quantity</p>
                              <p className="text-sm font-bold">{item.quantity}</p>
                            </div>
                            <div className="bg-zinc-100 px-3 py-1 rounded-lg">
                              <p className="text-[9px] text-zinc-600 uppercase font-black">Price</p>
                              <p className="text-sm font-bold text-[#03401b]">₹{item.price}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Exchange Section */}
              <div className="bg-zinc-50 border border-zinc-200 border border-[#03401b]/10 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <RefreshCw className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <RefreshCw className="w-5 h-5 text-[#03401b]" />
                    <h3 className="text-lg font-black uppercase tracking-tighter">Exchange Protocol</h3>
                  </div>

                  {order.exchangeRequest ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          order.exchangeRequest.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                          order.exchangeRequest.status === 'approved' ? 'bg-[#03401b]/10 text-[#03401b]' :
                          order.exchangeRequest.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                          'bg-blue-500/10 text-blue-500'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                          Status: {order.exchangeRequest.status.replace('-', ' ')}
                        </div>
                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                          Requested {new Date(order.exchangeRequest.requestedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="bg-white/40 border border-[#03401b]/10 rounded-2xl p-6 space-y-4">
                        {/* Progress Tracker */}
                        <div className="relative flex justify-between items-center px-4">
                          <div className="absolute top-1/2 left-0 w-full h-px bg-white/10 -translate-y-1/2 z-0" />
                          {[
                            { label: 'Requested', icon: Clock, status: ['pending', 'approved', 'rejected', 'picked-up', 'in-transit', 'exchanged'] },
                            { label: 'Approved', icon: ShieldCheck, status: ['approved', 'picked-up', 'in-transit', 'exchanged'] },
                            { label: 'Pickup', icon: Box, status: ['picked-up', 'in-transit', 'exchanged'] },
                            { label: 'Exchange', icon: RefreshCw, status: ['exchanged'] }
                          ].map((step, i) => {
                            const isActive = step.status.includes(order.exchangeRequest!.status);
                            return (
                              <div key={i} className="relative z-10 flex flex-col items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-500 ${
                                  isActive ? 'bg-green-500 border-[#03401b] text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-white border-[#03401b]/10 text-zinc-600'
                                }`}>
                                  <step.icon className="w-4 h-4" />
                                </div>
                                <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'text-[#03401b]' : 'text-zinc-600'}`}>{step.label}</span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="pt-4 border-t border-[#03401b]/10 flex gap-4">
                          <div className="flex-1">
                            <p className="text-[9px] text-zinc-600 uppercase font-black mb-1">Reason</p>
                            <p className="text-xs text-zinc-700 italic">"{order.exchangeRequest.reason}"</p>
                          </div>
                          {order.exchangeRequest.adminNotes && (
                            <div className="flex-1 border-l border-[#03401b]/10 pl-4">
                              <p className="text-[9px] text-zinc-600 uppercase font-black mb-1">Admin Update</p>
                              <p className="text-xs text-zinc-700">{order.exchangeRequest.adminNotes}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {order.exchangeRequest.pickupTrackingId && (
                        <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                              <Truck className="w-4 h-4 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-[9px] text-zinc-600 uppercase font-black">Pickup Tracking</p>
                              <p className="text-xs font-mono text-[#03401b] tracking-widest">{order.exchangeRequest.pickupTrackingId}</p>
                            </div>
                          </div>
                          <button className="text-[9px] font-black uppercase tracking-widest text-blue-500 hover:text-[#03401b] transition-colors">Track Status</button>
                        </div>
                      )}
                    </div>
                  ) : isExchangeEligible ? (
                    <div className="space-y-6">
                      <p className="text-sm text-zinc-700 leading-relaxed max-w-md">
                        Not satisfied with the fit or quality? Initiate an exchange within the eligibility window. 
                        Ensure the artifact is in original condition with tags.
                      </p>
                      <button 
                        onClick={() => setShowExchangeModal(true)}
                        className="bg-[#03401b] !text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-white transition-all shadow-lg shadow-[#03401b]/20 flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Initiate Exchange
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-red-500/50">
                        <Lock className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Protocol Locked</span>
                      </div>
                      <p className="text-xs text-zinc-600 italic">
                        {order.status !== 'delivered' 
                          ? "Exchange protocol activates post-delivery." 
                          : "Eligibility window closed or item is non-exchangeable."}
                      </p>
                      <div className="mt-4 p-4 bg-white/50 border border-[#03401b]/10 rounded-2xl flex items-start gap-3">
                        <Info className="w-4 h-4 text-zinc-600 mt-0.5" />
                        <div>
                           <p className="text-[10px] text-zinc-600 uppercase font-black mb-1">Exchange Policy</p>
                           <p className="text-xs text-zinc-700 leading-relaxed">
                              {getProduct(order.products[0].productId)?.exchangePolicy?.type === 'no-exchange' 
                                ? "This artifact is excluded from exchange protocols."
                                : `${getProduct(order.products[0].productId)?.exchangePolicy?.days || 7} Days post-delivery exchange window applies.`}
                           </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Summary & Logistics */}
            <div className="space-y-10">
              {/* Order Summary */}
              <div className="bg-white shadow-sm border border-[#03401b]/10 rounded-3xl p-8 space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-600 border-l-2 border-[#03401b] pl-4">Financials</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 uppercase font-bold tracking-widest text-[10px]">Subtotal</span>
                    <span className="font-bold">₹{order.totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 uppercase font-bold tracking-widest text-[10px]">Shipping</span>
                    <span className="text-[#03401b] font-bold uppercase text-[10px]">Free</span>
                  </div>
                  <div className="pt-4 border-t border-[#03401b]/10 flex justify-between items-end">
                    <span className="text-zinc-700 uppercase font-black tracking-widest text-xs">Total</span>
                    <span className="text-2xl font-black text-[#03401b]">₹{order.totalAmount}</span>
                  </div>
                </div>
                <div className="pt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                  <CreditCard className="w-3 h-3" />
                  Paid via {order.paymentStatus === 'paid' ? 'Digital Gateway' : 'COD (Pending)'}
                </div>
                {order.status === 'cancelled' && (
                  <div className="mt-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-sm">
                    <p className="font-bold text-red-500">Refund Initiated</p>
                    <p className="text-zinc-700">Refund initiate into source account.</p>
                    <p className="text-zinc-700 mt-1">Amount: ₹{order.totalAmount}</p>
                    <p className="text-zinc-700">Refund ID: {(order as any).refundDetails?.refundId || 'N/A'}</p>
                  </div>
                )}
              </div>

              {/* Delivery Info */}
              <div className="bg-white shadow-sm border border-[#03401b]/10 rounded-3xl p-8 space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-600 border-l-2 border-[#03401b] pl-4">Drop Location</h3>
                <div className="space-y-4">
                   <div className="flex items-start gap-4">
                      <MapPin className="w-5 h-5 text-zinc-600 mt-1" />
                      <div>
                        <p className="text-sm font-bold uppercase tracking-tight">{user.name}</p>
                        <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                          {user.addresses.find(a => a.id === order.addressId || (a as any)._id === order.addressId)?.apartment}, 
                          {user.addresses.find(a => a.id === order.addressId || (a as any)._id === order.addressId)?.roadName}, 
                          {user.addresses.find(a => a.id === order.addressId || (a as any)._id === order.addressId)?.city}, 
                          {user.addresses.find(a => a.id === order.addressId || (a as any)._id === order.addressId)?.state}<br />
                          {user.addresses.find(a => a.id === order.addressId || (a as any)._id === order.addressId)?.pincode}
                        </p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4 pt-4 border-t border-[#03401b]/10">
                      <Smartphone className="w-4 h-4 text-zinc-600" />
                      <p className="text-xs text-zinc-700 font-bold">+91 {user.phone}</p>
                   </div>
                </div>
              </div>

              {/* Help Widget */}
              {/* moved to center below grid */}
            </div>
          </div>
        </div>
        {/* Centered Help Widget */}
        <div className="container mx-auto px-4 max-w-4xl mt-8">
          <div className="p-8 border border-[#03401b]/10 rounded-3xl text-center space-y-4 mx-auto max-w-md">
            <Info className="w-8 h-8 text-zinc-800 mx-auto" />
            <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">Need Assistance?</p>
            <p className="text-xs text-zinc-700">Encountered an issue with your transmission? Contact our support relay.</p>
            <a href="mailto:soulstich.store@gmail.com" className="inline-block text-[10px] font-black uppercase text-[#03401b] hover:text-[#03401b] transition-colors">Contact Support</a>
          </div>
        </div>
      </div>

      {/* Exchange Modal */}
      <AnimatePresence>
        {showExchangeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowExchangeModal(false)}
              className="absolute inset-0 bg-white/95 backdrop-blur-md" 
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white border border-[#03401b]/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-[#03401b]/10 flex justify-between items-center bg-zinc-50">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-6 h-6 text-[#03401b]" />
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter">Initiate Exchange</h2>
                    <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mt-1">Step {exchangeStep === 'reason' ? '1' : exchangeStep === 'product' ? '2' : exchangeStep === 'address' ? '3' : '4'} of 4</p>
                  </div>
                </div>
                <button onClick={() => setShowExchangeModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-6 h-6 text-zinc-600" />
                </button>
              </div>

              <div className="p-8 max-h-[70vh] overflow-y-auto">
                {exchangeStep === 'reason' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-4">
                      <label className="text-xs font-black uppercase tracking-widest text-zinc-600 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Reason for Exchange
                      </label>
                      <textarea 
                        value={exchangeReason}
                        onChange={(e) => setExchangeReason(e.target.value)}
                        placeholder="Please describe the issue (e.g., fit too tight, print defect...)"
                        className="w-full bg-white border border-[#03401b]/10 rounded-2xl p-4 h-32 text-sm focus:border-[#03401b]/50 transition-colors"
                      />
                      <div className="grid grid-cols-3 gap-2 pt-2">
                        {['Size too small', 'Size too large', 'Quality issue', 'Wrong item received', 'Color mismatch', 'Defect'].map(opt => (
                          <button
                            key={opt}
                            onClick={() => setSelectedReasons(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt])}
                            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${selectedReasons.includes(opt) ? 'bg-[#03401b] !text-white border-[#03401b]' : 'bg-white text-zinc-700 border-[#03401b]/10'}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-black uppercase tracking-widest text-zinc-600 flex items-center gap-2">
                        <Camera className="w-4 h-4" />
                        Verification Photos
                      </label>
                      <div className="grid grid-cols-4 gap-4">
                        {photoUrls.map((url, i) => (
                          <div key={i} className="aspect-square bg-white rounded-xl overflow-hidden border border-[#03401b]/10 relative group">
                            <img src={url} className="w-full h-full object-cover" alt="" />
                            <button 
                              onClick={() => setPhotoUrls(urls => urls.filter((_, idx) => idx !== i))}
                              className="absolute top-1 right-1 p-1 bg-white/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {photoUrls.length < 4 && (
                          <label className="aspect-square bg-white shadow-sm border-2 border-dashed border-[#03401b]/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-[#03401b]/50 transition-all group">
                            <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                            {uploadingPhotos ? (
                              <RefreshCw className="w-6 h-6 text-[#03401b] animate-spin" />
                            ) : (
                              <>
                                <Upload className="w-6 h-6 text-zinc-600 group-hover:text-[#03401b] transition-colors" />
                                <span className="text-[8px] font-black uppercase text-zinc-600 mt-2">Upload</span>
                              </>
                            )}
                          </label>
                        )}
                      </div>
                      <p className="text-[9px] text-zinc-600 uppercase font-bold">Max 4 photos. Crucial for defect verification.</p>
                      <p className="text-[9px] text-zinc-600 uppercase font-bold">Each photo must be under 5MB.</p>
                    </div>

                    <button 
                      disabled={(!exchangeReason && selectedReasons.length === 0) || photoUrls.length === 0}
                      onClick={() => setExchangeStep('product')}
                      className="w-full bg-[#03401b] !text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:hover:bg-white"
                    >
                      Continue Protocol
                    </button>
                  </div>
                )}

                {exchangeStep === 'address' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-4">
                      <label className="text-xs font-black uppercase tracking-widest text-zinc-600 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Review Pickup Address
                      </label>
                      <div className="bg-white shadow-sm border border-[#03401b]/10 rounded-2xl p-6">
                        <p className="text-[10px] text-zinc-600 uppercase font-black mb-2">Pickup Address (Original Delivery)</p>
                        <p className="text-xs text-zinc-700">
                          {(selectedAddress?.apartment || '')} {(selectedAddress?.roadName || '')}, {selectedAddress?.city || ''}, {selectedAddress?.state || ''} - {selectedAddress?.pincode || ''}
                        </p>
                        <p className="text-[10px] text-zinc-600 mt-1">Phone: {selectedAddress?.phone || user.phone}</p>
                        <p className="text-[9px] text-zinc-600 mt-3 italic">This address is locked to match the original delivery. Contact support to change.</p>
                      </div>
                    </div>
                    <div className="flex gap-4 pt-2">
                      <button onClick={() => setExchangeStep('product')} className="flex-1 bg-white text_white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all">Back</button>
                      <button 
                        onClick={() => setExchangeStep('confirm')}
                        className="flex-[2] bg-[#03401b] !text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}
                {/* {exchangeStep === 'address' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-4">
                      <label className="text-xs font-black uppercase tracking-widest text-zinc-600 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Review Pickup Address
                      </label>
                      <div className="bg-white shadow-sm border border-[#03401b]/10 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-zinc-600 uppercase font-black mb-1">Apartment / House</p>
                          <input 
                            value={selectedAddress?.apartment || ''}
                            onChange={(e) => setSelectedAddress(prev => ({ ...(prev as Address), apartment: e.target.value }))}
                            className="w-full bg-white border border-[#03401b]/10 rounded-xl p-3 text-sm"
                          />
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-600 uppercase font-black mb-1">Road / Street</p>
                          <input 
                            value={selectedAddress?.roadName || ''}
                            onChange={(e) => setSelectedAddress(prev => ({ ...(prev as Address), roadName: e.target.value }))}
                            className="w-full bg-white border border-[#03401b]/10 rounded-xl p-3 text-sm"
                          />
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-600 uppercase font-black mb-1">City</p>
                          <input 
                            value={selectedAddress?.city || ''}
                            onChange={(e) => setSelectedAddress(prev => ({ ...(prev as Address), city: e.target.value }))}
                            className="w-full bg-white border border-[#03401b]/10 rounded-xl p-3 text-sm"
                          />
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-600 uppercase font-black mb-1">State</p>
                          <input 
                            value={selectedAddress?.state || ''}
                            onChange={(e) => setSelectedAddress(prev => ({ ...(prev as Address), state: e.target.value }))}
                            className="w-full bg-white border border-[#03401b]/10 rounded-xl p-3 text-sm"
                          />
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-600 uppercase font-black mb-1">Pincode</p>
                          <input 
                            value={selectedAddress?.pincode || ''}
                            onChange={(e) => setSelectedAddress(prev => ({ ...(prev as Address), pincode: e.target.value }))}
                            className="w-full bg-white border border-[#03401b]/10 rounded-xl p-3 text-sm"
                          />
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-600 uppercase font-black mb-1">Phone</p>
                          <input 
                            value={selectedAddress?.phone || ''}
                            onChange={(e) => setSelectedAddress(prev => ({ ...(prev as Address), phone: e.target.value }))}
                            className="w-full bg-white border border-[#03401b]/10 rounded-xl p-3 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4 pt-2">
                      <button onClick={() => setExchangeStep('product')} className="flex-1 bg-white text-[#03401b] py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all">Back</button>
                      <button 
                        onClick={() => setExchangeStep('confirm')}
                        className="flex-[2] bg-[#03401b] !text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all"
                      >
                        Continue
                      </button>
                    </div>
                  </div> */}
              
                {exchangeStep === 'product' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-4">
                      <label className="text-xs font-black uppercase tracking-widest text-zinc-600 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4" />
                        Select Exchange Artifact
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        {products.filter(p => p.id === order.products[0].productId || p.linkedProducts?.includes(getProduct(order.products[0].productId)?.sku || '')).map(prod => (
                          <button 
                            key={prod.id}
                            onClick={() => {
                                setSelectedExchangeProduct(prod);
                                setSelectedSize('');
                            }}
                            className={`p-4 rounded-2xl border transition-all text-left flex gap-4 ${
                                selectedExchangeProduct?.id === prod.id ? 'bg-[#03401b]/10 border-[#03401b]' : 'bg-white shadow-sm border-[#03401b]/10 hover:border-[#03401b]/20'
                            }`}
                          >
                            <div className="w-12 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0">
                                <img src={prod.images[0]} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-tight line-clamp-1">{prod.name}</p>
                                <p className="text-xs font-bold text-[#03401b] mt-1">₹{prod.offerPrice}</p>
                              <p className="text-[10px] text-zinc-600 font-mono mt-1">SKU: {prod.sku}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedExchangeProduct && (
                      <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                        <label className="text-xs font-black uppercase tracking-widest text-zinc-600">Select Desired Size</label>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(selectedExchangeProduct.sizes).map(([size, stock]) => (
                            <button 
                              key={size}
                              disabled={stock === 0}
                              onClick={() => setSelectedSize(size)}
                              className={`px-6 py-3 rounded-xl text-xs font-black uppercase transition-all ${
                                stock === 0 ? 'bg-white text-zinc-700 cursor-not-allowed opacity-30' :
                                selectedSize === size ? 'bg-[#03401b] !text-white' : 'bg-zinc-800 text-[#03401b] hover:bg-zinc-700'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        <button onClick={() => setExchangeStep('reason')} className="flex-1 bg-white text-[#03401b] py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all">Back</button>
                        <button 
                            disabled={!selectedExchangeProduct || !selectedSize}
                            onClick={() => setExchangeStep('address')}
                            className="flex-[2] bg-[#03401b] !text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all disabled:opacity-50"
                        >
                            Review Address
                        </button>
                    </div>
                  </div>
                )}

                {exchangeStep === 'confirm' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white shadow-sm border border-[#03401b]/10 rounded-3xl p-8 space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-600 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" />
                            Confirmation Summary
                        </h3>
                        
                        <div className="flex gap-8 items-center">
                            <div className="flex-1 space-y-2">
                                <p className="text-[10px] text-zinc-600 uppercase font-black">Current Artifact</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-14 bg-white rounded-lg overflow-hidden border border-[#03401b]/10">
                                        <img src={getProduct(order.products[0].productId)?.images[0]} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <p className="text-xs font-bold uppercase">{order.products[0].size}</p>
                                </div>
                            </div>
                            <RefreshCw className="w-5 h-5 text-zinc-700" />
                            <div className="flex-1 space-y-2">
                                <p className="text-[10px] text-zinc-600 uppercase font-black">Exchange For</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-14 bg-white rounded-lg overflow-hidden border border-[#03401b]/20">
                                        <img src={selectedExchangeProduct?.images[0]} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <p className="text-xs font-bold uppercase text-[#03401b]">{selectedSize}</p>
                                </div>
                                <p className="text-[10px] text-zinc-600 font-mono">SKU: {selectedExchangeProduct?.sku}</p>
                            </div>
                        </div>

                        {/* Price Calculation */}
                        <div className="pt-6 border-t border-[#03401b]/10 space-y-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-zinc-600 uppercase font-bold">Price Difference</span>
                                {(() => {
                                    const diff = (selectedExchangeProduct?.offerPrice || 0) - order.products[0].price;
                                    return (
                                        <span className={diff > 0 ? 'text-red-500' : 'text-[#03401b]'}>
                                            {diff > 0 ? `+ ₹${diff}` : '₹0'}
                                        </span>
                                    );
                                })()}
                            </div>
                            <p className="text-[10px] text-zinc-600 leading-relaxed italic">
                                { (selectedExchangeProduct?.offerPrice || 0) > order.products[0].price 
                                    ? "Difference must be paid instantly upon approval via digital gateway."
                                    : "Remaining balance is non-refundable as per exchange protocol." }
                            </p>
                        </div>
                        <div className="pt-6 border-t border-[#03401b]/10">
                          <p className="text-[10px] text-zinc-600 uppercase font-black mb-2">Pickup Address</p>
                          <p className="text-xs text-zinc-700">
                            {(selectedAddress?.apartment || '')} {(selectedAddress?.roadName || '')}, {selectedAddress?.city || ''}, {selectedAddress?.state || ''} - {selectedAddress?.pincode || ''}
                          </p>
                          <p className="text-[10px] text-zinc-600 mt-1">Phone: {selectedAddress?.phone || user.phone}</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => setExchangeStep('address')} className="flex-1 bg-white text-[#03401b] py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all">Back</button>
                        <button 
                            onClick={submitExchangeRequest}
                            className="flex-[2] bg-[#03401b] !text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white transition-all shadow-xl shadow-[#03401b]/20"
                        >
                            Finalize Request
                        </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderDetailsPage;
