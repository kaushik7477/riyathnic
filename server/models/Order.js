import mongoose from 'mongoose';

const orderProductSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  quantity: { type: Number, required: true },
  size: { type: String, required: true },
  price: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema({
  orderCode: { type: String, unique: true, index: true },
  userId: { type: String, required: true }, // Could be ObjectId if referencing User model
  products: [orderProductSchema],
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'], 
    default: 'pending' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['paid', 'unpaid'], 
    default: 'unpaid' 
  },
  trackingId: String,
  addressId: String, // ID of the address used
  refundDetails: {
    refundId: String,
    amount: Number,
    upiId: String,
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String
  }
}, { timestamps: true });

// Ensure virtual 'id' is included in toJSON
orderSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) { delete ret._id; }
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
