const express = require('express')
const router = express.Router()
const Vendor = require('../models/Vendor')
const { authenticate, requireRole } = require('../middleware/auth')
const { sanitizeString } = require('../utils/validation')
const { sendError, handleServerError } = require('../utils/errors')

router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 })
    res.json(vendors)
  } catch (err) {
    handleServerError(res, err, 'list-vendors')
  }
})

router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { name, category } = req.body
    if (!name || !category) return sendError(res, 400, 'Name and category are required')

    const vendor = new Vendor({
      name: sanitizeString(name, 100),
      category: sanitizeString(category, 100),
      status: 'active',
    })
    await vendor.save()
    res.status(201).json(vendor)
  } catch (err) {
    handleServerError(res, err, 'create-vendor')
  }
})

router.patch('/:id', requireRole('admin'), async (req, res) => {
  try {
    const updates = {}
    if (req.body.name) updates.name = sanitizeString(req.body.name, 100)
    if (req.body.category) updates.category = sanitizeString(req.body.category, 100)
    if (req.body.status && ['active', 'inactive'].includes(req.body.status)) {
      updates.status = req.body.status
    }

    const vendor = await Vendor.findByIdAndUpdate(req.params.id, updates, { new: true })
    if (!vendor) return sendError(res, 404, 'Not found')
    res.json(vendor)
  } catch (err) {
    handleServerError(res, err, 'update-vendor')
  }
})

router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const result = await Vendor.findByIdAndDelete(req.params.id)
    if (!result) return sendError(res, 404, 'Not found')
    res.json({ message: 'Deleted' })
  } catch (err) {
    handleServerError(res, err, 'delete-vendor')
  }
})

module.exports = router
