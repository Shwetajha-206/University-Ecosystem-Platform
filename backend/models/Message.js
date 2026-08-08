const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  fromEmail: { type: String, required: true },
  fromName: { type: String, default: '' },
  fromRole: { type: String, default: 'student' },
  toEmail: { type: String, required: true },
  toName: { type: String, default: '' },
  toRole: { type: String, default: 'cr' },
  body: { type: String, required: true },
  read: { type: Boolean, default: false },
  course: { type: String, default: '' },
  branch: { type: String, default: '' },
  semester: { type: String, default: '' },
  section: { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('Message', messageSchema)
