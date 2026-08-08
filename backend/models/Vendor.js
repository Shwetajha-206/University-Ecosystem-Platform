const mongoose = require('mongoose')

const vendorSchema = new mongoose.Schema({
  vendorID: { type: String, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  avgRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true })

vendorSchema.pre('save', async function(next) {
  if (!this.vendorID) {
    const count = await mongoose.model('Vendor').countDocuments()
    this.vendorID = `V${String(count + 1).padStart(3, '0')}`
  }
  next()
})

module.exports = mongoose.model('Vendor', vendorSchema)