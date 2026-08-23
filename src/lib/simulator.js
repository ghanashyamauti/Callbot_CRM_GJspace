// Call Simulation Engine
// Follows the proper callbot flow:
// 1. Welcome & greet
// 2. Ask: direct connect or bot assist?
// 3. If assist → talk about real estate (GJ Spaces services)
// 4. Mark query category
// 5. If direct connect → "Our agent will contact you soon" → end call

import { v4 as uuidv4 } from 'uuid';
import {
  INDIAN_NAMES,
  PUNE_AREAS,
  getRandomItem,
  getRandomPhone,
} from './gjspaces-knowledge';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'GJ Spaces';

function generateWaveformData(duration) {
  const bars = Math.min(Math.max(Math.floor(duration / 3), 30), 100);
  return Array.from({ length: bars }, () => Math.random() * 0.8 + 0.2);
}

function generateTimestamps(transcript, baseDuration) {
  const avgTimePerMessage = baseDuration / transcript.length;
  let elapsed = 0;
  return transcript.map((msg) => {
    const variance = (Math.random() - 0.5) * avgTimePerMessage * 0.3;
    elapsed += avgTimePerMessage + variance;
    return { ...msg, timestamp: Math.max(1, Math.round(elapsed)) };
  });
}

// ========================================
// CONVERSATION SCENARIOS — Real Bot Flow
// ========================================

