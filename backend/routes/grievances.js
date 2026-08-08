const express = require('express')

const router = express.Router()

const Grievance = require('../models/Grievance')

const User = require('../models/User')

const { authenticate, requireRole } = require('../middleware/auth')

const { sanitizeString, validateProofFiles, STATUS_VALUES } = require('../utils/validation')

const { sendError, handleServerError } = require('../utils/errors')

const { logAudit } = require('../utils/audit')

const { getAutoAssignRole, getDefaultDeadline } = require('../utils/complaintHelpers')

const { notifyGrievanceEvent } = require('../utils/syncNotifications')

const {
  studentClassSnapshot,
  buildRecordClassQuery,
  recordMatchesClass,
  findClassCr,
} = require('../utils/classHelpers')

// Public route for tracking grievances (no auth required)
router.get('/public/:id', async (req, res) => {
  try {
    const g = await Grievance.findOne({ grievanceID: req.params.id })
    if (!g) return res.status(404).json({ message: 'Not found' })
    // anonymous grievances ke liye student name hide karo
    const safe = g.toObject()
    if (safe.anonymous) { 
      safe.studentName = 'Anonymous'
      safe.studentID = ''
    }
    res.json(safe)
  } catch (err) {
    handleServerError(res, err, 'public-track-grievance')
  }
})

router.use(authenticate)



function getListFilter(user) {
  if (user.role === 'admin') return {}
  if (user.role === 'vendor') return { assignedTo: user.email }
  if (user.role === 'cr') return buildRecordClassQuery(user)
  return null
}

async function canManageGrievance(grievance, user) {
  if (user.role === 'admin') return true
  if (user.role === 'cr') return recordMatchesClass(grievance, user)
  return false
}



async function autoAssignGrievance(grievance, submitter) {

  if (submitter?.role === 'student') {
    const classCr = await findClassCr(submitter)
    if (classCr) {
      grievance.assignedTo = classCr.email
      grievance.assignedToName = classCr.name
      grievance.assignedToRole = 'cr'
      grievance.department = classCr.branch || classCr.course || ''
      grievance.deadline = getDefaultDeadline(grievance.priority)
      return grievance
    }
  }

  const role = getAutoAssignRole(grievance.category)

  const assignee = await User.findOne({ role, blocked: { $ne: true } }).sort({ createdAt: 1 })

  if (assignee) {

    grievance.assignedTo = assignee.email

    grievance.assignedToName = assignee.name

    grievance.assignedToRole = role

    grievance.department = assignee.branch || assignee.course || ''

  }

  grievance.deadline = getDefaultDeadline(grievance.priority)

  return grievance

}



router.get('/', requireRole('admin', 'cr', 'vendor'), async (req, res) => {

  try {

    const filter = getListFilter(req.user)

    const grievances = await Grievance.find(filter || {}).sort({ createdAt: -1 })

    res.json(grievances)

  } catch (err) {

    handleServerError(res, err, 'list-grievances')

  }

})



router.get('/user/:id', async (req, res) => {

  try {

    const email = decodeURIComponent(req.params.id)

    if (email !== req.user.email && req.user.role !== 'admin') {

      return sendError(res, 403, 'Insufficient permissions')

    }

    const grievances = await Grievance.find({ studentID: email }).sort({ createdAt: -1 })

    res.json(grievances)

  } catch (err) {

    handleServerError(res, err, 'user-grievances')

  }

})



router.post('/', requireRole('student', 'cr'), async (req, res) => {

  try {

    const { title, category, description, priority, anonymous, proof } = req.body

    if (!category || !description) return sendError(res, 400, 'Category and description are required')



    let grievance = new Grievance({

      studentID: anonymous ? 'anonymous' : req.user.email,

      studentName: anonymous ? 'Anonymous' : sanitizeString(req.user.name, 100),

      title: sanitizeString(title, 200),

      category: sanitizeString(category, 100),

      description: sanitizeString(description, 2000),

      priority: sanitizeString(priority, 20) || 'Medium',

      anonymous: !!anonymous,

      proof: validateProofFiles(proof),

      status: 'Pending',

      ...studentClassSnapshot(req.user),

    })

    grievance = await autoAssignGrievance(grievance, req.user)

    await grievance.save()

    if (grievance.assignedTo) {
      await notifyGrievanceEvent(grievance, 'created', req.user)
    }

    res.status(201).json(grievance)

  } catch (err) {

    handleServerError(res, err, 'create-grievance')

  }

})



