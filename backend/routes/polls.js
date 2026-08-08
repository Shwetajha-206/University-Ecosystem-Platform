const express = require('express')
const router = express.Router()
const Poll = require('../models/Poll')
const { authenticate, requireRole } = require('../middleware/auth')
const { sanitizeString } = require('../utils/validation')
const { sendError, handleServerError } = require('../utils/errors')
const { classFieldsFromUser } = require('../utils/classHelpers')

router.use(authenticate)

function pollClassFilter(user) {
  const q = { active: true }
  const f = classFieldsFromUser(user)
  if (f.course) q.course = f.course
  if (f.section) q.section = f.section
  if (f.semester) q.semester = f.semester
  if (f.branch) q.branch = f.branch
  return q
}

router.get('/', requireRole('student', 'cr', 'admin'), async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : pollClassFilter(req.user)
    const polls = await Poll.find(filter).sort({ createdAt: -1 }).limit(50)
    const email = req.user.email
    res.json(polls.map(p => ({
      ...p.toObject(),
      totalVotes: p.options.reduce((s, o) => s + o.votes.length, 0),
      userVoted: p.options.some(o => o.votes.includes(email)),
      userVoteIndex: p.options.findIndex(o => o.votes.includes(email)),
    })))
  } catch (err) {
    handleServerError(res, err, 'list-polls')
  }
})

router.post('/', requireRole('cr'), async (req, res) => {
  try {
    const { question, options, expiresAt } = req.body
    if (!question || !Array.isArray(options) || options.length < 2) {
      return sendError(res, 400, 'Question and at least 2 options required')
    }
    const cls = classFieldsFromUser(req.user)
    const poll = await Poll.create({
      question: sanitizeString(question, 300),
      options: options.slice(0, 6).map(o => ({ text: sanitizeString(o, 200), votes: [] })),
      createdBy: req.user.email,
      createdByName: req.user.name,
      ...cls,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    })
    res.status(201).json(poll)
  } catch (err) {
    handleServerError(res, err, 'create-poll')
  }
})

router.post('/:id/vote', requireRole('student'), async (req, res) => {
  try {
    const { optionIndex } = req.body
    const poll = await Poll.findById(req.params.id)
    if (!poll || !poll.active) return sendError(res, 404, 'Poll not found')
    if (poll.expiresAt && new Date(poll.expiresAt) < new Date()) {
      return sendError(res, 400, 'Poll has expired')
    }
    const cls = classFieldsFromUser(req.user)
    if (poll.course && poll.course !== cls.course) return sendError(res, 403, 'Not your class poll')
    if (poll.section && poll.section !== cls.section) return sendError(res, 403, 'Not your class poll')
    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return sendError(res, 400, 'Invalid option')
    }
    poll.options.forEach(o => {
      o.votes = o.votes.filter(v => v !== req.user.email)
    })
    poll.options[optionIndex].votes.push(req.user.email)
    await poll.save()
    res.json(poll)
  } catch (err) {
    handleServerError(res, err, 'vote-poll')
  }
})

router.delete('/:id', requireRole('cr'), async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id)
    if (!poll) return sendError(res, 404, 'Not found')
    if (poll.createdBy !== req.user.email) return sendError(res, 403, 'Insufficient permissions')
    poll.active = false
    await poll.save()
    res.json({ message: 'Deleted' })
  } catch (err) {
    handleServerError(res, err, 'delete-poll')
  }
})

module.exports = router
