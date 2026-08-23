// CallSession — MongoDB model for active Twilio calls
// Stores state across multiple webhook requests (since serverless is stateless)
// Keyed by Twilio's CallSid. Deleted after call ends and full record is saved.

import mongoose from 'mongoose';

const CallSessionSchema = new mongoose.Schema({
  callSid:    { type: String, required: true, unique: true, index: true },
  from:       { type: String, default: '' },   // caller phone number
  to:         { type: String, default: '' },   // your Twilio number
  language:   { type: String, enum: ['english', 'hindi', 'marathi'], default: 'english' },
  speechLang: { type: String, default: 'en-IN' },   // Twilio language code
  honorific:  { type: String, enum: ['sir', 'maam', ''], default: '' },
  mode:       { type: String, enum: ['talk', 'voicemail', ''], default: '' },
  transcript: [{
    role: { type: String, enum: ['bot', 'customer'] },
    text: { type: String },
    _id: false,
  }],
  aiMessages: [{
    role:    { type: String },   // 'user' | 'assistant'
    content: { type: String },
    _id: false,
  }],
  recordingUrl:      { type: String, default: null },
  recordingTranscript: { type: String, default: null },
  startTime:  { type: Date, default: Date.now },
  status:     { type: String, enum: ['active', 'ended'], default: 'active' },
  updatedAt:  { type: Date, default: Date.now },
});

CallSessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const CallSession = mongoose.models.CallSession
  || mongoose.model('CallSession', CallSessionSchema);
