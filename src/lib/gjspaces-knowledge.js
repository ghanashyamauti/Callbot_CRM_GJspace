// GJ Spaces Knowledge Base — Bot conversation intelligence
// Contains business info, FAQ, and conversation templates

export const GJ_SPACES_INFO = {
  name: 'GJ Spaces',
  tagline: 'Premium Co-Working & Interior Design Solutions',
  location: 'Pune, Maharashtra, India',
  phone: '+91 98765 43210',
  email: 'info@gjspaces.com',
  website: 'https://gjspaces.com',
  hours: 'Monday - Saturday: 9:00 AM - 7:00 PM',
  established: '2020',
};

export const SERVICES = [
  {
    name: 'Co-Working Spaces',
    description: 'Premium shared office spaces with modern amenities, high-speed internet, meeting rooms, and a vibrant community.',
    pricing: 'Starting from ₹5,000/month for hot desks, ₹8,000/month for dedicated desks, ₹15,000/month for private cabins.',
  },
  {
    name: 'Interior Design',
    description: 'End-to-end interior design services for residential and commercial spaces. Modern, contemporary, and traditional designs.',
    pricing: 'Starting from ₹800/sq.ft for residential, ₹600/sq.ft for commercial projects.',
  },
  {
    name: 'Office Setup & Renovation',
    description: 'Complete office setup solutions including furniture, IT infrastructure, lighting, and acoustic design.',
    pricing: 'Custom quotes based on office size and requirements. Typical range: ₹3-15 Lakhs.',
  },
  {
    name: 'Virtual Office',
    description: 'Professional business address, mail handling, and access to meeting rooms without a physical office.',
    pricing: '₹2,500/month with GST address, ₹3,500/month with meeting room access.',
  },
  {
    name: 'Event Space Rental',
    description: 'Modern event spaces for workshops, seminars, and team building activities. Capacity: 20-100 people.',
    pricing: '₹5,000-₹15,000 per event depending on duration and capacity.',
  },
];

export const FAQS = [
  { q: 'What are your working hours?', a: 'Our co-working space is open Monday to Saturday, 9 AM to 7 PM. We also offer 24/7 access plans for dedicated members.' },
  { q: 'Do you offer free trials?', a: 'Yes! We offer a complimentary one-day trial pass. You can experience our workspace before committing to a plan.' },
  { q: 'Is parking available?', a: 'Yes, we have both two-wheeler and four-wheeler parking available for our members at no extra cost.' },
  { q: 'Can I book a meeting room?', a: 'Absolutely! Meeting rooms can be booked hourly starting at ₹500/hour. Members get 10 complimentary hours per month.' },
  { q: 'Do you provide internet?', a: 'Yes, we provide high-speed fiber internet (100 Mbps) with backup connectivity to ensure uninterrupted work.' },
  { q: 'What amenities are included?', a: 'Our amenities include high-speed WiFi, printing, tea/coffee, power backup, AC, sanitization, reception services, and locker storage.' },
  { q: 'Can I visit before joining?', a: 'Of course! You can schedule a free site visit anytime during our working hours. We\'ll give you a complete tour of our facility.' },
  { q: 'Do you handle residential interiors?', a: 'Yes! We specialize in both residential and commercial interior design. Our team has completed 200+ residential projects in Pune.' },
  { q: 'What is your design process?', a: 'Our process includes: 1) Initial consultation, 2) Space analysis, 3) Concept design, 4) 3D visualization, 5) Execution, 6) Handover. Typical timeline is 6-12 weeks.' },
  { q: 'Do you offer EMI options?', a: 'Yes, we offer flexible EMI options for interior design projects through our banking partners. 0% EMI available for up to 12 months.' },
];

