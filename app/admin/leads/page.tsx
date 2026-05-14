'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, MessageSquare, Bot, User, CalendarDays, CheckCircle2, CircleDashed, ClipboardList, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface LatestSeguimiento {
  id: string
  tipo: 'CONTACTO' | 'SEGUIMIENTO'
  fecha: string
  observaciones: string | null
  agent_id: string
  agent_name: string
}

interface AdminLead {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  classification: string | null
  source: string | null
  zone_interest: string | null
  resultado: 'VENTA' | 'NO_VENTA' | null
  created_at: string
  assigned_agent_id: string | null
  assigned_agent_name: string | null
  seguimiento_count: number
  latest_seguimiento: LatestSeguimiento | null
  has_chat: boolean
}

interface Conversation {
  id: string
  status: string | null
  classification: string | null
  flow_state: string | null
  created_at: string
}

interface ChatMessage {
  id: string
  humano: string | null
  chatbot: string | null
  created_at: string
}

const CLASSIFICATION_COLORS: Record<string, string> = {
  caliente: 'bg-red-100 text-red-700 border-red-200',
  tibio: 'bg-amber-100 text-amber-700 border-amber-200',
  frio: 'bg-blue-100 text-blue-700 border-blue-200',
}

function formatDate(iso: string | null, withTime = false) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

function classificationBadge(classification: string | null) {
  if (!classification) return <span className="text-xs text-muted-foreground">Sin calificar</span>

  const key = classification.toLowerCase()
  const label = key.charAt(0).toUpperCase() + key.slice(1)
  const cls = CLASSIFICATION_COLORS[key] ?? 'bg-gray-100 text-gray-700 border-gray-200'

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {label}
    </span>
  )
}

function resultadoBadge(resultado: AdminLead['resultado']) {
  if (resultado === 'VENTA') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-green-100 text-green-700 border-green-200">
        <CheckCircle2 className="h-3 w-3" />
        Venta concretada
      </span>
    )
  }

  if (resultado === 'NO_VENTA') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-red-100 text-red-700 border-red-200">
        <CircleDashed className="h-3 w-3" />
        No venta
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-700 border-gray-200">
      <CircleDashed className="h-3 w-3" />
      Pendiente
    </span>
  )
}

