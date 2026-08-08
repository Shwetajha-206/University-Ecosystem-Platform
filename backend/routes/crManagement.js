const express = require('express')
const router = express.Router()
const User = require('../models/User')
const Complaint = require('../models/Complaint')
const Grievance = require('../models/Grievance')
const Poll = require('../models/Poll')
const Message = require('../models/Message')
const Announcement = require('../models/Announcement')
const CrActivityLog = require('../models/CrActivityLog')
const CrRating = require('../models/CrRating')
const { authenticate, requireRole } = require('../middleware/auth')
const { sendError, handleServerError } = require('../utils/errors')
const { logAudit } = require('../utils/audit')
const { logCrActivity, computePerformanceMetrics } = require('../utils/crActivity')
const {
  isValidEmail,
  validatePassword,
  sanitizeString,
  pick,
} = require('../utils/validation')
const {
  buildStudentClassQuery,
  buildRecordClassQuery,
  buildClassQueryFromFields,
  buildCrClassQuery,
  bulkAssignStudentsToCr,
  syncClassStudentsToCr,
  transferStudentsToCr,
  reassignOpenItemsToCr,
  formatClassLabel,
  classFieldsFromUser,
} = require('../utils/classHelpers')

router.use(authenticate, requireRole('admin'))

function serializeCr(user, extra = {}) {
  return {
    id: user._id,
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    course: user.course,
    branch: user.branch,
    semester: user.semester,
    section: user.section,
    enrollmentNumber: user.enrollmentNumber,
    blocked: user.blocked,
    suspended: user.suspended,
    suspendedReason: user.suspendedReason,
    suspendedAt: user.suspendedAt,
    crWarnings: user.crWarnings || [],
    lastLoginAt: user.lastLoginAt,
    lastActiveAt: user.lastActiveAt,
    createdAt: user.createdAt,
    classLabel: formatClassLabel(user),
    ...extra,
  }
}

async function getCrOr404(id, res) {
  const cr = await User.findOne({ _id: id, role: 'cr' }).select('-password -refreshTokenHash')
  if (!cr) {
    sendError(res, 404, 'CR not found')
    return null
  }
  return cr
}

async function getCrStats(cr) {
  const classFilter = buildRecordClassQuery(cr)
  const studentQuery = buildStudentClassQuery(cr)
  const [students, complaints, grievances, polls, notices, messages, ratings] = await Promise.all([
    User.countDocuments(studentQuery),
    Complaint.find(classFilter),
    Grievance.find(classFilter),
    Poll.find({ createdBy: cr.email, active: { $ne: false } }),
    Announcement.find({ postedBy: cr.email, role: 'cr' }),
    Message.find({
      $or: [{ fromEmail: cr.email }, { toEmail: cr.email }],
    }).sort({ createdAt: -1 }).limit(500),
    CrRating.find({ crEmail: cr.email }),
  ])
  const performance = computePerformanceMetrics(complaints, grievances, messages)
  const avgRating = ratings.length
    ? Math.round((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length) * 10) / 10
    : null
  return {
    studentCount: students,
    pollsCount: polls.length,
    noticesCount: notices.length,
    performance,
    avgRating,
    ratingsCount: ratings.length,
  }
}

