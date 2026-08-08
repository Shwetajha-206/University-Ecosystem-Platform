const mongoose = require('mongoose')

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, enum: ['general', 'exam', 'event', 'holiday', 'urgent'], default: 'general' },
  postedBy: { type: String, required: true },
  role: { type: String, default: 'admin' },
  targetCourse: { type: String, default: '' },
  targetBranch: { type: String, default: '' },
  targetSemester: { type: String, default: '' },
  targetSection: { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('Announcement', announcementSchema)