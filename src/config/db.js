const mongoose = require('mongoose');

// Connection configuration
const CONNECTION_OPTIONS = {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  maxPoolSize: 10, // Maintain up to 10 socket connections
  minPoolSize: 5, // Maintain at least 5 socket connections
  retryWrites: true,
  w: 'majority'
};

// Retry configuration
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds
let retryCount = 0;
let isConnecting = false;

/**
 * Connect to MongoDB with retry logic
 */
const connectDB = async () => {
  // Prevent multiple simultaneous connection attempts
  if (isConnecting) {
    console.log('⏳ Connection attempt already in progress...');
    return;
  }

  const mongoURI = process.env.MONGODB_URI;
  
  if (!mongoURI) {
    console.error('❌ MONGODB_URI is not defined in environment variables');
    process.exit(1);
  }

  try {
    isConnecting = true;
    console.log(`🔄 Attempting to connect to MongoDB... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);

    const conn = await mongoose.connect(mongoURI, CONNECTION_OPTIONS);

    // Reset retry count on successful connection
    retryCount = 0;
    isConnecting = false;

    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    console.log(`   Ready State: ${getConnectionState(conn.connection.readyState)}`);

    return conn;
  } catch (error) {
    isConnecting = false;
    retryCount++;

    console.error(`❌ MongoDB connection error (Attempt ${retryCount}/${MAX_RETRIES}):`);
    console.error(`   Error: ${error.message}`);

    if (retryCount < MAX_RETRIES) {
      console.log(`⏳ Retrying connection in ${RETRY_DELAY / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return connectDB(); // Retry connection
    } else {
      console.error('❌ Maximum retry attempts reached. Exiting...');
      process.exit(1);
    }
  }
};

/**
 * Get human-readable connection state
 */
const getConnectionState = (readyState) => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[readyState] || 'unknown';
};

/**
 * Setup MongoDB connection event listeners
 */
const setupEventListeners = () => {
  const db = mongoose.connection;

  // Connection successful
  db.on('connected', () => {
    console.log('📡 MongoDB connection event: CONNECTED');
    console.log(`   Database: ${db.name}`);
    console.log(`   Host: ${db.host}`);
    console.log(`   Port: ${db.port}`);
  });

  // Connection error
  db.on('error', (error) => {
    console.error('❌ MongoDB connection event: ERROR');
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
  });

  // Connection disconnected
  db.on('disconnected', () => {
    console.warn('⚠️  MongoDB connection event: DISCONNECTED');
    console.warn('   Attempting to reconnect...');
    
    // Attempt reconnection after delay
    setTimeout(() => {
      if (mongoose.connection.readyState === 0) {
        connectDB().catch(err => {
          console.error('❌ Reconnection failed:', err.message);
        });
      }
    }, RETRY_DELAY);
  });

  // Connection reconnected
  db.on('reconnected', () => {
    console.log('🔄 MongoDB connection event: RECONNECTED');
    console.log(`   Database: ${db.name}`);
  });

  // Connection timeout
  db.on('timeout', () => {
    console.error('⏱️  MongoDB connection event: TIMEOUT');
    console.error('   Connection timeout occurred');
  });

  // Handle process termination
  process.on('SIGINT', async () => {
    console.log('\n🛑 SIGINT received: Closing MongoDB connection...');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 SIGTERM received: Closing MongoDB connection...');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  });
};

/**
 * Initialize database connection
 */
const initDB = async () => {
  // Setup event listeners first
  setupEventListeners();

  // Then attempt connection
  try {
    await connectDB();
  } catch (error) {
    console.error('❌ Failed to initialize database connection:', error);
    throw error;
  }
};

/**
 * Check if database is connected
 */
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Get connection status
 */
const getConnectionStatus = () => {
  return {
    readyState: mongoose.connection.readyState,
    state: getConnectionState(mongoose.connection.readyState),
    host: mongoose.connection.host,
    name: mongoose.connection.name,
    port: mongoose.connection.port,
    isConnected: isConnected()
  };
};

module.exports = {
  connectDB,
  initDB,
  isConnected,
  getConnectionStatus,
  setupEventListeners
};