// Dashboard analytics
router.get('/dashboard', async (req, res) => {
  try {
    const crs = await User.find({ role: 'cr' }).select('-password -refreshTokenHash')
    const active = crs.filter(c => !c.blocked && !c.suspended)
    const inactive = crs.filter(c => c.blocked || c.suspended)

    const crPerformance = await Promise.all(crs.map(async (cr) => {
      const stats = await getCrStats(cr)
      return {
        id: cr._id,
        name: cr.name,
        email: cr.email,
        classLabel: formatClassLabel(cr),
        active: !cr.blocked && !cr.suspended,
        ...stats.performance,
        avgRating: stats.avgRating,
        studentCount: stats.studentCount,
      }
    }))

    const bestPerforming = [...crPerformance]
      .filter(c => c.totalComplaints + c.totalGrievances > 0)
      .sort((a, b) => b.resolutionRate - a.resolutionRate || a.avgResponseHours - b.avgResponseHours)
      .slice(0, 5)

    const complaintStats = crPerformance.map(c => ({
      name: c.name,
      classLabel: c.classLabel,
      total: c.totalComplaints,
      resolved: c.resolved,
      resolutionRate: c.resolutionRate,
    }))

    const feedbackRatings = await CrRating.aggregate([
      { $group: { _id: '$crEmail', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      { $sort: { avgRating: -1 } },
      { $limit: 10 },
    ])

    res.json({
      totals: {
        total: crs.length,
        active: active.length,
        inactive: inactive.length,
        suspended: crs.filter(c => c.suspended).length,
        blocked: crs.filter(c => c.blocked).length,
      },
      bestPerforming,
      complaintStats,
      feedbackRatings,
      crs: crPerformance,
    })
  } catch (err) {
    handleServerError(res, err, 'cr-dashboard')
  }
})

// List all CRs
router.get('/', async (req, res) => {
  try {
    const crs = await User.find({ role: 'cr' }).select('-password -refreshTokenHash').sort({ createdAt: -1 })
    const enriched = await Promise.all(crs.map(async (cr) => {
      const stats = await getCrStats(cr)
      return serializeCr(cr, {
        studentCount: stats.studentCount,
        resolutionRate: stats.performance.resolutionRate,
        avgRating: stats.avgRating,
        isActive: !cr.blocked && !cr.suspended,
      })
    }))
    res.json(enriched)
  } catch (err) {
    handleServerError(res, err, 'list-crs')
  }
})

// Create CR account
router.post('/', async (req, res) => {
  try {
    const { name, email, password, enrollmentNumber, course, branch, semester, section } = req.body
    if (!isValidEmail(email)) return sendError(res, 400, 'Invalid email address')
    const passErr = validatePassword(password)
    if (passErr) return sendError(res, 400, passErr)
    if (!course || !section) return sendError(res, 400, 'Course and section are required for CR')

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) return sendError(res, 400, 'Email already in use')

    const duplicate = await User.findOne(buildCrClassQuery({
      course: sanitizeString(course, 50),
      branch: sanitizeString(branch, 50),
      semester: sanitizeString(semester, 10),
      section: sanitizeString(section, 10),
    }))
    if (duplicate && !duplicate.blocked) {
      return sendError(res, 400, `A CR already exists for this class (${duplicate.name})`)
    }

    const cr = new User({
      name: sanitizeString(name, 100),
      email: email.toLowerCase(),
      password,
      role: 'cr',
      enrollmentNumber: sanitizeString(enrollmentNumber, 50),
      course: sanitizeString(course, 50),
      branch: sanitizeString(branch, 50),
      semester: sanitizeString(semester, 10),
      section: sanitizeString(section, 10),
    })
    await cr.save()

    const classFields = classFieldsFromUser(cr)
    const updated = await bulkAssignStudentsToCr(classFields, cr.email)

    await logAudit(req, 'CREATE_CR', 'cr', cr.email, formatClassLabel(cr))
    await logCrActivity({
      crEmail: cr.email,
      crName: cr.name,
      action: 'CR_CREATED',
      details: `Assigned to ${formatClassLabel(cr)}. ${updated} students linked.`,
      performedBy: req.user.email,
      performedByRole: 'admin',
    })

    res.status(201).json(serializeCr(cr, { studentsAssigned: updated }))
  } catch (err) {
    handleServerError(res, err, 'create-cr')
  }
})

// Get CR profile with full stats
router.get('/:id', async (req, res) => {
  try {
    const cr = await getCrOr404(req.params.id, res)
    if (!cr) return
    const stats = await getCrStats(cr)
    const students = await User.find(buildStudentClassQuery(cr))
      .select('-password -refreshTokenHash')
      .sort({ name: 1 })
    res.json({
      ...serializeCr(cr, stats),
      students: students.map(s => ({
        id: s._id,
        name: s.name,
        email: s.email,
        enrollmentNumber: s.enrollmentNumber,
        assignedCrEmail: s.assignedCrEmail,
      })),
    })
  } catch (err) {
    handleServerError(res, err, 'get-cr-profile')
  }
})

// Edit CR details
router.patch('/:id', async (req, res) => {
  try {
    const cr = await getCrOr404(req.params.id, res)
    if (!cr) return
    const fields = pick(req.body, ['name', 'email', 'enrollmentNumber'])
    if (fields.email && !isValidEmail(fields.email)) return sendError(res, 400, 'Invalid email address')
    if (fields.email) {
      const dup = await User.findOne({ email: fields.email.toLowerCase(), _id: { $ne: cr._id } })
      if (dup) return sendError(res, 400, 'Email already in use')
      fields.email = fields.email.toLowerCase()
    }
    if (fields.name) fields.name = sanitizeString(fields.name, 100)

    const updated = await User.findByIdAndUpdate(cr._id, fields, { new: true, select: '-password -refreshTokenHash' })
    await logAudit(req, 'UPDATE_CR', 'cr', updated.email)
    res.json(serializeCr(updated))
  } catch (err) {
    handleServerError(res, err, 'update-cr')
  }
})

// Change assigned course/branch/semester/section
router.patch('/:id/class', async (req, res) => {
  try {
    const cr = await getCrOr404(req.params.id, res)
    if (!cr) return

    const oldClass = classFieldsFromUser(cr)
    const { course, branch, semester, section, reassignStudents = true } = req.body
    const newClass = {
      course: sanitizeString(course || cr.course, 50),
      branch: sanitizeString(branch || cr.branch, 50),
      semester: sanitizeString(semester || cr.semester, 10),
      section: sanitizeString(section || cr.section, 10),
    }

    const duplicate = await User.findOne({
      ...buildCrClassQuery(newClass),
      _id: { $ne: cr._id },
      blocked: { $ne: true },
      suspended: { $ne: true },
    })
    if (duplicate) {
      return sendError(res, 400, `Another active CR exists for this class (${duplicate.name})`)
    }

    if (reassignStudents) {
      await syncClassStudentsToCr(oldClass)
    }

    const updated = await User.findByIdAndUpdate(cr._id, newClass, { new: true, select: '-password -refreshTokenHash' })
    let studentsUpdated = 0
    if (reassignStudents) {
      studentsUpdated = await bulkAssignStudentsToCr(newClass, updated.email)
    }

    await logAudit(req, 'CHANGE_CR_CLASS', 'cr', updated.email, `${formatClassLabel(oldClass)} → ${formatClassLabel(updated)}`)
    await logCrActivity({
      crEmail: updated.email,
      crName: updated.name,
      action: 'CLASS_CHANGED',
      details: `Moved from ${formatClassLabel(oldClass)} to ${formatClassLabel(updated)}. ${studentsUpdated} students updated.`,
      performedBy: req.user.email,
      performedByRole: 'admin',
    })

    res.json(serializeCr(updated, { studentsAssigned: studentsUpdated }))
  } catch (err) {
    handleServerError(res, err, 'change-cr-class')
  }
})

// Reset CR password
router.patch('/:id/password', async (req, res) => {
  try {
    const cr = await getCrOr404(req.params.id, res)
    if (!cr) return
    const passErr = validatePassword(req.body.password)
    if (passErr) return sendError(res, 400, passErr)

    cr.password = req.body.password
    cr.refreshTokenHash = null
    await cr.save()
    await logAudit(req, 'RESET_CR_PASSWORD', 'cr', cr.email)
    res.json({ message: 'Password reset successfully' })
  } catch (err) {
    handleServerError(res, err, 'reset-cr-password')
  }
})

// Activate/deactivate CR
router.patch('/:id/status', async (req, res) => {
  try {
    const cr = await getCrOr404(req.params.id, res)
    if (!cr) return
    const { active } = req.body
    const blocked = active === false

    const updated = await User.findByIdAndUpdate(
      cr._id,
      { blocked, refreshTokenHash: blocked ? null : cr.refreshTokenHash },
      { new: true, select: '-password -refreshTokenHash' }
    )

    if (blocked) {
      await syncClassStudentsToCr(classFieldsFromUser(updated))
    } else {
      await bulkAssignStudentsToCr(classFieldsFromUser(updated), updated.email)
    }

    await logAudit(req, blocked ? 'DEACTIVATE_CR' : 'ACTIVATE_CR', 'cr', updated.email)
    res.json(serializeCr(updated))
  } catch (err) {
    handleServerError(res, err, 'cr-status')
  }
})

// Suspend CR
router.patch('/:id/suspend', async (req, res) => {
  try {
    const cr = await getCrOr404(req.params.id, res)
    if (!cr) return
    const { suspended, reason } = req.body

    const updated = await User.findByIdAndUpdate(
      cr._id,
      {
        suspended: !!suspended,
        suspendedReason: suspended ? sanitizeString(reason, 200) : '',
        suspendedAt: suspended ? new Date() : null,
        refreshTokenHash: suspended ? null : cr.refreshTokenHash,
      },
      { new: true, select: '-password -refreshTokenHash' }
    )

    if (suspended) {
      await syncClassStudentsToCr(classFieldsFromUser(updated))
    } else {
      await bulkAssignStudentsToCr(classFieldsFromUser(updated), updated.email)
    }

    await logAudit(req, suspended ? 'SUSPEND_CR' : 'UNSUSPEND_CR', 'cr', updated.email, reason)
    res.json(serializeCr(updated))
  } catch (err) {
    handleServerError(res, err, 'suspend-cr')
  }
})

// Send warning to CR
router.post('/:id/warn', async (req, res) => {
  try {
    const cr = await getCrOr404(req.params.id, res)
    if (!cr) return
    const message = sanitizeString(req.body.message, 500)
    if (!message) return sendError(res, 400, 'Warning message is required')

    const warning = { message, issuedBy: req.user.email, issuedAt: new Date() }
    const updated = await User.findByIdAndUpdate(
      cr._id,
      { $push: { crWarnings: warning } },
      { new: true, select: '-password -refreshTokenHash' }
    )

    await logAudit(req, 'WARN_CR', 'cr', cr.email, message)
    await logCrActivity({
      crEmail: cr.email,
      crName: cr.name,
      action: 'WARNING_ISSUED',
      details: message,
      performedBy: req.user.email,
      performedByRole: 'admin',
    })

    res.json(serializeCr(updated))
  } catch (err) {
    handleServerError(res, err, 'warn-cr')
  }
})

// Delete CR
router.delete('/:id', async (req, res) => {
  try {
    const cr = await getCrOr404(req.params.id, res)
    if (!cr) return
    const { transferToCrId } = req.body || {}

    if (transferToCrId) {
      const newCr = await getCrOr404(transferToCrId, res)
      if (!newCr) return
      await transferStudentsToCr(cr.email, newCr.email)
      await reassignOpenItemsToCr(cr.email, newCr.email, newCr.name)
    } else {
      await User.updateMany({ assignedCrEmail: cr.email }, { assignedCrEmail: null })
    }

    await syncClassStudentsToCr(classFieldsFromUser(cr))
    await User.findByIdAndDelete(cr._id)
    await logAudit(req, 'DELETE_CR', 'cr', cr.email)
    res.json({ message: 'CR deleted successfully' })
  } catch (err) {
    handleServerError(res, err, 'delete-cr')
  }
})

// Replace existing CR with new CR
router.post('/:id/replace', async (req, res) => {
  try {
    const oldCr = await getCrOr404(req.params.id, res)
    if (!oldCr) return

    const { name, email, password, deactivateOld = true } = req.body
    if (!isValidEmail(email)) return sendError(res, 400, 'Invalid email address')
    const passErr = validatePassword(password)
    if (passErr) return sendError(res, 400, passErr)

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) return sendError(res, 400, 'Email already in use')

    const newCr = new User({
      name: sanitizeString(name, 100),
      email: email.toLowerCase(),
      password,
      role: 'cr',
      course: oldCr.course,
      branch: oldCr.branch,
      semester: oldCr.semester,
      section: oldCr.section,
      enrollmentNumber: oldCr.enrollmentNumber,
    })
    await newCr.save()

    const transferred = await transferStudentsToCr(oldCr.email, newCr.email)
    const reassigned = await reassignOpenItemsToCr(oldCr.email, newCr.email, newCr.name)

    if (deactivateOld) {
      oldCr.blocked = true
      oldCr.refreshTokenHash = null
      await oldCr.save()
    }

    await logAudit(req, 'REPLACE_CR', 'cr', `${oldCr.email} → ${newCr.email}`)
    await logCrActivity({
      crEmail: newCr.email,
      crName: newCr.name,
      action: 'CR_REPLACED',
      details: `Replaced ${oldCr.name}. ${transferred} students transferred.`,
      performedBy: req.user.email,
      performedByRole: 'admin',
    })

    res.status(201).json({
      newCr: serializeCr(newCr),
      transferred,
      reassigned,
      oldCrDeactivated: deactivateOld,
    })
  } catch (err) {
    handleServerError(res, err, 'replace-cr')
  }
})

