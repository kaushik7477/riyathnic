import mongoose from 'mongoose';

const sectionsSchema = new mongoose.Schema(
  {
    dashboard: { type: Boolean, default: false },
    products: { type: Boolean, default: false },
    orders: { type: Boolean, default: false },
    exchanges: { type: Boolean, default: false },
    customers: { type: Boolean, default: false },
    analytics: { type: Boolean, default: false },
    finance: { type: Boolean, default: false },
    coupons: { type: Boolean, default: false },
    reviews: { type: Boolean, default: false },
    website: { type: Boolean, default: false },
    tools: { type: Boolean, default: false },
    settings: { type: Boolean, default: false },
  },
  { _id: false }
);

const adminAccessSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    sections: { type: sectionsSchema, default: () => ({}) },
    status: { type: String, enum: ['active', 'blocked'], default: 'active' },
    lastActiveAt: { type: Date },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

adminAccessSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  },
});

const AdminAccess = mongoose.model('AdminAccess', adminAccessSchema);
export default AdminAccess;