router.patch('/:id/status', requireRole('admin', 'cr'), async (req, res) => {

  try {

    const { status } = req.body

    if (!STATUS_VALUES.grievance.includes(status)) {

      return sendError(res, 400, 'Invalid status')

    }

    const existing = await Grievance.findById(req.params.id)

    if (!existing) return sendError(res, 404, 'Not found')

    if (!(await canManageGrievance(existing, req.user))) return sendError(res, 403, 'Insufficient permissions')

    const grievance = await Grievance.findByIdAndUpdate(req.params.id, { status }, { new: true })

    if (req.user.role === 'admin') await logAudit(req, 'UPDATE_STATUS', 'grievance', grievance.grievanceID, status)

    await notifyGrievanceEvent(grievance, 'status', req.user)

    res.json(grievance)

  } catch (err) {

    handleServerError(res, err, 'update-grievance-status')

  }

})



router.patch('/:id/reply', requireRole('admin', 'cr'), async (req, res) => {

  try {

    const existing = await Grievance.findById(req.params.id)

    if (!existing) return sendError(res, 404, 'Not found')

    if (!(await canManageGrievance(existing, req.user))) return sendError(res, 403, 'Insufficient permissions')

    const prefix = req.user.role === 'cr' ? `[CR - ${req.user.name}] ` : ''

    const adminReply = prefix + sanitizeString(req.body.adminReply, 2000)

    const grievance = await Grievance.findByIdAndUpdate(

      req.params.id,

      { adminReply, repliedAt: new Date() },

      { new: true }

    )

    if (req.user.role === 'admin') await logAudit(req, 'REPLY', 'grievance', grievance.grievanceID)

    await notifyGrievanceEvent(grievance, 'reply', req.user)

    res.json(grievance)

  } catch (err) {

    handleServerError(res, err, 'reply-grievance')

  }

})

router.patch('/:id/verify', requireRole('cr'), async (req, res) => {
  try {
    const existing = await Grievance.findById(req.params.id)
    if (!existing) return sendError(res, 404, 'Not found')
    if (!recordMatchesClass(existing, req.user)) return sendError(res, 403, 'Insufficient permissions')
    const grievance = await Grievance.findByIdAndUpdate(req.params.id, { crVerified: true }, { new: true })
    res.json(grievance)
  } catch (err) {
    handleServerError(res, err, 'verify-grievance')
  }
})

router.patch('/:id/important', requireRole('cr'), async (req, res) => {
  try {
    const existing = await Grievance.findById(req.params.id)
    if (!existing) return sendError(res, 404, 'Not found')
    if (!recordMatchesClass(existing, req.user)) return sendError(res, 403, 'Insufficient permissions')
    const grievance = await Grievance.findByIdAndUpdate(req.params.id, { markedImportant: !!req.body.markedImportant }, { new: true })
    res.json(grievance)
  } catch (err) {
    handleServerError(res, err, 'mark-grievance-important')
  }
})

router.patch('/:id/priority-recommendation', requireRole('cr'), async (req, res) => {
  try {
    const priority = sanitizeString(req.body.priorityRecommendation, 20)
    if (!['Low', 'Medium', 'High', 'Urgent'].includes(priority)) return sendError(res, 400, 'Invalid priority')
    const existing = await Grievance.findById(req.params.id)
    if (!existing) return sendError(res, 404, 'Not found')
    if (!recordMatchesClass(existing, req.user)) return sendError(res, 403, 'Insufficient permissions')
    const grievance = await Grievance.findByIdAndUpdate(req.params.id, { priorityRecommendation: priority }, { new: true })
    await notifyGrievanceEvent(grievance, 'status', req.user)
    res.json(grievance)
  } catch (err) {
    handleServerError(res, err, 'grievance-priority-recommendation')
  }
})

router.patch('/:id/forward', requireRole('cr'), async (req, res) => {
  try {
    const { assigneeEmail } = req.body
    const existing = await Grievance.findById(req.params.id)
    if (!existing) return sendError(res, 404, 'Not found')
    if (!recordMatchesClass(existing, req.user)) return sendError(res, 403, 'Insufficient permissions')
    const assignee = await User.findOne({ email: assigneeEmail.toLowerCase(), role: { $in: ['vendor', 'admin'] } })
    if (!assignee) return sendError(res, 404, 'Assignee not found')
    const grievance = await Grievance.findByIdAndUpdate(req.params.id, {
      forwardedTo: assignee.email,
      forwardedToRole: assignee.role,
      assignedTo: assignee.email,
      assignedToName: assignee.name,
      assignedToRole: assignee.role,
      status: 'In Progress',
    }, { new: true })
    await notifyGrievanceEvent(grievance, 'assigned', req.user)
    res.json(grievance)
  } catch (err) {
    handleServerError(res, err, 'forward-grievance')
  }
})

