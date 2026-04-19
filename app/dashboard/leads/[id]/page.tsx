'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MessageSquare, User, ChevronDown, ChevronUp, Bot, ClipboardList } from 'lucide-react'

interface Lead {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  motivation: string | null
  can_pay_entry: boolean | null
  can_pay_monthly: boolean | null
  zone_interest: string | null
  source: string | null
  notes: string | null
  classification: string | null
  resultado: string | null
  created_at: string
  remotejid: string | null
  id_conversations: string | null
  modificacion_at: string | null
}

interface Conversation {
  id: string
  phone: string | null
  status: string | null
  classification: string | null
  flow_state: string | null
  lead_created: boolean | null
  created_at: string
  motivacion: string | null
  entrada: string | null
  cuota: string | null
}

interface ChatMessage {
  id: string
  humano: string | null
  chatbot: string | null
  created_at: string
}

interface Seguimiento {
  id: string
  tipo: 'CONTACTO' | 'SEGUIMIENTO'
  fecha: string
  observaciones: string | null
  created_at: string
}

const CLASSIFICATION_COLORS: Record<string, string> = {
  caliente: 'bg-red-100 text-red-700 border-red-200',
  tibio: 'bg-orange-100 text-orange-700 border-orange-200',
  frio: 'bg-blue-100 text-blue-700 border-blue-200',
}

const RESULTADO_COLORS: Record<string, string> = {
  VENTA: 'bg-green-100 text-green-700 border-green-200',
  NO_VENTA: 'bg-red-100 text-red-700 border-red-200',
}

function classificationBadge(v: string | null) {
  const key = (v ?? '').toLowerCase()
  const cls = CLASSIFICATION_COLORS[key] ?? 'bg-gray-100 text-gray-600 border-gray-200'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>{v ?? '—'}</span>
}

function resultadoBadge(resultado: string | null) {
  if (!resultado) return null
  const cls = RESULTADO_COLORS[resultado] ?? 'bg-gray-100 text-gray-600 border-gray-200'
  const label = resultado === 'VENTA' ? 'Venta' : 'No venta'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>{label}</span>
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value ?? '—'}</p>
    </div>
  )
}

function BoolField({ label, value }: { label: string; value: boolean | null }) {
  if (value === null) return <Field label={label} value="—" />
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${value ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
        {value ? 'Sí' : 'No'}
      </span>
    </div>
  )
}

