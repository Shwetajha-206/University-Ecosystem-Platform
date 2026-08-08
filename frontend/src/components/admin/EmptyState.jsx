import { Inbox } from 'lucide-react'

export default function EmptyState({ title = 'No data found', description = 'There is nothing to display yet.', icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Icon size={24} className="text-gray-400" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="text-xs text-gray-500 mt-1 max-w-xs">{description}</p>
    </div>
  )
}
