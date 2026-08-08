const mongoose = require('mongoose')

const complaintSchema = new mongoose.Schema({
  complaintID: { type: String, unique: true },
  studentID: { type: String, required: true },
  studentName: { type: String, default: '' },
  title: { type: String, default: '' },
  priority: { type: String, default: 'Medium' },
  anonymous: { type: Boolean, default: false },
  category: { type: String, required: true },
  description: { type: String, required: true },
  proof: { type: mongoose.Schema.Types.Mixed, default: [] },
  status: { type: String, enum: ['pending', 'reviewing', 'In Progress', 'resolved', 'rejected', 'Resolved', 'Rejected'], default: 'pending' },
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

complaintSchema.pre('save', async function(next) {
  if (!this.complaintID) {
    const count = await mongoose.model('Complaint').countDocuments()
    this.complaintID = `C${String(count + 1).padStart(3, '0')}`
  }
  next()
})

module.exports = mongoose.model('Complaint', complaintSchema)