function ChatViewer({ leadId, convId }: { leadId: string; convId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/dashboard/leads/${leadId}/conversations/${convId}/messages`)
      .then((r) => r.json())
      .then((data) => { setMessages(Array.isArray(data) ? data : []); setLoading(false) })
  }, [leadId, convId])

  if (loading) return <div className="py-6 text-center text-sm text-muted-foreground">Cargando chat...</div>
  if (messages.length === 0) return <div className="py-6 text-center text-sm text-muted-foreground">Sin mensajes</div>

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto px-1 py-2">
      {messages.map((m) => (
        <div key={m.id} className="space-y-2">
          {m.humano && (
            <div className="flex gap-2 justify-end">
              <div className="max-w-[75%] px-3 py-2 rounded-2xl rounded-br-sm text-sm whitespace-pre-wrap bg-blue-600 text-white">
                {m.humano}
              </div>
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center mt-0.5">
                <User className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
          )}
          {m.chatbot && (
            <div className="flex gap-2 justify-start">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                <Bot className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div className="max-w-[75%] px-3 py-2 rounded-2xl rounded-bl-sm text-sm whitespace-pre-wrap bg-gray-100 text-gray-800">
                {m.chatbot}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ConversationCard({ conv, leadId }: { conv: Conversation; leadId: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-muted/40 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {conv.status && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-700 border-gray-200">
              {conv.status}
            </span>
          )}
          {classificationBadge(conv.classification)}
          {conv.flow_state && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-purple-100 text-purple-700 border-purple-200">
              {conv.flow_state}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{formatDate(conv.created_at)}</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
      </button>

      {open && (
        <div className="border-t">
          {(conv.motivacion || conv.entrada || conv.cuota) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-4 py-3 bg-muted/20 border-b">
              {conv.motivacion && <div className="space-y-0.5"><p className="text-xs text-muted-foreground">Motivación</p><p className="text-sm">{conv.motivacion}</p></div>}
              {conv.entrada && <div className="space-y-0.5"><p className="text-xs text-muted-foreground">Entrada</p><p className="text-sm">{conv.entrada}</p></div>}
              {conv.cuota && <div className="space-y-0.5"><p className="text-xs text-muted-foreground">Cuota</p><p className="text-sm">{conv.cuota}</p></div>}
            </div>
          )}
          <div className="px-4 py-3">
            <ChatViewer leadId={leadId} convId={conv.id} />
          </div>
        </div>
      )}
    </div>
  )
}

function SeguimientoItem({ seg }: { seg: Seguimiento }) {
  const isContacto = seg.tipo === 'CONTACTO'
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${isContacto ? 'bg-blue-500' : 'bg-orange-500'}`} />
        <div className="w-px flex-1 bg-border mt-1" />
      </div>
      <div className="pb-4 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${isContacto ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
            {isContacto ? 'Contacto' : 'Seguimiento'}
          </span>
          <span className="text-xs text-muted-foreground">{formatDate(seg.fecha)}</span>
        </div>
        {seg.observaciones && (
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{seg.observaciones}</p>
        )}
      </div>
    </div>
  )
}

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [lead, setLead] = useState<Lead | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/dashboard/leads/${id}`).then((r) => r.json()),
      fetch(`/api/dashboard/leads/${id}/conversations`).then((r) => r.json()),
      fetch(`/api/dashboard/leads/${id}/seguimientos`).then((r) => r.json()),
    ]).then(([leadData, convData, segData]) => {
      setLead(leadData?.error ? null : leadData)
      setConversations(Array.isArray(convData) ? convData : [])
      setSeguimientos(Array.isArray(segData) ? segData : [])
      setLoading(false)
    })
  }, [id])

  if (loading) return <div className="text-center py-16 text-muted-foreground text-sm">Cargando...</div>

  if (!lead) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-1" /> Volver</Button>
        <p className="text-muted-foreground">Lead no encontrado.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-1" /> Volver</Button>
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-2xl font-bold tracking-tight">{lead.name ?? 'Sin nombre'}</h2>
          {resultadoBadge(lead.resultado)}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> Información del lead</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          <Field label="Nombre" value={lead.name} />
          <Field label="Teléfono" value={lead.phone} />
          <Field label="Email" value={lead.email} />
          <div className="space-y-0.5"><p className="text-xs text-muted-foreground">Clasificación chatbot</p><div>{classificationBadge(lead.classification)}</div></div>
          <Field label="Fuente" value={lead.source} />
          <Field label="Zona de interés" value={lead.zone_interest} />
          <BoolField label="Puede pagar entrada" value={lead.can_pay_entry} />
          <BoolField label="Puede pagar cuota" value={lead.can_pay_monthly} />
          <Field label="Motivación" value={lead.motivation} />
          <Field label="Notas" value={lead.notes} />
          <Field label="Creado" value={formatDate(lead.created_at)} />
          <Field label="Modificado" value={formatDate(lead.modificacion_at)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4" /> Historial de gestión ({seguimientos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {seguimientos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Sin gestiones registradas</p>
          ) : (
            <div className="mt-1">
              {seguimientos.map((seg) => (
                <SeguimientoItem key={seg.id} seg={seg} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Conversaciones ({conversations.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No hay conversaciones registradas</p>
          ) : conversations.map((c) => (
            <ConversationCard key={c.id} conv={c} leadId={id} />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
