const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const path = require('path')
require('dotenv').config()

const app = express()

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  console.error('FATAL: JWT_SECRET must be at least 32 characters in production')
  process.exit(1)
}

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

app.set('trust proxy', 1)

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

app.use(cors({
  origin: CLIENT_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(cookieParser())
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ limit: '5mb', extended: true }))

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  message: { message: 'Too many requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)
app.use('/api/auth/refresh', authLimiter)
app.use('/api/', apiLimiter)

app.use('/api/auth', require('./routes/auth'))
app.use('/api/complaints', require('./routes/complaints'))
app.use('/api/grievances', require('./routes/grievances'))
app.use('/api/feedbacks', require('./routes/feedbacks'))
app.use('/api/lostitems', require('./routes/lostitems'))
app.use('/api/ratings', require('./routes/ratings'))
app.use('/api/vendors', require('./routes/vendors'))
app.use('/api/skillresources', require('./routes/skillresources'))
app.use('/api/announcements', require('./routes/announcements'))
app.use('/api/analytics', require('./routes/analytics'))
app.use('/api/reports', require('./routes/reports'))
app.use('/api/notifications', require('./routes/notifications'))
app.use('/api/class', require('./routes/class'))
app.use('/api/cr-management', require('./routes/crManagement'))
app.use('/api/polls', require('./routes/polls'))
app.use('/api/messages', require('./routes/messages'))
app.use('/api/audit', require('./routes/audit'))

const distPath = path.join(__dirname, '../university-platform/dist')
if (process.env.SERVE_SPA === 'true') {
  app.use(express.static(distPath))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.log('✅ MongoDB Connected!')
const PORT = process.env.PORT || 10000

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
  })
  .catch(err => {
    console.log('❌ MongoDB Error:', err.message)
  })
