const CATEGORY_ASSIGN_MAP = {
  Canteen: 'vendor',
  Food: 'vendor',
  Finance: 'cr',
  Academic: 'cr',
  Infrastructure: 'cr',
  Hostel: 'cr',
  Sports: 'cr',
  Safety: 'admin',
  Ragging: 'admin',
  Harassment: 'admin',
  'Sexual Harassment': 'admin',
  Discrimination: 'admin',
  'Mental Health': 'admin',
}

const DEFAULT_DEADLINE_DAYS = {
  Urgent: 1,
  High: 3,
  Medium: 7,
  Low: 14,
}

function getAutoAssignRole(category) {
  return CATEGORY_ASSIGN_MAP[category] || 'cr'
}

function getDefaultDeadline(priority) {
  const days = DEFAULT_DEADLINE_DAYS[priority] || DEFAULT_DEADLINE_DAYS.Medium
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

function normalizeStatus(status) {
  const map = {
    pending: 'Pending',
    reviewing: 'In Progress',
    resolved: 'Resolved',
    rejected: 'Rejected',
    Pending: 'Pending',
    'In Progress': 'In Progress',
    Resolved: 'Resolved',
    Rejected: 'Rejected',
  }
  return map[status] || status
}

function isOverdue(item) {
  if (!item.deadline) return false
  const resolved = ['resolved', 'Resolved', 'rejected', 'Rejected']
  if (resolved.includes(item.status)) return false
  return new Date(item.deadline) < new Date()
}

module.exports = { CATEGORY_ASSIGN_MAP, getAutoAssignRole, getDefaultDeadline, normalizeStatus, isOverdue }
