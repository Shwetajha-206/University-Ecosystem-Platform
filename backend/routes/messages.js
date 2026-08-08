const express = require('express')
const router = express.Router()
const Message = require('../models/Message')
const User = require('../models/User')
const { authenticate, requireRole } = require('../middleware/auth')
const { sanitizeString } = require('../utils/validation')
const { sendError, handleServerError } = require('../utils/errors')
const { classFieldsFromUser, findClassCr, buildStudentClassQuery, formatClassLabel } = require('../utils/classHelpers')
const { notifyUsers } = require('../utils/syncNotifications')

router.use(authenticate)

async function canMessageUser(sender, recipientEmail) {
  const recipient = await User.findOne({ email: recipientEmail })
  if (!recipient) return false
  if (sender.role === 'admin') return true

  if (sender.role === 'student' && recipient.role === 'admin') {
    const admin = await User.findOne({ email: recipient.email, role: 'admin', blocked: { $ne: true } })
    return !!admin
  }

  if (sender.role === 'student' && recipient.role === 'cr') {
    if (sender.assignedCrEmail === recipient.email) return true
    const cr = await findClassCr(sender)
    return cr && cr.email === recipient.email
  }

  if (sender.role === 'cr' && recipient.role === 'student') {
    const q = buildStudentClassQuery(sender)
    q.email = recipient.email
    const student = await User.findOne(q)
    return !!student
  }

  // ── CR → Admin messaging ──
  if (sender.role === 'cr' && recipient.role === 'admin') {
    const admin = await User.findOne({ email: recipient.email, role: 'admin', blocked: { $ne: true } })
    return !!admin
  }

  return false
}

function peerFilter(email, peer) {
  return {
    $or: [
      { fromEmail: email, toEmail: peer },
      { fromEmail: peer, toEmail: email },
    ],
  }
}

function buildClassMessageFilter({ course, branch, semester, section }) {
  const filter = {}
  if (course) filter.course = course
  if (branch) filter.branch = branch
  if (semester) filter.semester = semester
  if (section) filter.section = section
  return filter
}

async function getStudentCrEmail(student) {
  if (student.assignedCrEmail) {
    const cr = await User.findOne({
      email: student.assignedCrEmail,
      role: 'cr',
      blocked: { $ne: true },
      suspended: { $ne: true },
    })
    if (cr) return cr.email
  }
  const cr = await findClassCr(student)
  return cr?.email || null
}

async function getCrStudentEmails(crUser) {
  const students = await User.find(buildStudentClassQuery(crUser)).select('email')
  return students.map(s => s.email)
}

async function getAdminEmails() {
  const admins = await User.find({ role: 'admin', blocked: { $ne: true } }).select('email')
  return admins.map(a => a.email)
}

async function isAllowedStudentPeer(student, peerEmail) {
  if (!peerEmail) return false
  const admins = await getAdminEmails()
  if (admins.includes(peerEmail)) return true
  const crEmail = await getStudentCrEmail(student)
  return crEmail === peerEmail
}

router.get('/', async (req, res) => {
  try {
    const email = req.user.email
    const withPeer = req.query.peer?.toLowerCase()
    let filter

    if (req.user.role === 'student') {
      const crEmail = await getStudentCrEmail(req.user)
      const adminEmails = await getAdminEmails()
      const allowedPeers = [...adminEmails, ...(crEmail ? [crEmail] : [])]

      if (withPeer) {
        if (!(await isAllowedStudentPeer(req.user, withPeer))) {
          return sendError(res, 403, 'Can only chat with your assigned CR or administration')
        }
        filter = peerFilter(email, withPeer)
      } else if (allowedPeers.length) {
        filter = {
          $or: [
            { fromEmail: email, toEmail: { $in: allowedPeers } },
            { fromEmail: { $in: allowedPeers }, toEmail: email },
          ],
        }
      } else {
        return res.json([])
      }

    } else if (req.user.role === 'cr') {
      const studentEmails = await getCrStudentEmails(req.user)
      const adminEmails = await getAdminEmails()
      const allowedPeers = [...studentEmails, ...adminEmails]

      if (withPeer) {
        if (!allowedPeers.includes(withPeer)) {
          return sendError(res, 403, 'Can only chat with your students or administration')
        }
        filter = peerFilter(email, withPeer)
      } else {
        filter = {
          $or: [
            { fromEmail: email, toEmail: { $in: allowedPeers } },
            { fromEmail: { $in: allowedPeers }, toEmail: email },
          ],
        }
      }

    } else {
      filter = { $or: [{ fromEmail: email }, { toEmail: email }] }
      if (withPeer) filter = peerFilter(email, withPeer)
    }

    const messages = await Message.find(filter).sort({ createdAt: 1 }).limit(200)
    res.json(messages)
  } catch (err) {
    handleServerError(res, err, 'list-messages')
  }
})