const ASSIST_CONVERSATIONS = {
  inquiry: [
    {
      transcript: [
        { role: 'bot', text: `Welcome to ${BRAND}! Thank you for calling. I'm your virtual assistant. How may I help you today?\n\nWould you like to:\n1. Speak with our team directly\n2. Get quick information from me` },
        { role: 'customer', text: 'I want some information about your co-working spaces.' },
        { role: 'bot', text: `Great choice! I'd be happy to help you with co-working space information.\n\nAt ${BRAND}, we offer:\n\n• Hot Desk: ₹5,000/month — Flexible shared seating\n• Dedicated Desk: ₹8,000/month — Your own fixed desk\n• Private Cabin: ₹15,000/month — For teams of 2-5\n\nAll plans include high-speed WiFi, power backup, tea/coffee, and meeting room access.\n\nWhat would you like to know more about?` },
        { role: 'customer', text: 'The dedicated desk plan sounds interesting. Is it available right now?' },
        { role: 'bot', text: `Yes! We currently have dedicated desks available. The plan includes:\n\n✓ Fixed desk with ergonomic chair\n✓ Personal locker\n✓ 10 hours of meeting room access/month\n✓ Printing quota\n✓ 24/7 access option\n\nWould you like to schedule a free site visit to see the space? Or would you prefer to speak with our team directly?` },
        { role: 'customer', text: 'I\'d like to visit first. Can I come tomorrow?' },
        { role: 'bot', text: `Absolutely! We're open for visits Monday to Saturday, 9 AM to 7 PM. I've noted your interest for a site visit tomorrow.\n\nOur team will reach out to you shortly to confirm the exact time. Is there anything else you'd like to know?` },
        { role: 'customer', text: 'No, that\'s all. Thank you!' },
        { role: 'bot', text: `Thank you for calling ${BRAND}! We look forward to seeing you. Have a wonderful day! 😊` },
      ],
      summary: 'Customer inquired about co-working plans, interested in Dedicated Desk (₹8,000/month). Wants to schedule a site visit tomorrow. Query: co-working space availability.',
      sentiment: 'positive',
      duration: 195,
      queryType: 'Co-Working Space Inquiry',
    },
    {
      transcript: [
        { role: 'bot', text: `Welcome to ${BRAND}! Thank you for calling. I'm your virtual assistant.\n\nWould you like to speak with our team directly, or can I assist you with some information?` },
        { role: 'customer', text: 'Tell me about your interior design services.' },
        { role: 'bot', text: `Wonderful! ${BRAND} offers complete interior design solutions:\n\n🏠 Residential Design — Starting at ₹800/sq.ft\n🏢 Commercial Design — Starting at ₹600/sq.ft\n\nOur services include:\n• Free initial consultation\n• 3D visualization & planning\n• Modular kitchen & wardrobes\n• Full project execution\n• 0% EMI available up to 12 months\n\nWhat type of project are you looking at?` },
        { role: 'customer', text: 'I have a 3BHK flat in Baner, about 1200 sq ft. What would it cost?' },
        { role: 'bot', text: `For a 1200 sq.ft 3BHK in Baner, here's an estimate:\n\n• Basic Package: ~₹9.6 Lakhs\n• Premium Package: ~₹14.4 Lakhs\n• Luxury Package: ~₹20+ Lakhs\n\nTimeline is typically 8-12 weeks. For a precise quote, our design team would need to visit the site.\n\nWould you like us to arrange a free site visit and consultation?` },
        { role: 'customer', text: 'Let me discuss with my wife first. Can I call back?' },
        { role: 'bot', text: `Of course! Take your time. You can call us anytime during working hours. I've noted your requirement — 3BHK interior design in Baner, 1200 sq.ft.\n\nOur agent will also follow up with you. Thank you for calling ${BRAND}! 🙏` },
      ],
      summary: 'Customer inquired about interior design for 3BHK (1200 sq.ft) in Baner. Discussed pricing packages (₹9.6L-20L+). Customer wants to discuss with family. Follow-up needed.',
      sentiment: 'positive',
      duration: 230,
      queryType: 'Interior Design Inquiry',
    },
  ],
  booking: [
    {
      transcript: [
        { role: 'bot', text: `Welcome to ${BRAND}! I'm your virtual assistant.\n\nWould you like to connect with our team directly, or can I help you with something?` },
        { role: 'customer', text: 'I want to book a meeting room for next week.' },
        { role: 'bot', text: `I'd be happy to help with that!\n\nWe have the following meeting rooms:\n\n🏢 Small (4-6 people): ₹500/hour\n🏢 Medium (8-12 people): ₹800/hour\n🏢 Large (20-30 people): ₹1,500/hour\n\nAll rooms include projector, whiteboard, AC, and WiFi. Which size would you need?` },
        { role: 'customer', text: 'Medium one, for 3 hours on Monday, 10 AM to 1 PM.' },
        { role: 'bot', text: `Let me note that down:\n\n📋 Booking Request:\n• Room: Medium Conference Room\n• Date: Next Monday\n• Time: 10:00 AM - 1:00 PM (3 hours)\n• Estimated Cost: ₹2,400\n\nOur team will confirm availability and reach out to you to finalize the booking. Payment can be made on-site. Is there anything else?` },
        { role: 'customer', text: 'No, that\'s perfect. Thanks!' },
        { role: 'bot', text: `Great! Our agent will contact you shortly to confirm. Thank you for calling ${BRAND}! 🎉` },
      ],
      summary: 'Customer wants to book Medium Conference Room for next Monday, 10 AM - 1 PM (3 hours, ₹2,400). Agent follow-up needed to confirm availability.',
      sentiment: 'positive',
      duration: 155,
      queryType: 'Meeting Room Booking',
    },
  ],
  complaint: [
    {
      transcript: [
        { role: 'bot', text: `Welcome to ${BRAND}! I'm your virtual assistant.\n\nWould you like to speak with our team directly, or may I assist you?` },
        { role: 'customer', text: 'I need to speak with someone. The AC on the second floor hasn\'t been working for 3 days.' },
        { role: 'bot', text: `I'm sorry to hear about the inconvenience. Let me note down your complaint:\n\n⚠️ Issue: AC malfunction on 2nd floor\n📅 Duration: 3 days\n\nI understand this affects your work. Our agent will contact you soon to resolve this on priority. Could you share your membership ID or name?` },
        { role: 'customer', text: 'My name is Priya Deshpande, membership GJ-2024-156.' },
        { role: 'bot', text: `Thank you, Ms. Deshpande. I've logged your complaint as high-priority.\n\n📝 Complaint Reference: Your agent will reach out within the hour.\n\nOur agent will contact you soon with a resolution. We sincerely apologize for the inconvenience. Is there anything else?` },
        { role: 'customer', text: 'No, just fix it please.' },
        { role: 'bot', text: `Absolutely. We're on it. Thank you for your patience, and sorry again. Our team will contact you soon. Take care! 🙏` },
      ],
      summary: 'COMPLAINT: Member Priya Deshpande (GJ-2024-156) — AC malfunction on 2nd floor for 3 days. Logged as high-priority. Agent follow-up required urgently.',
      sentiment: 'negative',
      duration: 180,
      queryType: 'Facility Complaint',
    },
  ],
  support: [
    {
      transcript: [
        { role: 'bot', text: `Welcome to ${BRAND}! I'm your virtual assistant.\n\nWould you like to connect with our team, or can I help you with something?` },
        { role: 'customer', text: 'I want to upgrade my membership from hot desk to dedicated desk.' },
        { role: 'bot', text: `Great choice! Here's a quick comparison:\n\n📊 Hot Desk → Dedicated Desk:\n• Price: ₹5,000 → ₹8,000/month\n• Seating: Shared → Fixed personal desk\n• Storage: Shared → Personal locker\n• Meeting Room: 5 hrs → 10 hrs/month\n\nOur team can process this upgrade for you. Would you like our agent to contact you and finalize the switch?` },
        { role: 'customer', text: 'Yes, please have them call me today.' },
        { role: 'bot', text: `Noted! I've marked your upgrade request. Our agent will contact you today to process the upgrade and assign your new desk.\n\nThank you for choosing ${BRAND}! We're glad you're growing with us. 🌟` },
      ],
      summary: 'Member wants to upgrade from Hot Desk (₹5K/month) to Dedicated Desk (₹8K/month). Requested agent callback today to process upgrade.',
      sentiment: 'positive',
      duration: 145,
      queryType: 'Membership Upgrade',
    },
  ],
};

