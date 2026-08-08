const express = require('express')

const router = express.Router()

const Complaint = require('../models/Complaint')

const User = require('../models/User')

const { authenticate, requireRole } = require('../middleware/auth')

const { sanitizeString, validateProofFiles, STATUS_VALUES } = require('../utils/validation')

const { sendError, handleServerError } = require('../utils/errors')

const { logAudit } = require('../utils/audit')

const { getAutoAssignRole, getDefaultDeadline } = require('../utils/complaintHelpers')

const { notifyComplaintEvent } = require('../utils/syncNotifications')

const {
  studentClassSnapshot,
  buildRecordClassQuery,
  recordMatchesClass,
  findClassCr,
} = require('../utils/classHelpers')
const { logCrActivity } = require('../utils/crActivity')



router.use(authenticate)



function getListFilter(user) {
  if (user.role === 'vendor') {
    return { assignedTo: user.email }
  }
  if (user.role === 'cr') {
    return buildRecordClassQuery(user)
  }
  return {}
}

async function canManageComplaint(complaint, user) {
  if (user.role === 'admin') return true
  if (user.role === 'cr') {
    return recordMatchesClass(complaint, user)
  }
  if (user.role === 'vendor') {
    return complaint.assignedTo === user.email
  }
  return false
}



async function autoAssignComplaint(complaint, submitter) {

  if (submitter?.role === 'student') {
    const classCr = await findClassCr(submitter)
    if (classCr) {
      complaint.assignedTo = classCr.email
      complaint.assignedToName = classCr.name
      complaint.assignedToRole = 'cr'
      complaint.department = classCr.branch || classCr.course || ''
      complaint.deadline = getDefaultDeadline(complaint.priority)
      return complaint
    }
  }

  const role = getAutoAssignRole(complaint.category)

  const assignee = await User.findOne({ role, blocked: { $ne: true } }).sort({ createdAt: 1 })

  if (assignee) {

    complaint.assignedTo = assignee.email

    complaint.assignedToName = assignee.name

    complaint.assignedToRole = role

    complaint.department = assignee.branch || assignee.course || ''

  }

  complaint.deadline = getDefaultDeadline(complaint.priority)

  return complaint

}



router.get('/', requireRole('admin', 'cr', 'vendor'), async (req, res) => {

  try {

    const complaints = await Complaint.find(getListFilter(req.user)).sort({ createdAt: -1 })

    res.json(complaints)

  } catch (err) {

    handleServerError(res, err, 'list-complaints')

  }

})



router.get('/user/:id', async (req, res) => {

  try {

    const email = decodeURIComponent(req.params.id)

    const isAdminOrCr = ['admin', 'cr'].includes(req.user.role)

    if (email !== req.user.email && !isAdminOrCr) {

      return sendError(res, 403, 'Insufficient permissions')

    }

    if (req.user.role === 'cr' && email !== req.user.email) {
      const student = await User.findOne({ email, role: 'student' })
      if (!student) return sendError(res, 404, 'Student not found')
      const probe = { studentCourse: student.course, studentBranch: student.branch, studentSemester: student.semester, studentSection: student.section }
      if (!recordMatchesClass(probe, req.user)) return sendError(res, 403, 'Student not in your class')
    }

    const complaints = await Complaint.find({ studentID: email }).sort({ createdAt: -1 })

    res.json(complaints)

  } catch (err) {

    handleServerError(res, err, 'user-complaints')

  }

})



router.post('/', requireRole('student', 'cr'), async (req, res) => {

  try {

    const { title, category, description, priority, anonymous, proof } = req.body

    if (!category || !description) return sendError(res, 400, 'Category and description are required')



    let complaint = new Complaint({

      studentID: anonymous ? 'anonymous' : req.user.email,

      studentName: anonymous ? 'Anonymous' : sanitizeString(req.user.name, 100),

      title: sanitizeString(title, 200),

      category: sanitizeString(category, 100),

      description: sanitizeString(description, 2000),

      priority: sanitizeString(priority, 20) || 'Medium',

      anonymous: !!anonymous,

      proof: validateProofFiles(proof),

      status: 'pending',

      ...studentClassSnapshot(req.user),

    })

    complaint = await autoAssignComplaint(complaint, req.user)

    await complaint.save()

    if (complaint.assignedTo) {
      await notifyComplaintEvent(complaint, 'created', req.user)
    }

    res.status(201).json(complaint)

  } catch (err) {

    handleServerError(res, err, 'create-complaint')

  }

})



