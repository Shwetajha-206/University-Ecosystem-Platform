const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { sendError } = require('../utils/errors')

async function authenticate(req, res, next) {
  const token = req.cookies?.accessToken
    || (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null)

  if (!token) {
    return sendError(res, 401, 'Authentication required')
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password -refreshTokenHash')
    if (!user) return sendError(res, 401, 'Authentication required')
    if (user.blocked) return sendError(res, 403, 'Account blocked')
    if (user.suspended) return sendError(res, 403, 'Account suspended')
    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Token expired')
    }
    return sendError(res, 401, 'Authentication required')
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return sendError(res, 401, 'Authentication required')
    if (!roles.includes(req.user.role)) {
      return sendError(res, 403, 'Insufficient permissions')
    }
    next()
  }
}

function requireSelfOrRole(paramName = 'id', ...roles) {
  return (req, res, next) => {
    if (!req.user) return sendError(res, 401, 'Authentication required')
    const targetId = req.params[paramName]
    const isSelf = req.user._id.toString() === targetId
    if (isSelf || roles.includes(req.user.role)) return next()
    return sendError(res, 403, 'Insufficient permissions')
  }
}

function ownsByEmail(resource) {
  if (!resource) return false
  return resource.studentID === 'anonymous' ? false : resource.studentID === resource._ownerEmail
}

function checkResourceOwner(getResource) {
  return async (req, res, next) => {
    try {
      const resource = await getResource(req)
      if (!resource) return sendError(res, 404, 'Not found')

      const isOwner = resource.studentID === req.user.email
      const isAdmin = ['admin', 'cr'].includes(req.user.role)

      if (isOwner || isAdmin) {
        req.resource = resource
        return next()
      }
      return sendError(res, 403, 'Insufficient permissions')
    } catch (err) {
      return sendError(res, 500, 'Internal server error')
    }
  }
}

module.exports = {
  authenticate,
  requireRole,
  requireSelfOrRole,
  checkResourceOwner,
}
