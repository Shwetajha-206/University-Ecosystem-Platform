const User = require('../models/User')

function classFieldsFromUser(user) {
  return {
    course: user.course || '',
    branch: user.branch || '',
    semester: user.semester || '',
    section: user.section || '',
  }
}

function studentClassSnapshot(user) {
  return {
    studentCourse: user.course || '',
    studentBranch: user.branch || '',
    studentSemester: user.semester || '',
    studentSection: user.section || '',
  }
}

function buildStudentClassQuery(user) {
  const q = { role: 'student', blocked: { $ne: true } }
  if (user.course) q.course = user.course
  if (user.branch) q.branch = user.branch
  if (user.semester) q.semester = user.semester
  if (user.section) q.section = user.section
  return q
}

function buildRecordClassQuery(user) {
  const q = {}
  if (user.course) q.studentCourse = user.course
  if (user.branch) q.studentBranch = user.branch
  if (user.semester) q.studentSemester = user.semester
  if (user.section) q.studentSection = user.section
  return q
}

function buildAnnouncementClassQuery(user) {
  if (!user || user.role === 'admin') return {}
  const q = {
    $or: [
      { targetCourse: { $in: [null, ''] } },
      {
        targetCourse: user.course || '',
        targetSection: user.section || '',
        $or: [
          { targetBranch: { $in: [null, ''] } },
          { targetBranch: user.branch || '' },
        ],
        $or: [
          { targetSemester: { $in: [null, ''] } },
          { targetSemester: user.semester || '' },
        ],
      },
    ],
  }
  return q
}

function announcementMatchesUser(announcement, user) {
  if (!announcement.targetCourse) return true
  if (user.role === 'admin') return true
  if (announcement.targetCourse && announcement.targetCourse !== (user.course || '')) return false
  if (announcement.targetBranch && announcement.targetBranch !== (user.branch || '')) return false
  if (announcement.targetSemester && announcement.targetSemester !== (user.semester || '')) return false
  if (announcement.targetSection && announcement.targetSection !== (user.section || '')) return false
  return true
}

function recordMatchesClass(record, user) {
  if (user.role === 'admin') return true
  if (user.role !== 'cr') return false
  if (!record.studentCourse && !record.studentSection) return false
  if (user.course && record.studentCourse !== user.course) return false
  if (user.section && record.studentSection !== user.section) return false
  if (user.semester && record.studentSemester && record.studentSemester !== user.semester) return false
  if (user.branch && record.studentBranch && record.studentBranch !== user.branch) return false
  return true
}

async function findClassCr(user) {
  const q = { role: 'cr', blocked: { $ne: true }, suspended: { $ne: true } }
  if (user.course) q.course = user.course
  if (user.branch) q.branch = user.branch
  if (user.semester) q.semester = user.semester
  if (user.section) q.section = user.section
  return User.findOne(q)
}

function buildClassQueryFromFields({ course, branch, semester, section }) {
  const q = { role: 'student', blocked: { $ne: true } }
  if (course) q.course = course
  if (branch) q.branch = branch
  if (semester) q.semester = semester
  if (section) q.section = section
  return q
}

function buildCrClassQuery(cr) {
  const q = { role: 'cr' }
  if (cr.course) q.course = cr.course
  if (cr.branch) q.branch = cr.branch
  if (cr.semester) q.semester = cr.semester
  if (cr.section) q.section = cr.section
  return q
}

async function bulkAssignStudentsToCr(classFields, crEmail) {
  const query = buildClassQueryFromFields(classFields)
  const result = await User.updateMany(query, { assignedCrEmail: crEmail })
  return result.modifiedCount
}

async function syncClassStudentsToCr(classFields) {
  const cr = await findClassCr(classFields)
  if (!cr) {
    const query = buildClassQueryFromFields(classFields)
    await User.updateMany(query, { assignedCrEmail: null })
    return { cr: null, updated: 0 }
  }
  const updated = await bulkAssignStudentsToCr(classFields, cr.email)
  return { cr, updated }
}

async function transferStudentsToCr(fromCrEmail, toCrEmail, studentEmails = null) {
  const query = { role: 'student', assignedCrEmail: fromCrEmail }
  if (Array.isArray(studentEmails) && studentEmails.length) {
    query.email = { $in: studentEmails.map(e => e.toLowerCase()) }
  }
  const result = await User.updateMany(query, { assignedCrEmail: toCrEmail })
  return result.modifiedCount
}

async function reassignOpenItemsToCr(oldCrEmail, newCrEmail, newCrName) {
  const Complaint = require('../models/Complaint')
  const Grievance = require('../models/Grievance')
  const openStatuses = ['pending', 'reviewing', 'In Progress', 'Pending']
  const complaintFilter = { assignedTo: oldCrEmail, status: { $in: openStatuses } }
  const grievanceFilter = { assignedTo: oldCrEmail, status: { $in: openStatuses } }
  const [cResult, gResult] = await Promise.all([
    Complaint.updateMany(complaintFilter, {
      assignedTo: newCrEmail,
      assignedToName: newCrName,
      assignedToRole: 'cr',
    }),
    Grievance.updateMany(grievanceFilter, {
      assignedTo: newCrEmail,
      assignedToName: newCrName,
      assignedToRole: 'cr',
    }),
  ])
  return { complaints: cResult.modifiedCount, grievances: gResult.modifiedCount }
}

async function assignCrToStudent(student) {
  const cr = await findClassCr(student)
  if (cr) {
    student.assignedCrEmail = cr.email
  }
  return student
}

function formatClassLabel(user) {
  const parts = [user.course, user.branch, user.semester ? `Year ${user.semester}` : null, user.section ? `Sec ${user.section}` : null].filter(Boolean)
  return parts.join(' · ') || 'Unassigned Class'
}

module.exports = {
  classFieldsFromUser,
  studentClassSnapshot,
  buildStudentClassQuery,
  buildRecordClassQuery,
  buildAnnouncementClassQuery,
  announcementMatchesUser,
  recordMatchesClass,
  findClassCr,
  assignCrToStudent,
  formatClassLabel,
  buildClassQueryFromFields,
  buildCrClassQuery,
  bulkAssignStudentsToCr,
  syncClassStudentsToCr,
  transferStudentsToCr,
  reassignOpenItemsToCr,
}
