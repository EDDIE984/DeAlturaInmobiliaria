'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  data: { resultado: string; count: number }[]
}

const COLORS: Record<string, string> = {
  VENTA: '#22c55e',
  NO_VENTA: '#ef4444',
  Pendiente: '#94a3b8',
}

const LABELS: Record<string, string> = {
  VENTA: 'Venta',
  NO_VENTA: 'No venta',
  Pendiente: 'Pendiente',
}

export default function ResultsPie({ data }: Props) {
  if (data.length === 0) {
    return <div className="h-56 flex items-center justify-center text-sm text-gray-400">Sin datos</div>
  }
  const display = data.map((d) => ({ ...d, label: LABELS[d.resultado] ?? d.resultado }))
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={display}
          dataKey="count"
          nameKey="label"
          cx="50%"
          cy="50%"
          outerRadius={75}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label={({ label, percent }: any) =>
            `${label} ${(percent * 100).toFixed(0)}%`
          }
        >
          {display.map((entry) => (
            <Cell key={entry.resultado} fill={COLORS[entry.resultado] ?? '#6b7280'} />
          ))}
        </Pie>
        <Tooltip formatter={(v: any) => [v, 'Leads']} />
      </PieChart>
    </ResponsiveContainer>
  )
}
