// Data store — MongoDB-backed with in-memory fallback.
// If MongoDB is not configured, falls back to in-memory (demo mode).
// All functions are async to support both modes transparently.

import { connectDB } from './mongodb';
import { Call } from './models/Call';
import { Customer } from './models/Customer';

const USE_MONGO = !!process.env.MONGODB_URI;

// ==================== IN-MEMORY FALLBACK ====================
// Used only if MONGODB_URI is not set
let memStore = { calls: [], customers: [] };

// ==================== HELPERS ====================

async function getDB() {
  if (USE_MONGO) await connectDB();
}

function generateWaveformData(duration) {
  const bars = Math.min(Math.max(Math.floor(duration / 3), 30), 100);
  return Array.from({ length: bars }, () => Math.random() * 0.8 + 0.2);
}

// ==================== CALLS ====================

export async function getAllCalls(filters = {}) {
  if (USE_MONGO) {
    await getDB();
    let query = {};
    if (filters.search) {
      const s = filters.search;
      query.$or = [
        { customerName: { $regex: s, $options: 'i' } },
        { customerPhone: { $regex: s, $options: 'i' } },
        { callId: { $regex: s, $options: 'i' } },
        { summary: { $regex: s, $options: 'i' } },
      ];
    }
    if (filters.category && filters.category !== 'all') query.queryCategory = filters.category;
    if (filters.status && filters.status !== 'all') query.status = filters.status;
    if (filters.sentiment && filters.sentiment !== 'all') query.sentiment = filters.sentiment;
    if (filters.dateFrom || filters.dateTo) {
      query.startTime = {};
      if (filters.dateFrom) query.startTime.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.startTime.$lte = new Date(filters.dateTo);
    }

    const sortField = filters.sortBy || 'startTime';
    const sortDir = filters.sortOrder === 'asc' ? 1 : -1;
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const skip = (page - 1) * limit;

    const [calls, total] = await Promise.all([
      Call.find(query).sort({ [sortField]: sortDir }).skip(skip).limit(limit).lean(),
      Call.countDocuments(query),
    ]);

    // Normalize _id → id
    const normalizedCalls = calls.map(c => ({ ...c, id: c._id.toString(), _id: undefined }));
    return { calls: normalizedCalls, total, page, totalPages: Math.ceil(total / limit), limit };
  }

  // In-memory fallback
  let calls = [...memStore.calls];
  if (filters.search) {
    const s = filters.search.toLowerCase();
    calls = calls.filter(c =>
      c.customerName.toLowerCase().includes(s) ||
      c.customerPhone.includes(s) ||
      c.callId.toLowerCase().includes(s) ||
      (c.summary && c.summary.toLowerCase().includes(s))
    );
  }
  if (filters.category && filters.category !== 'all') calls = calls.filter(c => c.queryCategory === filters.category);
  if (filters.status && filters.status !== 'all') calls = calls.filter(c => c.status === filters.status);
  if (filters.sentiment && filters.sentiment !== 'all') calls = calls.filter(c => c.sentiment === filters.sentiment);

  const sortBy = filters.sortBy || 'startTime';
  const sortOrder = filters.sortOrder || 'desc';
  calls.sort((a, b) => {
    let valA = a[sortBy], valB = b[sortBy];
    if (sortBy === 'startTime' || sortBy === 'createdAt') { valA = new Date(valA).getTime(); valB = new Date(valB).getTime(); }
    return sortOrder === 'desc' ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1);
  });

  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 20;
  const total = calls.length;
  return { calls: calls.slice((page - 1) * limit, page * limit), total, page, totalPages: Math.ceil(total / limit), limit };
}

export async function getCallById(id) {
  if (USE_MONGO) {
    await getDB();
    const call = await Call.findById(id).lean().catch(() => null)
      || await Call.findOne({ callId: id }).lean().catch(() => null);
    if (!call) return null;
    return { ...call, id: call._id.toString(), _id: undefined };
  }
  return memStore.calls.find(c => c.id === id) || null;
}

