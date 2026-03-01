const mongoose = require('mongoose');

const userPreferencesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Preferences must belong to a user'],
    unique: true,
    index: true
  },
  notificationType: {
    type: String,
    enum: {
      values: ['sound', 'vibration', 'silent'],
      message: 'notificationType must be one of: sound, vibration, silent'
    },
    default: 'sound'
  },
  reminderTime: {
    type: Number,
    default: 30,
    min: [0, 'Reminder time cannot be negative'],
    max: [1440, 'Reminder time cannot exceed 24 hours (1440 minutes)']
  },
  enableCalendarSync: {
    type: Boolean,
    default: true
  },
  enableNotifications: {
    type: Boolean,
    default: true
  },
  autoCreateCalendarEvents: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: false, updatedAt: true }
});

// Index on userId for fast lookups (already unique, but explicit index helps)
userPreferencesSchema.index({ userId: 1 });

// Pre-save hook to update updatedAt
userPreferencesSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('UserPreferences', userPreferencesSchema);

