import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend, AreaChart, Area,
} from 'recharts'
import { apiJson } from '../../lib/api'
import StatCard from '../../components/admin/StatCard'
import LoadingState from '../../components/admin/LoadingState'
import { TrendingUp, Users, CheckCircle, BarChart2 } from 'lucide-react'

const COLORS = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#ef4444', '#6366f1']

export default function AdminAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiJson('/analytics/overview')
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState message="Loading analytics..." />
  if (!data) return <div className="text-center py-20 text-sm text-gray-500">Failed to load analytics</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Analytics Dashboard</h2>
        <p className="text-sm text-gray-500 mt-0.5">Comprehensive insights into complaints, grievances, and user engagement</p>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Complaints" value={data.complaints.total} icon={BarChart2} color="purple" />
        <StatCard label="Total Grievances" value={data.grievances.total} icon={BarChart2} color="red" />
        <StatCard label="Pending" value={data.complaints.pending + data.grievances.pending} icon={TrendingUp} color="amber" />
        <StatCard label="Resolved" value={data.complaints.resolved + data.grievances.resolved} icon={CheckCircle} color="green" />
        <StatCard label="Resolution Rate" value={`${data.resolutionRate}%`} icon={TrendingUp} color="blue" />
        <StatCard label="Avg Vendor Rating" value={data.avgRating} icon={Users} color="slate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Monthly Trends</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data.monthlyTrends}>
              <defs>
                <linearGradient id="colorC" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="complaints" stroke="#7c3aed" fill="url(#colorC)" name="Complaints" />
              <Area type="monotone" dataKey="grievances" stroke="#ef4444" fill="url(#colorG)" name="Grievances" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Category-wise Analytics</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={data.categoryAnalytics.slice(0, 6)} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={90} label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                {data.categoryAnalytics.slice(0, 6).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Department-wise Analytics</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.departmentAnalytics.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="department" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="users" fill="#6366f1" name="Students" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Resolution Rate Analytics</h3>
          <div className="flex items-center justify-center py-6">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#7c3aed" strokeWidth="3"
                  strokeDasharray={`${data.resolutionRate} ${100 - data.resolutionRate}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">{data.resolutionRate}%</span>
                <span className="text-xs text-gray-500">Resolved</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2 text-center">
            <div className="p-2 bg-amber-50 rounded-lg"><p className="text-lg font-bold text-amber-700">{data.complaints.pending + data.grievances.pending}</p><p className="text-xs text-amber-600">Pending</p></div>
            <div className="p-2 bg-green-50 rounded-lg"><p className="text-lg font-bold text-green-700">{data.complaints.resolved + data.grievances.resolved}</p><p className="text-xs text-green-600">Resolved</p></div>
            <div className="p-2 bg-red-50 rounded-lg"><p className="text-lg font-bold text-red-700">{data.complaints.rejected + data.grievances.rejected}</p><p className="text-xs text-red-600">Rejected</p></div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">User Engagement Analytics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>{['Rank', 'User', 'Email', 'Submissions'].map(h => (
                <th key={h} className="text-left text-xs font-medium text-gray-400 px-4 py-2">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {data.userEngagement.map((u, i) => (
                <tr key={u.email} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-xs font-bold text-purple-600">#{i + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{u.email}</td>
                  <td className="px-4 py-2.5"><span className="badge bg-purple-100 text-purple-700">{u.submissions}</span></td>
                </tr>
              ))}
              {data.userEngagement.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-xs text-gray-400">No engagement data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Complaint Trend Analysis</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data.monthlyTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            <Line type="monotone" dataKey="complaints" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4, fill: '#7c3aed' }} name="Complaints" />
            <Line type="monotone" dataKey="grievances" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: '#ef4444' }} name="Grievances" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