// Transfer students to another CR
router.post('/:id/transfer-students', async (req, res) => {
  try {
    const fromCr = await getCrOr404(req.params.id, res)
    if (!fromCr) return
    const { toCrId, studentEmails } = req.body
    const toCr = await getCrOr404(toCrId, res)
    if (!toCr) return

    const transferred = await transferStudentsToCr(fromCr.email, toCr.email, studentEmails)
    await logAudit(req, 'TRANSFER_STUDENTS', 'cr', `${fromCr.email} → ${toCr.email}`, `${transferred} students`)
    res.json({ transferred, fromCr: fromCr.email, toCr: toCr.email })
  } catch (err) {
    handleServerError(res, err, 'transfer-students')
  }
})

// Reassign CR responsibilities (open complaints/grievances)
router.post('/:id/reassign-responsibilities', async (req, res) => {
  try {
    const fromCr = await getCrOr404(req.params.id, res)
    if (!fromCr) return
    const { toCrId } = req.body
    const toCr = await getCrOr404(toCrId, res)
    if (!toCr) return

    const result = await reassignOpenItemsToCr(fromCr.email, toCr.email, toCr.name)
    await logAudit(req, 'REASSIGN_CR_RESPONSIBILITIES', 'cr', fromCr.email, toCr.email)
    res.json(result)
  } catch (err) {
    handleServerError(res, err, 'reassign-responsibilities')
  }
})