// Indian names for realistic simulation
export const INDIAN_NAMES = [
  'Aarav Sharma', 'Priya Patel', 'Rohit Deshmukh', 'Sneha Kulkarni', 'Vikram Singh',
  'Ananya Gupta', 'Arjun Mehta', 'Kavita Joshi', 'Raj Malhotra', 'Meera Reddy',
  'Amit Kumar', 'Divya Nair', 'Sanjay Bhosale', 'Pooja Sawant', 'Nikhil Patil',
  'Shruti Deshpande', 'Aditya Rao', 'Neha Kapoor', 'Rahul Chavan', 'Swati Iyer',
  'Karan Thakur', 'Ritu Agarwal', 'Pranav Wagh', 'Isha Banerjee', 'Vishal Gaikwad',
  'Tanvi Shah', 'Manoj Pillai', 'Deepa Mane', 'Sachin Jadhav', 'Ankita Mishra',
];

export const PUNE_AREAS = [
  'Kothrud', 'Hinjawadi', 'Baner', 'Wakad', 'Viman Nagar', 'Kalyani Nagar',
  'Koregaon Park', 'Hadapsar', 'Kharadi', 'Magarpatta', 'Aundh', 'Shivaji Nagar',
  'Deccan', 'Pimpri-Chinchwad', 'Bavdhan', 'Pashan', 'SB Road', 'FC Road',
];

