const express = require('express')
const router = express.Router()
const User = require('../models/User')
const Complaint = require('../models/Complaint')
const Grievance = require('../models/Grievance')
const CrRating = require('../models/CrRating')
const { authenticate, requireRole } = require('../middleware/auth')
const { sendError, handleServerError } = require('../utils/errors')
const { sanitizeString } = require('../utils/validation')
const {
  buildStudentClassQuery,
  buildRecordClassQuery,
  buildClassQueryFromFields,
  findClassCr,
  formatClassLabel,
} = require('../utils/classHelpers')
const { COURSES, SEMESTERS, SECTIONS } = require('../utils/classOptions')

async function distinctRegistrationField(field, filters = {}) {
  const q = { role: { $in: ['student', 'cr'] }, blocked: { $ne: true } }
  if (filters.course) q.course = filters.course
  if (filters.branch) q.branch = filters.branch
  if (filters.semester) q.semester = filters.semester
  q[field] = { $nin: [null, ''] }
  const vals = await User.distinct(field, q)
  return vals.sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }))
}

router.get('/registration-options', async (req, res) => {
  try {
    const branches = await distinctRegistrationField('branch')
    res.json({
      courses: COURSES,
      branches,
      semesters: SEMESTERS,
      sections: SECTIONS,
    })
  } catch (err) {
    handleServerError(res, err, 'registration-options')
  }
})

router.use(authenticate)

router.get('/assigned', requireRole('admin'), async (req, res) => {
  try {
    const { course, branch, semester, section } = req.query
    const studentQuery = buildClassQueryFromFields({ course, branch, semester, section })
    const crQuery = { role: 'cr', blocked: { $ne: true } }
    if (course) crQuery.course = course
    if (branch) crQuery.branch = branch
    if (semester) crQuery.semester = semester
    if (section) crQuery.section = section

    const [students, crs] = await Promise.all([
      User.find(studentQuery).select('name email enrollmentNumber course branch semester section').sort({ name: 1 }),
      User.find(crQuery).select('name email course branch semester section').sort({ name: 1 }),
    ])

    res.json({
      students: students.map(s => ({
        id: s._id,
        name: s.name,
        email: s.email,
        enrollmentNumber: s.enrollmentNumber,
        course: s.course,
        branch: s.branch,
        semester: s.semester,
        section: s.section,
        classLabel: formatClassLabel(s),
      })),
      crs: crs.map(c => ({
        id: c._id,
        name: c.name,
        email: c.email,
        course: c.course,
        branch: c.branch,
        semester: c.semester,
        section: c.section,
        classLabel: formatClassLabel(c),
      })),
      counts: { students: students.length, crs: crs.length },
    })
  } catch (err) {
    handleServerError(res, err, 'assigned-class')
  }
})

router.get('/cr', requireRole('student'), async (req, res) => {
  try {
    let cr = null
    const classCr = await findClassCr(req.user)
    if (classCr && req.user.assignedCrEmail !== classCr.email) {
      await User.findByIdAndUpdate(req.user._id, { assignedCrEmail: classCr.email })
    }
    if (req.user.assignedCrEmail) {
      cr = await User.findOne({ email: req.user.assignedCrEmail, role: 'cr', blocked: { $ne: true }, suspended: { $ne: true } }).select('-password -refreshTokenHash')
    }
    if (!cr) {
      cr = classCr
    }
    if (!cr) return res.json(null)
    res.json({
      id: cr._id,
      name: cr.name,
      email: cr.email,
      course: cr.course,
      branch: cr.branch,
      semester: cr.semester,
      section: cr.section,
      classLabel: formatClassLabel(cr),
    })
  } catch (err) {
    handleServerError(res, err, 'get-class-cr')
  }
})

router.get('/students', requireRole('cr'), async (req, res) => {
  try {
    const students = await User.find(buildStudentClassQuery(req.user))
      .select('-password -refreshTokenHash')
      .sort({ name: 1 })
    res.json(students.map(s => ({
      id: s._id,
      name: s.name,
      email: s.email,
      enrollmentNumber: s.enrollmentNumber,
      course: s.course,
      branch: s.branch,
      semester: s.semester,
      section: s.section,
    })))
  } catch (err) {
    handleServerError(res, err, 'class-students')
  }
})

