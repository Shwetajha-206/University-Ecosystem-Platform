const mongoose = require('mongoose')

const lostItemSchema = new mongoose.Schema({
  itemID: { type: String, unique: true },
  studentID: { type: String, required: true },
  reporterName: { type: String, default: '' },
  itemName: { type: String, required: true },
  description: { type: String, default: '' },
  location: { type: String, default: '' },
  photo: { type: String, default: '' },
  status: { type: String, enum: ['lost', 'found', 'claimed'], default: 'lost' },
}, { timestamps: true })

lostItemSchema.pre('save', async function(next) {
  if (!this.itemID) {
    const count = await mongoose.model('LostItem').countDocuments()
    this.itemID = `I${String(count + 1).padStart(3, '0')}`
  }
  next()
})

module.exports = mongoose.model('LostItem', lostItemSchema)