router.patch('/:id', requireRole('admin', 'cr', 'vendor'), async (req, res) => {

  try {

    const { status } = req.body

    if (!STATUS_VALUES.complaint.includes(status)) {

      return sendError(res, 400, 'Invalid status')

    }

    const existing = await Complaint.findById(req.params.id)

    if (!existing) return sendError(res, 404, 'Not found')

    if (!(await canManageComplaint(existing, req.user))) {

      return sendError(res, 403, 'Insufficient permissions')

    }

    const complaint = await Complaint.findByIdAndUpdate(req.params.id, { status }, { new: true })

    if (req.user.role === 'admin') await logAudit(req, 'UPDATE_STATUS', 'complaint', complaint.complaintID, status)

    await notifyComplaintEvent(complaint, 'status', req.user)

    res.json(complaint)

  } catch (err) {

    handleServerError(res, err, 'update-complaint')

  }

})



router.patch('/:id/reply', requireRole('admin', 'cr', 'vendor'), async (req, res) => {

  try {

    const existing = await Complaint.findById(req.params.id)

    if (!existing) return sendError(res, 404, 'Not found')

    if (!(await canManageComplaint(existing, req.user))) {

      return sendError(res, 403, 'Insufficient permissions')

    }

    const prefix = req.user.role === 'vendor' ? `[Vendor Update - ${req.user.name}] ` : ''

    const adminReply = prefix + sanitizeString(req.body.adminReply, 2000)

    const complaint = await Complaint.findByIdAndUpdate(

      req.params.id,

      { adminReply, repliedAt: new Date() },

      { new: true }

    )

    if (req.user.role === 'admin') await logAudit(req, 'REPLY', 'complaint', complaint.complaintID)

    await notifyComplaintEvent(complaint, 'reply', req.user)

    res.json(complaint)

  } catch (err) {

    handleServerError(res, err, 'reply-complaint')

  }

})



router.patch('/:id/assign', requireRole('admin'), async (req, res) => {

  try {

    const { assigneeEmail } = req.body

    const assignee = await User.findOne({ email: assigneeEmail.toLowerCase(), role: { $in: ['cr', 'vendor', 'admin'] } })

    if (!assignee) return sendError(res, 404, 'Assignee not found')



    const complaint = await Complaint.findByIdAndUpdate(

      req.params.id,

      {

        assignedTo: assignee.email,

        assignedToName: assignee.name,

        assignedToRole: assignee.role,

        status: 'In Progress',

      },

      { new: true }

    )

    if (!complaint) return sendError(res, 404, 'Not found')

    await logAudit(req, 'ASSIGN', 'complaint', complaint.complaintID, assignee.email)

    await notifyComplaintEvent(complaint, 'assigned', req.user)

    res.json(complaint)

  } catch (err) {

    handleServerError(res, err, 'assign-complaint')

  }

})



router.patch('/:id/escalate', requireRole('admin'), async (req, res) => {

  try {

    const complaint = await Complaint.findById(req.params.id)

    if (!complaint) return sendError(res, 404, 'Not found')



    complaint.escalationLevel = (complaint.escalationLevel || 0) + 1

    complaint.escalatedAt = new Date()

    complaint.priority = complaint.escalationLevel >= 2 ? 'Urgent' : 'High'

    complaint.status = 'In Progress'



    const admin = await User.findOne({ role: 'admin', blocked: { $ne: true } })

    if (admin) {

      complaint.assignedTo = admin.email

      complaint.assignedToName = admin.name

      complaint.assignedToRole = 'admin'

    }

    await complaint.save()

    await logAudit(req, 'ESCALATE', 'complaint', complaint.complaintID, `Level ${complaint.escalationLevel}`)

    await notifyComplaintEvent(complaint, 'escalated', req.user)

    res.json(complaint)

  } catch (err) {

    handleServerError(res, err, 'escalate-complaint')

  }

})



router.patch('/:id/deadline', requireRole('admin'), async (req, res) => {

  try {

    const { deadline } = req.body

    if (!deadline) return sendError(res, 400, 'Deadline is required')

    const complaint = await Complaint.findByIdAndUpdate(

      req.params.id,

      { deadline: new Date(deadline) },

      { new: true }

    )

    if (!complaint) return sendError(res, 404, 'Not found')

    await logAudit(req, 'SET_DEADLINE', 'complaint', complaint.complaintID, deadline)

    await notifyComplaintEvent(complaint, 'deadline', req.user)

    res.json(complaint)

  } catch (err) {

    handleServerError(res, err, 'set-deadline')

  }

})