// Activity logs
router.get('/:id/activity', async (req, res) => {
  try {
    const cr = await getCrOr404(req.params.id, res)
    if (!cr) return
    const logs = await CrActivityLog.find({ crEmail: cr.email }).sort({ createdAt: -1 }).limit(200)
    res.json(logs)
  } catch (err) {
    handleServerError(res, err, 'cr-activity')
  }
})

// Complaints handled by CR
router.get('/:id/complaints', async (req, res) => {
  try {
    const cr = await getCrOr404(req.params.id, res)
    if (!cr) return
    const classFilter = buildRecordClassQuery(cr)
    const complaints = await Complaint.find({
      $or: [{ assignedTo: cr.email }, classFilter],
    }).sort({ createdAt: -1 })
    res.json(complaints)
  } catch (err) {
    handleServerError(res, err, 'cr-complaints')
  }
})

// Grievances handled by CR
router.get('/:id/grievances', async (req, res) => {
  try {
    const cr = await getCrOr404(req.params.id, res)
    if (!cr) return
    const classFilter = buildRecordClassQuery(cr)
    const grievances = await Grievance.find({
      $or: [{ assignedTo: cr.email }, classFilter],
    }).sort({ createdAt: -1 })
    res.json(grievances)
  } catch (err) {
    handleServerError(res, err, 'cr-grievances')
  }
})

