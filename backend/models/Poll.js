const mongoose = require('mongoose')

const pollSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{
    text: { type: String, required: true },
    votes: { type: [String], default: [] },
  }],
  createdBy: { type: String, required: true },
  createdByName: { type: String, default: '' },
  course: { type: String, default: '' },
  branch: { type: String, default: '' },
  semester: { type: String, default: '' },
  section: { type: String, default: '' },
  expiresAt: { type: Date },
  active: { type: Boolean, default: true },
}, { timestamps: true })

module.exports = mongoose.model('Poll', pollSchema)
