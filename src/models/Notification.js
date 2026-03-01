const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Notification must belong to a user'],
    index: true
  },
  shiftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift',
    required: [true, 'Notification must be associated with a shift'],
    index: true
  },
  reminderMinutesBefore: {
    type: Number,
    required: [true, 'Reminder minutes before is required'],
    min: [0, 'Reminder minutes cannot be negative'],
    max: [1440, 'Reminder minutes cannot exceed 24 hours (1440 minutes)']
  },
  triggerTime: {
    type: Date,
    required: [true, 'Trigger time is required'],
    index: true
  },
  sent: {
    type: Boolean,
    default: false,
    index: true
  },
  sentAt: {
    type: Date
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'sent', 'cancelled'],
      message: 'status must be one of: pending, sent, cancelled'
    },
    default: 'pending',
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
notificationSchema.index({ userId: 1, status: 1 });
notificationSchema.index({ triggerTime: 1, status: 1 });
notificationSchema.index({ shiftId: 1 });

// Virtual to check if notification is due
notificationSchema.virtual('isDue').get(function() {
  return this.triggerTime <= new Date() && this.status === 'pending';
});

// Method to mark as sent
notificationSchema.methods.markAsSent = function() {
  this.sent = true;
  this.sentAt = new Date();
  this.status = 'sent';
  return this.save();
};

// Ensure virtuals are included in JSON output
notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Notification', notificationSchema);

