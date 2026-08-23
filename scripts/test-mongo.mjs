import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Read .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
let uri = '';
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  const match = content.match(/MONGODB_URI=(.+)/);
  if (match) {
    uri = match[1].trim();
  }
}

console.log('Testing connection to MongoDB Atlas...');
console.log('Target URI:', uri ? uri.replace(/:([^:@]+)@/, ':****@') : 'NOT FOUND');

async function verifyDB() {
  try {
    await mongoose.connect(uri, { dbName: 'callbot-crm', serverSelectionTimeoutMS: 8000 });
    console.log('\n✅ Successfully connected to MongoDB Atlas!');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('\n📁 Existing collections in database:');
    if (collections.length === 0) {
      console.log('   (No collections yet — will be created on first completed call)');
    } else {
      for (const col of collections) {
        const count = await db.collection(col.name).countDocuments();
        console.log(`   - Collection "${col.name}": ${count} document(s)`);
      }
    }

    const callsCount = await db.collection('calls').countDocuments().catch(() => 0);
    const customersCount = await db.collection('customers').countDocuments().catch(() => 0);

    console.log('\n📊 Current Database Stats:');
    console.log(`   • Total Calls in DB: ${callsCount}`);
    console.log(`   • Total Customers in DB: ${customersCount}`);

    if (callsCount > 0) {
      console.log('\n📄 Latest call in DB:');
      const latest = await db.collection('calls').find().sort({ startTime: -1 }).limit(1).toArray();
      console.log({
        id: latest[0].callId,
        customerName: latest[0].customerName,
        customerPhone: latest[0].customerPhone,
        summary: latest[0].summary,
        status: latest[0].status,
        timestamp: latest[0].startTime
      });
    }

    await mongoose.disconnect();
    console.log('\nVerification check finished successfully!');
  } catch (err) {
    console.error('\n❌ MongoDB Error:', err.message);
  }
}

verifyDB();
