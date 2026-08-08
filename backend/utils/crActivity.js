const CrActivityLog = require('../models/CrActivityLog')

async function logCrActivity({ crEmail, crName, action, target = '', targetId = '', details = '', performedBy = '', performedByRole = 'cr' }) {
  try {
    await CrActivityLog.create({
      crEmail,
      crName,
      action,
      target,
      targetId: String(targetId),
      details: typeof details === 'string' ? details.slice(0, 500) : JSON.stringify(details).slice(0, 500),
      performedBy,
      performedByRole,
    })
  } catch {
    // non-blocking
  }
}

function computePerformanceMetrics(complaints, grievances, messages) {
  const allItems = [...complaints, ...grievances]
  const resolved = allItems.filter(i => ['resolved', 'Resolved'].includes(i.status)).length
  const total = allItems.length
  const resolutionRate = total ? Math.round((resolved / total) * 100) : 0

  const repliedItems = allItems.filter(i => i.repliedAt && i.createdAt)
  let avgResponseHours = 0
  if (repliedItems.length) {
    const totalMs = repliedItems.reduce((sum, i) => sum + (new Date(i.repliedAt) - new Date(i.createdAt)), 0)
    avgResponseHours = Math.round((totalMs / repliedItems.length) / (1000 * 60 * 60) * 10) / 10
  }

  const crMessages = messages.filter(m => m.fromRole === 'cr')
  const studentMessages = messages.filter(m => m.fromRole === 'student')
  const unreadStudentMessages = studentMessages.filter(m => !m.read).length

  return {
    totalComplaints: complaints.length,
    totalGrievances: grievances.length,
    resolved,
    pending: total - resolved,
    resolutionRate,
    avgResponseHours,
    totalMessages: messages.length,
    crMessagesSent: crMessages.length,
    unreadStudentMessages,
    verified: allItems.filter(i => i.crVerified).length,
    escalated: allItems.filter(i => i.crEscalated).length,
    important: allItems.filter(i => i.markedImportant).length,
  }
}

module.exports = { logCrActivity, computePerformanceMetrics }
