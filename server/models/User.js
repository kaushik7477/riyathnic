import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  receiverName: String,
  apartment: String,
  roadName: String,
  city: String,
  state: String,
  pincode: String,
  phone: String,
  isDefault: { type: Boolean, default: false }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

addressSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});

const userSchema = new mongoose.Schema({
  name: { type: String }, // Optional for initial login, can be updated later
  email: { type: String, unique: true, sparse: true }, // Unique if present, but allows multiple nulls
  phone: { type: String, required: true, unique: true }, // Main unique ID
  addresses: [addressSchema],
  wishlist: [{ type: String }],
  orders: [{ type: String }],
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  blockReason: { type: String },
  adminNotes: { type: String },
  tags: [{ type: String }],
  sessionVersion: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Ensure virtual 'id' is included in toJSON
userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) { 
    ret.id = ret._id.toString();
    delete ret._id; 
  }
});

const User = mongoose.model('User', userSchema);
export default User;
