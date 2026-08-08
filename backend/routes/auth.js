const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const { authenticate, requireRole, requireSelfOrRole } = require('../middleware/auth')
const {
  signAccessToken,
  signRefreshToken,
  hashToken,
  serializeUser,
  setAuthCookies,
  clearAuthCookies,
} = require('../utils/tokens')
const {
  isValidEmail,
  validatePassword,
  sanitizeString,
  VALID_ROLES,
  REGISTER_ROLES,
  pick,
} = require('../utils/validation')
const { sendError, handleServerError } = require('../utils/errors')
const { logAudit } = require('../utils/audit')
const { assignCrToStudent } = require('../utils/classHelpers')

async function issueSession(res, user) {
  const accessToken = signAccessToken(user)
  const refreshToken = signRefreshToken(user)
  await User.findByIdAndUpdate(user._id, { refreshTokenHash: hashToken(refreshToken) })
  setAuthCookies(res, accessToken, refreshToken)
  return serializeUser(user)
}

// Public registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, shop, enrollmentNumber, course, branch, semester, section } = req.body

    if (!isValidEmail(email)) return sendError(res, 400, 'Invalid email address')
    const passErr = validatePassword(password)
    if (passErr) return sendError(res, 400, passErr)

    const safeRole = REGISTER_ROLES.includes(role) ? role : 'student'
    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) return sendError(res, 400, 'Unable to create account')

    const user = new User({
      name: sanitizeString(name, 100),
      email: email.toLowerCase(),
      password,
      role: safeRole,
      shop: safeRole === 'vendor' ? sanitizeString(shop, 100) : null,
      enrollmentNumber: sanitizeString(enrollmentNumber, 50),
      course: sanitizeString(course, 50),
      branch: sanitizeString(branch, 50),
      semester: sanitizeString(semester, 10),
      section: sanitizeString(section, 10),
    })
    if (safeRole === 'student') await assignCrToStudent(user)
    await user.save()
    const userPayload = await issueSession(res, user)
    res.json({ user: userPayload })
  } catch (err) {
    handleServerError(res, err, 'register')
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!isValidEmail(email) || typeof password !== 'string') {
      return sendError(res, 400, 'Invalid email or password')
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user || user.blocked || user.suspended) {
      return sendError(res, 400, 'Invalid email or password')
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) return sendError(res, 400, 'Invalid email or password')

    user.lastLoginAt = new Date()
    user.lastActiveAt = new Date()
    await user.save()

    const userPayload = await issueSession(res, user)
    res.json({ user: userPayload })
  } catch (err) {
    handleServerError(res, err, 'login')
  }
})

router.get('/me', authenticate, (req, res) => {
  res.json({ user: serializeUser(req.user) })
})

router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.refreshToken
  if (!refreshToken) return sendError(res, 401, 'Session expired')

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET)
    if (decoded.type !== 'refresh') return sendError(res, 401, 'Session expired')

    const user = await User.findById(decoded.id)
    if (!user || user.blocked || user.suspended) {
      clearAuthCookies(res)
      return sendError(res, 401, 'Session expired')
    }

    const tokenHash = hashToken(refreshToken)
    if (!user.refreshTokenHash || user.refreshTokenHash !== tokenHash) {
      clearAuthCookies(res)
      return sendError(res, 401, 'Session expired')
    }

    const userPayload = await issueSession(res, user)
    res.json({ user: userPayload })
  } catch {
    clearAuthCookies(res)
    return sendError(res, 401, 'Session expired')
  }
})

router.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET)
        await User.findByIdAndUpdate(decoded.id, { refreshTokenHash: null })
      } catch {
        // expired token
      }
    }
    clearAuthCookies(res)
    res.json({ message: 'Logged out' })
  } catch (err) {
    handleServerError(res, err, 'logout')
  }
})

// ── PUBLIC ROUTE — admin email fetch ──
router.get('/admin-email', async (req, res) => {
  try {
    const admin = await User.findOne({ role: 'admin' }, { email: 1, name: 1 })
    if (!admin) return sendError(res, 404, 'Admin not found')
    res.json({ email: admin.email, name: admin.name })
  } catch (err) {
    handleServerError(res, err, 'admin-email')
  }
})

// ── AUTHENTICATED ROUTE — saare admins ki list (CR/Student use karte hain) ──
router.get('/admins', authenticate, async (req, res) => {
  try {
    const admins = await User.find(
      { role: 'admin', blocked: { $ne: true } },
      { email: 1, name: 1 }
    ).sort({ name: 1 })
    res.json(admins)
  } catch (err) {
    handleServerError(res, err, 'list-admins')
  }
})

// Public endpoint for teacher/staff list (for feedback dropdown)
router.get('/teachers', authenticate, async (req, res) => {
  try {
    const teachers = await User.find(
      { role: { $in: ['faculty', 'admin'] }, blocked: { $ne: true } },
      { name: 1, email: 1, role: 1, _id: 0 }
    ).sort({ name: 1 })
    res.json(teachers)
  } catch (err) {
    handleServerError(res, err, 'list-teachers')
  }
})

router.put('/read-announcement/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return sendError(res, 404, 'User not found')
    
    if (!user.readAnnouncements.includes(req.params.id)) {
      user.readAnnouncements.push(req.params.id)
      await user.save()
    }
    res.json({ success: true, readAnnouncements: user.readAnnouncements })
  } catch (err) {
    handleServerError(res, err, 'read-announcement')
  }
})

// ── ADMIN ONLY — user management ──
router.get('/users', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.find({}, { password: 0, refreshTokenHash: 0 }).sort({ createdAt: -1 })
    res.json(users)
  } catch (err) {
    handleServerError(res, err, 'list-users')
  }
})