// Polls created by CR
router.get('/:id/polls', async (req, res) => {
  try {
    const cr = await getCrOr404(req.params.id, res)
    if (!cr) return
    const polls = await Poll.find({ createdBy: cr.email }).sort({ createdAt: -1 })
    res.json(polls)
  } catch (err) {
    handleServerError(res, err, 'cr-polls')
  }
})

// Notices sent by CR
router.get('/:id/notices', async (req, res) => {
  try {
    const cr = await getCrOr404(req.params.id, res)
    if (!cr) return
    const notices = await Announcement.find({ postedBy: cr.email, role: 'cr' }).sort({ createdAt: -1 })
    res.json(notices)
  } catch (err) {
    handleServerError(res, err, 'cr-notices')
  }
})

// Student chats with CR
router.get('/:id/messages', async (req, res) => {
  try {
    const cr = await getCrOr404(req.params.id, res)
    if (!cr) return
    const messages = await Message.find({
      $or: [{ fromEmail: cr.email }, { toEmail: cr.email }],
    }).sort({ createdAt: -1 }).limit(500)
    res.json(messages)
  } catch (err) {
    handleServerError(res, err, 'cr-messages')
  }
})

// Performance analytics
router.get('/:id/performance', async (req, res) => {
  try {
    const cr = await getCrOr404(req.params.id, res)
    if (!cr) return
    const classFilter = buildRecordClassQuery(cr)
    const [complaints, grievances, messages, ratings] = await Promise.all([
      Complaint.find(classFilter),
      Grievance.find(classFilter),
      Message.find({ $or: [{ fromEmail: cr.email }, { toEmail: cr.email }] }),
      CrRating.find({ crEmail: cr.email }),
    ])
    const performance = computePerformanceMetrics(complaints, grievances, messages)
    const avgRating = ratings.length
      ? Math.round((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length) * 10) / 10
      : null

    const statusBreakdown = {}
    ;[...complaints, ...grievances].forEach(i => {
      const s = i.status || 'pending'
      statusBreakdown[s] = (statusBreakdown[s] || 0) + 1
    })

    res.json({
      performance,
      avgRating,
      ratingsCount: ratings.length,
      ratings,
      statusBreakdown,
      lastLoginAt: cr.lastLoginAt,
      lastActiveAt: cr.lastActiveAt,
      isActive: !cr.blocked && !cr.suspended,
    })
  } catch (err) {
    handleServerError(res, err, 'cr-performance')
  }
})

