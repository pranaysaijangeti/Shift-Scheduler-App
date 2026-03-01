const mongoose = require('mongoose');

// Time format validation (HH:MM)
const timeFormatRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

const shiftSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Shift must belong to a user'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a shift title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  date: {
    type: Date,
    required: [true, 'Please provide a shift date'],
    index: true
  },
  startTime: {
    type: String,
    required: [true, 'Please provide a start time'],
    match: [timeFormatRegex, 'Start time must be in HH:MM format (e.g., 09:00)']
  },
  endTime: {
    type: String,
    required: [true, 'Please provide an end time'],
    match: [timeFormatRegex, 'End time must be in HH:MM format (e.g., 17:00)'],
    validate: {
      validator: function(value) {
        if (!this.startTime) return true;
        // Convert HH:MM to minutes for comparison
        const startMinutes = this.startTime.split(':').reduce((h, m) => parseInt(h) * 60 + parseInt(m));
        const endMinutes = value.split(':').reduce((h, m) => parseInt(h) * 60 + parseInt(m));
        return endMinutes > startMinutes;
      },
      message: 'End time must be after start time'
    }
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot be more than 200 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  reminderMinutesBefore: {
    type: Number,
    default: 30,
    min: [0, 'Reminder minutes cannot be negative'],
    max: [1440, 'Reminder minutes cannot exceed 24 hours (1440 minutes)']
  },
  alarmSet: {
    type: Boolean,
    default: false
  },
  calendarEventId: {
    type: String,
    trim: true
  },
  notificationId: {
    type: String,
    trim: true
  },
  extractedFrom: {
    type: String,
    enum: {
      values: ['image', 'text', 'excel'],
      message: 'extractedFrom must be one of: image, text, excel'
    }
  },
  fileName: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound index on userId and date for fast queries
shiftSchema.index({ userId: 1, date: 1 });

// Index on date for date range queries
shiftSchema.index({ date: 1 });

// Index on userId for user-specific queries
shiftSchema.index({ userId: 1 });

// Virtual for full start datetime
shiftSchema.virtual('startDateTime').get(function() {
  if (this.date && this.startTime) {
    const [hours, minutes] = this.startTime.split(':').map(Number);
    const date = new Date(this.date);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }
  return null;
});

// Virtual for full end datetime
shiftSchema.virtual('endDateTime').get(function() {
  if (this.date && this.endTime) {
    const [hours, minutes] = this.endTime.split(':').map(Number);
    const date = new Date(this.date);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }
  return null;
});

// Virtual for shift duration in hours
shiftSchema.virtual('durationHours').get(function() {
  if (this.startTime && this.endTime) {
    const startMinutes = this.startTime.split(':').reduce((h, m) => parseInt(h) * 60 + parseInt(m));
    const endMinutes = this.endTime.split(':').reduce((h, m) => parseInt(h) * 60 + parseInt(m));
    return (endMinutes - startMinutes) / 60;
  }
  return 0;
});

// Ensure virtuals are included in JSON output
shiftSchema.set('toJSON', { virtuals: true });
shiftSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Shift', shiftSchema);
