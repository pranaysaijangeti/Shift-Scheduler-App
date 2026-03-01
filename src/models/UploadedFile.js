const mongoose = require('mongoose');

const uploadedFileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'File must belong to a user'],
    index: true
  },
  fileName: {
    type: String,
    required: [true, 'Please provide a file name'],
    trim: true,
    maxlength: [500, 'File name cannot be more than 500 characters']
  },
  storedFileName: {
    type: String,
    trim: true,
    maxlength: [500, 'Stored file name cannot be more than 500 characters']
  },
  fileType: {
    type: String,
    required: [true, 'Please provide a file type'],
    enum: {
      values: ['image', 'text', 'excel'],
      message: 'fileType must be one of: image, text, excel'
    },
    index: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  processedAt: {
    type: Date
  },
  shiftsExtracted: {
    type: Number,
    default: 0,
    min: [0, 'Shifts extracted cannot be negative']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'processed', 'error'],
      message: 'status must be one of: pending, processed, error'
    },
    default: 'pending',
    index: true
  },
  errorMessage: {
    type: String,
    trim: true,
    maxlength: [1000, 'Error message cannot be more than 1000 characters']
  }
}, {
  timestamps: true
});

// Compound index on userId and status for user-specific file queries
uploadedFileSchema.index({ userId: 1, status: 1 });

// Index on uploadedAt for sorting by upload date
uploadedFileSchema.index({ uploadedAt: -1 });

// Virtual to check if file is processed
uploadedFileSchema.virtual('isProcessed').get(function() {
  return this.status === 'processed';
});

// Virtual to check if file has errors
uploadedFileSchema.virtual('hasError').get(function() {
  return this.status === 'error';
});

// Method to mark as processed
uploadedFileSchema.methods.markAsProcessed = function(shiftsCount = 0) {
  this.status = 'processed';
  this.processedAt = new Date();
  this.shiftsExtracted = shiftsCount;
  return this.save();
};

// Method to mark as error
uploadedFileSchema.methods.markAsError = function(errorMessage) {
  this.status = 'error';
  this.errorMessage = errorMessage || 'Unknown error occurred';
  this.processedAt = new Date();
  return this.save();
};

// Ensure virtuals are included in JSON output
uploadedFileSchema.set('toJSON', { virtuals: true });
uploadedFileSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('UploadedFile', uploadedFileSchema);

