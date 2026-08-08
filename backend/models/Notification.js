const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['notice', 'announcement', 'emergency', 'alert'], default: 'notice' },
  targetRoles: { type: [String], default: ['student', 'cr', 'vendor', 'admin'] },
  targetEmails: { type: [String], default: [] },
  postedBy: { type: String, required: true },
  postedByName: { type: String, default: '' },
  readBy: { type: [String], default: [] },
  priority: { type: String, enum: ['normal', 'high', 'critical'], default: 'normal' },
}, { timestamps: true })

module.exports = mongoose.model('Notification', notificationSchema)
