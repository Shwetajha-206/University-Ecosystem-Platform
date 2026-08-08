const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'cr', 'vendor', 'admin', 'faculty'], default: 'student' },
  shop: { type: String, default: null },
  blocked: { type: Boolean, default: false },
  // Student / CR fields
  enrollmentNumber: { type: String, default: null },
  course: { type: String, default: null },
  branch: { type: String, default: null },
  semester: { type: String, default: null },
  section: { type: String, default: null },
  assignedCrEmail: { type: String, default: null },
  refreshTokenHash: { type: String, default: null },
  suspicious: { type: Boolean, default: false },
  suspiciousReason: { type: String, default: '' },
  lastActiveAt: { type: Date },
  lastLoginAt: { type: Date },
  suspended: { type: Boolean, default: false },
  suspendedReason: { type: String, default: '' },
  suspendedAt: { type: Date },
  crWarnings: [{
    message: { type: String, default: '' },
    issuedBy: { type: String, default: '' },
    issuedAt: { type: Date, default: Date.now },
  }],
  readAnnouncements: [{ type: String }],
}, { timestamps: true })

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password)
}

module.exports = mongoose.model('User', userSchema)