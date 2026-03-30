import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: String, // Men, Women, Unisex, Couple
  imageUrl: String
});

export default mongoose.model('Category', categorySchema);
