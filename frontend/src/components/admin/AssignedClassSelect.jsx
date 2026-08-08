import { useState, useEffect, useCallback } from 'react'
import { GraduationCap } from 'lucide-react'
import { apiJson } from '../../lib/api'
import { COURSES, SEMESTERS, SECTIONS } from '../../lib/classOptions'

const EMPTY = { course: '', branch: '', semester: '', section: '' }

export default function AssignedClassSelect({
  value,
  onChange,
  className = '',
  compact = false,
  requireAll = false,
}) {
  const [branches, setBranches] = useState([])
  const [branchesLoading, setBranchesLoading] = useState(true)

  const fetchBranches = useCallback(async () => {
    setBranchesLoading(true)
    try {
      const data = await apiJson('/class/registration-options')
      setBranches(data.branches || [])
    } catch {
      setBranches([])
    } finally {
      setBranchesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBranches()
  }, [fetchBranches])

  const update = (field, val) => {
    onChange?.({ ...value, [field]: val })
  }

  const clear = () => onChange?.(EMPTY)

  const fields = [
    { key: 'course', label: 'Course', opts: COURSES, loading: false },
    { key: 'branch', label: 'Branch', opts: branches, loading: branchesLoading },
    { key: 'semester', label: 'Semester', opts: SEMESTERS, loading: false },
    { key: 'section', label: 'Section', opts: SECTIONS, loading: false },
  ]

  const dropdowns = (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${compact ? '' : 'lg:grid-cols-4'} gap-3`}>
      {fields.map(({ key, label, opts, loading }) => (
        <div key={key}>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {label}{(compact || requireAll) ? ' *' : ''}
          </label>
          <select
            className="input text-sm w-full"
            value={value[key] || ''}
            onChange={e => update(key, e.target.value)}
            disabled={loading}
          >
            <option value="">
              {loading ? 'Loading...' : (compact || requireAll) ? `Select ${label}` : `All ${label}s`}
            </option>
            {opts.map(o => (
              <option key={o} value={o}>{key === 'semester' ? `Semester ${o}` : o}</option>
            ))}
          </select>
          {key === 'branch' && !loading && opts.length === 0 && (
            <p className="text-[10px] text-gray-400 mt-0.5">No branches in student registration yet</p>
          )}
        </div>
      ))}
    </div>
  )

  if (compact) return <div className={className}>{dropdowns}</div>

  return (
    <div className={`card p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GraduationCap size={16} className="text-purple-600" />
          <h3 className="text-sm font-semibold text-gray-900">Assigned Class</h3>
        </div>
        {(value.course || value.branch || value.semester || value.section) && (
          <button type="button" onClick={clear} className="text-xs text-purple-600 hover:underline">
            Clear all
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Courses, semesters, and sections use standard options. Branches are loaded from student registration data.
      </p>
      {dropdowns}
    </div>
  )
}

export function isClassFilterComplete(filter) {
  return !!(filter?.course && filter?.branch && filter?.semester && filter?.section)
}

export { EMPTY as EMPTY_CLASS }