router.get('/analytics', requireRole('cr'), async (req, res) => {
  try {
    const classFilter = buildRecordClassQuery(req.user)
    const [complaints, grievances] = await Promise.all([
      Complaint.find(classFilter),
      Grievance.find(classFilter),
    ])

    const countByStatus = (items) => {
      const map = {}
      items.forEach(i => {
        const s = i.status || 'pending'
        map[s] = (map[s] || 0) + 1
      })
      return map
    }

    const countByCategory = (items) => {
      const map = {}
      items.forEach(i => {
        const c = i.category || 'Other'
        map[c] = (map[c] || 0) + 1
      })
      return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8)
    }

    res.json({
      classLabel: formatClassLabel(req.user),
      complaints: {
        total: complaints.length,
        byStatus: countByStatus(complaints),
        byCategory: countByCategory(complaints),
        important: complaints.filter(c => c.markedImportant).length,
        verified: complaints.filter(c => c.crVerified).length,
        escalated: complaints.filter(c => c.crEscalated).length,
      },
      grievances: {
        total: grievances.length,
        byStatus: countByStatus(grievances),
        byCategory: countByCategory(grievances),
        important: grievances.filter(g => g.markedImportant).length,
        verified: grievances.filter(g => g.crVerified).length,
        escalated: grievances.filter(g => g.crEscalated).length,
      },
    })
  } catch (err) {
    handleServerError(res, err, 'class-analytics')
  }
})

router.get('/reports/monthly', requireRole('cr'), async (req, res) => {
  try {
    const classFilter = buildRecordClassQuery(req.user)
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const dateFilter = { createdAt: { $gte: start, $lte: now } }

    const [complaints, grievances, students] = await Promise.all([
      Complaint.find({ ...classFilter, ...dateFilter }),
      Grievance.find({ ...classFilter, ...dateFilter }),
      User.find(buildStudentClassQuery(req.user)).select('name email'),
    ])

    const monthName = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' })

    res.json({
      month: monthName,
      classLabel: formatClassLabel(req.user),
      studentCount: students.length,
      complaints: {
        total: complaints.length,
        resolved: complaints.filter(c => ['resolved', 'Resolved'].includes(c.status)).length,
        pending: complaints.filter(c => ['pending', 'Pending'].includes(c.status)).length,
        important: complaints.filter(c => c.markedImportant).length,
        items: complaints.map(c => ({
          id: c.complaintID,
          title: c.title || c.category,
          status: c.status,
          priority: c.priority,
          student: c.studentName,
          createdAt: c.createdAt,
        })),
      },
      grievances: {
        total: grievances.length,
        resolved: grievances.filter(g => ['resolved', 'Resolved'].includes(g.status)).length,
        pending: grievances.filter(g => ['pending', 'Pending'].includes(g.status)).length,
        important: grievances.filter(g => g.markedImportant).length,
        items: grievances.map(g => ({
          id: g.grievanceID,
          title: g.title || g.category,
          status: g.status,
          priority: g.priority,
          student: g.studentName,
          createdAt: g.createdAt,
        })),
      },
    })
  } catch (err) {
    handleServerError(res, err, 'monthly-report')
  }
})

router.post('/cr/rate', requireRole('student'), async (req, res) => {
  try {
    const { rating, comment } = req.body
    if (!rating || rating < 1 || rating > 5) return sendError(res, 400, 'Rating must be between 1 and 5')

    let cr = null
    if (req.user.assignedCrEmail) {
      cr = await User.findOne({ email: req.user.assignedCrEmail, role: 'cr' })
    }
    if (!cr) cr = await findClassCr(req.user)
    if (!cr) return sendError(res, 404, 'No CR assigned to your class')

    const doc = await CrRating.findOneAndUpdate(
      { crEmail: cr.email, studentEmail: req.user.email },
      {
        crName: cr.name,
        studentName: req.user.name,
        rating: Math.round(rating),
        comment: sanitizeString(comment, 500),
        course: req.user.course,
        branch: req.user.branch,
        semester: req.user.semester,
        section: req.user.section,
      },
      { upsert: true, new: true }
    )
    res.json(doc)
  } catch (err) {
    handleServerError(res, err, 'rate-cr')
  }
})

module.exports = router
