import React, { useState, useEffect } from 'react';
import { Ticket, Gift, Plus, Trash2, Edit2, Check, X, Eye, Calendar, DollarSign, Percent } from 'lucide-react';
import { Coupon, FreeGift, Product } from '../../types';
import { fetchCoupons, createCoupon, updateCoupon, deleteCoupon, fetchFreeGifts, createFreeGift, updateFreeGift, deleteFreeGift, fetchProducts } from '../../src/api';

const AdminCoupons: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'coupons' | 'gifts'>('coupons');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [gifts, setGifts] = useState<FreeGift[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [editingGift, setEditingGift] = useState<FreeGift | null>(null);

  // Usage Modal
  const [viewUsageCoupon, setViewUsageCoupon] = useState<Coupon | null>(null);

  // Form Data
  const [couponForm, setCouponForm] = useState<Partial<Coupon>>({
    code: '', type: 'percentage', value: 0, minBilling: 0, maxDiscount: 0, isVisible: true
  });
  const [giftForm, setGiftForm] = useState<FreeGift>({ name: '', sku: '', minBilling: 0, isActive: true, description: '', price: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log("Fetching coupons, gifts, and products...");
      const [cData, gData, pData] = await Promise.all([
        fetchCoupons(), 
        fetchFreeGifts(), 
        fetchProducts()
      ]);
      console.log("Loaded Coupons:", cData);
      console.log("Loaded Gifts:", gData);
      console.log("Loaded Products:", pData);
      setCoupons(cData || []);
      setGifts(gData || []);
      setProducts(pData || []);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCoupon = async () => {
    try {
      if (editingCoupon && editingCoupon._id) {
        await updateCoupon(editingCoupon._id, couponForm);
      } else {
        await createCoupon(couponForm);
      }
      setIsCouponModalOpen(false);
      setEditingCoupon(null);
      setCouponForm({ code: '', type: 'percentage', value: 0, minBilling: 0, maxDiscount: 0, isVisible: true });
      loadData();
    } catch (error) {
      alert("Failed to save coupon");
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (confirm("Are you sure?")) {
      await deleteCoupon(id);
      loadData();
    }
  };

  const handleSaveGift = async () => {
    try {
      if (editingGift && editingGift._id) {
        await updateFreeGift(editingGift._id, giftForm);
      } else {
        await createFreeGift(giftForm);
      }
      setIsGiftModalOpen(false);
      setEditingGift(null);
      setGiftForm({ name: '', sku: '', minBilling: 0, isActive: true, description: '', price: 0 });
      loadData();
    } catch (error) {
      alert("Failed to save gift");
    }
  };

  const handleDeleteGift = async (id: string) => {
    if (confirm("Are you sure?")) {
      await deleteFreeGift(id);
      loadData();
    }
  };

  const openCouponModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setCouponForm(coupon);
    } else {
      setEditingCoupon(null);
      setCouponForm({ code: '', type: 'percentage', value: 0, minBilling: 0, maxDiscount: 0, isVisible: true });
    }
    setIsCouponModalOpen(true);
  };

  const openGiftModal = (gift?: FreeGift) => {
    if (gift) {
      setEditingGift(gift);
      setGiftForm(gift);
    } else {
      setEditingGift(null);
      setGiftForm({ name: '', sku: '', minBilling: 0, isActive: true, description: '', price: 0 });
    }
    setIsGiftModalOpen(true);
  };

  return (
    <div className="p-6 space-y-8 text-white min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Offers & Rewards</h1>
        <div className="flex space-x-4">
          <button 
            onClick={() => setActiveTab('coupons')} 
            className={`px-6 py-2 rounded-full font-bold uppercase text-xs tracking-widest transition-colors ${activeTab === 'coupons' ? 'bg-green-500 text-black' : 'bg-zinc-900 text-zinc-500'}`}
          >
            Coupons
          </button>
          <button 
            onClick={() => setActiveTab('gifts')} 
            className={`px-6 py-2 rounded-full font-bold uppercase text-xs tracking-widest transition-colors ${activeTab === 'gifts' ? 'bg-green-500 text-black' : 'bg-zinc-900 text-zinc-500'}`}
          >
            Gifts
          </button>
        </div>
      </div>

      {/* COUPONS TAB */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={() => openCouponModal()} className="bg-white text-black px-6 py-3 rounded-lg font-black uppercase text-xs tracking-widest flex items-center space-x-2 hover:bg-green-500 transition-colors">
              <Plus className="w-4 h-4" />
              <span>Create Coupon</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {coupons.map(coupon => (
              <div key={coupon.id || coupon._id} className={`bg-zinc-900 border ${coupon.isVisible ? 'border-green-500/30' : 'border-red-500/30'} p-6 rounded-2xl relative overflow-hidden`}>
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button onClick={() => setViewUsageCoupon(coupon)} className="p-2 bg-black rounded-full hover:text-blue-500"><Eye className="w-4 h-4" /></button>
                  <button onClick={() => openCouponModal(coupon)} className="p-2 bg-black rounded-full hover:text-green-500"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteCoupon((coupon.id || coupon._id)!)} className="p-2 bg-black rounded-full hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>

                <div className="flex items-center space-x-4 mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${coupon.type === 'percentage' ? 'bg-purple-500/20 text-purple-500' : 'bg-blue-500/20 text-blue-500'}`}>
                    {coupon.type === 'percentage' ? <Percent className="w-6 h-6" /> : <DollarSign className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tighter">{coupon.code}</h3>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                      {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `₹${coupon.value} FLAT OFF`}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-zinc-400 font-medium">
                  <div className="flex justify-between">
                    <span>Min Billing:</span>
                    <span className="text-white">₹{coupon.minBilling}</span>
                  </div>
                  {coupon.maxDiscount && (
                    <div className="flex justify-between">
                      <span>Max Discount:</span>
                      <span className="text-white">Up to ₹{coupon.maxDiscount}</span>
                    </div>
                  )}
                  {coupon.expiry && (
                    <div className="flex justify-between">
                      <span>Expires:</span>
                      <span className="text-white">{new Date(coupon.expiry).toLocaleDateString()}</span>
                    </div>
                  )}
                   <div className="flex justify-between pt-2 border-t border-white/5 mt-2">
                    <span>Used By:</span>
                    <span className="text-green-500 font-bold">{coupon.usageCount} Users</span>
                  </div>
                </div>
                
                {!coupon.isVisible && (
                    <div className="absolute bottom-4 right-4 text-[10px] font-bold uppercase tracking-widest text-red-500 bg-red-500/10 px-2 py-1 rounded">Hidden</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GIFTS TAB */}
      {activeTab === 'gifts' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={() => openGiftModal()} className="bg-white text-black px-6 py-3 rounded-lg font-black uppercase text-xs tracking-widest flex items-center space-x-2 hover:bg-green-500 transition-colors">
              <Plus className="w-4 h-4" />
              <span>Add GIFTS</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {gifts.map(gift => (
              <div key={gift.id || gift._id} className={`bg-zinc-900 border ${gift.isActive ? 'border-green-500/30' : 'border-red-500/30'} p-6 rounded-2xl relative`}>
                 <div className="absolute top-4 right-4 flex space-x-2">
                  <button onClick={() => openGiftModal(gift)} className="p-2 bg-black rounded-full hover:text-green-500"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteGift((gift.id || gift._id)!)} className="p-2 bg-black rounded-full hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>

                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-500">
                    <Gift className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">{gift.name}</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">SKU: {gift.sku}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-zinc-400 font-medium">
                   <div className="flex justify-between">
                    <span>Min Order Value:</span>
                    <span className="text-white font-bold">₹{gift.minBilling}</span>
                  </div>
                  <p className="pt-2 border-t border-white/5 text-zinc-500 italic">"{gift.description}"</p>
                </div>

                 {!gift.isActive && (
                    <div className="absolute bottom-4 right-4 text-[10px] font-bold uppercase tracking-widest text-red-500 bg-red-500/10 px-2 py-1 rounded">Inactive</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COUPON MODAL */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-lg w-full space-y-6">
            <h2 className="text-2xl font-black uppercase tracking-tighter">{editingCoupon ? 'Edit Coupon' : 'New Coupon'}</h2>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="text-xs font-bold uppercase text-zinc-500 block mb-2">Coupon Code</label>
                    <input 
                        type="text" 
                        value={couponForm.code} 
                        onChange={(e) => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})}
                        className="w-full bg-black border border-white/10 px-4 py-3 rounded-lg font-bold text-white focus:border-green-500 outline-none"
                        placeholder="e.g. SUMMER20"
                    />
                </div>
                
                <div>
                    <label className="text-xs font-bold uppercase text-zinc-500 block mb-2">Type</label>
                    <select 
                        value={couponForm.type} 
                        onChange={(e) => setCouponForm({...couponForm, type: e.target.value as 'flat' | 'percentage'})}
                        className="w-full bg-black border border-white/10 px-4 py-3 rounded-lg font-bold text-white outline-none"
                    >
                        <option value="percentage">Percentage (%)</option>
                        <option value="flat">Flat Amount (₹)</option>
                    </select>
                </div>

                <div>
                    <label className="text-xs font-bold uppercase text-zinc-500 block mb-2">Value</label>
                    <input 
                        type="number" 
                        value={couponForm.value} 
                        onChange={(e) => setCouponForm({...couponForm, value: Number(e.target.value)})}
                        className="w-full bg-black border border-white/10 px-4 py-3 rounded-lg font-bold text-white focus:border-green-500 outline-none"
                    />
                </div>

                <div>
                    <label className="text-xs font-bold uppercase text-zinc-500 block mb-2">Min Billing</label>
                    <input 
                        type="number" 
                        value={couponForm.minBilling} 
                        onChange={(e) => setCouponForm({...couponForm, minBilling: Number(e.target.value)})}
                        className="w-full bg-black border border-white/10 px-4 py-3 rounded-lg font-bold text-white focus:border-green-500 outline-none"
                    />
                </div>

                <div>
                    <label className="text-xs font-bold uppercase text-zinc-500 block mb-2">Max Discount (Opt)</label>
                    <input 
                        type="number" 
                        value={couponForm.maxDiscount || 0} 
                        onChange={(e) => setCouponForm({...couponForm, maxDiscount: Number(e.target.value)})}
                        className="w-full bg-black border border-white/10 px-4 py-3 rounded-lg font-bold text-white focus:border-green-500 outline-none"
                    />
                </div>

                 <div className="col-span-2">
                    <label className="text-xs font-bold uppercase text-zinc-500 block mb-2">Expiry Date (Opt)</label>
                    <input 
                        type="date" 
                        value={couponForm.expiry ? new Date(couponForm.expiry).toISOString().split('T')[0] : ''} 
                        onChange={(e) => setCouponForm({...couponForm, expiry: e.target.value})}
                        className="w-full bg-black border border-white/10 px-4 py-3 rounded-lg font-bold text-white focus:border-green-500 outline-none"
                    />
                </div>

                <div className="col-span-2 flex items-center space-x-3 bg-black p-4 rounded-lg border border-white/5">
                    <input 
                        type="checkbox" 
                        checked={couponForm.isVisible} 
                        onChange={(e) => setCouponForm({...couponForm, isVisible: e.target.checked})}
                        className="w-5 h-5 accent-green-500"
                    />
                    <span className="text-sm font-bold uppercase">Show in Available Offers</span>
                </div>
            </div>

            <div className="flex space-x-4 pt-4">
                <button onClick={handleSaveCoupon} className="flex-1 bg-green-500 text-black py-3 rounded-lg font-black uppercase text-xs tracking-widest hover:bg-green-400">Save Coupon</button>
                <button onClick={() => setIsCouponModalOpen(false)} className="flex-1 bg-zinc-800 text-white py-3 rounded-lg font-black uppercase text-xs tracking-widest hover:bg-zinc-700">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* GIFT MODAL */}
      {isGiftModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-lg w-full space-y-6">
            <h2 className="text-2xl font-black uppercase tracking-tighter">{editingGift ? 'Edit Gift' : 'New Gift'}</h2>
            
            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold uppercase text-zinc-500 block mb-2">Gift Name</label>
                    <input 
                        type="text" 
                        value={giftForm.name} 
                        onChange={(e) => setGiftForm({...giftForm, name: e.target.value})}
                        className="w-full bg-black border border-white/10 px-4 py-3 rounded-lg font-bold text-white focus:border-green-500 outline-none"
                        placeholder="e.g. Socks"
                    />
                </div>

                <div>
                    <label className="text-xs font-bold uppercase text-zinc-500 block mb-2">Product SKU</label>
                    <select 
                        value={giftForm.sku} 
                        onChange={(e) => setGiftForm({...giftForm, sku: e.target.value})}
                        className="w-full bg-black border border-white/10 px-4 py-3 rounded-lg font-bold text-white focus:border-green-500 outline-none"
                    >
                        <option value="">Select Product</option>
                        {products.map(product => (
                            <option key={product.id} value={product.sku}>
                                {product.name} ({product.sku})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-xs font-bold uppercase text-zinc-500 block mb-2">Min Order Value</label>
                    <input 
                        type="number" 
                        value={giftForm.minBilling} 
                        onChange={(e) => setGiftForm({...giftForm, minBilling: Number(e.target.value)})}
                        className="w-full bg-black border border-white/10 px-4 py-3 rounded-lg font-bold text-white focus:border-green-500 outline-none"
                    />
                </div>

                <div>
                    <label className="text-xs font-bold uppercase text-zinc-500 block mb-2">Description</label>
                    <input 
                        type="text" 
                        value={giftForm.description} 
                        onChange={(e) => setGiftForm({...giftForm, description: e.target.value})}
                        className="w-full bg-black border border-white/10 px-4 py-3 rounded-lg font-bold text-white focus:border-green-500 outline-none"
                        placeholder="e.g. Shop for ₹1299 and get free socks"
                    />
                </div>

                <div>
                    <label className="text-xs font-bold uppercase text-zinc-500 block mb-2">Gift Price (₹)</label>
                    <input 
                        type="number" 
                        value={giftForm.price || 0} 
                        onChange={(e) => setGiftForm({...giftForm, price: Number(e.target.value)})}
                        className="w-full bg-black border border-white/10 px-4 py-3 rounded-lg font-bold text-white focus:border-green-500 outline-none"
                        placeholder="0"
                    />
                </div>

                <div className="flex items-center space-x-3 bg-black p-4 rounded-lg border border-white/5">
                    <input 
                        type="checkbox" 
                        checked={giftForm.isActive} 
                        onChange={(e) => setGiftForm({...giftForm, isActive: e.target.checked})}
                        className="w-5 h-5 accent-green-500"
                    />
                    <span className="text-sm font-bold uppercase">Activate Offer</span>
                </div>
            </div>

            <div className="flex space-x-4 pt-4">
                <button onClick={handleSaveGift} className="flex-1 bg-green-500 text-black py-3 rounded-lg font-black uppercase text-xs tracking-widest hover:bg-green-400">Save Gift</button>
                <button onClick={() => setIsGiftModalOpen(false)} className="flex-1 bg-zinc-800 text-white py-3 rounded-lg font-black uppercase text-xs tracking-widest hover:bg-zinc-700">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* USAGE MODAL */}
      {viewUsageCoupon && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Usage: {viewUsageCoupon.code}</h2>
                    <button onClick={() => setViewUsageCoupon(null)}><X className="w-6 h-6 text-zinc-500 hover:text-white" /></button>
                </div>
                
                {viewUsageCoupon.usedBy && viewUsageCoupon.usedBy.length > 0 ? (
                    <table className="w-full text-left text-sm text-zinc-400">
                        <thead className="bg-black text-xs font-bold uppercase text-zinc-500">
                            <tr>
                                <th className="p-3">Date</th>
                                <th className="p-3">User ID</th>
                                <th className="p-3">Order ID</th>
                                <th className="p-3 text-right">Savings</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {viewUsageCoupon.usedBy.map((usage, idx) => (
                                <tr key={idx}>
                                    <td className="p-3">{new Date(usage.date).toLocaleDateString()}</td>
                                    <td className="p-3 font-mono">{usage.userId}</td>
                                    <td className="p-3 font-mono">{usage.orderId}</td>
                                    <td className="p-3 text-right text-green-500 font-bold">₹{usage.savings}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-center py-10 text-zinc-500 font-bold uppercase tracking-widest">
                        No usage data yet
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
