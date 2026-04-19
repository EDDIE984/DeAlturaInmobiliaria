'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  data: { fecha: string; count: number }[]
}

export default function LeadsLineChart({ data }: Props) {
  if (data.length === 0) {
    return <div className="h-56 flex items-center justify-center text-sm text-gray-400">Sin datos</div>
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="fecha" tickFormatter={(d: string) => d.slice(5)} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip labelFormatter={(l: string) => `Fecha: ${l}`} formatter={(v: number) => [v, 'Leads']} />
        <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
