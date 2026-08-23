// CallSession — MongoDB model for active Twilio calls
// Stores state across multiple webhook requests (since serverless is stateless)
// Keyed by Twilio's CallSid. Deleted after call ends and full record is saved.

import mongoose from 'mongoose';

const CallSessionSchema = new mongoose.Schema({
  callSid:      { type: String, required: true, unique: true, index: true },
  from:         { type: String, default: '' },
  to:           { type: String, default: '' },
  customerName: { type: String, default: '' },
  language:     { type: String, enum: ['english', 'hindi', 'marathi'], default: 'english' },
  speechLang:   { type: String, default: 'en-IN' },
  honorific:    { type: String, enum: ['sir', 'maam', ''], default: '' },
  mode:         { type: String, enum: ['talk', 'voicemail', ''], default: '' },
  transcript: [{
    role: { type: String, enum: ['bot', 'customer'] },
    text: { type: String },
    _id: false,
  }],
  aiMessages: [{
    role:    { type: String },
    content: { type: String },
    _id: false,
  }],
  recordingUrl:        { type: String, default: null },
  recordingTranscript: { type: String, default: null },
  startTime:  { type: Date, default: Date.now },
  status:     { type: String, enum: ['active', 'ended'], default: 'active' },
}, {
  timestamps: true,
});

export const CallSession = mongoose.models.CallSession
  || mongoose.model('CallSession', CallSessionSchema);