// Override CR decision on complaint
router.post('/override/complaint/:complaintId', async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.complaintId)
    if (!complaint) return sendError(res, 404, 'Complaint not found')

    const updates = pick(req.body, ['status', 'crVerified', 'markedImportant', 'priorityRecommendation', 'adminReply'])
    if (updates.adminReply) {
      updates.adminReply = `[Admin Override] ${sanitizeString(updates.adminReply, 2000)}`
      updates.repliedAt = new Date()
    }

    const updated = await Complaint.findByIdAndUpdate(complaint._id, updates, { new: true })
    await logAudit(req, 'OVERRIDE_CR_DECISION', 'complaint', updated.complaintID, JSON.stringify(updates))
    if (complaint.assignedTo) {
      await logCrActivity({
        crEmail: complaint.assignedTo,
        crName: complaint.assignedToName,
        action: 'ADMIN_OVERRIDE',
        target: 'complaint',
        targetId: updated.complaintID,
        details: JSON.stringify(updates),
        performedBy: req.user.email,
        performedByRole: 'admin',
      })
    }
    res.json(updated)
  } catch (err) {
    handleServerError(res, err, 'override-complaint')
  }
})

// Override CR decision on grievance
router.post('/override/grievance/:grievanceId', async (req, res) => {
  try {
    const grievance = await Grievance.findById(req.params.grievanceId)
    if (!grievance) return sendError(res, 404, 'Grievance not found')

    const updates = pick(req.body, ['status', 'crVerified', 'markedImportant', 'priorityRecommendation', 'adminReply'])
    if (updates.adminReply) {
      updates.adminReply = `[Admin Override] ${sanitizeString(updates.adminReply, 2000)}`
      updates.repliedAt = new Date()
    }

    const updated = await Grievance.findByIdAndUpdate(grievance._id, updates, { new: true })
    await logAudit(req, 'OVERRIDE_CR_DECISION', 'grievance', updated.grievanceID, JSON.stringify(updates))
    if (grievance.assignedTo) {
      await logCrActivity({
        crEmail: grievance.assignedTo,
        crName: grievance.assignedToName,
        action: 'ADMIN_OVERRIDE',
        target: 'grievance',
        targetId: updated.grievanceID,
        details: JSON.stringify(updates),
        performedBy: req.user.email,
        performedByRole: 'admin',
      })
    }
    res.json(updated)
  } catch (err) {
    handleServerError(res, err, 'override-grievance')
  }
})

