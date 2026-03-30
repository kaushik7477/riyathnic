import mongoose from 'mongoose';

const heroImageSchema = new mongoose.Schema({
  imageUrl: String,
  sku: String, // Product SKU to link to
  position: { type: Number, min: 1, max: 9, unique: true } // 1-9
});

export default mongoose.model('HeroImage', heroImageSchema);