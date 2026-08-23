import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  phone:        { type: String, required: true, unique: true, index: true },
  email:        { type: String, default: '' },
  location:     { type: String, default: '' },
  totalCalls:   { type: Number, default: 1 },
  lastCallDate: { type: Date, default: Date.now },
  tags:         { type: [String], default: [] },
  notes:        { type: String, default: '' },
  createdAt:    { type: Date, default: Date.now },
});

CustomerSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    if (ret.lastCallDate instanceof Date) ret.lastCallDate = ret.lastCallDate.toISOString();
    if (ret.createdAt instanceof Date) ret.createdAt = ret.createdAt.toISOString();
    return ret;
  },
});

export const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
