
import { Product, Category, Gender, Coupon } from './types';

export const CATEGORIES: Category[] = ['Puff Print', 'DTF', 'Screen Print', 'Hybrid', 'Oversized', 'Hoodie', 'Shirt', 'T-shirt'];
export const GENDERS: Gender[] = ['Men', 'Women', 'Unisex', 'Couple'];

export const DUMMY_HERO_IMAGES = [];

export const DUMMY_CATEGORIES_DATA = [];

export const DUMMY_TAGS = [];

export const DUMMY_REVIEWS = [];

export const DUMMY_PRODUCTS: Product[] = [
  {
    id: 'dummy_error_1',
    sku: 'DUMMY-ERR',
    name: 'dummy product',
    category: ['Uncategorized', 'Unisex'],
    actualPrice: 0,
    offerPrice: 0,
    images: [],
    description: 'Server connection failed. This is a diagnostic placeholder.',
    sizes: { 'Free Size': 1 },
    quality: 'N/A',
    countryOfOrigin: 'N/A',
    manufactureDate: 'N/A',
    pickupPoint: 'N/A',
    exchangePolicy: { type: 'no-exchange', description: 'N/A' },
    cancelPolicy: 'N/A',
    tags: [],
    isBestSelling: true,
    discountPercentage: 0
  }
];

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra & Nagar Haveli",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal"
];

export const DUMMY_COUPONS: Coupon[] = [
  // { code: 'SOUL10', type: 'percentage', value: 10, minBilling: 999, maxDiscount: 200, isVisible: true },
  // { code: 'FIRST50', type: 'flat', value: 50, minBilling: 499, isVisible: true },
  // { code: 'BIGSAVER', type: 'percentage', value: 15, minBilling: 1499, maxDiscount: 500, isVisible: true }
];