// Pre-scripted conversation scenarios
export const SCENARIOS = {
  inquiry: {
    label: 'General Inquiry',
    icon: '💬',
    description: 'Customer asking about services, pricing, or facilities',
    conversations: [
      {
        customerName: null, // Will be randomized
        transcript: [
          { role: 'bot', text: 'Welcome to GJ Spaces! I\'m your virtual assistant. How can I help you today?' },
          { role: 'customer', text: 'Hi, I\'m looking for co-working space in Pune. Can you tell me about your plans?' },
          { role: 'bot', text: 'Of course! We have several flexible co-working plans:\n\n• Hot Desk: ₹5,000/month - Shared seating\n• Dedicated Desk: ₹8,000/month - Your own fixed desk\n• Private Cabin: ₹15,000/month - For teams of 2-5\n\nAll plans include high-speed WiFi, power backup, tea/coffee, and access to meeting rooms.' },
          { role: 'customer', text: 'That sounds good. What about the dedicated desk? Is it available immediately?' },
          { role: 'bot', text: 'Yes! We currently have dedicated desks available. You can start as early as tomorrow. The plan includes:\n\n✓ Fixed desk with ergonomic chair\n✓ Personal locker\n✓ 10 hours of meeting room access/month\n✓ Printing quota of 100 pages/month\n✓ 24/7 access option available\n\nWould you like to schedule a free site visit to see the space?' },
          { role: 'customer', text: 'Yes, I\'d like to visit. When can I come?' },
          { role: 'bot', text: 'You\'re welcome to visit us anytime during our working hours: Monday to Saturday, 9 AM to 7 PM. I\'d recommend scheduling a specific time so our team can give you a personalized tour. Would you prefer morning or afternoon?' },
          { role: 'customer', text: 'Tomorrow afternoon would work. Around 2 PM?' },
          { role: 'bot', text: 'I\'ve noted your visit for tomorrow at 2 PM. Our team will be ready to show you around and answer any questions. Our address is in Pune. Is there anything else you\'d like to know?' },
          { role: 'customer', text: 'No, that\'s all. Thank you!' },
          { role: 'bot', text: 'Thank you for your interest in GJ Spaces! We look forward to seeing you tomorrow. Have a great day! 😊' },
        ],
        summary: 'Customer inquired about co-working plans, showed interest in dedicated desk at ₹8,000/month, and scheduled a site visit for tomorrow at 2 PM.',
        sentiment: 'positive',
        duration: 180,
      },
      {
        transcript: [
          { role: 'bot', text: 'Welcome to GJ Spaces! How may I assist you today?' },
          { role: 'customer', text: 'I want to know about your interior design services.' },
          { role: 'bot', text: 'We\'d love to help transform your space! GJ Spaces offers end-to-end interior design services:\n\n🏠 Residential: Starting at ₹800/sq.ft\n🏢 Commercial: Starting at ₹600/sq.ft\n\nOur process includes free consultation, 3D visualization, and complete project execution. We\'ve completed 200+ projects in Pune.' },
          { role: 'customer', text: 'I have a 2BHK apartment in Baner, about 850 sq ft. What would be the approximate cost?' },
          { role: 'bot', text: 'For an 850 sq.ft 2BHK in Baner, here\'s an approximate breakdown:\n\n• Basic Package: ₹6.8 Lakhs (₹800/sq.ft)\n• Premium Package: ₹10.2 Lakhs (₹1,200/sq.ft)\n• Luxury Package: ₹14.5 Lakhs+ (₹1,700/sq.ft)\n\nThis includes modular kitchen, wardrobes, false ceiling, painting, and electrical work. We also offer 0% EMI for up to 12 months!' },
          { role: 'customer', text: 'The premium package sounds interesting. How long does it typically take?' },
          { role: 'bot', text: 'For a 2BHK apartment, our typical timeline is:\n\n📐 Design Phase: 2-3 weeks\n🏗️ Execution Phase: 6-8 weeks\n✅ Total: 8-11 weeks\n\nWe start with a free site visit and consultation. Shall I schedule one for you?' },
          { role: 'customer', text: 'Let me discuss with my family first. Can I call back later?' },
          { role: 'bot', text: 'Absolutely! Take your time. You can reach us anytime at +91 98765 43210 or visit our website at gjspaces.com. We\'re here to help whenever you\'re ready. Have a wonderful day!' },
        ],
        summary: 'Customer inquired about interior design for 2BHK apartment (850 sq.ft) in Baner. Discussed pricing packages (₹6.8L-14.5L). Customer wants to discuss with family before proceeding.',
        sentiment: 'positive',
        duration: 240,
      },
    ],
  },
  booking: {
    label: 'Booking & Appointment',
    icon: '📅',
    description: 'Customer wanting to book a visit, service, or meeting room',
    conversations: [
      {
        transcript: [
          { role: 'bot', text: 'Welcome to GJ Spaces! How can I help you today?' },
          { role: 'customer', text: 'I want to book a meeting room for next Monday.' },
          { role: 'bot', text: 'I\'d be happy to help you book a meeting room! We have:\n\n🏢 Small Room (4-6 people): ₹500/hour\n🏢 Medium Room (8-12 people): ₹800/hour\n🏢 Large Conference Hall (20-30 people): ₹1,500/hour\n\nAll rooms include a projector, whiteboard, AC, and WiFi. Which size would work for you?' },
          { role: 'customer', text: 'I need the medium room for about 3 hours. From 10 AM to 1 PM.' },
          { role: 'bot', text: 'Let me check availability for the Medium Room on Monday, 10 AM to 1 PM.\n\n✅ Great news! The room is available!\n\nBooking Summary:\n• Room: Medium Conference Room\n• Date: Next Monday\n• Time: 10:00 AM - 1:00 PM (3 hours)\n• Cost: ₹2,400 (₹800 × 3 hours)\n\nShall I confirm this booking?' },
          { role: 'customer', text: 'Yes, please confirm. Do you need any advance payment?' },
          { role: 'bot', text: 'Your booking is confirmed! 🎉\n\nPayment can be made on the day of your visit. We accept UPI, cards, and cash. I\'ll send a confirmation to your registered number.\n\nA few things to note:\n• Arrive 10 minutes early for setup\n• Complimentary tea/coffee for all attendees\n• Free cancellation up to 24 hours before\n\nAnything else I can help with?' },
          { role: 'customer', text: 'That\'s perfect. Thank you!' },
          { role: 'bot', text: 'You\'re welcome! See you on Monday. Have a productive week ahead! 🙌' },
        ],
        summary: 'Customer booked Medium Conference Room for next Monday, 10 AM - 1 PM (3 hours) at ₹2,400. Booking confirmed successfully.',
        sentiment: 'positive',
        duration: 150,
      },
      {
        transcript: [
          { role: 'bot', text: 'Hello! Welcome to GJ Spaces. How may I help you?' },
          { role: 'customer', text: 'Hi, I\'d like to schedule a site visit for your co-working space.' },
          { role: 'bot', text: 'We\'d love to show you around! Our space is open for visits Monday through Saturday, 9 AM to 7 PM.\n\nDuring the visit, you\'ll get to see:\n• Our open workspace and dedicated desks\n• Private cabins and meeting rooms\n• Pantry and recreation areas\n• Parking facilities\n\nWhen would be convenient for you?' },
          { role: 'customer', text: 'How about this Saturday at 11 AM? I\'ll be coming with my business partner.' },
          { role: 'bot', text: 'Saturday at 11 AM works perfectly! I\'ve scheduled your visit.\n\n📋 Visit Details:\n• Date: This Saturday\n• Time: 11:00 AM\n• Visitors: 2 people\n• Duration: ~30-45 minutes\n\nOur team member will give you a complete walkthrough and explain all our plans. May I have your name for the appointment?' },
          { role: 'customer', text: 'Sure, it\'s Rajesh Khanna.' },
          { role: 'bot', text: 'Thank you, Mr. Khanna! Your visit is confirmed for Saturday at 11 AM. You\'ll receive a confirmation SMS shortly.\n\nOur address will be shared via WhatsApp. Is there anything specific you\'d like us to prepare or any particular requirements you have?' },
          { role: 'customer', text: 'We need space for a team of about 8 people. Please keep that in mind during the tour.' },
          { role: 'bot', text: 'Noted! We have excellent options for a team of 8. Our team will specifically show you our private cabin section which is perfect for your requirement. Looking forward to seeing you on Saturday! 🏢' },
        ],
        summary: 'Customer (Rajesh Khanna) scheduled a site visit for Saturday at 11 AM with business partner. Looking for space for team of 8 people.',
        sentiment: 'positive',
        duration: 200,
      },
    ],
  },
  complaint: {
    label: 'Complaint',
    icon: '⚠️',
    description: 'Customer raising an issue or filing a complaint',
    conversations: [
      {
        transcript: [
          { role: 'bot', text: 'Welcome to GJ Spaces. How can I assist you today?' },
          { role: 'customer', text: 'I\'m a member and I need to raise a complaint. The AC in the second floor hasn\'t been working properly for 3 days now.' },
          { role: 'bot', text: 'I sincerely apologize for the inconvenience. A comfortable workspace is our top priority. Let me note down the details:\n\n• Issue: AC malfunction on 2nd floor\n• Duration: 3 days\n\nCould you please share your membership ID or the name registered with us?' },
          { role: 'customer', text: 'My membership ID is GJ-2024-156. Name is Priya Deshpande. I\'m paying full price and expect proper facilities.' },
          { role: 'bot', text: 'I completely understand your frustration, Ms. Deshpande. You absolutely deserve a comfortable working environment. Here\'s what I\'m doing:\n\n🔧 Immediate Action:\n1. Escalating this to our facility manager right away\n2. Requesting priority AC repair/service today\n3. Logging this as a high-priority complaint (#COMP-0892)\n\nAs a temporary measure, would you like to be relocated to our 3rd floor where all ACs are functioning normally?' },
          { role: 'customer', text: 'Yes, please arrange that. And I want to know when the AC will be fixed permanently.' },
          { role: 'bot', text: 'I\'ve arranged a temporary desk for you on the 3rd floor. You can move whenever convenient.\n\nRegarding the permanent fix:\n• Our maintenance team will inspect today by 2 PM\n• Estimated repair time: Within 24 hours\n• You\'ll receive an update call from our facility manager\n\nAs a gesture of goodwill, we\'d like to extend your membership by 3 complimentary days. Would that be acceptable?' },
          { role: 'customer', text: 'Okay, that\'s reasonable. Please make sure it gets fixed tomorrow.' },
          { role: 'bot', text: 'Absolutely, Ms. Deshpande. You have my word. I\'ve marked this as urgent. Our team will keep you updated. If you face any further issues, please don\'t hesitate to contact us. We value your membership! 🙏' },
        ],
        summary: 'Member Priya Deshpande (GJ-2024-156) complained about AC malfunction on 2nd floor for 3 days. Temporary relocation to 3rd floor arranged. AC repair escalated as urgent. 3 complimentary days offered.',
        sentiment: 'negative',
        duration: 270,
      },
      {
        transcript: [
          { role: 'bot', text: 'Hello! Welcome to GJ Spaces support. How can I help?' },
          { role: 'customer', text: 'The WiFi has been extremely slow today. I can barely load web pages. This is affecting my work.' },
          { role: 'bot', text: 'I\'m sorry to hear that. Reliable internet is crucial for productivity. Let me check the status.\n\n🔍 Checking network status...\n\nI see there\'s been higher than usual traffic on the 1st floor network. Our IT team is aware and working on it. Could you tell me which floor and desk you\'re at?' },
          { role: 'customer', text: 'I\'m on the first floor, desk D-12. I have a client call in 30 minutes and I need stable internet.' },
          { role: 'bot', text: 'I understand the urgency. Here are immediate solutions:\n\n1. 🔄 Our IT team is rebooting the 1st floor router right now (2-3 min)\n2. 📱 You can connect to our backup network: GJSpaces-5G (password will be sent to your phone)\n3. 🏢 For your client call, I can reserve Meeting Room A which has a dedicated internet line\n\nWhich option works best for you?' },
          { role: 'customer', text: 'The meeting room sounds good for the call. Please book it.' },
          { role: 'bot', text: 'Done! Meeting Room A is reserved for you for the next 2 hours at no charge.\n\n• Room: A (Ground Floor)\n• Time: Now - 2 hours\n• Dedicated 100Mbps line\n• Cost: Complimentary (due to inconvenience)\n\nThe WiFi issue should also be resolved within the next 15 minutes. We\'ll notify you once it\'s back to full speed. Sorry again for the trouble!' },
          { role: 'customer', text: 'Alright, thanks for the quick response.' },
          { role: 'bot', text: 'You\'re welcome! Good luck with your client call. We\'ll make sure this doesn\'t happen again. 💪' },
        ],
        summary: 'Member reported slow WiFi on 1st floor (Desk D-12). Had urgent client call. Complimentary meeting room reserved. IT team working on router reset. Issue expected to resolve within 15 minutes.',
        sentiment: 'neutral',
        duration: 190,
      },
    ],
  },
  support: {
    label: 'General Support',
    icon: '🛠️',
    description: 'Customer needing help with membership, billing, or facilities',
    conversations: [
      {
        transcript: [
          { role: 'bot', text: 'Hi there! Welcome to GJ Spaces. What can I do for you?' },
          { role: 'customer', text: 'I want to upgrade my membership from hot desk to dedicated desk. How do I do that?' },
          { role: 'bot', text: 'Great choice! Upgrading is simple. Here\'s what changes with a Dedicated Desk plan:\n\n📊 Hot Desk → Dedicated Desk Comparison:\n• Price: ₹5,000 → ₹8,000/month\n• Seating: Shared → Fixed personal desk\n• Storage: Shared → Personal locker\n• Meeting Room: 5 hrs/month → 10 hrs/month\n• Access: Business hours → 24/7 option\n\nThe upgrade can take effect from your next billing cycle. Shall I process it?' },
          { role: 'customer', text: 'Can it start from today? I\'ll pay the difference.' },
          { role: 'bot', text: 'Yes, absolutely! I can process an immediate upgrade.\n\n💰 Pro-rated charges:\n• Days remaining in current cycle: 18 days\n• Difference per day: ~₹100\n• Pro-rated amount: ₹1,800\n• Next month onwards: ₹8,000/month\n\nI\'ll assign you desk D-24 (window seat with natural light). Would you like to proceed?' },
          { role: 'customer', text: 'D-24 sounds nice! Yes, please go ahead.' },
          { role: 'bot', text: 'Your upgrade is processed! 🎉\n\n✅ New Plan: Dedicated Desk\n✅ Desk Number: D-24 (2nd Floor, Window)\n✅ Pro-rated charge: ₹1,800 (payable today)\n✅ Effective: Immediately\n\nYour locker key will be available at the reception. Welcome to the Dedicated Desk family! Is there anything else?' },
          { role: 'customer', text: 'No, that\'s all. Thanks!' },
          { role: 'bot', text: 'Enjoy your new dedicated desk! If you need any help settling in, our staff is always around. Have a productive day! ✨' },
        ],
        summary: 'Member upgraded from Hot Desk (₹5,000/month) to Dedicated Desk (₹8,000/month). Assigned desk D-24. Pro-rated charge of ₹1,800 applied. Effective immediately.',
        sentiment: 'positive',
        duration: 210,
      },
      {
        transcript: [
          { role: 'bot', text: 'Welcome to GJ Spaces! How can I help you today?' },
          { role: 'customer', text: 'I received my invoice for this month and I think there\'s a billing error. I was charged ₹10,000 but my plan is ₹8,000.' },
          { role: 'bot', text: 'I\'m sorry about that confusion. Let me look into your billing right away. Could you share your membership ID or registered phone number?' },
          { role: 'customer', text: 'Phone number is 9876543210. Name is Amit Kulkarni.' },
          { role: 'bot', text: 'Thank you, Mr. Kulkarni. I\'ve pulled up your account.\n\n📋 Billing Breakdown for this month:\n• Dedicated Desk Plan: ₹8,000\n• Meeting Room Usage (2.5 hrs beyond free quota): ₹1,250\n• Printing (87 pages beyond quota): ₹750\n• Total: ₹10,000\n\nIt appears the extra charges are for meeting room overtime and additional printing. Would you like a detailed usage report?' },
          { role: 'customer', text: 'Oh, I didn\'t realize I went over the quota. Can you send me the detailed report?' },
          { role: 'bot', text: 'Of course! I\'ll email the detailed usage report to your registered email address within the next 30 minutes.\n\n💡 Quick Tip: You can track your real-time usage through our member portal at members.gjspaces.com. This way, you\'ll always know how much of your quota you\'ve used.\n\nWould you like me to set up usage alerts so you\'re notified when you\'re at 80% of your quota?' },
          { role: 'customer', text: 'Yes, that would be helpful. Please set that up.' },
          { role: 'bot', text: 'Done! Usage alerts activated. You\'ll get notifications at 80% and 100% of your meeting room and printing quotas.\n\nIs there anything else I can help with, Mr. Kulkarni?' },
          { role: 'customer', text: 'No, thanks for clarifying. That makes sense now.' },
          { role: 'bot', text: 'You\'re welcome! Don\'t hesitate to call if you have any more questions. Have a great day! 📊' },
        ],
        summary: 'Member Amit Kulkarni (Phone: 9876543210) queried about billing discrepancy. Clarified extra charges were for meeting room overtime (₹1,250) and additional printing (₹750). Usage alerts set up. Detailed report to be emailed.',
        sentiment: 'neutral',
        duration: 260,
      },
    ],
  },
};

export function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getRandomPhone() {
  const prefixes = ['98', '97', '96', '95', '94', '93', '91', '90', '88', '87', '86', '85', '84', '83', '82', '81', '70', '72', '73', '74', '75', '76', '77', '78', '79'];
  const prefix = getRandomItem(prefixes);
  const num = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return `+91 ${prefix}${num.slice(0, 3)} ${num.slice(3, 5)}${num.slice(5)}`;
}
