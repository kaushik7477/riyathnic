import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: String,
  sku: { type: String, unique: true },
  actualPrice: Number,
  offerPrice: Number,
  description: String,
  images: [String],
  category: [String],
  tags: [String],
  sizes: {
    type: Map,
    of: Number
  },
  isBestSelling: { type: Boolean, default: false },
  quality: String,
  pickupPoint: String,
  returnPolicy: String,
  cancelPolicy: String,
  exchangePolicy: {
    type: {
      type: String,
      enum: ['days', 'no-exchange'],
      default: 'days'
    },
    days: Number,
    description: String
  },
  color: {
    name: String,
    hex: String
  },
  linkedProducts: [String],
  countryOfOrigin: String,
  manufactureDate: Date,
  productionCost: Number,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Product', productSchema);
