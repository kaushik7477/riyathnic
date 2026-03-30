import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import HeroImage from '../models/HeroImage.js';
import Category from '../models/Category.js';
import Review from '../models/Review.js';
import Tag from '../models/Tag.js';
import WebsiteConfig from '../models/WebsiteConfig.js';
import Coupon from '../models/Coupon.js';
import FreeGift from '../models/FreeGift.js';
import Expense from '../models/Expense.js';
// Removed duplicate Product import that was causing a SyntaxError
import User from '../models/User.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import AdminAccess from '../models/AdminAccess.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import axios from 'axios';
import twilio from 'twilio';

// --- Database Maintenance ---
// This drops the old unique email index that causes the E11000 error when email is null.
// Mongoose will recreate it as a 'sparse' index based on the updated User model.
User.collection.dropIndex('email_1')
  .then(() => console.log('Successfully dropped old email index'))
  .catch(err => {
    if (err.code === 27) {
      console.log('Index email_1 already dropped or does not exist');
    } else {
      console.error('Error dropping index:', err.message);
    }
  });

const router = express.Router();

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer Storage Setup
let storage;

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  // Use Cloudinary Storage if credentials are provided
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'soulstich',
      resource_type: 'auto',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'mp4', 'mov', 'webm'],
    },
  });
} else {
  // Fallback to Disk Storage
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'server/uploads/')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname)
    }
  });
}

const upload = multer({ storage: storage });

