const mongoose = require('mongoose')

const crActivityLogSchema = new mongoose.Schema({
  crEmail: { type: String, required: true, index: true },
  crName: { type: String, default: '' },
  action: { type: String, required: true },
  target: { type: String, default: '' },
  targetId: { type: String, default: '' },
  details: { type: String, default: '' },
  performedBy: { type: String, default: '' },
  performedByRole: { type: String, default: 'cr' },
}, { timestamps: true })

module.exports = mongoose.model('CrActivityLog', crActivityLogSchema)