function SeguimientoCell({ lead }: { lead: AdminLead }) {
  if (!lead.latest_seguimiento) {
    return <span className="text-xs text-muted-foreground">Sin seguimiento</span>
  }

  const seg = lead.latest_seguimiento
  return (
    <div className="space-y-1 max-w-[200px]">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${seg.tipo === 'CONTACTO' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
          {seg.tipo === 'CONTACTO' ? 'Contacto' : 'Seguimiento'}
        </span>
        <span className="text-xs text-muted-foreground">{formatDate(seg.fecha, true)}</span>
      </div>
      <p className="text-xs text-gray-700 truncate">Agente: {seg.agent_name}</p>
      {seg.observaciones && <p className="text-xs text-muted-foreground line-clamp-2">{seg.observaciones}</p>}
    </div>
  )
}

interface SeguimientoHistorial {
  id: string
  tipo: 'CONTACTO' | 'SEGUIMIENTO'
  fecha: string
  observaciones: string | null
  agent_id: string
  agent_name: string
  created_at: string
}

function SeguimientoDialog({
  lead,
  open,
  onOpenChange,
}: {
  lead: AdminLead | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [seguimientos, setSeguimientos] = useState<SeguimientoHistorial[] | null>(null)

  useEffect(() => {
    if (!open || !lead) return
    setSeguimientos(null)
    fetch(`/api/admin/leads/${lead.id}/seguimientos`)
      .then((res) => res.json())
      .then((data) => setSeguimientos(Array.isArray(data) ? data : []))
      .catch(() => setSeguimientos([]))
  }, [open, lead])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] flex flex-col overflow-hidden p-0">
        <div className="p-4 pb-0">
          <DialogHeader>
            <DialogTitle>Historial de seguimientos</DialogTitle>
            <DialogDescription>
              {lead ? `${lead.name ?? 'Sin nombre'} · ${lead.phone ?? 'Sin teléfono'} · Agente: ${lead.assigned_agent_name ?? 'Sin asignar'}` : 'Cargando lead'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 pt-3">
          {seguimientos === null ? (
            <p className="text-sm text-muted-foreground">Cargando historial...</p>
          ) : seguimientos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay seguimientos registrados para este lead.</p>
          ) : (
            <div className="space-y-3">
              {seguimientos.map((seg, idx) => (
                <div key={seg.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${seg.tipo === 'CONTACTO' ? 'bg-blue-500' : 'bg-orange-500'}`} />
                    {idx < seguimientos.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                  </div>
                  <div className="pb-4 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${seg.tipo === 'CONTACTO' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                        {seg.tipo === 'CONTACTO' ? 'Contacto' : 'Seguimiento'}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDate(seg.fecha, true)}</span>
                      <span className="text-xs text-muted-foreground">· {seg.agent_name}</span>
                    </div>
                    {seg.observaciones && (
                      <p className="text-sm text-gray-700 bg-muted/50 rounded-md px-3 py-2">{seg.observaciones}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ChatDialog({
  lead,
  open,
  onOpenChange,
}: {
  lead: AdminLead | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [conversations, setConversations] = useState<Conversation[] | null>(null)
  const [messagesByConv, setMessagesByConv] = useState<Record<string, ChatMessage[]>>({})
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !lead) return

    fetch(`/api/admin/leads/${lead.id}/conversations`)
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setConversations(list)
        setMessagesByConv({})

        if (list.length > 0 && list[0]?.id) {
          setSelectedConvId(list[0].id)
        } else {
          setSelectedConvId(null)
        }
      })
  }, [open, lead])

  useEffect(() => {
    if (!lead || !selectedConvId) return
    if (messagesByConv[selectedConvId] !== undefined) return

    fetch(`/api/admin/leads/${lead.id}/conversations/${selectedConvId}/messages`)
      .then((res) => res.json())
      .then((data) => {
        const messages = Array.isArray(data) ? data : []
        setMessagesByConv((prev) => ({ ...prev, [selectedConvId]: messages }))
      })
  }, [lead, selectedConvId, messagesByConv])

  const loadingConversations = conversations === null
  const messages = selectedConvId ? messagesByConv[selectedConvId] : undefined
  const loadingMessages = selectedConvId ? messages === undefined : false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl w-[95vw] max-h-[90vh] flex flex-col overflow-hidden p-0">
        <div className="p-4 pb-0">
          <DialogHeader>
            <DialogTitle>Chat BOT - Cliente</DialogTitle>
            <DialogDescription>
              {lead ? `${lead.name ?? 'Sin nombre'} · ${lead.phone ?? 'Sin teléfono'} · Agente: ${lead.assigned_agent_name ?? 'Sin asignar'}` : 'Cargando lead'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4 flex-1 min-h-0 overflow-hidden p-4 pt-3">
          <div className="border rounded-md p-2 overflow-y-auto">
            {loadingConversations ? (
              <p className="text-sm text-muted-foreground p-3">Cargando conversaciones...</p>
            ) : (conversations?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground p-3">No hay conversaciones para este lead.</p>
            ) : (
              <div className="space-y-2">
                {conversations?.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`w-full text-left p-3 rounded-md border transition-colors ${selectedConvId === conv.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-muted/50'}`}
                  >
                    <p className="text-xs text-muted-foreground">{formatDate(conv.created_at, true)}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {conv.status && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border bg-gray-100 text-gray-700 border-gray-200">
                          {conv.status}
                        </span>
                      )}
                      {classificationBadge(conv.classification)}
                    </div>
                    {conv.flow_state && <p className="text-xs text-muted-foreground mt-1">Flujo: {conv.flow_state}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border rounded-md p-3 overflow-y-auto">
            {!selectedConvId ? (
              <p className="text-sm text-muted-foreground">Selecciona una conversación para ver el chat.</p>
            ) : loadingMessages ? (
              <p className="text-sm text-muted-foreground">Cargando mensajes...</p>
            ) : (messages?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">Sin mensajes en esta conversación.</p>
            ) : (
              <div className="space-y-3">
                {messages?.map((msg) => (
                  <div key={msg.id} className="space-y-2">
                    {msg.humano && (
                      <div className="flex gap-2 justify-end">
                        <div className="max-w-[75%] px-3 py-2 rounded-2xl rounded-br-sm text-sm whitespace-pre-wrap bg-blue-600 text-white">
                          {msg.humano}
                        </div>
                        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center mt-0.5">
                          <User className="h-3.5 w-3.5 text-white" />
                        </div>
                      </div>
                    )}

                    {msg.chatbot && (
                      <div className="flex gap-2 justify-start">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                          <Bot className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <div className="max-w-[75%] px-3 py-2 rounded-2xl rounded-bl-sm text-sm whitespace-pre-wrap bg-gray-100 text-gray-800">
                          {msg.chatbot}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<AdminLead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [chatLead, setChatLead] = useState<AdminLead | null>(null)
  const [seguimientoLead, setSeguimientoLead] = useState<AdminLead | null>(null)
  const [filterResultado, setFilterResultado] = useState<'ALL' | 'VENTA' | 'NO_VENTA' | 'PENDIENTE'>('ALL')
  const [filterCreadoDesde, setFilterCreadoDesde] = useState('')
  const [filterCreadoHasta, setFilterCreadoHasta] = useState('')
  const [filterSegDesde, setFilterSegDesde] = useState('')
  const [filterSegHasta, setFilterSegHasta] = useState('')
  const [sortSeguimiento, setSortSeguimiento] = useState<'asc' | 'desc' | null>(null)
  const [sortCreado, setSortCreado] = useState<'asc' | 'desc' | null>(null)

  useEffect(() => {
    fetch('/api/admin/leads')
      .then((res) => res.json())
      .then((data) => {
        setLeads(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => {
        setLeads([])
        setLoading(false)
      })
  }, [])

  const hasActiveFilters = filterResultado !== 'ALL' || filterCreadoDesde !== '' || filterCreadoHasta !== '' || filterSegDesde !== '' || filterSegHasta !== '' || sortSeguimiento !== null || sortCreado !== null

  function clearFilters() {
    setFilterResultado('ALL')
    setFilterCreadoDesde('')
    setFilterCreadoHasta('')
    setFilterSegDesde('')
    setFilterSegHasta('')
    setSortSeguimiento(null)
    setSortCreado(null)
  }

  function cycleSortCreado() {
    setSortCreado((prev) => prev === null ? 'desc' : prev === 'desc' ? 'asc' : null)
  }

  function cycleSortSeguimiento() {
    setSortSeguimiento((prev) => prev === null ? 'desc' : prev === 'desc' ? 'asc' : null)
  }

  const filteredLeads = useMemo(() => {
    const query = search.toLowerCase().trim()

    let result = leads.filter((lead) => {
      if (query && !(
        (lead.name ?? '').toLowerCase().includes(query) ||
        (lead.phone ?? '').toLowerCase().includes(query) ||
        (lead.email ?? '').toLowerCase().includes(query) ||
        (lead.classification ?? '').toLowerCase().includes(query) ||
        (lead.assigned_agent_name ?? '').toLowerCase().includes(query)
      )) return false

      if (filterResultado !== 'ALL') {
        if (filterResultado === 'PENDIENTE' && lead.resultado !== null) return false
        if (filterResultado === 'VENTA' && lead.resultado !== 'VENTA') return false
        if (filterResultado === 'NO_VENTA' && lead.resultado !== 'NO_VENTA') return false
      }

      if (filterCreadoDesde) {
        if (new Date(lead.created_at) < new Date(filterCreadoDesde)) return false
      }
      if (filterCreadoHasta) {
        const hasta = new Date(filterCreadoHasta)
        hasta.setHours(23, 59, 59, 999)
        if (new Date(lead.created_at) > hasta) return false
      }

      if (filterSegDesde || filterSegHasta) {
        if (!lead.latest_seguimiento) return false
        const segFecha = new Date(lead.latest_seguimiento.fecha)
        if (filterSegDesde && segFecha < new Date(filterSegDesde)) return false
        if (filterSegHasta) {
          const hasta = new Date(filterSegHasta)
          hasta.setHours(23, 59, 59, 999)
          if (segFecha > hasta) return false
        }
      }

      return true
    })

    if (sortSeguimiento !== null) {
      result = [...result].sort((a, b) => {
        const aFecha = a.latest_seguimiento?.fecha ?? null
        const bFecha = b.latest_seguimiento?.fecha ?? null
        if (!aFecha && !bFecha) return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        if (!aFecha) return 1
        if (!bFecha) return -1
        const diff = new Date(aFecha).getTime() - new Date(bFecha).getTime()
        return sortSeguimiento === 'asc' ? diff : -diff
      })
    }

    if (sortCreado !== null) {
      result = [...result].sort((a, b) => {
        const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        return sortCreado === 'asc' ? diff : -diff
      })
    }

    return result
  }, [leads, search, filterResultado, filterCreadoDesde, filterCreadoHasta, filterSegDesde, filterSegHasta, sortSeguimiento, sortCreado])

  const calienteCount = leads.filter((lead) => (lead.classification ?? '').toLowerCase() === 'caliente').length
  const tibioCount = leads.filter((lead) => (lead.classification ?? '').toLowerCase() === 'tibio').length
  const frioCount = leads.filter((lead) => (lead.classification ?? '').toLowerCase() === 'frio').length
  const ventasCount = leads.filter((lead) => lead.resultado === 'VENTA').length

  return (
    <div className="space-y-6">
      <SeguimientoDialog lead={seguimientoLead} open={Boolean(seguimientoLead)} onOpenChange={(open) => !open && setSeguimientoLead(null)} />
      <ChatDialog lead={chatLead} open={Boolean(chatLead)} onOpenChange={(open) => !open && setChatLead(null)} />

      <div>
        <h2 className="text-2xl font-bold tracking-tight">Leads</h2>
        <p className="text-muted-foreground text-sm">Visualiza todos los leads asignados a los agentes, su calificación BOT, seguimiento y estado de venta.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total leads</CardDescription>
            <CardTitle className="text-3xl">{leads.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Caliente</CardDescription>
            <CardTitle className="text-3xl text-red-600">{calienteCount}</CardTitle>
          </CardHeader>
          <CardContent>{classificationBadge('caliente')}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tibio</CardDescription>
            <CardTitle className="text-3xl text-amber-600">{tibioCount}</CardTitle>
          </CardHeader>
          <CardContent>{classificationBadge('tibio')}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Frío</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{frioCount}</CardTitle>
          </CardHeader>
          <CardContent>{classificationBadge('frio')}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ventas concretadas</CardDescription>
            <CardTitle className="text-3xl text-green-600">{ventasCount}</CardTitle>
          </CardHeader>
          <CardContent>{resultadoBadge('VENTA')}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por cliente, teléfono, email, clasificación o agente..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-end gap-4 pt-2 border-t">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Estado venta</span>
              <Select value={filterResultado} onValueChange={(v) => setFilterResultado(v as typeof filterResultado)}>
                <SelectTrigger className="h-8 w-[155px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="VENTA">Venta concretada</SelectItem>
                  <SelectItem value="NO_VENTA">No venta</SelectItem>
                  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Fecha creado</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={filterCreadoDesde}
                  onChange={(e) => setFilterCreadoDesde(e.target.value)}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <span className="text-muted-foreground text-sm">—</span>
                <input
                  type="date"
                  value={filterCreadoHasta}
                  onChange={(e) => setFilterCreadoHasta(e.target.value)}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <Button
                  variant={sortCreado !== null ? 'default' : 'outline'}
                  size="sm"
                  onClick={cycleSortCreado}
                  className="h-8 w-8 p-0"
                  title="Ordenar por fecha creado"
                >
                  {sortCreado === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : sortCreado === 'desc' ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUpDown className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Fecha seguimiento</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={filterSegDesde}
                  onChange={(e) => setFilterSegDesde(e.target.value)}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <span className="text-muted-foreground text-sm">—</span>
                <input
                  type="date"
                  value={filterSegHasta}
                  onChange={(e) => setFilterSegHasta(e.target.value)}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <Button
                  variant={sortSeguimiento !== null ? 'default' : 'outline'}
                  size="sm"
                  onClick={cycleSortSeguimiento}
                  className="h-8 w-8 p-0"
                  title="Ordenar por fecha de seguimiento"
                >
                  {sortSeguimiento === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : sortSeguimiento === 'desc' ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUpDown className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 gap-1.5 text-xs text-muted-foreground self-end">
                <X className="h-3.5 w-3.5" />
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-16 text-muted-foreground text-sm">Cargando leads...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Agente asignado</TableHead>
                  <TableHead>Clasificación BOT</TableHead>
                  <TableHead>Seguimiento agente</TableHead>
                  <TableHead>Venta</TableHead>

                  <TableHead>Chat</TableHead>
                  <TableHead>Creado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                      {search ? 'No hay resultados para tu búsqueda' : 'No existen leads para mostrar'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => (
                    <TableRow key={lead.id} className="hover:bg-muted/40">
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-medium">{lead.name ?? 'Sin nombre'}</p>
                          <p className="text-xs text-muted-foreground">{lead.phone ?? 'Sin teléfono'}</p>
                          {lead.email && <p className="text-xs text-muted-foreground">{lead.email}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{lead.assigned_agent_name ?? 'Sin asignar'}</TableCell>
                      <TableCell>{classificationBadge(lead.classification)}</TableCell>
                      <TableCell>
                        {lead.seguimiento_count > 0 ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSeguimientoLead(lead)}
                            className="gap-1"
                          >
                            <ClipboardList className="h-3.5 w-3.5" />
                            Ver historial
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin seguimiento</span>
                        )}
                      </TableCell>
                      <TableCell>{resultadoBadge(lead.resultado)}</TableCell>

                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setChatLead(lead)}
                          className="gap-1"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          Ver chat
                        </Button>
                        {!lead.has_chat && (
                          <p className="text-[11px] text-muted-foreground mt-1">Lead sin vínculo de chat</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(lead.created_at)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
