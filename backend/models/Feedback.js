const mongoose = require('mongoose')

const feedbackSchema = new mongoose.Schema({
  feedbackID: { type: String, unique: true },
  studentID: { type: String, required: true },
  subject: { type: String, required: true },
  teacher: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comments: { type: String, default: '' },
}, { timestamps: true })

feedbackSchema.pre('save', async function(next) {
  if (!this.feedbackID) {
    const count = await mongoose.model('Feedback').countDocuments()
    this.feedbackID = `F${String(count + 1).padStart(3, '0')}`
  }
  next()
})

module.exports = mongoose.model('Feedback', feedbackSchema)