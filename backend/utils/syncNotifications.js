const Notification = require('../models/Notification')

async function notifyUsers({ emails = [], roles = [], title, message, type = 'alert', priority = 'normal', postedBy, postedByName }) {
  const uniqueEmails = [...new Set(emails.filter(Boolean))]
  const uniqueRoles = [...new Set(roles.filter(Boolean))]
  if (!uniqueEmails.length && !uniqueRoles.length) return

  await Notification.create({
    title,
    message,
    type: ['notice', 'announcement', 'emergency', 'alert'].includes(type) ? type : 'alert',
    targetRoles: uniqueRoles,
    targetEmails: uniqueEmails,
    postedBy: postedBy || 'system',
    postedByName: postedByName || 'System',
    priority: ['normal', 'high', 'critical'].includes(priority) ? priority : 'normal',
  })
}

function collectRecipients(record) {
  const emails = []
  if (record.studentID && record.studentID !== 'anonymous') emails.push(record.studentID)
  if (record.assignedTo) emails.push(record.assignedTo)
  return [...new Set(emails)]
}

async function notifyComplaintEvent(complaint, event, actor) {
  const id = complaint.complaintID || 'Complaint'
  const messages = {
    created: `New complaint ${id} has been assigned to you.`,
    assigned: `Complaint ${id} assigned to ${complaint.assignedToName || 'you'}.`,
    status: `Complaint ${id} status changed to "${complaint.status}".`,
    reply: `New response on complaint ${id}.`,
    escalated: `Complaint ${id} escalated to level ${complaint.escalationLevel || 1}.`,
    deadline: complaint.deadline
      ? `Deadline set for complaint ${id}: ${new Date(complaint.deadline).toLocaleDateString('en-IN')}.`
      : `Deadline updated for complaint ${id}.`,
  }

  await notifyUsers({
    emails: collectRecipients(complaint),
    title: `Complaint ${id}`,
    message: messages[event] || `Update on complaint ${id}.`,
    type: event === 'escalated' ? 'alert' : 'notice',
    priority: event === 'escalated' ? 'high' : 'normal',
    postedBy: actor?.email,
    postedByName: actor?.name || 'Admin',
  })
}

async function notifyGrievanceEvent(grievance, event, actor) {
  const id = grievance.grievanceID || 'Grievance'
  const messages = {
    created: `New grievance ${id} has been assigned to you.`,
    assigned: `Grievance ${id} assigned to ${grievance.assignedToName || 'you'}.`,
    status: `Grievance ${id} status changed to "${grievance.status}".`,
    reply: `New response on grievance ${id}.`,
    escalated: `Grievance ${id} escalated to level ${grievance.escalationLevel || 1}.`,
    deadline: grievance.deadline
      ? `Deadline set for grievance ${id}: ${new Date(grievance.deadline).toLocaleDateString('en-IN')}.`
      : `Deadline updated for grievance ${id}.`,
  }

  await notifyUsers({
    emails: collectRecipients(grievance),
    title: `Grievance ${id}`,
    message: messages[event] || `Update on grievance ${id}.`,
    type: event === 'escalated' ? 'alert' : 'notice',
    priority: event === 'escalated' ? 'high' : 'normal',
    postedBy: actor?.email,
    postedByName: actor?.name || 'Admin',
  })
}

module.exports = { notifyUsers, notifyComplaintEvent, notifyGrievanceEvent }
