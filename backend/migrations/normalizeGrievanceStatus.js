// Migration script to normalize grievance status values
// Run this once: node migrations/normalizeGrievanceStatus.js

require('dotenv').config()
const mongoose = require('mongoose')
const Grievance = require('../models/Grievance')

const statusMap = {
  'pending': 'Pending',
  'resolved': 'Resolved',
  'rejected': 'Rejected',
  'in progress': 'In Progress',
}

async function normalizeStatuses() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/university-ecosystem')
    console.log('Connected to MongoDB')

    const grievances = await Grievance.find({})
    console.log(`Found ${grievances.length} grievances to check`)

    let updated = 0
    
    for (const grievance of grievances) {
      const normalized = statusMap[grievance.status.toLowerCase()] || grievance.status
      
      if (grievance.status !== normalized) {
        grievance.status = normalized
        await grievance.save()
        updated++
        console.log(`Updated ${grievance.grievanceID}: "${grievance.status}" -> "${normalized}"`)
      }
    }

    console.log(`\n✅ Migration complete: ${updated} grievances updated`)
    process.exit(0)
  } catch (err) {
    console.error('❌ Migration failed:', err)
    process.exit(1)
  }
}

normalizeStatuses()
