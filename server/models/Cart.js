import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  size: { type: String, required: true },
  isGift: { type: Boolean, default: false }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  items: [cartItemSchema],
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Cart', cartSchema);
