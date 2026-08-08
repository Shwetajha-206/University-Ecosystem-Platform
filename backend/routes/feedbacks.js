const express = require('express')
const router = express.Router()
const Feedback = require('../models/Feedback')
const { authenticate, requireRole } = require('../middleware/auth')
const { sanitizeString } = require('../utils/validation')
const { sendError, handleServerError } = require('../utils/errors')

router.use(authenticate)

router.get('/', requireRole('admin', 'cr'), async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 })
    res.json(feedbacks)
  } catch (err) {
  }
})

router.get('/my', async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ studentID: req.user.email }).sort({ createdAt: -1 })
    res.json(feedbacks)
  } catch (err) {
    handleServerError(res, err, 'my-feedbacks')
  }
})

router.post('/', requireRole('student', 'cr'), async (req, res) => {
  try {
    const { subject, teacher, rating, comments } = req.body
    const numRating = Number(rating)
    if (!subject || !teacher || !numRating || numRating < 1 || numRating > 5) {
      return sendError(res, 400, 'Subject, teacher, and rating (1-5) are required')
    }

    const feedback = new Feedback({
      studentID: req.user.email,
      subject: sanitizeString(subject, 200),
      teacher: sanitizeString(teacher, 100),
      rating: numRating,
      comments: sanitizeString(comments, 1000),
    })
    await feedback.save()
    res.status(201).json(feedback)
  } catch (err) {
    handleServerError(res, err, 'create-feedback')
  }
})

router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const result = await Feedback.findByIdAndDelete(req.params.id)
    if (!result) return sendError(res, 404, 'Not found')
    res.json({ message: 'Deleted' })
  } catch (err) {
    handleServerError(res, err, 'delete-feedback')
  }
})

module.exports = router
