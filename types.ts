
export type Category = 'Puff Print' | 'DTF' | 'Screen Print' | 'Hybrid' | 'Oversized' | 'Hoodie' | 'Shirt' | 'T-shirt';
export type Gender = 'Men' | 'Women' | 'Unisex' | 'Couple';

export interface Product {
  id: string; // Mapped from _id
  _id?: string;
  sku: string;
  name: string;
  category: string[]; // Merged Category + Gender + Tags for display
  tags: string[];
  actualPrice: number;
  offerPrice: number;
  images: string[];
  description: string;
  sizes: { [key: string]: number }; // Size name -> stock count
  
  // New Fields
  quality?: string;
  pickupPoint?: string;
  exchangePolicy: {
    type: 'days' | 'no-exchange';
    days?: number;
    description?: string;
  };
  cancelPolicy?: string;
  color?: { name: string, hex: string };
  linkedProducts?: string[]; // SKUs
  countryOfOrigin?: string;
  manufactureDate?: string;
  productionCost?: number; // Cost to manufacture

  isBestSelling?: boolean;
  discountPercentage?: number;
  image?: string; // Compatibility field
}

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone: string;
  addresses: Address[];
  wishlist: string[];
  orders: string[];
  status: 'active' | 'blocked';
  blockReason?: string;
  adminNotes?: string;
  tags?: string[];
  lastActive: string;
  createdAt: string;
}

export interface Address {
  id: string;
  _id?: string;
  receiverName: string;
  apartment: string;
  roadName: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'exchange-pending' | 'exchange-approved' | 'exchange-rejected' | 'exchange-picked-up' | 'exchange-in-transit' | 'exchanged';

export interface Order {
  id: string;
  _id?: string;
  userId: string;
  products: { productId: string; quantity: number; size: string; price: number }[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: 'paid' | 'unpaid';
  trackingId?: string;
  createdAt: string;
  updatedAt?: string;
  addressId: string;
  refundDetails?: {
    refundId?: string;
    amount?: number;
    upiId?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
  };
  logistics?: {
    packageSize: 'small' | 'medium' | 'large';
    packageWeight: number; // in kg
    packagingCost: number;
    shippingCost: number;
  };
  exchangeRequest?: {
    status: 'pending' | 'approved' | 'rejected' | 'picked-up' | 'in-transit' | 'exchanged';
    reason: string;
    photos: string[];
    newProductId: string;
    newSize: string;
    requestedAt: string;
    adminNotes?: string;
    paymentId?: string; // For price difference paid via Razorpay
    pickupTrackingId?: string;
    pickupAddress?: Address;
    exchangeProductSku?: string;
  };
  exchangeData?: string; // Stringified exchange request for robust persistence
}

export interface FinanceConfig {
  password: string;
  razorpayFeeType: 'percentage' | 'fixed';
  razorpayFeeValue: number;
  productGstPercentage: number;
  packagingCosts: {
    small: number;
    medium: number;
    large: number;
  };
  shippingBaseRate: number; // rate per kg
}

export interface Expense {
  id: string;
  category: 'Marketing' | 'Operations' | 'Salary' | 'Others';
  description: string;
  amount: number;
  date: string; // ISO date string
  createdAt?: string;
  updatedAt?: string;
}

export interface Coupon {
  id?: string;
  _id?: string;
  code: string;
  type: 'flat' | 'percentage';
  value: number;
  minBilling: number;
  maxDiscount?: number;
  expiry?: string;
  isVisible: boolean;
  usageCount: number;
  usedBy: { userId: string, orderId: string, savings: number, date: string }[];
}

export interface FreeGift {
  id?: string;
  _id?: string;
  name: string;
  sku: string;
  minBilling: number;
  isActive: boolean;
  description?: string;
  price?: number;
}
