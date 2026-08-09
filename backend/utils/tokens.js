const jwt = require('jsonwebtoken')
const crypto = require('crypto')

const ACCESS_EXPIRY = '15m'
const REFRESH_DAYS = 7

function signAccessToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_EXPIRY,
  })
}

function signRefreshToken(user) {
  return jwt.sign({ id: user._id, type: 'refresh' }, process.env.JWT_SECRET, {
    expiresIn: `${REFRESH_DAYS}d`,
  })
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    shop: user.shop,
    enrollmentNumber: user.enrollmentNumber,
    course: user.course,
    branch: user.branch,
    semester: user.semester,
    section: user.section,
    assignedCrEmail: user.assignedCrEmail,
    readAnnouncements: user.readAnnouncements || [],
  }
}

function setAuthCookies(res, accessToken, refreshToken) {
  const isProd = process.env.NODE_ENV === 'production'
  const common = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  }

  res.cookie('accessToken', accessToken, {
    ...common,
    maxAge: 15 * 60 * 1000,
    path: '/',
  })

  res.cookie('refreshToken', refreshToken, {
    ...common,
    maxAge: REFRESH_DAYS * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  })
}

function clearAuthCookies(res) {
  res.clearCookie('accessToken', { path: '/' })
  res.clearCookie('refreshToken', { path: '/api/auth' })
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  hashToken,
  serializeUser,
  setAuthCookies,
  clearAuthCookies,
}
