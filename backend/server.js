const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
let db;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'intownlocal';

// Connect to MongoDB
async function connectToDatabase() {
  try {
    const client = await MongoClient.connect(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    db = client.db(DB_NAME);
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.log('⚠️  Running without database - using in-memory storage');
  }
}

// ============= Dummy Data =============

const DUMMY_SHOPS = [
  {
    id: 'shop1',
    name: 'Fresh Mart Grocery',
    category: 'Grocery',
    lat: 12.9716,
    lng: 77.5946,
    price: 500.0,
    savings: 50.0,
    address: 'MG Road, Bangalore',
  },
  {
    id: 'shop2',
    name: 'Style Salon & Spa',
    category: 'Salon',
    lat: 12.972,
    lng: 77.595,
    price: 800.0,
    savings: 100.0,
    address: 'Brigade Road, Bangalore',
  },
  {
    id: 'shop3',
    name: 'Organic Foods Store',
    category: 'Grocery',
    lat: 12.971,
    lng: 77.594,
    price: 600.0,
    savings: 75.0,
    address: 'Church Street, Bangalore',
  },
  {
    id: 'shop4',
    name: 'Wellness Pharmacy',
    category: 'Pharmacy',
    lat: 12.9725,
    lng: 77.5955,
    price: 300.0,
    savings: 40.0,
    address: 'Commercial Street, Bangalore',
  },
  {
    id: 'shop5',
    name: 'Quick Bites Restaurant',
    category: 'Restaurant',
    lat: 12.9705,
    lng: 77.5935,
    price: 400.0,
    savings: 60.0,
    address: 'Residency Road, Bangalore',
  },
  {
    id: 'shop6',
    name: 'Fashion Hub',
    category: 'Fashion',
    lat: 12.973,
    lng: 77.596,
    price: 1200.0,
    savings: 150.0,
    address: 'MG Road, Bangalore',
  },
  {
    id: 'shop7',
    name: 'Tech Store',
    category: 'Electronics',
    lat: 12.97,
    lng: 77.593,
    price: 2000.0,
    savings: 200.0,
    address: 'Indiranagar, Bangalore',
  },
  {
    id: 'shop8',
    name: 'Beauty Palace',
    category: 'Salon',
    lat: 12.9735,
    lng: 77.5965,
    price: 900.0,
    savings: 110.0,
    address: 'Koramangala, Bangalore',
  },
];

const DUMMY_PLANS = [
  {
    id: 'plan1',
    name: 'IT Max',
    pricePerMonth: 299.0,
    benefits: [
      '5% discount at all partner stores',
      'Free delivery on orders above ₹500',
      'Access to exclusive deals',
      'Priority customer support',
    ],
    savings: 500.0,
  },
  {
    id: 'plan2',
    name: 'IT Max Plus',
    pricePerMonth: 499.0,
    benefits: [
      '10% discount at all partner stores',
      'Free delivery on all orders',
      'Access to premium exclusive deals',
      '24/7 priority customer support',
      'Cashback on every purchase',
      'Extended warranty on electronics',
    ],
    savings: 1200.0,
  },
];

// ============= Helper Functions =============

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const toRad = (value) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ============= API Endpoints =============

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Send OTP endpoint
app.post('/api/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    console.log(`📱 Sending OTP to ${phone}`);

    // Mock OTP - always return success
    // In production, integrate with SMS service like Twilio
    res.json({
      success: true,
      message: `OTP sent successfully to ${phone}. Use 1234 for testing.`,
    });
  } catch (error) {
    console.error('Error in send-otp:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
    });
  }
});

// Verify OTP endpoint
app.post('/api/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone and OTP are required',
      });
    }

    // Mock OTP verification - accept any 4-digit OTP
    if (otp.length !== 4) {
      return res.json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    // Check if user exists or create new user
    let user;
    if (db) {
      user = await db.collection('users').findOne({ phone });

      if (!user) {
        user = {
          id: uuidv4(),
          name: `User ${phone.slice(-4)}`,
          phone,
          created_at: new Date(),
        };
        await db.collection('users').insertOne(user);
      }
    } else {
      // In-memory user for testing without DB
      user = {
        id: uuidv4(),
        name: `User ${phone.slice(-4)}`,
        phone,
        created_at: new Date(),
      };
    }

    // Generate mock token
    const token = uuidv4();

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
      },
      token,
    });
  } catch (error) {
    console.error('Error in verify-otp:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
    });
  }
});

