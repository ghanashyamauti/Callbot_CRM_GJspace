import mongoose from 'mongoose';

const TranscriptMessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['bot', 'customer'], required: true },
  text: { type: String, required: true },
  timestamp: { type: Number, default: 0 },
}, { _id: false });

const CallSchema = new mongoose.Schema({
  callId:           { type: String, required: true, unique: true, index: true },
  customerName:     { type: String, required: true },
  customerPhone:    { type: String, required: true, index: true },
  customerEmail:    { type: String, default: '' },
  customerLocation: { type: String, default: '' },
  direction:        { type: String, enum: ['inbound', 'outbound'], default: 'inbound' },
  status:           { type: String, enum: ['completed', 'in-progress', 'missed', 'voicemail'], default: 'completed' },
  duration:         { type: Number, default: 0 },
  startTime:        { type: Date, default: Date.now },
  endTime:          { type: Date },
  transcript:       { type: [TranscriptMessageSchema], default: [] },
  voicemail:        { type: String, default: null }, // voicemail message text
  summary:          { type: String, default: '' },
  queryCategory:    { type: String, default: 'inquiry' },
  queryType:        { type: String, default: '' },
  sentiment:        { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' },
  resolution:       { type: String, enum: ['resolved', 'pending', 'escalated', 'voicemail'], default: 'pending' },
  language:         { type: String, enum: ['english', 'hindi', 'marathi'], default: 'english' },
  recordingUrl:     { type: String, default: null }, // actual audio recording url or base64 audio
  waveformData:     { type: [Number], default: [] },
  createdAt:        { type: Date, default: Date.now },
});

// Virtuals for serialization
CallSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    // Serialize dates to ISO strings
    if (ret.startTime instanceof Date) ret.startTime = ret.startTime.toISOString();
    if (ret.endTime instanceof Date) ret.endTime = ret.endTime.toISOString();
    if (ret.createdAt instanceof Date) ret.createdAt = ret.createdAt.toISOString();
    return ret;
  },
});

export const Call = mongoose.models.Call || mongoose.model('Call', CallSchema);
