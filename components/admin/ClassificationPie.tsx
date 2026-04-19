'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  data: { clasificacion: string; count: number }[]
}

const COLORS: Record<string, string> = {
  caliente: '#ef4444',
  tibio: '#f97316',
  frio: '#3b82f6',
  'sin clasificar': '#9ca3af',
}

export default function ClassificationPie({ data }: Props) {
  if (data.length === 0) {
    return <div className="h-56 flex items-center justify-center text-sm text-gray-400">Sin datos</div>
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="clasificacion"
          cx="50%"
          cy="50%"
          outerRadius={75}
          label={({ clasificacion, percent }: { clasificacion: string; percent: number }) =>
            `${clasificacion} ${(percent * 100).toFixed(0)}%`
          }
        >
          {data.map((entry) => (
            <Cell key={entry.clasificacion} fill={COLORS[entry.clasificacion] ?? '#6b7280'} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => [v, 'Leads']} />
      </PieChart>
    </ResponsiveContainer>
  )
}
