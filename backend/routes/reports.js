const express = require('express')
const router = express.Router()
const Complaint = require('../models/Complaint')
const Grievance = require('../models/Grievance')
const User = require('../models/User')
const Feedback = require('../models/Feedback')
const { authenticate, requireRole } = require('../middleware/auth')
const { handleServerError } = require('../utils/errors')
const { logAudit } = require('../utils/audit')

router.use(authenticate, requireRole('admin'))

function toCsv(rows, headers) {
  const escape = (v) => {
    const s = String(v ?? '').replace(/"/g, '""')
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s
  }
  const lines = [headers.join(',')]
  rows.forEach(row => lines.push(headers.map(h => escape(row[h])).join(',')))
  return lines.join('\n')
}

router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params
    const { period = 'monthly' } = req.query
    const now = new Date()
    let startDate = new Date(now.getFullYear(), 0, 1)
    if (period === 'monthly') startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    if (period === 'yearly') startDate = new Date(now.getFullYear(), 0, 1)

    let csv = ''
    let reportData = null
    let filename = `${type}-report-${period}-${now.toISOString().slice(0, 10)}.csv`

    if (type === 'complaints') {
      const data = await Complaint.find({ createdAt: { $gte: startDate } }).sort({ createdAt: -1 }).lean()
      const headers = ['complaintID', 'studentID', 'studentName', 'category', 'status', 'priority', 'assignedToName', 'deadline', 'createdAt']
      reportData = data.map(d => ({
        ...d,
        deadline: d.deadline ? new Date(d.deadline).toISOString() : '',
        createdAt: new Date(d.createdAt).toISOString(),
      }))
      csv = toCsv(reportData, headers)
    } else if (type === 'grievances') {
      const data = await Grievance.find({ createdAt: { $gte: startDate } }).sort({ createdAt: -1 }).lean()
      const headers = ['grievanceID', 'studentID', 'studentName', 'category', 'status', 'priority', 'assignedToName', 'deadline', 'createdAt']
      reportData = data.map(d => ({
        ...d,
        deadline: d.deadline ? new Date(d.deadline).toISOString() : '',
        createdAt: new Date(d.createdAt).toISOString(),
      }))
      csv = toCsv(reportData, headers)
    } else if (type === 'users') {
      const data = await User.find({}, { password: 0, refreshTokenHash: 0 }).sort({ createdAt: -1 }).lean()
      const headers = ['name', 'email', 'role', 'blocked', 'suspicious', 'course', 'branch', 'createdAt']
      reportData = data.map(d => ({
        ...d,
        createdAt: new Date(d.createdAt).toISOString(),
      }))
      csv = toCsv(reportData, headers)
    } else if (type === 'feedbacks') {
      const data = await Feedback.find({ createdAt: { $gte: startDate } }).sort({ createdAt: -1 }).lean()
      const headers = ['feedbackID', 'studentID', 'subject', 'teacher', 'rating', 'comments', 'createdAt']
      reportData = data.map(d => ({
        ...d,
        createdAt: new Date(d.createdAt).toISOString(),
      }))
      csv = toCsv(reportData, headers)
    } else if (type === 'summary') {
      const [complaints, grievances, users] = await Promise.all([
        Complaint.countDocuments({ createdAt: { $gte: startDate } }),
        Grievance.countDocuments({ createdAt: { $gte: startDate } }),
        User.countDocuments(),
      ])
      const headers = ['metric', 'value']
      reportData = [
        { metric: 'Period', value: period },
        { metric: 'Complaints', value: complaints },
        { metric: 'Grievances', value: grievances },
        { metric: 'Total Users', value: users },
        { metric: 'Generated At', value: now.toISOString() },
      ]
      csv = toCsv(reportData, headers)
      filename = `summary-report-${period}-${now.toISOString().slice(0, 10)}.csv`
    } else {
      return res.status(400).json({ message: 'Invalid report type' })
    }

    await logAudit(req, 'EXPORT_REPORT', type, period)
    
    if (req.query.format === 'json') {
      return res.json(reportData)
    }

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(csv)
  } catch (err) {
    handleServerError(res, err, 'generate-report')
  }
})

module.exports = router