// Get shops endpoint
app.get('/api/shops', (req, res) => {
  try {
    const { lat, lng, category } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    // Filter and calculate distances
    let shops = DUMMY_SHOPS.map((shop) => ({
      ...shop,
      distance: parseFloat(
        calculateDistance(userLat, userLng, shop.lat, shop.lng).toFixed(2)
      ),
    }));

    // Apply category filter if provided
    if (category) {
      shops = shops.filter(
        (shop) => shop.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Sort by distance
    shops.sort((a, b) => a.distance - b.distance);

    res.json(shops);
  } catch (error) {
    console.error('Error in get shops:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shops',
    });
  }
});

// Get plans endpoint
app.get('/api/plans', (req, res) => {
  try {
    res.json(DUMMY_PLANS);
  } catch (error) {
    console.error('Error in get plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plans',
    });
  }
});

// Get categories endpoint
app.get('/api/categories', (req, res) => {
  try {
    const categories = [
      { id: 'cat1', name: 'Grocery', icon: 'cart' },
      { id: 'cat2', name: 'Salon', icon: 'cut' },
      { id: 'cat3', name: 'Restaurant', icon: 'restaurant' },
      { id: 'cat4', name: 'Pharmacy', icon: 'medical' },
      { id: 'cat5', name: 'Fashion', icon: 'shirt' },
      { id: 'cat6', name: 'Electronics', icon: 'laptop' },
    ];
    res.json(categories);
  } catch (error) {
    console.error('Error in get categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
    });
  }
});

// Process payment endpoint
app.post('/api/payment', async (req, res) => {
  try {
    const { userId, shopId, planId, amount, method } = req.body;

    if (!userId || !amount || !method) {
      return res.status(400).json({
        success: false,
        message: 'userId, amount, and method are required',
      });
    }

    // Generate transaction ID
    const transactionId = `TXN${Math.floor(Math.random() * 900000) + 100000}`;

    // Calculate savings (10%)
    const savings = amount * 0.1;

    // Store payment in database if available
    if (db) {
      const payment = {
        id: uuidv4(),
        userId,
        shopId,
        planId,
        amount,
        method,
        transactionId,
        status: 'success',
        savings,
        created_at: new Date(),
      };
      await db.collection('payments').insertOne(payment);
    }

    res.json({
      success: true,
      transactionId,
      message: 'Payment successful',
      savings,
    });
  } catch (error) {
    console.error('Error in payment:', error);
    res.status(500).json({
      success: false,
      message: 'Payment failed',
    });
  }
});

// Member registration endpoint (mock)
app.post('/api/customer', async (req, res) => {
  try {
    const memberData = req.body;
    console.log('📝 Member registration:', memberData);

    // Mock success response
    res.json({
      success: true,
      message: 'Member registered successfully',
      memberId: uuidv4(),
    });
  } catch (error) {
    console.error('Error in customer registration:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
    });
  }
});

// Merchant registration endpoint (mock)
app.post('/api/merchant', async (req, res) => {
  try {
    const merchantData = req.body;
    console.log('🏪 Merchant registration:', merchantData);

    // Mock success response
    res.json({
      success: true,
      message: 'Merchant registered successfully',
      merchantId: uuidv4(),
    });
  } catch (error) {
    console.error('Error in merchant registration:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

// Start server
async function startServer() {
  await connectToDatabase();

  app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('🚀 ========================================');
    console.log(`✅ IntownLocal Backend Server Running!`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🌐 Local: http://localhost:${PORT}`);
    console.log(`🔗 Health: http://localhost:${PORT}/health`);
    console.log('🚀 ========================================');
    console.log('');
  });
}

startServer();
