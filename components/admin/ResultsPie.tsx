'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, LabelList } from 'recharts'

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
      <BarChart data={display} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip formatter={(v: any) => [v, 'Leads']} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Leads">
          <LabelList dataKey="count" position="top" style={{ fontSize: 12, fontWeight: 600 }} />
          {display.map((entry) => (
            <Cell key={entry.resultado} fill={COLORS[entry.resultado] ?? '#6b7280'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
