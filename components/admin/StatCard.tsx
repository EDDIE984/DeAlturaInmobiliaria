interface StatCardProps {
  label: string
  value: string | number
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red'
}

const COLOR_MAP: Record<StatCardProps['color'], string> = {
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  green: 'bg-green-50 text-green-700 border-green-100',
  purple: 'bg-purple-50 text-purple-700 border-purple-100',
  orange: 'bg-orange-50 text-orange-700 border-orange-100',
  red: 'bg-red-50 text-red-700 border-red-100',
}

export default function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-5 ${COLOR_MAP[color]}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-60">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  )
}
