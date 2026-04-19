'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, MessageSquare, Bot, User, CalendarDays, CheckCircle2, CircleDashed } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
    <div className="space-y-1 min-w-[220px]">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${seg.tipo === 'CONTACTO' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
          {seg.tipo === 'CONTACTO' ? 'Contacto' : 'Seguimiento'}
        </span>
        <span className="text-xs text-muted-foreground">{formatDate(seg.fecha, true)}</span>
      </div>
      <p className="text-xs text-gray-700">Agente: {seg.agent_name}</p>
      {seg.observaciones && <p className="text-xs text-muted-foreground">{seg.observaciones}</p>}
    </div>
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
      <DialogContent className="max-w-5xl w-[95vw]">
        <DialogHeader>
          <DialogTitle>Chat BOT - Cliente</DialogTitle>
          <DialogDescription>
            {lead ? `${lead.name ?? 'Sin nombre'} · ${lead.phone ?? 'Sin teléfono'} · Agente: ${lead.assigned_agent_name ?? 'Sin asignar'}` : 'Cargando lead'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 h-[65vh]">
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

  const filteredLeads = useMemo(() => {
    const query = search.toLowerCase().trim()
    if (!query) return leads

    return leads.filter((lead) => {
      return (
        (lead.name ?? '').toLowerCase().includes(query) ||
        (lead.phone ?? '').toLowerCase().includes(query) ||
        (lead.email ?? '').toLowerCase().includes(query) ||
        (lead.classification ?? '').toLowerCase().includes(query) ||
        (lead.assigned_agent_name ?? '').toLowerCase().includes(query)
      )
    })
  }, [leads, search])

  const calienteCount = leads.filter((lead) => (lead.classification ?? '').toLowerCase() === 'caliente').length
  const tibioCount = leads.filter((lead) => (lead.classification ?? '').toLowerCase() === 'tibio').length
  const frioCount = leads.filter((lead) => (lead.classification ?? '').toLowerCase() === 'frio').length
  const ventasCount = leads.filter((lead) => lead.resultado === 'VENTA').length

  return (
    <div className="space-y-6">
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
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por cliente, teléfono, email, clasificación o agente..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
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
                  <TableHead>Interés</TableHead>
                  <TableHead>Chat</TableHead>
                  <TableHead>Creado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
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
                        <SeguimientoCell lead={lead} />
                        {lead.seguimiento_count > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">{lead.seguimiento_count} gestiones registradas</p>
                        )}
                      </TableCell>
                      <TableCell>{resultadoBadge(lead.resultado)}</TableCell>
                      <TableCell>
                        <div className="space-y-0.5 text-xs text-muted-foreground min-w-[140px]">
                          <p>Zona: {lead.zone_interest ?? '—'}</p>
                          <p>Fuente: {lead.source ?? '—'}</p>
                        </div>
                      </TableCell>
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
