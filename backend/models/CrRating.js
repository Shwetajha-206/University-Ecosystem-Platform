const mongoose = require('mongoose')

const crRatingSchema = new mongoose.Schema({
  crEmail: { type: String, required: true, index: true },
  crName: { type: String, default: '' },
  studentEmail: { type: String, required: true },
  studentName: { type: String, default: '' },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: '' },
  course: { type: String, default: '' },
  branch: { type: String, default: '' },
  semester: { type: String, default: '' },
  section: { type: String, default: '' },
}, { timestamps: true })

crRatingSchema.index({ crEmail: 1, studentEmail: 1 }, { unique: true })

module.exports = mongoose.model('CrRating', crRatingSchema)