// Upload Endpoint
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  
  // If using Cloudinary, req.file.path is the secure URL.
  // If using Disk Storage, construct the local URL.
  const fileUrl = req.file.path || `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  
  res.json({ url: fileUrl });
});

// --- Products ---
router.get('/products', async (req, res) => {
  try {
    const { category, isBestSelling, search } = req.query;
    let query = {};
    if (category && category !== 'All') query.category = category;
    if (isBestSelling === 'true') query.isBestSelling = true;
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { sku: { $regex: search, $options: 'i' } }
        ];
    }
    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    req.io.emit('product_created', product);
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    req.io.emit('product_updated', product);
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    await Product.findByIdAndDelete(req.params.id);
    req.io.emit('product_deleted', req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Hero Images ---
router.get('/hero-images', async (req, res) => {
  try {
    const images = await HeroImage.find();
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/hero-images', async (req, res) => {
  try {
    const { imageUrl, sku, position } = req.body;
    
    if (position) {
        // If position is provided, replace any existing image at that position
        const image = await HeroImage.findOneAndUpdate(
            { position },
            { imageUrl, sku, position },
            { new: true, upsert: true }
        );
        return res.json(image);
    }

    // Fallback for legacy or non-positioned (should generally enforce position now)
    const image = new HeroImage({ imageUrl, sku });
    await image.save();
    res.json(image);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.delete('/hero-images/:id', async (req, res) => {
    try {
        await HeroImage.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Categories (Find Your Vibe) ---
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/categories', async (req, res) => {
  try {
    // Update if exists, else create
    const { name, imageUrl } = req.body;
    const category = await Category.findOneAndUpdate(
      { name }, 
      { imageUrl }, 
      { new: true, upsert: true }
    );
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Reviews ---
router.get('/reviews', async (req, res) => {
  try {
    const { admin } = req.query;
    const query = admin === 'true' ? {} : { isApproved: true };
    const reviews = await Review.find(query).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reviews', async (req, res) => {
  try {
    const review = new Review(req.body);
    await review.save();
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/reviews/:id', async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/reviews/:id', async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Tags ---
router.get('/tags', async (req, res) => {
  try {
    const tags = await Tag.find();
    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tags', async (req, res) => {
  try {
    const { name } = req.body;
    const tag = await Tag.findOneAndUpdate({ name }, { name }, { new: true, upsert: true });
    res.json(tag);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/tags/:id', async (req, res) => {
  try {
    await Tag.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Expenses (Operational Ledger) ---
router.get('/expenses', async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1, createdAt: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/expenses', async (req, res) => {
  try {
    const { category, description, amount, date } = req.body;
    const expense = new Expense({
      category,
      description,
      amount,
      date: date ? new Date(date) : undefined,
    });
    await expense.save();
    req.io.emit('expense_created', expense);
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/expenses/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }
    const expense = await Expense.findByIdAndUpdate(req.params.id, updateData, { new: true });
    req.io.emit('expense_updated', expense);
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/expenses/:id', async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    req.io.emit('expense_deleted', req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Website Config ---
router.get('/website-config/:section', async (req, res) => {
  try {
    const config = await WebsiteConfig.findOne({ section: req.params.section });
    res.json(config ? config.config : null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/website-config', async (req, res) => {
  try {
    const { section, config } = req.body;
    const updatedConfig = await WebsiteConfig.findOneAndUpdate(
      { section },
      { config },
      { new: true, upsert: true }
    );
    res.json(updatedConfig);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Coupons ---
router.get('/coupons', async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/coupons', async (req, res) => {
  try {
    const coupon = new Coupon(req.body);
    await coupon.save();
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/coupons/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/coupons/:id', async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- GIFTS ---
router.get('/free-gifts', async (req, res) => {
  try {
    const gifts = await FreeGift.find().sort({ createdAt: -1 });
    res.json(gifts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/free-gifts', async (req, res) => {
  try {
    const gift = new FreeGift(req.body);
    await gift.save();
    res.json(gift);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Admin Access (Panel Admins) ---
router.get('/admin-access', async (req, res) => {
  try {
    const admins = await AdminAccess.find().sort({ createdAt: -1 });
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin-access', async (req, res) => {
  try {
    const { email, password, sections, status } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await AdminAccess.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ error: 'An admin with this email already exists. Use edit instead.' });
    }
    const admin = new AdminAccess({
      email: normalizedEmail,
      password,
      sections: sections || {},
      status: status || 'active',
    });
    await admin.save();
    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/admin-access/:id', async (req, res) => {
  try {
    const { email, password, sections, status } = req.body;
    const update = {};
    if (email) update.email = String(email).trim().toLowerCase();
    if (password) update.password = password;
    if (sections) update.sections = sections;
    if (status) update.status = status;

    const admin = await AdminAccess.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    res.json(admin);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'An admin with this email already exists.' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin-access/:id', async (req, res) => {
  try {
    const admin = await AdminAccess.findByIdAndDelete(req.params.id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    res.json({ message: 'Admin deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin-access/by-email', async (req, res) => {
  try {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const admin = await AdminAccess.findOne({ email });
    if (!admin) {
      return res.status(404).json({ error: 'Admin account not found' });
    }
    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin-access/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const admin = await AdminAccess.findOne({ email: normalizedEmail });
    if (!admin) {
      return res.status(404).json({ error: 'Admin account not found' });
    }
    if (admin.status === 'blocked') {
      return res.status(403).json({ error: 'Your admin access is blocked. Contact the superadmin.' });
    }
    if (admin.password !== password) {
      return res.status(401).json({ error: 'Invalid admin password' });
    }
    admin.lastActiveAt = new Date();
    await admin.save();
    const adminJson = admin.toJSON();
    delete adminJson.password;
    res.json(adminJson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/free-gifts/:id', async (req, res) => {
  try {
    const gift = await FreeGift.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(gift);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/free-gifts/:id', async (req, res) => {
  try {
    await FreeGift.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Auth ---
const formatPhoneForTwilio = (phone) => {
  if (!phone) return '';
  let digits = phone.toString().replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('91') && digits.length >= 12) {
    digits = digits.slice(0, 12);
    return `+${digits}`;
  }
  if (digits.length >= 10) {
    const last10 = digits.slice(-10);
    return `+91${last10}`;
  }
  return '';
};

let twilioClient = null;
const getTwilioClient = () => {
  if (twilioClient) return twilioClient;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return null;
  twilioClient = twilio(accountSid, authToken);
  return twilioClient;
};

router.post('/auth/request-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // DUMMY LOGIN OVERRIDE
    if (phone === '7477310465' || phone === '+917477310465') {
      return res.json({ message: 'OTP sent successfully (dummy)' });
    }

    const client = getTwilioClient();
    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (!client || !verifyServiceSid) {
      return res.status(500).json({ error: 'OTP service not configured. Please contact support.' });
    }

    const to = formatPhoneForTwilio(phone);
    if (!to) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    await client.verify.v2.services(verifyServiceSid).verifications.create({
      to,
      channel: 'sms'
    });

    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error('Twilio send OTP error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
});

router.post('/auth/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required' });
    }

    // DUMMY LOGIN OVERRIDE
    const isDummy = (phone === '7477310465' || phone === '+917477310465') && otp === '261002';

    if (!isDummy) {
      const client = getTwilioClient();
      const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

      if (!client || !verifyServiceSid) {
        return res.status(500).json({ error: 'OTP service not configured. Please contact support.' });
      }

      const to = formatPhoneForTwilio(phone);
      if (!to) {
        return res.status(400).json({ error: 'Invalid phone number format' });
      }

      try {
        const result = await client.verify.v2.services(verifyServiceSid).verificationChecks.create({
          to,
          code: otp
        });

        const status = String(result.status || '').toLowerCase();
        const isApproved = status === 'approved';

        if (!isApproved) {
          return res.status(400).json({ error: 'Invalid OTP' });
        }
      } catch (verifyErr) {
        console.error('Twilio verify OTP error:', verifyErr.response?.data || verifyErr.message);
        return res.status(400).json({ error: 'Invalid OTP' });
      }
    }

    // Find or create user by phone
    let user = await User.findOne({ phone });
    
    if (user && user.status === 'blocked') {
      return res.status(403).json({ 
        error: 'Your account has been suspended', 
        reason: user.blockReason,
        status: 'blocked'
      });
    }

    let isNewUser = false;
    
    if (!user) {
      user = new User({ phone });
      await user.save();
      isNewUser = true;
    } else if (!user.name || !user.email) {
      // Also treat as "new" if they haven't completed onboarding
      isNewUser = true;
    }

    user.lastActive = new Date();
    await user.save();
    
    res.json({ user, isNewUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/auth/onboarding', async (req, res) => {
  try {
    const { userId, name, email } = req.body;
    const user = await User.findByIdAndUpdate(
      userId, 
      { name, email }, 
      { new: true }
    );
    res.json(user);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email already in use by another account.' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/logout', async (req, res) => {
  try {
    const { userId, allDevices } = req.body;
    if (allDevices) {
      // Increment sessionVersion to invalidate all current tokens/sessions
      await User.findByIdAndUpdate(userId, { $inc: { sessionVersion: 1 } });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Users ---
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users/:id/reset', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Clear user data but keep the phone number
    user.name = undefined;
    user.email = undefined;
    user.addresses = [];
    user.wishlist = [];
    user.orders = [];
    user.status = 'active';
    user.blockReason = undefined;
    user.sessionVersion += 1; // Invalidate current sessions
    
    await user.save();
    res.json({ message: 'User reset successfully', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Orders ---
router.get('/orders', async (req, res) => {
  try {
    const { userId } = req.query;
    const filter = userId ? { userId } : {};
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate unique human-friendly order code: "SS" + 10 digits
const generateOrderCode = async () => {
  let code = '';
  let exists = true;
  while (exists) {
    const num = Math.floor(1000000000 + Math.random() * 9000000000);
    code = `SS${num}`;
    // eslint-disable-next-line no-await-in-loop
    exists = !!(await Order.findOne({ orderCode: code }).lean());
  }
  return code;
};

router.post('/orders', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { products } = req.body;
    
    // Check stock for all items first
    for (const item of products) {
      const product = await Product.findById(item.productId).session(session);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }
      
      const currentStock = product.sizes.get(item.size) || 0;
      if (currentStock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name} (Size: ${item.size}). Available: ${currentStock}`);
      }
    }

    // Decrement stock
    for (const item of products) {
      const product = await Product.findById(item.productId).session(session);
      const newStock = product.sizes.get(item.size) - item.quantity;
      product.sizes.set(item.size, newStock);
      await product.save({ session });
      
      // Emit stock update
      req.io.emit('stock_updated', { 
        productId: product._id, 
        size: item.size, 
        newStock 
      });
    }

    // Attach generated orderCode
    const order = new Order({ ...req.body, orderCode: await generateOrderCode() });
    await order.save({ session });
    
    await session.commitTransaction();
    req.io.emit('order_created', order);
    res.json(order);
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ error: err.message });
  } finally {
    session.endSession();
  }
});