router.post('/users', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, password, role, shop } = req.body
    if (!isValidEmail(email)) return sendError(res, 400, 'Invalid email address')
    const passErr = validatePassword(password)
    if (passErr) return sendError(res, 400, passErr)
    if (!VALID_ROLES.includes(role)) return sendError(res, 400, 'Invalid role')

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) return sendError(res, 400, 'Email already in use')

    const user = new User({
      name: sanitizeString(name, 100),
      email: email.toLowerCase(),
      password,
      role,
      shop: role === 'vendor' ? sanitizeString(shop, 100) : null,
    })
    await user.save()
    await logAudit(req, 'CREATE_USER', 'user', user.email, role)
    res.status(201).json(serializeUser(user))
  } catch (err) {
    handleServerError(res, err, 'create-user')
  }
})

router.delete('/users/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return sendError(res, 400, 'Cannot delete your own account')
    }
    await User.findByIdAndDelete(req.params.id)
    await logAudit(req, 'DELETE_USER', 'user', req.params.id)
    res.json({ message: 'User deleted' })
  } catch (err) {
    handleServerError(res, err, 'delete-user')
  }
})

router.patch('/users/:id/role', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { role } = req.body
    if (!VALID_ROLES.includes(role)) return sendError(res, 400, 'Invalid role')
    if (req.params.id === req.user._id.toString()) {
      return sendError(res, 400, 'Cannot change your own role')
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, select: '-password -refreshTokenHash' }
    )
    if (!user) return sendError(res, 404, 'User not found')
    await logAudit(req, 'CHANGE_ROLE', 'user', user.email, role)
    res.json(user)
  } catch (err) {
    handleServerError(res, err, 'update-role')
  }
})

router.patch('/users/:id/profile', authenticate, requireSelfOrRole('id', 'admin'), async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin'
    const fields = pick(req.body, ['name', 'email', 'enrollmentNumber', 'course', 'branch', 'semester', 'section'])
    if (fields.email && !isValidEmail(fields.email)) return sendError(res, 400, 'Invalid email address')

    if (fields.email) {
      const existing = await User.findOne({ email: fields.email.toLowerCase(), _id: { $ne: req.params.id } })
      if (existing) return sendError(res, 400, 'Email already in use')
      fields.email = fields.email.toLowerCase()
    }

    if (fields.name) fields.name = sanitizeString(fields.name, 100)

    let user = await User.findByIdAndUpdate(
      req.params.id,
      fields,
      { new: true, select: '-password -refreshTokenHash' }
    )
    if (!user) return sendError(res, 404, 'User not found')
    if (user.role === 'student' && (fields.course || fields.branch || fields.semester || fields.section)) {
      await assignCrToStudent(user)
      await user.save()
    }
    res.json(isAdmin ? user : serializeUser(user))
  } catch (err) {
    handleServerError(res, err, 'update-profile')
  }
})

router.patch('/users/:id/password', authenticate, requireSelfOrRole('id', 'admin'), async (req, res) => {
  try {
    const passErr = validatePassword(req.body.password)
    if (passErr) return sendError(res, 400, passErr)

    const user = await User.findById(req.params.id)
    if (!user) return sendError(res, 404, 'User not found')

    user.password = req.body.password
    user.refreshTokenHash = null
    await user.save()
    res.json({ message: 'Password updated' })
  } catch (err) {
    handleServerError(res, err, 'reset-password')
  }
})

router.patch('/users/:id/block', authenticate, requireRole('admin'), async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return sendError(res, 400, 'Cannot block your own account')
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { blocked: !!req.body.blocked },
      { new: true, select: '-password -refreshTokenHash' }
    )
    if (!user) return sendError(res, 404, 'User not found')
    await logAudit(req, req.body.blocked ? 'BLOCK_USER' : 'UNBLOCK_USER', 'user', user.email)
    res.json(user)
  } catch (err) {
    handleServerError(res, err, 'block-user')
  }
})

router.get('/users/suspicious', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.find({ role: 'student' }, { password: 0, refreshTokenHash: 0 }).lean()
    const suspicious = users.filter(u => {
      const reasons = []
      if (!u.enrollmentNumber) reasons.push('Missing enrollment number')
      if (u.email && /^\d+@/.test(u.email)) reasons.push('Suspicious email pattern')
      if (u.name && u.name.length < 3) reasons.push('Invalid name')
      if (u.name && /test|fake|dummy|spam/i.test(u.name)) reasons.push('Suspicious name')
      return reasons.length > 0
    }).map(u => ({
      ...u,
      suspiciousReasons: [
        !u.enrollmentNumber ? 'Missing enrollment number' : null,
        u.email && /^\d+@/.test(u.email) ? 'Suspicious email pattern' : null,
        u.name && u.name.length < 3 ? 'Invalid name' : null,
        u.name && /test|fake|dummy|spam/i.test(u.name) ? 'Suspicious name' : null,
      ].filter(Boolean),
    }))
    res.json(suspicious)
  } catch (err) {
    handleServerError(res, err, 'suspicious-users')
  }
})

router.patch('/users/:id/suspicious', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { suspicious, suspiciousReason } = req.body
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        suspicious: !!suspicious,
        suspiciousReason: sanitizeString(suspiciousReason, 200),
        blocked: suspicious ? true : undefined,
      },
      { new: true, select: '-password -refreshTokenHash' }
    )
    if (!user) return sendError(res, 404, 'User not found')
    await logAudit(req, suspicious ? 'FLAG_SUSPICIOUS' : 'CLEAR_SUSPICIOUS', 'user', user.email, suspiciousReason)
    res.json(user)
  } catch (err) {
    handleServerError(res, err, 'flag-suspicious')
  }
})

module.exports = router