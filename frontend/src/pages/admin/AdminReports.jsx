import { useState } from 'react'
import { Download, FileText, Table, Calendar } from 'lucide-react'
import { apiFetch } from '../../lib/api'

const REPORT_TYPES = [
  { id: 'complaints', label: 'Complaints Report', icon: FileText, desc: 'All complaints with status, assignee, and deadlines' },
  { id: 'users', label: 'Users Report', icon: Table, desc: 'Complete user directory with roles and status' },
  { id: 'feedbacks', label: 'Feedbacks Report', icon: Table, desc: 'Teacher feedback submissions and ratings' },
  { id: 'summary', label: 'Summary Report', icon: Calendar, desc: 'High-level metrics overview' },
]

export default function AdminReports() {
  const [period, setPeriod] = useState('monthly')
  const [downloading, setDownloading] = useState(null)

  const downloadReport = async (type, format = 'csv') => {
    setDownloading(type)
    try {
      const res = await apiFetch(`/reports/${type}?period=${period}`)
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-report-${period}.${format === 'csv' ? 'csv' : 'csv'}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(err.message || 'Failed to download report')
    }
    setDownloading(null)
  }

  const downloadPDF = async (type) => {
    try {
      const res = await apiFetch(`/reports/${type}?period=${period}&format=json`)
      if (!res.ok) throw new Error('Failed to fetch data for PDF')
      const data = await res.json()
      
      let tableHtml = ''
      if (data && data.length > 0) {
        const headers = Object.keys(data[0]).filter(k => k !== '_id' && k !== '__v')
        tableHtml = `<table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${data.map(row => `<tr>${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>`
      } else {
        tableHtml = '<p style="color: #64748b; margin-top: 20px;">No data available for this period.</p>'
      }

      const win = window.open('', '_blank')
      if (!win) return alert('Please allow popups to generate PDF')
      win.document.write(`
        <html><head><title>${type} Report</title>
        <style>body{font-family:Inter,sans-serif;padding:40px;color:#1a1a2e}h1{color:#7c3aed;margin-bottom:8px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #e2e8f0;padding:8px 12px;text-align:left;font-size:13px}th{background:#f8fafc;font-weight:600}.meta{color:#64748b;font-size:14px;margin-bottom:24px;border-bottom:1px solid #e2e8f0;padding-bottom:16px}</style>
        </head><body>
        <h1>${type.charAt(0).toUpperCase() + type.slice(1)} Report</h1>
        <p class="meta">Period: ${period} &middot; Generated: ${new Date().toLocaleString()}</p>
        ${tableHtml}
        <script>window.onload=function(){window.print()}</script>
        </body></html>`)
      win.document.close()
    } catch (err) {
      alert(err.message || 'Failed to generate PDF')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Reports</h2>
        <p className="text-sm text-gray-500 mt-0.5">Generate and download reports in CSV or PDF format</p>
      </div>

      <div className="card p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Report Period</p>
        <div className="flex gap-2">
          {['monthly', 'yearly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${period === p ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {REPORT_TYPES.map(({ id, label, icon: Icon, desc }) => (
          <div key={id} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => downloadReport(id, 'csv')} disabled={downloading === id}
                className="flex items-center gap-2 flex-1 justify-center px-3 py-2 rounded-lg text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 transition-colors">
                <Download size={13} />
                {downloading === id ? 'Downloading...' : 'Export CSV'}
              </button>
              <button onClick={() => downloadPDF(id)}
                className="flex items-center gap-2 flex-1 justify-center px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">
                <FileText size={13} /> PDF
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-5 bg-purple-50 border-purple-100">
        <h3 className="text-sm font-semibold text-purple-900 mb-2">Export Tips</h3>
        <ul className="text-xs text-purple-700 space-y-1 list-disc list-inside">
          <li>CSV files can be opened in Excel, Google Sheets, or any spreadsheet application</li>
          <li>Monthly reports include data from the current month; yearly reports cover the full year</li>
          <li>PDF reports open a print dialog — use "Save as PDF" to download</li>
        </ul>
      </div>
    </div>
  )
}
