import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },
  type: { type: String, enum: ['flat', 'percentage'], required: true },
  value: { type: Number, required: true },
  minBilling: { type: Number, default: 0 },
  maxDiscount: Number,
  expiry: Date,
  isVisible: { type: Boolean, default: true },
  usageCount: { type: Number, default: 0 },
  usedBy: [{
    userId: String,
    orderId: String,
    savings: Number,
    date: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Coupon', couponSchema);