router.patch('/:id/verify', requireRole('cr'), async (req, res) => {
  try {
    const existing = await Complaint.findById(req.params.id)
    if (!existing) return sendError(res, 404, 'Not found')
    if (!recordMatchesClass(existing, req.user)) return sendError(res, 403, 'Insufficient permissions')
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, { crVerified: true }, { new: true })
    await logCrActivity({ crEmail: req.user.email, crName: req.user.name, action: 'VERIFY_COMPLAINT', target: 'complaint', targetId: complaint.complaintID })
    await notifyComplaintEvent(complaint, 'status', req.user)
    res.json(complaint)
  } catch (err) {
    handleServerError(res, err, 'verify-complaint')
  }
})

router.patch('/:id/important', requireRole('cr'), async (req, res) => {
  try {
    const existing = await Complaint.findById(req.params.id)
    if (!existing) return sendError(res, 404, 'Not found')
    if (!recordMatchesClass(existing, req.user)) return sendError(res, 403, 'Insufficient permissions')
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, { markedImportant: !!req.body.markedImportant }, { new: true })
    await logCrActivity({ crEmail: req.user.email, crName: req.user.name, action: 'MARK_IMPORTANT', target: 'complaint', targetId: complaint.complaintID, details: String(!!req.body.markedImportant) })
    res.json(complaint)
  } catch (err) {
    handleServerError(res, err, 'mark-important')
  }
})

router.patch('/:id/priority-recommendation', requireRole('cr'), async (req, res) => {
  try {
    const priority = sanitizeString(req.body.priorityRecommendation, 20)
    if (!['Low', 'Medium', 'High', 'Urgent'].includes(priority)) {
      return sendError(res, 400, 'Invalid priority recommendation')
    }
    const existing = await Complaint.findById(req.params.id)
    if (!existing) return sendError(res, 404, 'Not found')
    if (!recordMatchesClass(existing, req.user)) return sendError(res, 403, 'Insufficient permissions')
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, { priorityRecommendation: priority }, { new: true })
    await notifyComplaintEvent(complaint, 'status', req.user)
    res.json(complaint)
  } catch (err) {
    handleServerError(res, err, 'priority-recommendation')
  }
})

router.patch('/:id/forward', requireRole('cr'), async (req, res) => {
  try {
    const { assigneeEmail } = req.body
    const existing = await Complaint.findById(req.params.id)
    if (!existing) return sendError(res, 404, 'Not found')
    if (!recordMatchesClass(existing, req.user)) return sendError(res, 403, 'Insufficient permissions')
    const assignee = await User.findOne({ email: assigneeEmail.toLowerCase(), role: { $in: ['vendor', 'admin'] } })
    if (!assignee) return sendError(res, 404, 'Assignee not found')
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, {
      forwardedTo: assignee.email,
      forwardedToRole: assignee.role,
      assignedTo: assignee.email,
      assignedToName: assignee.name,
      assignedToRole: assignee.role,
      status: 'In Progress',
    }, { new: true })
    await notifyComplaintEvent(complaint, 'assigned', req.user)
    res.json(complaint)
  } catch (err) {
    handleServerError(res, err, 'forward-complaint')
  }
})

router.patch('/:id/cr-escalate', requireRole('cr'), async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
    if (!complaint) return sendError(res, 404, 'Not found')
    if (!recordMatchesClass(complaint, req.user)) return sendError(res, 403, 'Insufficient permissions')
    complaint.crEscalated = true
    complaint.escalationLevel = (complaint.escalationLevel || 0) + 1
    complaint.escalatedAt = new Date()
    complaint.priority = 'High'
    complaint.status = 'In Progress'
    const admin = await User.findOne({ role: 'admin', blocked: { $ne: true } })
    if (admin) {
      complaint.assignedTo = admin.email
      complaint.assignedToName = admin.name
      complaint.assignedToRole = 'admin'
      complaint.forwardedTo = admin.email
      complaint.forwardedToRole = 'admin'
    }
    await complaint.save()
    await notifyComplaintEvent(complaint, 'escalated', req.user)
    res.json(complaint)
  } catch (err) {
    handleServerError(res, err, 'cr-escalate-complaint')
  }
})

router.put('/:id', requireRole('admin', 'cr', 'vendor'), async (req, res) => {

  try {

    const { status } = req.body

    if (!STATUS_VALUES.complaint.includes(status)) {

      return sendError(res, 400, 'Invalid status')

    }

    const existing = await Complaint.findById(req.params.id)

    if (!existing) return sendError(res, 404, 'Not found')

    if (!(await canManageComplaint(existing, req.user))) {

      return sendError(res, 403, 'Insufficient permissions')

    }

    const complaint = await Complaint.findByIdAndUpdate(req.params.id, { status }, { new: true })

    await notifyComplaintEvent(complaint, 'status', req.user)

    res.json(complaint)

  } catch (err) {

    handleServerError(res, err, 'update-complaint')

  }

})



module.exports = router