router.get('/history', requireRole('admin'), async (req, res) => {
  try {
    const { course, branch, semester, section, role, search, limit = 500 } = req.query
    const filter = buildClassMessageFilter({ course, branch, semester, section })
    if (role === 'student' || role === 'cr') {
      filter.$or = [{ fromRole: role }, { toRole: role }]
    }
    if (search) {
      const q = search.toLowerCase()
      filter.$and = filter.$and || []
      filter.$and.push({
        $or: [
          { fromName: { $regex: q, $options: 'i' } },
          { toName: { $regex: q, $options: 'i' } },
          { fromEmail: { $regex: q, $options: 'i' } },
          { toEmail: { $regex: q, $options: 'i' } },
          { body: { $regex: q, $options: 'i' } },
        ],
      })
    }
    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit, 10) || 500, 1000))
    res.json(messages)
  } catch (err) {
    handleServerError(res, err, 'message-history')
  }
})

router.get('/conversations', requireRole('admin'), async (req, res) => {
  try {
    const email = req.user.email
    const messages = await Message.find({
      $or: [{ fromEmail: email }, { toEmail: email }],
    }).sort({ createdAt: -1 }).limit(1000)

    const peerMap = new Map()
    for (const m of messages) {
      const peerEmail = m.fromEmail === email ? m.toEmail : m.fromEmail
      if (!peerMap.has(peerEmail)) {
        peerMap.set(peerEmail, {
          email: peerEmail,
          name: m.fromEmail === email ? m.toName : m.fromName,
          role: m.fromEmail === email ? m.toRole : m.fromRole,
          lastMessage: m.body,
          lastAt: m.createdAt,
          unread: m.toEmail === email && !m.read,
        })
      }
    }

    const peers = [...peerMap.values()]
    const users = await User.find({ email: { $in: peers.map(p => p.email) } })
      .select('name email role course branch semester section')
    const userByEmail = Object.fromEntries(users.map(u => [u.email, u]))

    res.json(peers.map(p => {
      const u = userByEmail[p.email]
      return {
        ...p,
        name: u?.name || p.name,
        role: u?.role || p.role,
        classLabel: u ? formatClassLabel(u) : '',
      }
    }).sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt)))
  } catch (err) {
    handleServerError(res, err, 'message-conversations')
  }
})

router.get('/admin-contacts', requireRole('student'), async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin', blocked: { $ne: true } })
      .select('name email')
      .sort({ name: 1 })

    const email = req.user.email
    const threads = await Message.find({
      $or: [
        { fromEmail: email, toRole: 'admin' },
        { fromEmail: { $in: admins.map(a => a.email) }, toEmail: email },
      ],
    }).sort({ createdAt: -1 })

    const lastByAdmin = new Map()
    for (const m of threads) {
      const adminEmail = m.fromRole === 'admin' ? m.fromEmail : m.toEmail
      if (!lastByAdmin.has(adminEmail)) {
        lastByAdmin.set(adminEmail, {
          unread: m.toEmail === email && m.fromRole === 'admin' && !m.read,
          lastAt: m.createdAt,
        })
      }
    }

    res.json(admins.map(a => ({
      name: a.name,
      email: a.email,
      role: 'admin',
      unread: lastByAdmin.get(a.email)?.unread || false,
      lastAt: lastByAdmin.get(a.email)?.lastAt || null,
    })))
  } catch (err) {
    handleServerError(res, err, 'admin-contacts')
  }
})

