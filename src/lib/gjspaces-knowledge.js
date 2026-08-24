// GJ SpaCes Knowledge Base — Real Estate Bot conversation intelligence
// Contains business info, FAQ, and conversation templates

export const GJ_SPACES_INFO = {
  name: 'GJ SpaCes',
  tagline: 'Trusted Real Estate Solutions in Pune',
  owner: 'Mr. Ganesh C Jadhav',
  location: '5th Floor, Office no-9, Opposite Shrimati Kashibai Navale Medical College, Nobel Manchester Building, Narhe, Pune, Maharashtra 411041',
  phone: '+91 99210 03458',
  email: 'gcjadhav@gmail.com',
  website: 'https://gjspaces.com',
  hours: 'Monday - Saturday: 10:00 AM - 7:00 PM',
  established: '2020',
};

export const SERVICES = [
  {
    name: 'Residential Plots',
    description: 'NA plots in and around Pune — Narhe, Sinhagad Road, Bavdhan, Hinjawadi, Pirangut, Mulshi, Maval areas. Clear titles, RERA registered.',
    pricing: 'Varies by location and size. Contact for detailed pricing.',
  },
  {
    name: 'Flats & Apartments',
    description: '1BHK, 2BHK, 3BHK flats in premium Pune locations. Under-construction and ready-to-move-in options available.',
    pricing: 'Based on location, configuration, and project. Contact for details.',
  },
  {
    name: 'Commercial Properties',
    description: 'Shops, offices, and commercial spaces in prime Pune locations.',
    pricing: 'Custom quotes based on location and size.',
  },
  {
    name: 'Property Consultation',
    description: 'Free property consultation, site visits, home loan assistance, and legal documentation support.',
    pricing: 'Free consultation. No charges for site visits.',
  },
];

export const FAQS = [
  { q: 'What type of properties do you offer?', a: 'We offer residential plots, flats (1BHK, 2BHK, 3BHK), and commercial properties across Pune.' },
  { q: 'Are your projects RERA registered?', a: 'Yes, all our projects are RERA registered with clear titles and transparent documentation.' },
  { q: 'Do you offer site visits?', a: 'Absolutely! We arrange free site visits at your convenience. Our team will accompany you to show the property.' },
  { q: 'Where are your properties located?', a: 'Our properties are located in Narhe, Sinhagad Road, Bavdhan, Hinjawadi, Pirangut, Mulshi, Maval, and other premium Pune areas.' },
  { q: 'Do you help with home loans?', a: 'Yes, we provide home loan assistance through our banking partners to make the buying process smooth for you.' },
  { q: 'What documents are needed to buy property?', a: 'You will need Aadhaar card, PAN card, income proof, bank statements, and passport-size photos. Our team will guide you through the complete documentation process.' },
  { q: 'Can I visit your office?', a: 'Of course! Our office is at 5th Floor, Office no-9, Nobel Manchester Building, Narhe, Pune 411041. We are open Monday to Saturday, 10 AM to 7 PM.' },
  { q: 'Do you offer EMI options?', a: 'Yes, through our banking partners we can arrange home loans with flexible EMI options. We help you with the entire loan process.' },
  { q: 'What is the booking process?', a: 'The process is simple: 1) Choose your property, 2) Pay booking amount, 3) Complete documentation, 4) Registration. Our team guides you at every step.' },
  { q: 'Are there any hidden charges?', a: 'No hidden charges at all. We believe in complete transparency. All costs including registration, stamp duty, and taxes are communicated upfront.' },
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
  'Narhe', 'Sinhagad Road', 'Bavdhan', 'Hinjawadi', 'Pirangut', 'Mulshi',
  'Maval', 'Kothrud', 'Wakad', 'Baner', 'Aundh', 'Hadapsar',
  'Kharadi', 'Undri', 'NIBM Road', 'Kondhwa', 'Warje', 'Dhayari',
];

