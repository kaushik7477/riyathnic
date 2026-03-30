import mongoose from 'mongoose';

const freeGiftSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true },
  minBilling: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  description: String,
  price: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('FreeGift', freeGiftSchema);