export async function addCall(callData) {
  if (USE_MONGO) {
    await getDB();
    // Upsert by callId to prevent duplicates
    const call = await Call.findOneAndUpdate(
      { callId: callData.callId },
      { $set: callData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    // Update or create customer
    await upsertCustomer(callData);
    return { ...call.toJSON(), id: call._id.toString() };
  }
  // In-memory
  memStore.calls.unshift(callData);
  const existing = memStore.customers.find(c => c.phone === callData.customerPhone);
  if (existing) {
    existing.totalCalls += 1;
    existing.lastCallDate = callData.startTime;
    if (!existing.tags.includes(callData.queryCategory)) existing.tags.push(callData.queryCategory);
  } else {
    memStore.customers.push({
      id: callData.id + '-cust',
      name: callData.customerName,
      phone: callData.customerPhone,
      email: callData.customerEmail,
      location: callData.customerLocation,
      totalCalls: 1,
      lastCallDate: callData.startTime,
      tags: [callData.queryCategory],
      notes: '',
      createdAt: callData.createdAt,
    });
  }
  return callData;
}

export async function updateCall(id, updates) {
  if (USE_MONGO) {
    await getDB();
    const call = await Call.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean().catch(() => null);
    if (!call) return null;
    return { ...call, id: call._id.toString(), _id: undefined };
  }
  const idx = memStore.calls.findIndex(c => c.id === id);
  if (idx === -1) return null;
  memStore.calls[idx] = { ...memStore.calls[idx], ...updates };
  return memStore.calls[idx];
}

export async function deleteCall(id) {
  if (USE_MONGO) {
    await getDB();
    const result = await Call.findByIdAndDelete(id);
    return !!result;
  }
  const idx = memStore.calls.findIndex(c => c.id === id);
  if (idx === -1) return false;
  memStore.calls.splice(idx, 1);
  return true;
}

// ==================== CUSTOMERS ====================

async function upsertCustomer(callData) {
  if (USE_MONGO) {
    await Customer.findOneAndUpdate(
      { phone: callData.customerPhone },
      {
        $set: { lastCallDate: callData.startTime, name: callData.customerName, email: callData.customerEmail, location: callData.customerLocation },
        $inc: { totalCalls: 1 },
        $addToSet: { tags: callData.queryCategory },
        $setOnInsert: { createdAt: callData.createdAt },
      },
      { upsert: true, new: true }
    );
  }
}

export async function getAllCustomers(filters = {}) {
  if (USE_MONGO) {
    await getDB();
    let query = {};
    if (filters.search) {
      const s = filters.search;
      query.$or = [
        { name: { $regex: s, $options: 'i' } },
        { phone: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { location: { $regex: s, $options: 'i' } },
      ];
    }
    if (filters.tag && filters.tag !== 'all') query.tags = filters.tag;
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const [customers, total] = await Promise.all([
      Customer.find(query).sort({ lastCallDate: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Customer.countDocuments(query),
    ]);
    const normalized = customers.map(c => ({ ...c, id: c._id.toString(), _id: undefined }));
    return { customers: normalized, total, page, totalPages: Math.ceil(total / limit), limit };
  }

  let customers = [...memStore.customers];
  if (filters.search) {
    const s = filters.search.toLowerCase();
    customers = customers.filter(c => c.name.toLowerCase().includes(s) || c.phone.includes(s) || (c.email && c.email.toLowerCase().includes(s)));
  }
  if (filters.tag && filters.tag !== 'all') customers = customers.filter(c => c.tags.includes(filters.tag));
  customers.sort((a, b) => new Date(b.lastCallDate) - new Date(a.lastCallDate));
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 20;
  const total = customers.length;
  return { customers: customers.slice((page - 1) * limit, page * limit), total, page, totalPages: Math.ceil(total / limit), limit };
}

export async function getCustomerById(id) {
  if (USE_MONGO) {
    await getDB();
    const c = await Customer.findById(id).lean().catch(() => null);
    if (!c) return null;
    return { ...c, id: c._id.toString(), _id: undefined };
  }
  return memStore.customers.find(c => c.id === id) || null;
}

export async function getCustomerCalls(customerId) {
  if (USE_MONGO) {
    await getDB();
    const customer = await Customer.findById(customerId).lean();
    if (!customer) return [];
    const calls = await Call.find({ customerPhone: customer.phone }).sort({ startTime: -1 }).lean();
    return calls.map(c => ({ ...c, id: c._id.toString(), _id: undefined }));
  }
  const customer = memStore.customers.find(c => c.id === customerId);
  if (!customer) return [];
  return memStore.calls.filter(c => c.customerPhone === customer.phone).sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
}

export async function updateCustomer(id, updates) {
  if (USE_MONGO) {
    await getDB();
    const c = await Customer.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
    if (!c) return null;
    return { ...c, id: c._id.toString(), _id: undefined };
  }
  const idx = memStore.customers.findIndex(c => c.id === id);
  if (idx === -1) return null;
  memStore.customers[idx] = { ...memStore.customers[idx], ...updates };
  return memStore.customers[idx];
}

export async function deleteCustomer(id) {
  if (USE_MONGO) {
    await getDB();
    const result = await Customer.findByIdAndDelete(id);
    return !!result;
  }
  const idx = memStore.customers.findIndex(c => c.id === id);
  if (idx === -1) return false;
  memStore.customers.splice(idx, 1);
  return true;
}

// ==================== ANALYTICS ====================

export async function getAnalytics() {
  if (USE_MONGO) {
    await getDB();
    const [calls, totalCustomers] = await Promise.all([
      Call.find({}).lean(),
      Customer.countDocuments(),
    ]);

    const now = new Date();
    const totalCalls = calls.length;
    const completedCalls = calls.filter(c => c.status === 'completed' || c.status === 'voicemail');
    const activeCalls = calls.filter(c => c.status === 'in-progress').length;
    const missedCalls = calls.filter(c => c.status === 'missed').length;
    const avgDuration = completedCalls.length > 0
      ? Math.round(completedCalls.reduce((sum, c) => sum + (c.duration || 0), 0) / completedCalls.length)
      : 0;
    const resolvedCalls = calls.filter(c => c.resolution === 'resolved').length;
    const resolutionRate = totalCalls > 0 ? Math.round((resolvedCalls / totalCalls) * 100) : 0;

    const categoryBreakdown = {};
    calls.forEach(c => { categoryBreakdown[c.queryCategory] = (categoryBreakdown[c.queryCategory] || 0) + 1; });

    const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 };
    completedCalls.forEach(c => { sentimentBreakdown[c.sentiment] = (sentimentBreakdown[c.sentiment] || 0) + 1; });
    const totalSentiment = completedCalls.length;
    const satisfactionScore = totalSentiment > 0
      ? Math.round((sentimentBreakdown.positive * 100 + sentimentBreakdown.neutral * 60 + sentimentBreakdown.negative * 20) / totalSentiment)
      : 0;

    const dailyVolume = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = calls.filter(c => {
        const d = c.startTime instanceof Date ? c.startTime : new Date(c.startTime);
        return d.toISOString().split('T')[0] === dateStr;
      }).length;
      dailyVolume.push({ date: dateStr, label: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }), calls: count });
    }

    const hourlyDistribution = Array.from({ length: 12 }, (_, i) => {
      const hour = i + 9;
      const count = completedCalls.filter(c => {
        const d = c.startTime instanceof Date ? c.startTime : new Date(c.startTime);
        return d.getHours() === hour;
      }).length;
      return { hour: `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'PM' : 'AM'}`, calls: count };
    });

    const recentCalls = calls
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
      .slice(0, 5)
      .map(c => ({ ...c, id: c._id.toString(), _id: undefined }));
    const directConnectCalls = calls.filter(c => c.resolution === 'escalated').length;

    return { totalCalls, activeCalls, missedCalls, avgDuration, resolutionRate, satisfactionScore, totalCustomers, directConnectCalls, categoryBreakdown, sentimentBreakdown, dailyVolume, hourlyDistribution, recentCalls };
  }

  // In-memory fallback
  const calls = memStore.calls;
  const now = new Date();
  const totalCalls = calls.length;
  const completedCalls = calls.filter(c => c.status === 'completed');
  const activeCalls = calls.filter(c => c.status === 'in-progress').length;
  const missedCalls = calls.filter(c => c.status === 'missed').length;
  const avgDuration = completedCalls.length > 0
    ? Math.round(completedCalls.reduce((sum, c) => sum + c.duration, 0) / completedCalls.length)
    : 0;
  const resolvedCalls = calls.filter(c => c.resolution === 'resolved').length;
  const resolutionRate = totalCalls > 0 ? Math.round((resolvedCalls / totalCalls) * 100) : 0;
  const categoryBreakdown = {};
  calls.forEach(c => { categoryBreakdown[c.queryCategory] = (categoryBreakdown[c.queryCategory] || 0) + 1; });
  const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 };
  completedCalls.forEach(c => { sentimentBreakdown[c.sentiment] = (sentimentBreakdown[c.sentiment] || 0) + 1; });
  const totalSentiment = completedCalls.length;
  const satisfactionScore = totalSentiment > 0
    ? Math.round((sentimentBreakdown.positive * 100 + sentimentBreakdown.neutral * 60 + sentimentBreakdown.negative * 20) / totalSentiment)
    : 0;
  const dailyVolume = [];
  for (let i = 13; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const count = calls.filter(c => c.startTime.split('T')[0] === dateStr).length;
    dailyVolume.push({ date: dateStr, label: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }), calls: count });
  }
  const hourlyDistribution = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 9;
    const count = completedCalls.filter(c => new Date(c.startTime).getHours() === hour).length;
    return { hour: `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'PM' : 'AM'}`, calls: count };
  });
  const recentCalls = calls.slice(0, 5);
  const directConnectCalls = calls.filter(c => c.resolution === 'escalated').length;
  return { totalCalls, activeCalls, missedCalls, avgDuration, resolutionRate, satisfactionScore, totalCustomers: memStore.customers.length, directConnectCalls, categoryBreakdown, sentimentBreakdown, dailyVolume, hourlyDistribution, recentCalls };
}