// Pre-scripted conversation scenarios for real estate
export const SCENARIOS = {
  inquiry: {
    label: 'Property Inquiry',
    icon: '🏠',
    description: 'Customer asking about plots, flats, or property details',
    conversations: [
      {
        customerName: null,
        transcript: [
          { role: 'bot', text: 'Welcome to GJ SpaCes! I\'m Sakshi, your AI assistant. How can I help you today?' },
          { role: 'customer', text: 'Hi, I\'m looking for a plot in Pune. Can you tell me what\'s available?' },
          { role: 'bot', text: 'Of course! We have NA plots available in several premium Pune locations including Narhe, Sinhagad Road, Bavdhan, Hinjawadi, Pirangut, and Mulshi area. Which location interests you?' },
          { role: 'customer', text: 'I\'m interested in Narhe or Sinhagad Road area. What sizes do you have?' },
          { role: 'bot', text: 'Great choice! In Narhe and Sinhagad Road, we have plots ranging from 1000 sq.ft to 5000 sq.ft. All plots have clear titles and are RERA registered. May I know your budget range so I can suggest the best options?' },
          { role: 'customer', text: 'My budget is around 25 to 30 lakhs.' },
          { role: 'bot', text: 'Thank you for sharing that. We have some excellent options in your budget range. I\'ve noted your requirements — plot in Narhe or Sinhagad Road, around 25-30 lakhs budget. Our team will review the best matching plots and contact you shortly with detailed pricing and availability. Would you like to schedule a site visit as well?' },
          { role: 'customer', text: 'Yes, I\'d like to see the plots this weekend.' },
          { role: 'bot', text: 'Our team will arrange a site visit for you this weekend. They will call you to confirm the exact day and time. Our office is at 5th Floor, Nobel Manchester Building, Narhe, Pune. You can also reach us at 099210 03458. Is there anything else I can help with?' },
          { role: 'customer', text: 'No, that\'s all. Thank you!' },
          { role: 'bot', text: 'Thank you for your interest in GJ SpaCes! Our team will get back to you very shortly. Have a wonderful day!' },
        ],
        summary: 'Customer inquired about plots in Narhe/Sinhagad Road area with 25-30 lakhs budget. Site visit requested for weekend. Team to follow up with matching options.',
        sentiment: 'positive',
        duration: 180,
      },
      {
        transcript: [
          { role: 'bot', text: 'Welcome to GJ SpaCes! How may I assist you today?' },
          { role: 'customer', text: 'I want to know about flats available in Pune.' },
          { role: 'bot', text: 'We have flats available in several Pune locations. Could you tell me what configuration you\'re looking for — 1BHK, 2BHK, or 3BHK?' },
          { role: 'customer', text: 'I\'m looking for a 2BHK flat. Preferably ready to move in.' },
          { role: 'bot', text: 'We have 2BHK ready-to-move-in options available. Which area of Pune do you prefer? We have options in Narhe, Bavdhan, Sinhagad Road, Hinjawadi, and surrounding areas.' },
          { role: 'customer', text: 'Bavdhan or Hinjawadi would be good. What\'s the price range?' },
          { role: 'bot', text: 'For 2BHK in Bavdhan and Hinjawadi, pricing varies by project and floor. I\'ve noted your requirements — 2BHK, ready possession, Bavdhan or Hinjawadi. Our team will share detailed pricing, floor plans, and available options with you shortly. We also help with home loan processing. Shall I note down anything else?' },
          { role: 'customer', text: 'Yes, I\'d need home loan assistance too. My budget is around 50-60 lakhs.' },
          { role: 'bot', text: 'Noted! 2BHK flat, ready possession, Bavdhan or Hinjawadi, budget 50-60 lakhs, with home loan assistance. Our team will contact you shortly with the best options. You can also visit our office at Nobel Manchester Building, Narhe, Pune. Thank you for calling GJ SpaCes!' },
        ],
        summary: 'Customer looking for 2BHK ready-to-move flat in Bavdhan/Hinjawadi, budget 50-60 lakhs. Home loan assistance needed. Team to follow up with options and pricing.',
        sentiment: 'positive',
        duration: 200,
      },
    ],
  },
  booking: {
    label: 'Site Visit Booking',
    icon: '📅',
    description: 'Customer wanting to schedule a site visit or property tour',
    conversations: [
      {
        transcript: [
          { role: 'bot', text: 'Welcome to GJ SpaCes! How can I help you today?' },
          { role: 'customer', text: 'I want to visit some plots in Pirangut area. Can you arrange?' },
          { role: 'bot', text: 'I\'d be happy to arrange a site visit for you! We have several plots available in Pirangut with excellent connectivity and clear titles. When would be convenient for you to visit?' },
          { role: 'customer', text: 'How about this Saturday morning? Around 10 AM?' },
          { role: 'bot', text: 'Saturday at 10 AM works well. I\'ve noted your preference. Our team member will accompany you to show the plots and explain all the details. May I have your name for the appointment?' },
          { role: 'customer', text: 'My name is Rajesh Khanna.' },
          { role: 'bot', text: 'Thank you, Mr. Khanna! I\'ve noted your site visit request for Saturday at 10 AM in Pirangut. Our team will call you to confirm the meeting point and exact location. Our office address is 5th Floor, Nobel Manchester Building, Narhe, Pune 411041. Anything else you\'d like to know?' },
          { role: 'customer', text: 'What should I carry for the visit?' },
          { role: 'bot', text: 'For the site visit, you don\'t need to carry anything special. Just bring a valid ID proof if you\'re interested in proceeding with any property. Our team will share all property documents, maps, and pricing during the visit. Is there anything else?' },
          { role: 'customer', text: 'No, that\'s all. See you Saturday!' },
          { role: 'bot', text: 'Looking forward to it, Mr. Khanna! Our team will revert to you shortly with confirmation. Have a great day!' },
        ],
        summary: 'Customer Rajesh Khanna requested site visit for plots in Pirangut on Saturday at 10 AM. Team to confirm and arrange accompanied visit.',
        sentiment: 'positive',
        duration: 150,
      },
      {
        transcript: [
          { role: 'bot', text: 'Hello! Welcome to GJ SpaCes. How may I help you?' },
          { role: 'customer', text: 'I saw your ad for flats in Narhe. I want to visit the sample flat.' },
          { role: 'bot', text: 'Thank you for your interest! We do have flats available in Narhe. Our team can show you the model flat and the site. Would you prefer a weekday or weekend visit?' },
          { role: 'customer', text: 'Any weekday after 5 PM would work since I have office during the day.' },
          { role: 'bot', text: 'Understood! I\'ll note an evening visit preference, any weekday after 5 PM. Our team will coordinate and call you to fix a specific day. The site is conveniently located near our office in Narhe. May I know your name?' },
          { role: 'customer', text: 'Priya Deshpande.' },
          { role: 'bot', text: 'Thank you, Ms. Deshpande! I\'ve noted your request. Our team will contact you shortly to schedule the flat visit after 5 PM on a weekday. You can also reach us directly at 099210 03458. Have a wonderful evening!' },
        ],
        summary: 'Customer Priya Deshpande wants to visit model flat in Narhe. Prefers weekday after 5 PM. Team to schedule.',
        sentiment: 'positive',
        duration: 120,
      },
    ],
  },
  complaint: {
    label: 'Complaint / Issue',
    icon: '⚠️',
    description: 'Customer raising concerns about property or service',
    conversations: [
      {
        transcript: [
          { role: 'bot', text: 'Welcome to GJ SpaCes. How can I assist you today?' },
          { role: 'customer', text: 'I booked a plot 3 months ago and the registration process is still pending. What\'s happening?' },
          { role: 'bot', text: 'I understand your concern and I sincerely apologize for the delay. Registration timelines can sometimes be extended due to documentation requirements. Could you please share your booking reference or the name the plot is booked under?' },
          { role: 'customer', text: 'It\'s booked under Amit Kulkarni. The plot is in Pirangut project.' },
          { role: 'bot', text: 'Thank you, Mr. Kulkarni. I\'ve noted your concern regarding the pending registration for your Pirangut plot. I\'m escalating this to our team right away. They will investigate the current status and contact you within 24 hours with a detailed update. I understand this must be frustrating and we want to resolve it as quickly as possible.' },
          { role: 'customer', text: 'I want it resolved this week. I\'ve been patient enough.' },
          { role: 'bot', text: 'Absolutely, Mr. Kulkarni. Your patience is deeply appreciated. I\'m marking this as high priority. Our team lead will personally call you within 24 hours with a resolution timeline. You can also visit our office or contact Mr. Ganesh Jadhav directly at 099210 03458 if needed. We are committed to resolving this promptly.' },
          { role: 'customer', text: 'Fine. I expect a call tomorrow.' },
          { role: 'bot', text: 'You will receive a call tomorrow, Mr. Kulkarni. I\'ve raised this as a priority case. Thank you for your patience and we sincerely apologize for the inconvenience. Is there anything else I can help with?' },
          { role: 'customer', text: 'No, just get it done.' },
          { role: 'bot', text: 'We will. Thank you for bringing this to our attention. Have a good day, Mr. Kulkarni.' },
        ],
        summary: 'Buyer Amit Kulkarni raised complaint about pending plot registration in Pirangut project (3 months). Escalated as high priority. Team to call within 24 hours with resolution.',
        sentiment: 'negative',
        duration: 210,
      },
    ],
  },
  support: {
    label: 'General Support',
    icon: '🛠️',
    description: 'Customer needing help with documentation, loans, or general queries',
    conversations: [
      {
        transcript: [
          { role: 'bot', text: 'Hi there! Welcome to GJ SpaCes. What can I do for you?' },
          { role: 'customer', text: 'I want to know about home loan options for buying a flat through you.' },
          { role: 'bot', text: 'Great question! We work with several leading banks to help our customers get the best home loan rates. We assist with the entire loan process including documentation, application, and follow-up with the bank. Would you like me to share more details?' },
          { role: 'customer', text: 'Yes, which banks do you work with?' },
          { role: 'bot', text: 'We have tie-ups with major banks like SBI, HDFC, ICICI, Bank of Maharashtra, and others. The interest rates and terms vary by bank. Our team can help you compare options and choose the best one based on your income and requirements. Would you like our team to contact you with detailed loan options?' },
          { role: 'customer', text: 'Yes please. And what documents will I need?' },
          { role: 'bot', text: 'For the home loan you will typically need: Aadhaar card, PAN card, last 6 months salary slips, last 2 years IT returns, bank statements, and passport-size photos. Our team will guide you through the complete process. I\'ve noted your requirement — our team will contact you shortly with loan options and next steps.' },
          { role: 'customer', text: 'Sounds good. Thank you.' },
          { role: 'bot', text: 'You\'re welcome! Our team will reach out to you shortly. If you have any more questions, feel free to call us at 099210 03458. Have a great day!' },
        ],
        summary: 'Customer inquired about home loan options for flat purchase. Discussed bank partnerships and required documents. Team to follow up with detailed loan options.',
        sentiment: 'positive',
        duration: 160,
      },
      {
        transcript: [
          { role: 'bot', text: 'Welcome to GJ SpaCes! How can I help you today?' },
          { role: 'customer', text: 'I bought a plot from you last year. I want to know the current market rate of the area.' },
          { role: 'bot', text: 'Thank you for being a valued customer! I\'d be happy to help. Could you tell me which project and location your plot is in?' },
          { role: 'customer', text: 'It\'s in the Mulshi project, near Pirangut.' },
          { role: 'bot', text: 'The Mulshi-Pirangut area has seen good appreciation. However, for accurate current market rates, I\'d recommend speaking with our property experts who track these numbers daily. Shall I have our team call you with the latest valuation details for your specific plot?' },
          { role: 'customer', text: 'Yes, that would be helpful. I\'m thinking of investing in another plot.' },
          { role: 'bot', text: 'That\'s wonderful! I\'ve noted that you\'re also interested in a new plot investment. Our team will contact you with both — the current valuation of your existing plot and the best new investment options available. Thank you for your continued trust in GJ SpaCes!' },
          { role: 'customer', text: 'Thanks Sakshi!' },
          { role: 'bot', text: 'My pleasure! Our team will revert to you shortly. Have a great day!' },
        ],
        summary: 'Existing customer with plot in Mulshi project inquired about current market rate and interested in new plot investment. Team to follow up with valuation and new options.',
        sentiment: 'positive',
        duration: 140,
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
