const express = require('express')
const router = express.Router()
const Announcement = require('../models/Announcement')
const { authenticate, requireRole } = require('../middleware/auth')
const { sanitizeString } = require('../utils/validation')
const { sendError, handleServerError } = require('../utils/errors')
const { announcementMatchesUser, classFieldsFromUser } = require('../utils/classHelpers')

const VALID_CATEGORIES = ['general', 'exam', 'event', 'holiday', 'urgent']

router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 })
    const filtered = req.user.role === 'admin'
      ? announcements
      : announcements.filter(a => announcementMatchesUser(a, req.user))
    res.json(filtered)
  } catch (err) {
    handleServerError(res, err, 'list-announcements')
  }
})

router.post('/', requireRole('admin', 'cr'), async (req, res) => {
  try {
    const { title, content, category } = req.body
    if (!title || !content) return sendError(res, 400, 'Title and content are required')

    const safeCategory = VALID_CATEGORIES.includes(category) ? category : 'general'

    const cls = req.user.role === 'cr' ? classFieldsFromUser(req.user) : {}
    const announcement = new Announcement({
      title: sanitizeString(title, 200),
      content: sanitizeString(content, 5000),
      category: safeCategory,
      postedBy: sanitizeString(req.user.name, 100),
      role: req.user.role,
      targetCourse: cls.course || '',
      targetBranch: cls.branch || '',
      targetSemester: cls.semester || '',
      targetSection: cls.section || '',
    })
    await announcement.save()
    res.status(201).json(announcement)
  } catch (err) {
    handleServerError(res, err, 'create-announcement')
  }
})

router.delete('/:id', requireRole('admin', 'cr'), async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
    if (!announcement) return sendError(res, 404, 'Not found')

    const isAuthor = announcement.postedBy === req.user.name
    const isAdmin = req.user.role === 'admin'
    if (!isAuthor && !isAdmin) return sendError(res, 403, 'Insufficient permissions')

    await announcement.deleteOne()
    res.json({ message: 'Deleted' })
  } catch (err) {
    handleServerError(res, err, 'delete-announcement')
  }
})

module.exports = router
