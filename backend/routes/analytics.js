const express = require('express')
const router = express.Router()
const Complaint = require('../models/Complaint')
const Grievance = require('../models/Grievance')
const User = require('../models/User')
const Feedback = require('../models/Feedback')
const Rating = require('../models/Rating')
const { authenticate, requireRole } = require('../middleware/auth')
const { handleServerError } = require('../utils/errors')
const { isOverdue } = require('../utils/complaintHelpers')

router.use(authenticate, requireRole('admin'))

router.get('/overview', async (_req, res) => {
  try {
    const [complaints, grievances, users, feedbacks] = await Promise.all([
      Complaint.find().lean(),
      Grievance.find().lean(),
      User.find({}, { password: 0, refreshTokenHash: 0 }).lean(),
      Feedback.find().lean(),
    ])

    const resolvedStatuses = ['resolved', 'Resolved']
    const pendingStatuses = ['pending', 'Pending', 'reviewing', 'In Progress']
    const rejectedStatuses = ['rejected', 'Rejected']

    const pendingComplaints = complaints.filter(c => pendingStatuses.includes(c.status))
    const resolvedComplaints = complaints.filter(c => resolvedStatuses.includes(c.status))
    const pendingGrievances = grievances.filter(g => pendingStatuses.includes(g.status))
    const resolvedGrievances = grievances.filter(g => resolvedStatuses.includes(g.status))
    const overdueComplaints = complaints.filter(c => isOverdue(c))
    const overdueGrievances = grievances.filter(g => isOverdue(g))

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const now = new Date()
    const monthlyTrends = months.map((month, i) => ({
      month,
      complaints: complaints.filter(c => new Date(c.createdAt).getMonth() === i && new Date(c.createdAt).getFullYear() === now.getFullYear()).length,
      grievances: grievances.filter(g => new Date(g.createdAt).getMonth() === i && new Date(g.createdAt).getFullYear() === now.getFullYear()).length,
    }))

    const categoryMap = {}
    complaints.forEach(c => { categoryMap[c.category] = (categoryMap[c.category] || 0) + 1 })
    grievances.forEach(g => { categoryMap[g.category] = (categoryMap[g.category] || 0) + 1 })
    const categoryAnalytics = Object.entries(categoryMap)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)

    const deptMap = {}
    users.filter(u => u.role === 'student' || u.role === 'cr').forEach(u => {
      const dept = u.branch || u.course || 'General'
      deptMap[dept] = (deptMap[dept] || 0) + 1
    })
    const departmentAnalytics = Object.entries(deptMap)
      .map(([department, count]) => ({ department, users: count }))
      .sort((a, b) => b.users - a.users)

    const totalResolved = resolvedComplaints.length + resolvedGrievances.length
    const totalItems = complaints.length + grievances.length
    const resolutionRate = totalItems ? Math.round((totalResolved / totalItems) * 100) : 0

    const engagementMap = {}
    complaints.forEach(c => {
      if (c.studentID && c.studentID !== 'anonymous') {
        engagementMap[c.studentID] = (engagementMap[c.studentID] || 0) + 1
      }
    })
    grievances.forEach(g => {
      if (g.studentID && g.studentID !== 'anonymous') {
        engagementMap[g.studentID] = (engagementMap[g.studentID] || 0) + 1
      }
    })
    const userEngagement = Object.entries(engagementMap)
      .map(([email, submissions]) => {
        const u = users.find(x => x.email === email)
        return { email, name: u?.name || email, submissions }
      })
      .sort((a, b) => b.submissions - a.submissions)
      .slice(0, 10)

    const issueMap = {}
    complaints.forEach(c => { issueMap[c.category] = (issueMap[c.category] || 0) + 1 })
    grievances.forEach(g => { issueMap[g.category] = (issueMap[g.category] || 0) + 1 })
    const commonIssues = Object.entries(issueMap)
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    const ratings = await Rating.find().lean()
    const avgRating = ratings.length
      ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
      : '0.0'

    res.json({
      totals: {
        complaints: complaints.length,
        grievances: grievances.length,
        users: users.length,
        students: users.filter(u => u.role === 'student').length,
        crs: users.filter(u => u.role === 'cr').length,
        vendors: users.filter(u => u.role === 'vendor').length,
        feedbacks: feedbacks.length,
      },
      complaints: {
        total: complaints.length,
        pending: pendingComplaints.length,
        resolved: resolvedComplaints.length,
        rejected: complaints.filter(c => rejectedStatuses.includes(c.status)).length,
        inProgress: complaints.filter(c => c.status === 'In Progress' || c.status === 'reviewing').length,
        overdue: overdueComplaints.length,
      },
      grievances: {
        total: grievances.length,
        pending: pendingGrievances.length,
        resolved: resolvedGrievances.length,
        rejected: grievances.filter(g => rejectedStatuses.includes(g.status)).length,
        inProgress: grievances.filter(g => g.status === 'In Progress').length,
        overdue: overdueGrievances.length,
      },
      resolutionRate,
      avgRating,
      monthlyTrends,
      categoryAnalytics,
      departmentAnalytics,
      userEngagement,
      commonIssues,
      roleDistribution: [
        { role: 'Students', count: users.filter(u => u.role === 'student').length },
        { role: 'CRs', count: users.filter(u => u.role === 'cr').length },
        { role: 'Vendors', count: users.filter(u => u.role === 'vendor').length },
        { role: 'Admins', count: users.filter(u => u.role === 'admin').length },
      ],
      lists: {
        complaints,
        grievances,
        users,
      }
    })
  } catch (err) {
    handleServerError(res, err, 'analytics-overview')
  }
})

module.exports = router
