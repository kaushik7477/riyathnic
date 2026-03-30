import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL =
  (import.meta as any).env.VITE_API_URL ||
  ((import.meta as any).env.PROD ? '/api' : `http://${window.location.hostname}:5000/api`);

const SOCKET_URL =
  (import.meta as any).env.VITE_SOCKET_URL ||
  ((import.meta as any).env.PROD ? window.location.origin : `http://${window.location.hostname}:5000`);

export const socket = io(SOCKET_URL);

export const api = axios.create({
  baseURL: API_URL,
});

export const fetchProducts = async (query?: any) => {
  try {
    const { data } = await api.get('/products', { params: query });
    return (data || []).map((p: any) => ({ ...p, id: p.id || p._id }));
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

export const createProduct = async (productData: any) => {
  const { data } = await api.post('/products', productData);
  return data;
};

export const updateProduct = async (id: string, productData: any) => {
  const { data } = await api.put(`/products/${id}`, productData);
  return data;
};

export const deleteProduct = async (id: string) => {
  const { data } = await api.delete(`/products/${id}`);
  return data;
};

export const fetchHeroImages = async () => {
  const { data } = await api.get('/hero-images');
  return data;
};

export const createHeroImage = async (imageData: any) => {
  const { data } = await api.post('/hero-images', imageData);
  return data;
};

export const deleteHeroImage = async (id: string) => {
  const { data } = await api.delete(`/hero-images/${id}`);
  return data;
};

export const fetchCategories = async () => {
  const { data } = await api.get('/categories');
  return data;
};

export const updateCategory = async (categoryData: any) => {
  const { data } = await api.post('/categories', categoryData);
  return data;
};

export const deleteCategory = async (id: string) => {
  const { data } = await api.delete(`/categories/${id}`);
  return data;
};

export const fetchReviews = async (admin: boolean = false) => {
  const { data } = await api.get('/reviews', { params: { admin } });
  return data;
};

export const createReview = async (reviewData: any) => {
  const { data } = await api.post('/reviews', reviewData);
  return data;
};

export const updateReview = async (id: string, reviewData: any) => {
  const { data } = await api.put(`/reviews/${id}`, reviewData);
  return data;
};

export const deleteReview = async (id: string) => {
  const { data } = await api.delete(`/reviews/${id}`);
  return data;
};

export const fetchTags = async () => {
  const { data } = await api.get('/tags');
  return data;
};

export const createTag = async (tagData: any) => {
  const { data } = await api.post('/tags', tagData);
  return data;
};

export const deleteTag = async (id: string) => {
  const { data } = await api.delete(`/tags/${id}`);
  return data;
};

export const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  const { data } = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data.url;
};

export const fetchWebsiteConfig = async (section: string) => {
  const { data } = await api.get(`/website-config/${section}`);
  return data;
};

export const updateWebsiteConfig = async (section: string, config: any) => {
  const { data } = await api.post('/website-config', { section, config });
  return data;
};

// --- Coupons ---
export const fetchCoupons = async () => {
  try {
    const { data } = await api.get('/coupons');
    return (data || []).map((c: any) => ({ ...c, id: c.id || c._id }));
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return [];
  }
};

export const createCoupon = async (couponData: any) => {
  const { data } = await api.post('/coupons', couponData);
  return data;
};

export const updateCoupon = async (id: string, couponData: any) => {
  const { data } = await api.put(`/coupons/${id}`, couponData);
  return data;
};

export const deleteCoupon = async (id: string) => {
  const { data } = await api.delete(`/coupons/${id}`);
  return data;
};

// --- Expenses (Operational Ledger) ---
export const fetchExpenses = async () => {
  try {
    const { data } = await api.get('/expenses');
    return (data || []).map((e: any) => ({ ...e, id: e.id || e._id }));
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return [];
  }
};

export const createExpense = async (expenseData: any) => {
  const { data } = await api.post('/expenses', expenseData);
  return data;
};

export const updateExpense = async (id: string, expenseData: any) => {
  const { data } = await api.put(`/expenses/${id}`, expenseData);
  return data;
};

export const deleteExpense = async (id: string) => {
  const { data } = await api.delete(`/expenses/${id}`);
  return data;
};

// --- GIFTS ---
export const fetchFreeGifts = async () => {
  try {
    const { data } = await api.get('/free-gifts');
    return (data || []).map((g: any) => ({ ...g, id: g.id || g._id }));
  } catch (error) {
    console.error("Error fetching GIFTS:", error);
    return [];
  }
};

export const createFreeGift = async (giftData: any) => {
  const { data } = await api.post('/free-gifts', giftData);
  return data;
};

export const updateFreeGift = async (id: string, giftData: any) => {
  const { data } = await api.put(`/free-gifts/${id}`, giftData);
  return data;
};

export const deleteFreeGift = async (id: string) => {
  const { data } = await api.delete(`/free-gifts/${id}`);
  return data;
};

// --- Admin Access (Panel Admins) ---
export const fetchAdminAccessList = async () => {
  try {
    const { data } = await api.get('/admin-access');
    return (data || []).map((a: any) => ({ ...a, id: a.id || a._id }));
  } catch (error) {
    console.error('Error fetching admin access list:', error);
    return [];
  }
};

export const createAdminAccess = async (adminData: any) => {
  const { data } = await api.post('/admin-access', adminData);
  return data;
};

export const updateAdminAccess = async (id: string, adminData: any) => {
  const { data } = await api.put(`/admin-access/${id}`, adminData);
  return data;
};

export const deleteAdminAccess = async (id: string) => {
  const { data } = await api.delete(`/admin-access/${id}`);
  return data;
};

export const loginAdminAccess = async (email: string, password: string) => {
  const { data } = await api.post('/admin-access/login', { email, password });
  return data;
};

export const fetchAdminAccessByEmail = async (email: string) => {
  const { data } = await api.get('/admin-access/by-email', { params: { email } });
  return data;
};

export const bookShiprocket = async (orderId: string) => {
  const { data } = await api.post('/shipping/shiprocket/book', { orderId });
  return data;
};

// --- Orders ---
export const createOrder = async (orderData: any) => {
  const { data } = await api.post('/orders', orderData);
  return data;
};

// --- Payments (Razorpay) ---
export const createRazorpayOrder = async (payload: {
  userId: string,
  items: { productId: string, size: string, quantity: number, isGift?: boolean, sku?: string }[],
  addressId: string,
  couponCode?: string
}) => {
  const { data } = await api.post('/payments/razorpay/order', payload);
  return data;
};

export const verifyRazorpayPayment = async (payload: {
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string,
  userId: string,
  items: { productId: string, size: string, quantity: number, isGift?: boolean, sku?: string }[],
  addressId: string,
  couponCode?: string
}) => {
  const { data } = await api.post('/payments/razorpay/verify', payload);
  return data;
};
export const mapOrder = (o: any) => {
  const mapped = { ...o, id: o.id || o._id };
  
  // Auto-parse exchangeData if exchangeRequest is missing
  if (!mapped.exchangeRequest) {
    if (mapped.exchangeData) {
      try {
        mapped.exchangeRequest = typeof mapped.exchangeData === 'string' 
          ? JSON.parse(mapped.exchangeData) 
          : mapped.exchangeData;
      } catch (e) {
        console.error("Failed to parse exchangeData for order", mapped.id, e);
      }
    } else if (mapped.exchange_request) {
      mapped.exchangeRequest = mapped.exchange_request;
    }
  }

  // Ensure mandatory fields are mapped if they exist at top level (for redundancy)
  if (mapped.exchangeRequest) {
    if (!mapped.exchangeRequest.reason && (o.exchange_reason || o.reason)) {
      mapped.exchangeRequest.reason = o.exchange_reason || o.reason;
    }
    if ((!mapped.exchangeRequest.photos || mapped.exchangeRequest.photos.length === 0) && (o.exchange_photos || o.photos)) {
      mapped.exchangeRequest.photos = o.exchange_photos || o.photos;
    }
    if (!mapped.exchangeRequest.newProductId && (o.newProductId || o.exchange_product_id)) {
      mapped.exchangeRequest.newProductId = o.newProductId || o.exchange_product_id;
    }
    if (!mapped.exchangeRequest.newSize && (o.newSize || o.exchange_size)) {
      mapped.exchangeRequest.newSize = o.newSize || o.exchange_size;
    }
  }
  
  return mapped;
};

export const fetchOrders = async (userId?: string) => {
  try {
    const params = userId ? { userId } : {};
    const { data } = await api.get('/orders', { params });
    return (data || []).map(mapOrder);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
};

export const updateOrder = async (id: string, orderData: any) => {
  const { data } = await api.put(`/orders/${id}`, orderData);
  return data;
};

export const fetchUsers = async () => {
  const { data } = await api.get('/users');
  return data.map((u: any) => ({ ...u, id: u.id || u._id }));
};

export const requestOTP = async (phone: string) => {
  const { data } = await api.post('/auth/request-otp', { phone });
  return data;
};

export const verifyOTP = async (phone: string, otp: string) => {
  const { data } = await api.post('/auth/verify-otp', { phone, otp });
  return data; // Returns { user, isNewUser }
};

export const completeOnboarding = async (userId: string, name: string, email: string) => {
  const { data } = await api.put('/auth/onboarding', { userId, name, email });
  return data;
};

export const logoutUser = async (userId: string, allDevices: boolean) => {
  const { data } = await api.post('/auth/logout', { userId, allDevices });
  return data;
};

export const updateUser = async (id: string, userData: any) => {
  const { data } = await api.put(`/users/${id}`, userData);
  return data;
};

export const deleteUser = async (id: string) => {
  const { data } = await api.delete(`/users/${id}`);
  return data;
};

export const resetUser = async (id: string) => {
  const { data } = await api.post(`/users/${id}/reset`);
  return data;
};
// --- Cart ---
export const saveCart = async (userId: string, items: any[]) => {
  const { data } = await api.post('/cart', { userId, items });
  return data;
};

export const fetchCart = async (userId: string) => {
  const { data } = await api.get(`/cart/${userId}`);
  return data;
};

export const fetchAllCarts = async () => {
    const { data } = await api.get('/carts');
    return data;
};

// --- Wishlist ---
export const saveWishlist = async (userId: string, productIds: string[]) => {
  const { data } = await api.post('/wishlist', { userId, productIds });
  return data;
};

export const fetchWishlist = async (userId: string) => {
  const { data } = await api.get(`/wishlist/${userId}`);
  return data;
};
