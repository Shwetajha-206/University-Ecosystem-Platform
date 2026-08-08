const express = require('express')
const router = express.Router()
const Rating = require('../models/Rating')
const Vendor = require('../models/Vendor')
const { authenticate, requireRole } = require('../middleware/auth')
const { sanitizeString, validatePhoto } = require('../utils/validation')
const { sendError, handleServerError } = require('../utils/errors')

router.use(authenticate)

router.get('/', requireRole('admin', 'cr'), async (req, res) => {
  try {
    const ratings = await Rating.find().sort({ createdAt: -1 })
    res.json(ratings)
  } catch (err) {
    handleServerError(res, err, 'list-ratings')
  }
})

router.post('/', requireRole('student', 'cr'), async (req, res) => {
  try {
    const { vendorName, rating, comments, photo } = req.body
    const numRating = Number(rating)
    if (!vendorName || !numRating || numRating < 1 || numRating > 5) {
      return sendError(res, 400, 'Vendor name and rating (1-5) are required')
    }

    const ratingDoc = new Rating({
      studentID: req.user.email,
      studentName: req.user.name || '',
      vendorName: sanitizeString(vendorName, 100),
      rating: numRating,
      comments: sanitizeString(comments, 1000),
      photo: validatePhoto(photo),
    })
    await ratingDoc.save()

    const allRatings = await Rating.find({ vendorName: ratingDoc.vendorName })
    const avg = allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length
    await Vendor.findOneAndUpdate(
      { name: ratingDoc.vendorName },
      { avgRating: avg.toFixed(1), totalRatings: allRatings.length }
    )

    res.status(201).json(ratingDoc)
  } catch (err) {
    handleServerError(res, err, 'create-rating')
  }
})

router.get('/my', async (req, res) => {
  try {
    const ratings = await Rating.find({ studentID: req.user.email }).sort({ createdAt: -1 })
    res.json(ratings)
  } catch (err) {
    handleServerError(res, err, 'my-ratings')
  }
})

router.get('/vendor/:vendorName', async (req, res) => {
  try {
    const vendorName = decodeURIComponent(req.params.vendorName)
    const ratings = await Rating.find({ vendorName }).sort({ createdAt: -1 })
    res.json(ratings)
  } catch (err) {
    handleServerError(res, err, 'vendor-ratings')
  }
})

module.exports = router