// Take control of any complaint
router.post('/take-control/complaint/:complaintId', async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.complaintId)
    if (!complaint) return sendError(res, 404, 'Complaint not found')

    const updated = await Complaint.findByIdAndUpdate(complaint._id, {
      assignedTo: req.user.email,
      assignedToName: req.user.name,
      assignedToRole: 'admin',
      status: 'In Progress',
    }, { new: true })

    await logAudit(req, 'TAKE_CONTROL', 'complaint', updated.complaintID)
    if (complaint.assignedTo && complaint.assignedToRole === 'cr') {
      await logCrActivity({
        crEmail: complaint.assignedTo,
        crName: complaint.assignedToName,
        action: 'ADMIN_TAKE_CONTROL',
        target: 'complaint',
        targetId: updated.complaintID,
        performedBy: req.user.email,
        performedByRole: 'admin',
      })
    }
    res.json(updated)
  } catch (err) {
    handleServerError(res, err, 'take-control-complaint')
  }
})

// Take control of any grievance
router.post('/take-control/grievance/:grievanceId', async (req, res) => {
  try {
    const grievance = await Grievance.findById(req.params.grievanceId)
    if (!grievance) return sendError(res, 404, 'Grievance not found')

    const updated = await Grievance.findByIdAndUpdate(grievance._id, {
      assignedTo: req.user.email,
      assignedToName: req.user.name,
      assignedToRole: 'admin',
      status: 'In Progress',
    }, { new: true })

    await logAudit(req, 'TAKE_CONTROL', 'grievance', updated.grievanceID)
    if (grievance.assignedTo && grievance.assignedToRole === 'cr') {
      await logCrActivity({
        crEmail: grievance.assignedTo,
        crName: grievance.assignedToName,
        action: 'ADMIN_TAKE_CONTROL',
        target: 'grievance',
        targetId: updated.grievanceID,
        performedBy: req.user.email,
        performedByRole: 'admin',
      })
    }
    res.json(updated)
  } catch (err) {
    handleServerError(res, err, 'take-control-grievance')
  }
})

// Student CR ratings (admin view all, students can submit via class route)
router.get('/:id/ratings', async (req, res) => {
  try {
    const cr = await getCrOr404(req.params.id, res)
    if (!cr) return
    const ratings = await CrRating.find({ crEmail: cr.email }).sort({ createdAt: -1 })
    res.json(ratings)
  } catch (err) {
    handleServerError(res, err, 'cr-ratings')
  }
})

module.exports = router
