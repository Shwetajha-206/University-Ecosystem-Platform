const mongoose = require('mongoose')

const ratingSchema = new mongoose.Schema({
  studentID: { type: String, required: true },
  studentName: { type: String, default: '' },
  vendorName: { type: String, required: true },
  vendorID: { type: String, default: 'V001' }, // required false kiya
  rating: { type: Number, min: 1, max: 5, required: true },
  comments: { type: String, default: '' },
  photo: { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('Rating', ratingSchema)