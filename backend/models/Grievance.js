const mongoose = require('mongoose')
const { customAlphabet } = require('nanoid')

// Custom alphabet for readable IDs: uppercase letters + numbers, excluding ambiguous chars (0, O, I, 1)
const nanoid = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 8)

const grievanceSchema = new mongoose.Schema({
  grievanceID: { type: String, unique: true },
  studentID: { type: String, required: true },
  studentName: { type: String, default: '' },
  title: { type: String, default: '' },
  priority: { type: String, default: 'Medium' },
  anonymous: { type: Boolean, default: false },
  category: { type: String, required: true },
  description: { type: String, required: true },
  proof: { type: mongoose.Schema.Types.Mixed, default: [] },
  status: { type: String, enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'], default: 'Pending' },
  adminReply: { type: String, default: '' },
  repliedAt: { type: Date },
  assignedTo: { type: String, default: '' },
  assignedToName: { type: String, default: '' },
  assignedToRole: { type: String, enum: ['', 'cr', 'vendor', 'admin'], default: '' },
  escalationLevel: { type: Number, default: 0 },
  escalatedAt: { type: Date },
  deadline: { type: Date },
  department: { type: String, default: '' },
  studentCourse: { type: String, default: '' },
  studentBranch: { type: String, default: '' },
  studentSemester: { type: String, default: '' },
  studentSection: { type: String, default: '' },
  crVerified: { type: Boolean, default: false },
  markedImportant: { type: Boolean, default: false },
  priorityRecommendation: { type: String, default: '' },
  crEscalated: { type: Boolean, default: false },
  forwardedTo: { type: String, default: '' },
  forwardedToRole: { type: String, default: '' },
}, { timestamps: true })

grievanceSchema.pre('save', async function(next) {
  if (!this.grievanceID) {
    // Generate unique ID with retry logic for collision safety
    let attempts = 0
    const maxAttempts = 5
    
    while (attempts < maxAttempts) {
      try {
        const id = `G-${nanoid()}`
        // Check if ID already exists
        const existing = await mongoose.model('Grievance').findOne({ grievanceID: id })
        if (!existing) {
          this.grievanceID = id
          break
        }
        attempts++
      } catch (err) {
        attempts++
        if (attempts >= maxAttempts) {
          return next(new Error('Failed to generate unique grievance ID'))
        }
      }
    }
  }
  
  // Normalize status to title case
  if (this.status) {
    const statusMap = {
      'pending': 'Pending',
      'resolved': 'Resolved',
      'rejected': 'Rejected',
    }
    this.status = statusMap[this.status.toLowerCase()] || this.status
  }
  
  next()
})

module.exports = mongoose.model('Grievance', grievanceSchema)