router.get('/contacts', async (req, res) => {
  try {
    if (req.user.role === 'cr') {
      const students = await User.find(buildStudentClassQuery(req.user))
        .select('name email')
        .sort({ name: 1 })
      return res.json(students.map(s => ({ name: s.name, email: s.email, role: 'student' })))
    }

    if (req.user.role === 'admin') {
      const { course, branch, semester, section, search } = req.query
      if (!course || !branch || !semester || !section) {
        return sendError(res, 400, 'Course, branch, semester, and section are required')
      }
      const q = {
        blocked: { $ne: true },
        suspended: { $ne: true },
        role: { $in: ['student', 'cr'] },
        course,
        branch,
        semester,
        section,
      }
      if (search) {
        const s = search.toLowerCase()
        q.$or = [
          { name: { $regex: s, $options: 'i' } },
          { email: { $regex: s, $options: 'i' } },
        ]
      }
      const users = await User.find(q)
        .select('name email role course branch semester section enrollmentNumber')
        .sort({ role: 1, name: 1 })
        .limit(500)
      return res.json(users.map(u => ({
        name: u.name,
        email: u.email,
        role: u.role,
        enrollmentNumber: u.enrollmentNumber || '',
        classLabel: formatClassLabel(u),
      })))
    }

    return sendError(res, 403, 'Insufficient permissions')
  } catch (err) {
    handleServerError(res, err, 'message-contacts')
  }
})

router.post('/', async (req, res) => {
  try {
    const { toEmail, body } = req.body
    if (!toEmail || !body?.trim()) return sendError(res, 400, 'Recipient and message required')

    const allowed = await canMessageUser(req.user, toEmail.toLowerCase())
    if (!allowed) return sendError(res, 403, 'Cannot message this user')

    const recipient = await User.findOne({ email: toEmail.toLowerCase() })
    let cls
    if (req.user.role === 'admin') {
      cls = classFieldsFromUser(recipient)
    } else if (req.user.role === 'cr') {
      // CR → Admin ke liye CR ki class fields use karo
      cls = recipient.role === 'admin'
        ? classFieldsFromUser(req.user)
        : classFieldsFromUser(req.user)
    } else {
      cls = classFieldsFromUser(recipient.role === 'admin' ? req.user : recipient)
    }

    const message = await Message.create({
      fromEmail: req.user.email,
      fromName: req.user.name,
      fromRole: req.user.role,
      toEmail: recipient.email,
      toName: recipient.name,
      toRole: recipient.role,
      body: sanitizeString(body, 2000),
      ...cls,
    })

    await notifyUsers({
      emails: [recipient.email],
      title: `Message from ${req.user.name}`,
      message: sanitizeString(body, 200).slice(0, 200),
      type: 'notice',
      priority: req.user.role === 'admin' ? 'high' : 'normal',
      postedBy: req.user.email,
      postedByName: req.user.name,
    })

    res.status(201).json(message)
  } catch (err) {
    handleServerError(res, err, 'send-message')
  }
})

router.patch('/:id/read', async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
    if (!message) return sendError(res, 404, 'Not found')
    if (message.toEmail !== req.user.email) return sendError(res, 403, 'Insufficient permissions')
    message.read = true
    await message.save()
    res.json(message)
  } catch (err) {
    handleServerError(res, err, 'mark-message-read')
  }
})

router.patch('/read-thread', async (req, res) => {
  try {
    const { peer } = req.body
    if (!peer) return sendError(res, 400, 'Peer email required')
    await Message.updateMany(
      { fromEmail: peer.toLowerCase(), toEmail: req.user.email, read: false },
      { read: true },
    )
    res.json({ ok: true })
  } catch (err) {
    handleServerError(res, err, 'mark-thread-read')
  }
})

module.exports = router