// Direct Connect Flow — customer wants to talk to human agent directly
const DIRECT_CONNECT_CONVERSATIONS = [
  {
    transcript: [
      { role: 'bot', text: `Welcome to ${BRAND}! Thank you for calling. I'm your virtual assistant.\n\nWould you like to speak with our team directly, or can I help you with quick information?` },
      { role: 'customer', text: 'I want to speak with someone directly.' },
      { role: 'bot', text: `Absolutely! I'll connect you with our team right away.\n\nOur agent will contact you very soon. Could you briefly let me know what your query is about so I can direct you to the right person?` },
      { role: 'customer', text: 'It\'s about a new office space for my startup.' },
      { role: 'bot', text: `Got it! I've noted your requirement — new office space for a startup.\n\nOur agent will contact you soon with the best options. Thank you for calling ${BRAND}! Have a great day! 🙏` },
    ],
    summary: 'Customer requested direct connect. Query: new office space for startup. Agent callback required.',
    sentiment: 'neutral',
    duration: 90,
    queryType: 'Direct Connect — Office Space',
    queryCategory: 'inquiry',
    resolution: 'escalated',
  },
  {
    transcript: [
      { role: 'bot', text: `Welcome to ${BRAND}! I'm your virtual assistant.\n\nWould you like to connect with our team directly, or may I assist you?` },
      { role: 'customer', text: 'Connect me to an agent please.' },
      { role: 'bot', text: `Sure! Our agent will contact you soon. Before I go, may I know what your query is regarding? This helps us connect you with the right person.` },
      { role: 'customer', text: 'I want to discuss a commercial interior design project.' },
      { role: 'bot', text: `Wonderful! I've noted your interest in commercial interior design.\n\nOur design consultant will reach out to you shortly. Thank you for calling ${BRAND}!` },
    ],
    summary: 'Customer requested direct connect for commercial interior design project. Design consultant follow-up needed.',
    sentiment: 'neutral',
    duration: 75,
    queryType: 'Direct Connect — Interior Design',
    queryCategory: 'inquiry',
    resolution: 'escalated',
  },
];

export function simulateCall(category = null, directConnect = false) {
  // Generate customer info
  const customerName = getRandomItem(INDIAN_NAMES);
  const customerPhone = getRandomPhone();
  const customerEmail = customerName.toLowerCase().replace(/\s+/g, '.') + '@' + getRandomItem(['gmail.com', 'yahoo.com', 'outlook.com']);
  const customerLocation = getRandomItem(PUNE_AREAS) + ', Pune';

  let conversation;
  let selectedCategory;

  if (directConnect) {
    // Direct connect flow
    conversation = getRandomItem(DIRECT_CONNECT_CONVERSATIONS);
    selectedCategory = conversation.queryCategory || 'inquiry';
  } else {
    // Assisted call flow — pick scenario
    const categories = Object.keys(ASSIST_CONVERSATIONS);
    selectedCategory = category || getRandomItem(categories);
    const scenarios = ASSIST_CONVERSATIONS[selectedCategory];
    conversation = getRandomItem(scenarios);
  }

  const durationVariance = Math.floor((Math.random() - 0.5) * 40);
  const duration = conversation.duration + durationVariance;
  const now = new Date();
  const startTime = new Date(now.getTime() - Math.floor(Math.random() * 60000));
  const endTime = new Date(startTime.getTime() + duration * 1000);
  const transcript = generateTimestamps(conversation.transcript, duration);

  return {
    id: uuidv4(),
    callId: 'CALL-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 5).toUpperCase(),
    customerName,
    customerPhone,
    customerEmail,
    customerLocation,
    direction: 'inbound',
    status: 'completed',
    duration,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    transcript,
    summary: conversation.summary,
    queryCategory: selectedCategory,
    queryType: conversation.queryType || selectedCategory,
    sentiment: conversation.sentiment,
    resolution: directConnect ? 'escalated' : (conversation.sentiment === 'negative' ? 'pending' : 'resolved'),
    waveformData: generateWaveformData(duration),
    createdAt: startTime.toISOString(),
  };
}
