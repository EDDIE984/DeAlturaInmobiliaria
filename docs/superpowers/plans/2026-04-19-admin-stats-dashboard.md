# Admin Stats Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a statistical dashboard at `/admin/dashboard` with global KPIs, 4 recharts charts, a per-agent ranking table, and a period filter.

**Architecture:** Client-side page (`useState` + `useEffect` + fetch), two new admin API routes, 6 new components. The `AdminSidebar` gets a new "Dashboard" link. All Supabase queries run server-side in API routes using `supabaseAdmin`.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS, Supabase (service role), recharts, JWT auth via `lib/auth.ts`.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `components/AdminSidebar.tsx` | Add Dashboard nav item |
| Create | `app/admin/dashboard/page.tsx` | Main dashboard page |
| Create | `app/api/admin/stats/route.ts` | Global KPIs + chart data |
| Create | `app/api/admin/stats/agents/route.ts` | Per-agent stats |
| Create | `components/admin/StatCard.tsx` | KPI card |
| Create | `components/admin/LeadsLineChart.tsx` | Trend line chart |
| Create | `components/admin/ClassificationPie.tsx` | caliente/tibio/frio pie |
| Create | `components/admin/SourceBarChart.tsx` | Leads by source bar chart |
| Create | `components/admin/ResultsPie.tsx` | VENTA/NO_VENTA/Pendiente pie |
| Create | `components/admin/AgentsTable.tsx` | Agent ranking table |

---

### Task 1: Install recharts

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install the package**

```bash
cd /Users/eddiesosa/Documents/OneWayEc/DeAltura && npm install recharts
```

