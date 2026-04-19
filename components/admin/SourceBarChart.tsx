'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  data: { fuente: string; count: number }[]
}

export default function SourceBarChart({ data }: Props) {
  if (data.length === 0) {
    return <div className="h-56 flex items-center justify-center text-sm text-gray-400">Sin datos</div>
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
        <YAxis dataKey="fuente" type="category" tick={{ fontSize: 11 }} width={90} />
        <Tooltip formatter={(v: number) => [v, 'Leads']} />
        <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Leads" />
      </BarChart>
    </ResponsiveContainer>
  )
}
