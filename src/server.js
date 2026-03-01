require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import database connection
const { initDB } = require('./config/db');

// Import routes
const apiRoutes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Shift Scheduler API is running',
    timestamp: new Date().toISOString()
  });
});

// Test route
app.get('/api/test', (req, res) => {
  const { getConnectionStatus } = require('./config/db');
  const dbStatus = getConnectionStatus();
  
  res.status(200).json({
    success: true,
    message: 'API test endpoint is working',
    timestamp: new Date().toISOString(),
    database: {
      connected: dbStatus.isConnected,
      state: dbStatus.state,
      host: dbStatus.host,
      name: dbStatus.name
    },
    environment: process.env.NODE_ENV || 'development',
    version: require('../package.json').version
  });
});

// API Routes
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB first
    console.log('🚀 Starting Shift Scheduler Backend...');
    await initDB();
    
    // Start Express server after database connection
    const PORT = process.env.PORT || 5000;
    const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces for mobile access
    app.listen(PORT, HOST, () => {
      console.log('\n' + '='.repeat(50));
      console.log('✅ Server Started Successfully!');
      console.log('='.repeat(50));
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`📱 Network URL: http://${HOST === '0.0.0.0' ? 'YOUR_LOCAL_IP' : HOST}:${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
      console.log(`🧪 Test Endpoint: http://localhost:${PORT}/api/test`);
      console.log(`📚 API Base: http://localhost:${PORT}/api`);
      console.log('='.repeat(50) + '\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();

module.exports = app;