router.put('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    req.io.emit('order_updated', order);
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Payments: Razorpay ---
router.post('/payments/razorpay/order', async (req, res) => {
  try {
    const { userId, items, addressId, couponCode } = req.body;
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET) {
      return res.status(500).json({ error: 'Razorpay credentials not configured' });
    }

    // Validate products and compute server-side pricing
    let regularSubtotal = 0;
    let giftTotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(400).json({ error: `Product ${item.productId} not found` });
      const price = item.isGift 
        ? (await FreeGift.findOne({ sku: product.sku }))?.price || 0
        : product.offerPrice;
      if (item.isGift) giftTotal += price * item.quantity;
      else regularSubtotal += price * item.quantity;
    }

    const subtotal = regularSubtotal + giftTotal;

    // Apply coupon if valid
    let discountAmount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode });
      if (coupon && subtotal >= coupon.minBilling) {
        if (coupon.type === 'flat') {
          discountAmount = coupon.value;
        } else {
          discountAmount = (regularSubtotal * coupon.value) / 100;
          if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
          }
        }
      }
    }

    const total = Math.max(0, Math.round(subtotal - discountAmount));
    const amountPaise = total * 100;

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET
    });

    const rpOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `${userId}-${Date.now()}`,
      notes: { userId, addressId }
    });

    res.json({
      orderId: rpOrder.id,
      amount: amountPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      computedTotal: total
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/payments/razorpay/verify', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, items, addressId, couponCode } = req.body;
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generated = hmac.digest('hex');
    if (generated !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment signature verification failed' });
    }

    // Recompute pricing and validate stock similarly to /orders
    let regularSubtotal = 0;
    let giftTotal = 0;
    const orderProducts = [];

    // Check stock for all items first
    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      if (!product) throw new Error(`Product ${item.productId} not found`);
      const currentStock = product.sizes.get(item.size) || 0;
      if (currentStock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name} (Size: ${item.size}). Available: ${currentStock}`);
      }
    }

    // Decrement stock and compute prices
    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      const price = item.isGift 
        ? (await FreeGift.findOne({ sku: product.sku }).session(session))?.price || 0
        : product.offerPrice;
      if (item.isGift) giftTotal += price * item.quantity;
      else regularSubtotal += price * item.quantity;

      const newStock = product.sizes.get(item.size) - item.quantity;
      product.sizes.set(item.size, newStock);
      await product.save({ session });

      orderProducts.push({
        productId: item.productId,
        quantity: item.quantity,
        size: item.size,
        price
      });
      
      // Emit stock update
      req.io.emit('stock_updated', { 
        productId: product._id, 
        size: item.size, 
        newStock 
      });
    }

    const subtotal = regularSubtotal + giftTotal;
    let discountAmount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode }).session(session);
      if (coupon && subtotal >= coupon.minBilling) {
        if (coupon.type === 'flat') {
          discountAmount = coupon.value;
        } else {
          discountAmount = (regularSubtotal * coupon.value) / 100;
          if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
          }
        }
      }
    }
    const totalAmount = Math.max(0, Math.round(subtotal - discountAmount));

    const order = new Order({
      userId,
      products: orderProducts,
      totalAmount,
      addressId,
      status: 'pending',
      paymentStatus: 'paid',
      createdAt: new Date().toISOString(),
      orderCode: await generateOrderCode()
    });
    await order.save({ session });

    await session.commitTransaction();
    req.io.emit('order_created', order);
    res.json(order);
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ error: err.message });
  } finally {
    session.endSession();
  }
});
// --- Cart ---
router.post('/cart', async (req, res) => {
  try {
    const { userId, items } = req.body;
    const cart = await Cart.findOneAndUpdate(
      { userId },
      { items, userId },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

let SR_TOKEN = null;
let SR_TOKEN_EXPIRES = 0;
const shiprocketLogin = async () => {
  if (SR_TOKEN && Date.now() < SR_TOKEN_EXPIRES) return SR_TOKEN;
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) return null;
  const { data } = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', { email, password });
  SR_TOKEN = data.token;
  SR_TOKEN_EXPIRES = Date.now() + 1000 * 60 * 50;
  return SR_TOKEN;
};

router.post('/shipping/shiprocket/book', async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const user = await User.findById(order.userId);
    const addr = user?.addresses?.find(a => (a.id || a._id) === order.addressId) || null;

    const token = await shiprocketLogin();
    let trackingId = `SR-${Math.floor(Math.random() * 1000000)}`;
    let labelUrl = '';
    let bookingWarning = null;

    // Validate configuration
    if (!token) {
      return res.status(400).json({ error: 'Shiprocket credentials not configured' });
    }
    if (!addr) {
      return res.status(400).json({ error: 'Customer address not found on this order' });
    }
    // Enrich missing city/state from pincode (India)
    try {
      if ((!addr.city || !addr.state) && addr.pincode) {
        const resp = await axios.get(`https://api.postalpincode.in/pincode/${addr.pincode}`);
        const info = Array.isArray(resp.data) ? resp.data[0] : null;
        const postOffice = info?.PostOffice && info.PostOffice[0];
        if (postOffice) {
          addr.city = addr.city || postOffice.District;
          addr.state = addr.state || postOffice.State;
        }
      }
    } catch (e) {
      // ignore enrichment failure; will fall back to validation error below
    }
    const pickupName = process.env.SHIPROCKET_PICKUP || 'Primary';
    const phone = (user?.phone || addr?.phone || '').toString().replace(/\D/g, '');
    if (!phone || phone.length < 10) {
      return res.status(400).json({ error: 'Invalid phone number for shipment (need 10 digits)' });
    }
    if (!addr.pincode || !addr.city || !addr.state) {
      return res.status(400).json({ error: 'Missing address fields (pincode/city/state) required for booking' });
    }

    if (token && addr) {
      try {
        const productIds = order.products.map(p => p.productId);
        const products = await Product.find({ _id: { $in: productIds } }).lean();

        const payload = {
          order_id: order.orderCode || order.id || order._id?.toString(),
          order_date: new Date(order.createdAt).toISOString().slice(0, 10),
          pickup_location: pickupName,
          billing_customer_name: user?.name || 'Customer',
          billing_last_name: '',
          billing_address: (addr?.apartment || addr?.houseNo || addr?.house || addr?.addressLine1 || '').toString().trim(),
          billing_address_2: (addr?.roadName || addr?.street || addr?.area || addr?.addressLine2 || '').toString().trim(),
          billing_city: addr?.city || '',
          billing_pincode: addr?.pincode || '',
          billing_state: addr?.state || '',
          billing_country: 'India',
          billing_email: user?.email || '',
          billing_phone: phone,
          shipping_is_billing: true,
          order_items: order.products.map(p => {
            const prod = products.find(pr => pr._id.toString() === p.productId);
            return {
              name: prod?.name || p.productId,
              sku: prod?.sku || p.productId,
              units: p.quantity,
              selling_price: p.price
            };
          }),
          payment_method: order.paymentStatus === 'paid' ? 'Prepaid' : 'COD',
          sub_total: order.totalAmount,
          length: 10,
          breadth: 10,
          height: 2,
          weight: Math.max(0.5, order.products.reduce((w, p) => w + 0.25 * p.quantity, 0))
        };
        const createRes = await axios.post('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const shipmentId = createRes.data?.shipment_id;
        if (!shipmentId) {
          const details = createRes.data || 'Shipment id not returned';
          return res.status(400).json({ error: 'Shiprocket booking failed', details });
        }

        try {
          const assignRes = await axios.post('https://apiv2.shiprocket.in/v1/external/courier/assign/awb', { shipment_id: shipmentId }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          trackingId = assignRes.data?.data?.awb_code || trackingId;
          labelUrl = assignRes.data?.data?.label_url || '';
        } catch (e) {
          bookingWarning = (e && e.response && e.response.data) ? e.response.data : (e?.message || 'AWB assignment error');
        }
      } catch (e) {
        const details = (e && e.response && e.response.data) ? e.response.data : (e?.message || 'Unknown booking error');
        return res.status(400).json({ error: 'Shiprocket booking failed', details });
      }
    }

    // Success: persist tracking info and status
    order.status = 'shipped';
    order.trackingId = trackingId;
    await order.save();
    req.io.emit('order_updated', order);
    res.json({ trackingId, labelUrl, order, warning: bookingWarning });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/webhooks/shiprocket', async (req, res) => {
  try {
    const awb = req.body?.awb || req.body?.awb_code || req.body?.tracking_awb;
    const current = (req.body?.current_status || req.body?.status || '').toLowerCase();
    if (!awb) return res.status(400).json({ error: 'AWB missing' });
    const order = await Order.findOne({ trackingId: awb });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    let nextStatus = order.status;
    if (current.includes('picked')) nextStatus = 'shipped';
    else if (current.includes('in transit')) nextStatus = 'shipped';
    else if (current.includes('out for delivery')) nextStatus = 'shipped';
    else if (current.includes('delivered')) nextStatus = 'delivered';
    else if (current.includes('rto') || current.includes('undelivered') || current.includes('cancel')) nextStatus = 'returned';
    order.status = nextStatus;
    await order.save();
    req.io.emit('order_updated', order);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/cart/:userId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId });
    res.json(cart ? cart.items : []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/carts', async (req, res) => {
    try {
        const carts = await Cart.find();
        res.json(carts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Wishlist ---
router.post('/wishlist', async (req, res) => {
  try {
    const { userId, productIds } = req.body;
    const user = await User.findByIdAndUpdate(
      userId,
      { wishlist: productIds },
      { new: true }
    );
    res.json(user ? user.wishlist : []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/wishlist/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    res.json(user ? user.wishlist : []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
