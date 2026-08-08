import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { MessageSquare, TrendingUp, Map, Activity, Star } from 'lucide-react'
import { apiJson } from '../../lib/api'
import StatCard from '../../components/admin/StatCard'
import LoadingState from '../../components/admin/LoadingState'

const HEAT_COLORS = ['#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed']

export default function AdminMonitoring() {
  const [data, setData] = useState(null)
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiJson('/analytics/overview'),
      apiJson('/feedbacks').catch(() => []),
    ]).then(([analytics, fb]) => {
      setData(analytics)
      setFeedbacks(Array.isArray(fb) ? fb : [])
    }).catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState message="Loading monitoring data..." />
  if (!data) return <div className="text-center py-20 text-sm text-gray-500">Failed to load monitoring data</div>

  const maxIssue = Math.max(...data.commonIssues.map(i => i.count), 1)
  const heatmapData = data.categoryAnalytics.map(c => ({
    ...c,
    intensity: c.count / maxIssue,
  }))

  const avgFeedbackRating = feedbacks.length
    ? (feedbacks.reduce((s, f) => s + (f.rating || 0), 0) / feedbacks.length).toFixed(1)
    : 'N/A'

  const performanceScore = data.resolutionRate

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Monitoring & Insights</h2>
        <p className="text-sm text-gray-500 mt-0.5">Feedback monitoring, issue heatmaps, and resolution performance</p>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Feedbacks" value={feedbacks.length} icon={MessageSquare} color="blue" />
        <StatCard label="Avg Feedback Rating" value={avgFeedbackRating} icon={Star} color="amber" />
        <StatCard label="Resolution Performance" value={`${performanceScore}%`} icon={Activity} color="green" />
        <StatCard label="Overdue Items" value={data.complaints.overdue + data.grievances.overdue} icon={TrendingUp} color="red" />
      </div>

      {/* Feedback Monitoring */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageSquare size={16} className="text-purple-600" /> Feedback Monitoring System
        </h3>
        {feedbacks.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">No feedback submissions yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>{['ID', 'Subject', 'Teacher', 'Rating', 'Comments', 'Date'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-400 px-4 py-2">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {feedbacks.slice(0, 10).map(f => (
                  <tr key={f._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{f.feedbackID}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-900">{f.subject}</td>
                    <td className="px-4 py-2.5 text-gray-600">{f.teacher}</td>
                    <td className="px-4 py-2.5">
                      <span className={`badge ${f.rating >= 4 ? 'bg-green-100 text-green-700' : f.rating >= 3 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs max-w-xs truncate">{f.comments}</td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs">{new Date(f.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Most Common Issues */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Most Common Issues Dashboard</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.commonIssues}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="issue" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.commonIssues.map((_, i) => (
                  <Cell key={i} fill={HEAT_COLORS[Math.min(i, HEAT_COLORS.length - 1)]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Heatmap */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Map size={16} className="text-purple-600" /> Heatmap of Problem Areas
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {heatmapData.slice(0, 9).map(item => {
              const idx = Math.min(Math.floor(item.intensity * (HEAT_COLORS.length - 1)), HEAT_COLORS.length - 1)
              return (
                <div key={item.category}
                  style={{ background: HEAT_COLORS[idx] }}
                  className="rounded-xl p-3 text-center transition-transform hover:scale-105">
                  <p className="text-xs font-semibold text-gray-800 truncate">{item.category}</p>
                  <p className="text-lg font-bold text-purple-900 mt-1">{item.count}</p>
                  <p className="text-[10px] text-purple-700">reports</p>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-2 mt-4 justify-center">
            <span className="text-[10px] text-gray-400">Low</span>
            {HEAT_COLORS.map((c, i) => (
              <div key={i} className="w-5 h-3 rounded-sm" style={{ background: c }} />
            ))}
            <span className="text-[10px] text-gray-400">High</span>
          </div>
        </div>
      </div>

      {/* Resolution Performance */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Resolution Performance Tracking</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Complaints Resolved', value: data.complaints.resolved, total: data.complaints.total, color: 'purple' },
            { label: 'Grievances Resolved', value: data.grievances.resolved, total: data.grievances.total, color: 'red' },
            { label: 'In Progress', value: data.complaints.inProgress + data.grievances.inProgress, total: data.complaints.total + data.grievances.total, color: 'blue' },
            { label: 'Overdue', value: data.complaints.overdue + data.grievances.overdue, total: data.complaints.total + data.grievances.total, color: 'amber' },
          ].map(item => {
            const pct = item.total ? Math.round((item.value / item.total) * 100) : 0
            return (
              <div key={item.label} className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 font-medium">{item.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{item.value}</p>
                <div className="h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">{pct}% of total</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
