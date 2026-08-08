const ALLOWED_PROOF_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
const MAX_PROOF_FILES = 5
const MAX_PROOF_BYTES = 5 * 1024 * 1024

function pick(obj, keys) {
  const result = {}
  for (const key of keys) {
    if (obj[key] !== undefined) result[key] = obj[key]
  }
  return result
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters'
  }
  if (password.length > 128) {
    return 'Password too long'
  }
  return null
}

function sanitizeString(str, maxLen = 500) {
  if (typeof str !== 'string') return ''
  return str.trim().slice(0, maxLen)
}

function isSafeUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return false
  try {
    const parsed = new URL(url.trim())
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

function validateProofFiles(proof) {
  if (!proof) return []
  if (!Array.isArray(proof)) return []

  return proof.slice(0, MAX_PROOF_FILES).filter((file) => {
    if (!file || typeof file.data !== 'string') return false
    const match = file.data.match(/^data:([^;]+);base64,(.+)$/)
    if (!match) return false
    if (!ALLOWED_PROOF_TYPES.includes(match[1])) return false
    try {
      const size = Buffer.from(match[2], 'base64').length
      return size > 0 && size <= MAX_PROOF_BYTES
    } catch {
      return false
    }
  }).map((file) => {
    const match = file.data.match(/^data:([^;]+);base64,(.+)$/)
    return {
      name: sanitizeString(file.name, 100),
      type: match ? match[1] : (file.type || 'application/octet-stream'),
      data: file.data,
    }
  })
}

function validatePhoto(photo) {
  if (!photo || typeof photo !== 'string') return ''
  const match = photo.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i)
  if (!match) return ''
  try {
    const size = Buffer.from(match[2], 'base64').length
    return size > 0 && size <= MAX_PROOF_BYTES ? photo : ''
  } catch {
    return ''
  }
}

const VALID_ROLES = ['student', 'cr', 'vendor', 'admin']
const REGISTER_ROLES = ['student', 'vendor']
const STATUS_VALUES = {
  complaint: ['Pending', 'Reviewing', 'In Progress', 'Resolved', 'Rejected'],
  grievance: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
  lostitem: ['Lost', 'Found', 'Claimed'],
}

module.exports = {
  pick,
  isValidEmail,
  validatePassword,
  sanitizeString,
  isSafeUrl,
  validateProofFiles,
  validatePhoto,
  VALID_ROLES,
  REGISTER_ROLES,
  STATUS_VALUES,
}
