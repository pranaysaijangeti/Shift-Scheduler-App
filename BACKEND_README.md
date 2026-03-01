# Shift Scheduler Backend API

Complete Node.js/Express backend for the Shift Scheduler App.

## Project Structure

```
src/
├── config/           # Configuration files
│   ├── constants.js  # Application constants
│   └── database.js   # MongoDB connection
├── controllers/      # Request handlers
│   ├── authController.js
│   ├── shiftController.js
│   └── uploadController.js
├── middleware/       # Custom middleware
│   ├── auth.js       # JWT authentication
│   ├── errorHandler.js
│   ├── upload.js     # File upload handling
│   └── validator.js
├── models/          # Mongoose models
│   ├── User.js
│   ├── Shift.js
│   └── index.js
├── routes/          # API routes
│   ├── auth.js
│   ├── shifts.js
│   ├── upload.js
│   └── index.js
├── utils/           # Utility functions
│   ├── jwt.js
│   ├── logger.js
│   ├── response.js
│   └── validators.js
└── server.js        # Application entry point
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   - Copy `.env.example` to `.env`
   - Update the values in `.env` with your configuration

3. **Start MongoDB**
   - Make sure MongoDB is running on your system
   - Update `MONGODB_URI` in `.env` if needed

4. **Run the Server**
   ```bash
   # Development mode (with nodemon)
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)

### Shifts
- `POST /api/shifts` - Create a new shift (Protected)
- `GET /api/shifts` - Get all shifts (Protected)
- `GET /api/shifts/:id` - Get a single shift (Protected)
- `PUT /api/shifts/:id` - Update a shift (Protected)
- `DELETE /api/shifts/:id` - Delete a shift (Protected)

### Upload
- `POST /api/upload/image` - Upload and process image with OCR (Protected)
- `POST /api/upload/excel` - Upload and process Excel file (Protected)
- `POST /api/upload/text` - Upload and process text file (Protected)

### Health Check
- `GET /health` - Server health check

## Features

- ✅ JWT-based authentication
- ✅ MongoDB with Mongoose ODM
- ✅ File upload handling (images, Excel, text)
- ✅ OCR integration with Tesseract.js
- ✅ Input validation with Joi
- ✅ Error handling middleware
- ✅ CORS support
- ✅ Environment-based configuration
- ✅ Graceful shutdown handling

## Next Steps

The following features need custom implementation:
- OCR text parsing logic for shift extraction
- Excel data parsing and shift creation
- Text file parsing and shift extraction
- Calendar integration
- Notification system

