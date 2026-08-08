function sendError(res, status, message) {
  return res.status(status).json({ message })
}

function handleServerError(res, err, context = '') {
  console.error(context ? `[${context}]` : '', err.message)
  return sendError(res, 500, 'Internal server error')
}

module.exports = { sendError, handleServerError }