router.patch('/:id/cr-escalate', requireRole('cr'), async (req, res) => {
  try {
    const grievance = await Grievance.findById(req.params.id)
    if (!grievance) return sendError(res, 404, 'Not found')
    if (!recordMatchesClass(grievance, req.user)) return sendError(res, 403, 'Insufficient permissions')
    grievance.crEscalated = true
    grievance.escalationLevel = (grievance.escalationLevel || 0) + 1
    grievance.escalatedAt = new Date()
    grievance.priority = 'High'
    grievance.status = 'In Progress'
    const admin = await User.findOne({ role: 'admin', blocked: { $ne: true } })
    if (admin) {
      grievance.assignedTo = admin.email
      grievance.assignedToName = admin.name
      grievance.assignedToRole = 'admin'
      grievance.forwardedTo = admin.email
      grievance.forwardedToRole = 'admin'
    }
    await grievance.save()
    await notifyGrievanceEvent(grievance, 'escalated', req.user)
    res.json(grievance)
  } catch (err) {
    handleServerError(res, err, 'cr-escalate-grievance')
  }
})



router.patch('/:id/assign', requireRole('admin'), async (req, res) => {

  try {

    const { assigneeEmail } = req.body

    const assignee = await User.findOne({ email: assigneeEmail.toLowerCase(), role: { $in: ['cr', 'vendor', 'admin'] } })

    if (!assignee) return sendError(res, 404, 'Assignee not found')



    const grievance = await Grievance.findByIdAndUpdate(

      req.params.id,

      {

        assignedTo: assignee.email,

        assignedToName: assignee.name,

        assignedToRole: assignee.role,

        status: 'In Progress',

      },

      { new: true }

    )

    if (!grievance) return sendError(res, 404, 'Not found')

    await logAudit(req, 'ASSIGN', 'grievance', grievance.grievanceID, assignee.email)

    await notifyGrievanceEvent(grievance, 'assigned', req.user)

    res.json(grievance)

  } catch (err) {

    handleServerError(res, err, 'assign-grievance')

  }

})



router.patch('/:id/escalate', requireRole('admin'), async (req, res) => {

  try {

    const grievance = await Grievance.findById(req.params.id)

    if (!grievance) return sendError(res, 404, 'Not found')



    grievance.escalationLevel = (grievance.escalationLevel || 0) + 1

    grievance.escalatedAt = new Date()

    grievance.priority = grievance.escalationLevel >= 2 ? 'Urgent' : 'High'

    grievance.status = 'In Progress'



    const admin = await User.findOne({ role: 'admin', blocked: { $ne: true } })

    if (admin) {

      grievance.assignedTo = admin.email

      grievance.assignedToName = admin.name

      grievance.assignedToRole = 'admin'

    }

    await grievance.save()

    await logAudit(req, 'ESCALATE', 'grievance', grievance.grievanceID, `Level ${grievance.escalationLevel}`)

    await notifyGrievanceEvent(grievance, 'escalated', req.user)

    res.json(grievance)

  } catch (err) {

    handleServerError(res, err, 'escalate-grievance')

  }

})



router.patch('/:id/deadline', requireRole('admin'), async (req, res) => {

  try {

    const { deadline } = req.body

    if (!deadline) return sendError(res, 400, 'Deadline is required')

    const grievance = await Grievance.findByIdAndUpdate(

      req.params.id,

      { deadline: new Date(deadline) },

      { new: true }

    )

    if (!grievance) return sendError(res, 404, 'Not found')

    await logAudit(req, 'SET_DEADLINE', 'grievance', grievance.grievanceID, deadline)

    await notifyGrievanceEvent(grievance, 'deadline', req.user)

    res.json(grievance)

  } catch (err) {

    handleServerError(res, err, 'set-deadline')

  }

})



router.delete('/:id', requireRole('admin'), async (req, res) => {

  try {

    const result = await Grievance.findByIdAndDelete(req.params.id)

    if (!result) return sendError(res, 404, 'Not found')

    await logAudit(req, 'DELETE', 'grievance', result.grievanceID)

    res.json({ message: 'Deleted' })

  } catch (err) {

    handleServerError(res, err, 'delete-grievance')

  }

})



module.exports = router
