const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const { authenticate, requireRole } = require('../middleware/auth')
const { sanitizeString, isSafeUrl } = require('../utils/validation')
const { sendError, handleServerError } = require('../utils/errors')

const SkillResourceSchema = new mongoose.Schema({
  title: String,
  link: String,
  category: String,
  description: { type: String, default: '' },
  subject: { type: String, default: '' },
  addedBy: { type: String, default: '' },
  addedByRole: { type: String, default: '' },
}, { timestamps: true })

const SkillResource = mongoose.model('SkillResource', SkillResourceSchema)

router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const resources = await SkillResource.find().sort({ createdAt: -1 })
    res.json(resources)
  } catch (err) {
    handleServerError(res, err, 'list-skillresources')
  }
})

router.post('/', requireRole('admin', 'student', 'cr'), async (req, res) => {
  try {
    const { title, link, category, description, subject } = req.body
    if (!title || !link) return sendError(res, 400, 'Title and link are required')
    if (!isSafeUrl(link)) return sendError(res, 400, 'Link must be a valid http(s) URL')

    const resource = new SkillResource({
      title: sanitizeString(title, 200),
      link: link.trim(),
      category: sanitizeString(category, 100),
      description: sanitizeString(description, 500),
      subject: sanitizeString(subject, 100),
      addedBy: req.user.name || req.user.email,
      addedByRole: req.user.role || '',
    })
    await resource.save()
    res.status(201).json(resource)
  } catch (err) {
    handleServerError(res, err, 'create-skillresource')
  }
})

router.delete('/:id', requireRole('admin', 'student', 'cr'), async (req, res) => {
  try {
    const result = await SkillResource.findByIdAndDelete(req.params.id)
    if (!result) return sendError(res, 404, 'Not found')
    res.json({ message: 'Deleted' })
  } catch (err) {
    handleServerError(res, err, 'delete-skillresource')
  }
})

module.exports = router