Expected: `added N packages` with no errors.

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add recharts for dashboard charts"
```

---

### Task 2: Add Dashboard link to AdminSidebar

**Files:**
- Modify: `components/AdminSidebar.tsx`

- [ ] **Step 1: Add the nav item**

In `components/AdminSidebar.tsx`, replace the import line for icons and the `NAV_ITEMS` array:

```tsx
import { Users, LogOut, UserCheck, Building2, Sparkles, MapPin, LayoutGrid, MessageSquareMore, BarChart3 } from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: BarChart3 },
  { label: 'Usuarios', href: '/admin/usuarios', icon: Users },
  { label: 'Agentes', href: '/admin/agentes', icon: UserCheck },
  { label: 'Leads', href: '/admin/leads', icon: MessageSquareMore },
  { label: 'Empresa', href: '/admin/empresa', icon: Building2 },
  { label: 'Amenidades', href: '/admin/amenidades', icon: Sparkles },
  { label: 'Lotes', href: '/admin/lotes', icon: MapPin },
  { label: 'Zonas', href: '/admin/zonas', icon: LayoutGrid },
]
```

- [ ] **Step 2: Verify in browser**

Start the dev server (`npm run dev`) and log in as admin. The sidebar should now show "Dashboard" as the first item. Clicking it shows a 404 (the page doesn't exist yet — that's expected).

- [ ] **Step 3: Commit**

```bash
git add components/AdminSidebar.tsx
git commit -m "feat: add Dashboard link to admin sidebar"
```

---

### Task 3: Create API route /api/admin/stats

**Files:**
- Create: `app/api/admin/stats/route.ts`

- [ ] **Step 1: Create the file**

```typescript
// app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const now = new Date()
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const defaultTo = now.toISOString()
  const from = searchParams.get('from') ?? defaultFrom
  const to = searchParams.get('to') ?? defaultTo

  const { data: leads } = await supabaseAdmin
    .from('leads')
    .select('id, resultado, classification, source, created_at')
    .gte('created_at', from)
    .lte('created_at', to)

  const allLeads = leads ?? []
  const leadIds = allLeads.map((l) => l.id)

  const ventas = allLeads.filter((l) => l.resultado === 'VENTA').length
  const noVentas = allLeads.filter((l) => l.resultado === 'NO_VENTA').length
  const tasaConversion =
    ventas + noVentas > 0
      ? Math.round((ventas / (ventas + noVentas)) * 1000) / 10
      : 0

  const { data: gestiones } = leadIds.length > 0
    ? await supabaseAdmin
        .from('lead_seguimientos')
        .select('lead_id, tipo, fecha')
        .in('lead_id', leadIds)
    : { data: [] }

  const leadsConGestion = new Set((gestiones ?? []).map((g) => g.lead_id))
  const sinGestionar = leadIds.filter((id) => !leadsConGestion.has(id)).length

  const ahora = new Date().toISOString()
  const seguimientosPendientes = (gestiones ?? []).filter(
    (g) => g.tipo === 'SEGUIMIENTO' && g.fecha > ahora
  ).length

  // Leads por día
  const byDay: Record<string, number> = {}
  allLeads.forEach((l) => {
    const day = l.created_at.split('T')[0]
    byDay[day] = (byDay[day] || 0) + 1
  })
  const leads_por_dia = Object.entries(byDay)
    .map(([fecha, count]) => ({ fecha, count }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  // Leads por clasificación
  const byClasificacion: Record<string, number> = {}
  allLeads.forEach((l) => {
    const c = l.classification || 'sin clasificar'
    byClasificacion[c] = (byClasificacion[c] || 0) + 1
  })
  const leads_por_clasificacion = Object.entries(byClasificacion).map(
    ([clasificacion, count]) => ({ clasificacion, count })
  )

  // Leads por fuente
  const byFuente: Record<string, number> = {}
  allLeads.forEach((l) => {
    const s = l.source || 'sin fuente'
    byFuente[s] = (byFuente[s] || 0) + 1
  })
  const leads_por_fuente = Object.entries(byFuente)
    .map(([fuente, count]) => ({ fuente, count }))
    .sort((a, b) => b.count - a.count)

  // Leads por resultado
  const byResultado: Record<string, number> = { VENTA: 0, NO_VENTA: 0, Pendiente: 0 }
  allLeads.forEach((l) => {
    if (l.resultado === 'VENTA') byResultado.VENTA++
    else if (l.resultado === 'NO_VENTA') byResultado.NO_VENTA++
    else byResultado.Pendiente++
  })
  const leads_por_resultado = Object.entries(byResultado).map(
    ([resultado, count]) => ({ resultado, count })
  )

  return NextResponse.json({
    total_leads: allLeads.length,
    ventas,
    no_ventas: noVentas,
    tasa_conversion: tasaConversion,
    sin_gestionar: sinGestionar,
    seguimientos_pendientes: seguimientosPendientes,
    leads_por_dia,
    leads_por_clasificacion,
    leads_por_fuente,
    leads_por_resultado,
  })
}
```

- [ ] **Step 2: Test the endpoint manually**

With the dev server running, visit (as admin):
```
http://localhost:3000/api/admin/stats
```
Expected: JSON with `total_leads`, `ventas`, `tasa_conversion`, etc.

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/stats/route.ts
git commit -m "feat: add admin global stats API route"
```

---

### Task 4: Create API route /api/admin/stats/agents

**Files:**
- Create: `app/api/admin/stats/agents/route.ts`

- [ ] **Step 1: Create the file**

```typescript
// app/api/admin/stats/agents/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const now = new Date()
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const defaultTo = now.toISOString()
  const from = searchParams.get('from') ?? defaultFrom
  const to = searchParams.get('to') ?? defaultTo

  const { data: agentsRaw } = await supabaseAdmin
    .from('agents')
    .select('id, name')
    .eq('active', true)
    .order('name')

  const { data: leadsRaw } = await supabaseAdmin
    .from('leads')
    .select('id, resultado, assigned_agent_id')
    .gte('created_at', from)
    .lte('created_at', to)

  const allLeads = leadsRaw ?? []
  const leadIds = allLeads.map((l) => l.id)

  const { data: gestoinesRaw } = leadIds.length > 0
    ? await supabaseAdmin
        .from('lead_seguimientos')
        .select('lead_id, tipo, fecha')
        .in('lead_id', leadIds)
    : { data: [] }

  const allGestiones = gestoinesRaw ?? []
  const ahora = new Date().toISOString()

  const agents = (agentsRaw ?? []).map((agent) => {
    const agentLeads = allLeads.filter((l) => l.assigned_agent_id === agent.id)
    const agentLeadIds = new Set(agentLeads.map((l) => l.id))
    const agentGestiones = allGestiones.filter((g) => agentLeadIds.has(g.lead_id))

    const ventas = agentLeads.filter((l) => l.resultado === 'VENTA').length
    const noVentas = agentLeads.filter((l) => l.resultado === 'NO_VENTA').length
    const tasaConversion =
      ventas + noVentas > 0
        ? Math.round((ventas / (ventas + noVentas)) * 1000) / 10
        : 0

    const leadsConGestion = new Set(agentGestiones.map((g) => g.lead_id))
    const sinGestionar = agentLeads.filter((l) => !leadsConGestion.has(l.id)).length
    const seguimientosPendientes = agentGestiones.filter(
      (g) => g.tipo === 'SEGUIMIENTO' && g.fecha > ahora
    ).length

    return {
      id: agent.id,
      name: agent.name,
      total_leads: agentLeads.length,
      ventas,
      no_ventas: noVentas,
      tasa_conversion: tasaConversion,
      sin_gestionar: sinGestionar,
      seguimientos_pendientes: seguimientosPendientes,
    }
  }).sort((a, b) => b.ventas - a.ventas)

  return NextResponse.json({ agents })
}
```

- [ ] **Step 2: Test the endpoint**

Visit: `http://localhost:3000/api/admin/stats/agents`
Expected: `{ agents: [...] }` with each agent's stats.

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/stats/agents/route.ts
git commit -m "feat: add admin per-agent stats API route"
```

---

### Task 5: Create StatCard component

**Files:**
- Create: `components/admin/StatCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/admin/StatCard.tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/StatCard.tsx
git commit -m "feat: add StatCard component for admin dashboard"
```

---

### Task 6: Create chart components

**Files:**
- Create: `components/admin/LeadsLineChart.tsx`
- Create: `components/admin/ClassificationPie.tsx`
- Create: `components/admin/SourceBarChart.tsx`
- Create: `components/admin/ResultsPie.tsx`

- [ ] **Step 1: Create LeadsLineChart**

```tsx
// components/admin/LeadsLineChart.tsx
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
```

- [ ] **Step 2: Create ClassificationPie**

```tsx
// components/admin/ClassificationPie.tsx
'use client'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

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
        <Pie data={data} dataKey="count" nameKey="clasificacion" cx="50%" cy="50%" outerRadius={75} label={({ clasificacion, percent }: { clasificacion: string; percent: number }) => `${clasificacion} ${(percent * 100).toFixed(0)}%`}>
          {data.map((entry) => (
            <Cell key={entry.clasificacion} fill={COLORS[entry.clasificacion] ?? '#6b7280'} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => [v, 'Leads']} />
      </PieChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 3: Create SourceBarChart**

```tsx
// components/admin/SourceBarChart.tsx
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
```

- [ ] **Step 4: Create ResultsPie**

```tsx
// components/admin/ResultsPie.tsx
'use client'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

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
        <Pie data={display} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={75} label={({ label, percent }: { label: string; percent: number }) => `${label} ${(percent * 100).toFixed(0)}%`}>
          {display.map((entry) => (
            <Cell key={entry.resultado} fill={COLORS[entry.resultado] ?? '#6b7280'} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => [v, 'Leads']} />
      </PieChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add components/admin/LeadsLineChart.tsx components/admin/ClassificationPie.tsx components/admin/SourceBarChart.tsx components/admin/ResultsPie.tsx
git commit -m "feat: add chart components for admin dashboard"
```

---

### Task 7: Create AgentsTable component

**Files:**
- Create: `components/admin/AgentsTable.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/admin/AgentsTable.tsx
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

interface Props {
  agents: AgentStat[]
}

export default function AgentsTable({ agents }: Props) {
  if (agents.length === 0) {
    return <div className="py-10 text-center text-sm text-gray-400">Sin agentes activos</div>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <th className="px-5 py-3 text-left">#</th>
            <th className="px-5 py-3 text-left">Agente</th>
            <th className="px-5 py-3 text-right">Leads</th>
            <th className="px-5 py-3 text-right">Ventas</th>
            <th className="px-5 py-3 text-right">No ventas</th>
            <th className="px-5 py-3 text-right">Conversión</th>
            <th className="px-5 py-3 text-right">Sin gestionar</th>
            <th className="px-5 py-3 text-right">Seg. pend.</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((agent, i) => (
            <tr key={agent.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3 text-gray-400 font-medium">{i + 1}</td>
              <td className="px-5 py-3 font-medium text-gray-800">{agent.name}</td>
              <td className="px-5 py-3 text-right text-gray-700">{agent.total_leads}</td>
              <td className="px-5 py-3 text-right">
                <span className="text-green-600 font-semibold">{agent.ventas}</span>
              </td>
              <td className="px-5 py-3 text-right text-red-500">{agent.no_ventas}</td>
              <td className="px-5 py-3 text-right">
                <span className={`font-semibold ${agent.tasa_conversion >= 50 ? 'text-green-600' : agent.tasa_conversion >= 25 ? 'text-orange-500' : 'text-red-500'}`}>
                  {agent.tasa_conversion}%
                </span>
              </td>
              <td className="px-5 py-3 text-right text-gray-500">{agent.sin_gestionar}</td>
              <td className="px-5 py-3 text-right text-gray-500">{agent.seguimientos_pendientes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/AgentsTable.tsx
git commit -m "feat: add AgentsTable component for admin dashboard"
```

---

### Task 8: Create the admin dashboard page

**Files:**
- Create: `app/admin/dashboard/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// app/admin/dashboard/page.tsx
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
    const { from, to } = getPeriodDates(periodo, customFrom, customTo)
    if (periodo === 'custom' && (!customFrom || !customTo)) return
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

      {/* Period filter */}
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
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard label="Total Leads" value={stats?.total_leads ?? 0} color="blue" />
            <StatCard label="Ventas" value={stats?.ventas ?? 0} color="green" />
            <StatCard label="Conversión" value={`${stats?.tasa_conversion ?? 0}%`} color="purple" />
            <StatCard label="Sin Gestionar" value={stats?.sin_gestionar ?? 0} color="orange" />
            <StatCard label="Seg. Pendientes" value={stats?.seguimientos_pendientes ?? 0} color="red" />
          </div>

          {/* Charts */}
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

          {/* Agents ranking */}
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
```

- [ ] **Step 2: Verify in browser**

Navigate to `http://localhost:3000/admin/dashboard`. You should see:
- 5 KPI cards with real data
- 4 charts (some may show "Sin datos" if the DB is empty)
- Agents ranking table

- [ ] **Step 3: Test period filter**

Click "Esta semana" → cards and charts should update. Click "Rango personalizado" → two date inputs appear. Select a date range → data updates.

- [ ] **Step 4: Commit**

```bash
git add app/admin/dashboard/page.tsx
git commit -m "feat: add admin stats dashboard page with period filter"
```

---

## Verification checklist

- [ ] `/admin/dashboard` loads without errors and shows data for the current month by default
- [ ] Switching between period buttons (Esta semana / Este mes / Últimos 3 meses) updates all KPIs and charts
- [ ] Rango personalizado shows date inputs; selecting dates fetches new data
- [ ] Table shows all active agents, even those with 0 leads
- [ ] Conversion % color: green ≥50%, orange ≥25%, red <25%
- [ ] Visiting `/api/admin/stats` as a `role=user` returns 403
- [ ] Dashboard link appears in admin sidebar and highlights correctly when active
