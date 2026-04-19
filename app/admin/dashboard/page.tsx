'use client'

import { useEffect, useState } from 'react'
import StatCard from '@/components/admin/StatCard'
import LeadsLineChart from '@/components/admin/LeadsLineChart'
import ClassificationPie from '@/components/admin/ClassificationPie'
import SourceBarChart from '@/components/admin/SourceBarChart'
import ResultsPie from '@/components/admin/ResultsPie'
import AgentsTable from '@/components/admin/AgentsTable'

type Periodo = 'semana' | 'mes' | 'trimestre' | 'custom'

interface GlobalStats {
  total_leads: number
  ventas: number
  no_ventas: number
  tasa_conversion: number
  sin_gestionar: number
  seguimientos_pendientes: number
  leads_por_dia: { fecha: string; count: number }[]
  leads_por_clasificacion: { clasificacion: string; count: number }[]
  leads_por_fuente: { fuente: string; count: number }[]
  leads_por_resultado: { resultado: string; count: number }[]
}

interface AgentStat {
  id: string
  name: string
  total_leads: number
  ventas: number
  no_ventas: number
  tasa_conversion: number
  sin_gestionar: number
  seguimientos_pendientes: number
}

function getPeriodDates(periodo: Periodo, customFrom: string, customTo: string) {
  const now = new Date()
  const to = now.toISOString()
  if (periodo === 'semana') {
    const from = new Date(now)
    from.setDate(from.getDate() - 7)
    return { from: from.toISOString(), to }
  }
  if (periodo === 'mes') {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), to }
  }
  if (periodo === 'trimestre') {
    const from = new Date(now)
    from.setMonth(from.getMonth() - 3)
    return { from: from.toISOString(), to }
  }
  return { from: customFrom || to, to: customTo || to }
}

const PERIODOS: { key: Periodo; label: string }[] = [
  { key: 'semana', label: 'Esta semana' },
  { key: 'mes', label: 'Este mes' },
  { key: 'trimestre', label: 'Últimos 3 meses' },
  { key: 'custom', label: 'Rango personalizado' },
]

export default function AdminDashboardPage() {
  const [periodo, setPeriodo] = useState<Periodo>('mes')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [agents, setAgents] = useState<AgentStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (periodo === 'custom' && (!customFrom || !customTo)) return
    const { from, to } = getPeriodDates(periodo, customFrom, customTo)
    setLoading(true)
    const params = new URLSearchParams({ from, to }).toString()
    Promise.all([
      fetch(`/api/admin/stats?${params}`).then((r) => r.json()),
      fetch(`/api/admin/stats/agents?${params}`).then((r) => r.json()),
    ]).then(([statsData, agentsData]) => {
      setStats(statsData)
      setAgents(agentsData.agents ?? [])
      setLoading(false)
    })
  }, [periodo, customFrom, customTo])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Resumen de gestión de ventas</p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {PERIODOS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriodo(p.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              periodo === p.key
                ? 'bg-blue-600 text-white'
                : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p.label}
          </button>
        ))}
        {periodo === 'custom' && (
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={customFrom ? customFrom.split('T')[0] : ''}
              onChange={(e) =>
                setCustomFrom(e.target.value ? e.target.value + 'T00:00:00.000Z' : '')
              }
              className="border rounded-lg px-3 py-2 text-sm"
            />
            <span className="text-gray-400">→</span>
            <input
              type="date"
              value={customTo ? customTo.split('T')[0] : ''}
              onChange={(e) =>
                setCustomTo(e.target.value ? e.target.value + 'T23:59:59.999Z' : '')
              }
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400 text-sm">Cargando...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard label="Total Leads" value={stats?.total_leads ?? 0} color="blue" />
            <StatCard label="Ventas" value={stats?.ventas ?? 0} color="green" />
            <StatCard label="Conversión" value={`${stats?.tasa_conversion ?? 0}%`} color="purple" />
            <StatCard label="Sin Gestionar" value={stats?.sin_gestionar ?? 0} color="orange" />
            <StatCard label="Seg. Pendientes" value={stats?.seguimientos_pendientes ?? 0} color="red" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Tendencia de leads</h2>
              <LeadsLineChart data={stats?.leads_por_dia ?? []} />
            </div>
            <div className="bg-white rounded-xl border p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Clasificación</h2>
              <ClassificationPie data={stats?.leads_por_clasificacion ?? []} />
            </div>
            <div className="bg-white rounded-xl border p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Por fuente</h2>
              <SourceBarChart data={stats?.leads_por_fuente ?? []} />
            </div>
            <div className="bg-white rounded-xl border p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Resultados</h2>
              <ResultsPie data={stats?.leads_por_resultado ?? []} />
            </div>
          </div>

          <div className="bg-white rounded-xl border">
            <div className="px-5 py-4 border-b">
              <h2 className="text-sm font-semibold text-gray-700">Ranking de agentes</h2>
            </div>
            <AgentsTable agents={agents} />
          </div>
        </>
      )}
    </div>
  )
}
