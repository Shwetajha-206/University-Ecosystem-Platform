const express = require('express')
const router = express.Router()
const AuditLog = require('../models/AuditLog')
const { authenticate, requireRole } = require('../middleware/auth')
const { handleServerError } = require('../utils/errors')

router.use(authenticate, requireRole('admin'))

router.get('/', async (req, res) => {
  try {
    const { limit = 100, action } = req.query
    const filter = action ? { action } : {}
    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 100, 500))
      .lean()
    res.json(logs)
  } catch (err) {
    handleServerError(res, err, 'list-audit-logs')
  }
})

module.exports = router
