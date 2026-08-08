const express = require('express')
const router = express.Router()
const Notification = require('../models/Notification')
const { authenticate, requireRole } = require('../middleware/auth')
const { sanitizeString } = require('../utils/validation')
const { sendError, handleServerError } = require('../utils/errors')
const { logAudit } = require('../utils/audit')

router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const role = req.user.role
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    const filtered = notifications.filter(n => {
      if (role === 'admin') return true
      if (Array.isArray(n.targetEmails) && n.targetEmails.length > 0) {
        return n.targetEmails.includes(req.user.email)
      }
      return n.targetRoles.includes(role)
    })
    res.json(filtered)
  } catch (err) {
    handleServerError(res, err, 'list-notifications')
  }
})

router.get('/unread-count', async (req, res) => {
  try {
    const role = req.user.role
    const notifications = await Notification.find().lean()
    const count = notifications.filter(n => {
      if (n.readBy.includes(req.user.email)) return false
      if (role === 'admin') return true
      if (Array.isArray(n.targetEmails) && n.targetEmails.length > 0) {
        return n.targetEmails.includes(req.user.email)
      }
      return n.targetRoles.includes(role)
    }).length
    res.json({ count })
  } catch (err) {
    handleServerError(res, err, 'unread-count')
  }
})

router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
    if (!notification) return sendError(res, 404, 'Not found')
    if (!notification.readBy.includes(req.user.email)) {
      notification.readBy.push(req.user.email)
      await notification.save()
    }
    res.json(notification)
  } catch (err) {
    handleServerError(res, err, 'mark-read')
  }
})

router.post('/broadcast', requireRole('admin'), async (req, res) => {
  try {
    const { title, message, type = 'notice', targetRoles, priority = 'normal' } = req.body
    if (!title || !message) return sendError(res, 400, 'Title and message are required')

    const notification = await Notification.create({
      title: sanitizeString(title, 200),
      message: sanitizeString(message, 2000),
      type: ['notice', 'announcement', 'emergency', 'alert'].includes(type) ? type : 'notice',
      targetRoles: Array.isArray(targetRoles) && targetRoles.length ? targetRoles : ['student', 'cr', 'vendor', 'admin'],
      postedBy: req.user.email,
      postedByName: req.user.name,
      priority: ['normal', 'high', 'critical'].includes(priority) ? priority : 'normal',
    })

    await logAudit(req, 'BROADCAST', 'notification', notification._id, title)
    res.status(201).json(notification)
  } catch (err) {
    handleServerError(res, err, 'broadcast')
  }
})

router.post('/emergency', requireRole('admin'), async (req, res) => {
  try {
    const { title, message } = req.body
    if (!title || !message) return sendError(res, 400, 'Title and message are required')

    const notification = await Notification.create({
      title: sanitizeString(title, 200),
      message: sanitizeString(message, 2000),
      type: 'emergency',
      targetRoles: ['student', 'cr', 'vendor', 'admin'],
      postedBy: req.user.email,
      postedByName: req.user.name,
      priority: 'critical',
    })

    await logAudit(req, 'EMERGENCY_ALERT', 'notification', notification._id, title)
    res.status(201).json(notification)
  } catch (err) {
    handleServerError(res, err, 'emergency-alert')
  }
})

router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id)
    res.json({ message: 'Deleted' })
  } catch (err) {
    handleServerError(res, err, 'delete-notification')
  }
})

module.exports = router
