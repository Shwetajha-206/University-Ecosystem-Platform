const mongoose = require('mongoose')

const auditLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminName: { type: String, required: true },
  adminEmail: { type: String, required: true },
  action: { type: String, required: true },
  target: { type: String, default: '' },
  targetId: { type: String, default: '' },
  details: { type: String, default: '' },
  ip: { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('AuditLog', auditLogSchema)
