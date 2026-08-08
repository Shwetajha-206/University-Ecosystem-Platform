const express = require('express')
const router = express.Router()
const LostItem = require('../models/LostItem')
const { authenticate, requireRole } = require('../middleware/auth')
const { sanitizeString, validatePhoto, STATUS_VALUES } = require('../utils/validation')
const { sendError, handleServerError } = require('../utils/errors')

router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const items = await LostItem.find().sort({ createdAt: -1 })
    res.json(items)
  } catch (err) {
    handleServerError(res, err, 'list-lostitems')
  }
})

router.post('/', requireRole('student', 'cr'), async (req, res) => {
  try {
    const { itemName, description, photo, location, type } = req.body
    if (!itemName) return sendError(res, 400, 'Item name is required')

    const item = new LostItem({
      studentID: req.user.email,
      reporterName: req.user.name || '',
      itemName: sanitizeString(itemName, 200),
      description: sanitizeString(description, 1000),
      location: sanitizeString(location, 200),
      photo: validatePhoto(photo),
      status: type === 'found' ? 'found' : 'lost',
    })
    await item.save()
    res.status(201).json(item)
  } catch (err) {
    handleServerError(res, err, 'create-lostitem')
  }
})

router.patch('/:id/status', async (req, res) => {
  try {
    const item = await LostItem.findById(req.params.id)
    if (!item) return sendError(res, 404, 'Not found')

    const isOwner = item.studentID === req.user.email
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) return sendError(res, 403, 'Insufficient permissions')

    const { status } = req.body
    if (!STATUS_VALUES.lostitem.includes(status)) {
      return sendError(res, 400, 'Invalid status')
    }

    item.status = status
    await item.save()
    res.json(item)
  } catch (err) {
    handleServerError(res, err, 'update-lostitem')
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const item = await LostItem.findById(req.params.id)
    if (!item) return sendError(res, 404, 'Not found')

    const isOwner = item.studentID === req.user.email
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) return sendError(res, 403, 'Insufficient permissions')

    await item.deleteOne()
    res.json({ message: 'Deleted' })
  } catch (err) {
    handleServerError(res, err, 'delete-lostitem')
  }
})

module.exports = router
