const AuditLog = require('../models/AuditLog')

async function logAudit(req, action, target = '', targetId = '', details = '') {
  try {
    if (!req.user || req.user.role !== 'admin') return
    await AuditLog.create({
      adminId: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      action,
      target,
      targetId: String(targetId),
      details: typeof details === 'string' ? details.slice(0, 500) : JSON.stringify(details).slice(0, 500),
      ip: req.ip || req.headers['x-forwarded-for'] || '',
    })
  } catch {
    // non-blocking
  }
}

module.exports = { logAudit }
