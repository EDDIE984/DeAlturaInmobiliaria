'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Integration } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PlusCircle, Pencil, Trash2, Building2, Eye } from 'lucide-react'

const EMPTY_FORM = {
  project_name: '', type: '', active: true, location: '', contact_city: '',
  contact_phone: '', contact_whatsapp: '', contact_email: '', nombre_robot: '',
  project_slogan: '', project_description: '', contact_office_name: '',
  contact_address: '', contact_schedule: '', contact_google_maps_url: '',
}

export default function EmpresaPage() {
  const router = useRouter()
  const [empresas, setEmpresas] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  async function fetchEmpresas() {
    setLoading(true)
    const res = await fetch('/api/admin/empresa')
    const data = await res.json()
    setEmpresas(data)
    setLoading(false)
  }

  useEffect(() => { fetchEmpresas() }, [])

  function openCreate() {
    setForm({ ...EMPTY_FORM })
    setEditingId(null)
    setError('')
    setShowModal(true)
  }

  function openEdit(e: Integration) {
    setForm({
      project_name: e.project_name ?? '',
      type: e.type ?? '',
      active: e.active ?? true,
      location: e.location ?? '',
      contact_city: e.contact_city ?? '',
      contact_phone: e.contact_phone ?? '',
      contact_whatsapp: e.contact_whatsapp ?? '',
      contact_email: e.contact_email ?? '',
      nombre_robot: e.nombre_robot ?? '',
      project_slogan: e.project_slogan ?? '',
      project_description: e.project_description ?? '',
      contact_office_name: e.contact_office_name ?? '',
      contact_address: e.contact_address ?? '',
      contact_schedule: e.contact_schedule ?? '',
      contact_google_maps_url: e.contact_google_maps_url ?? '',
    })
    setEditingId(e.id)
    setError('')
    setShowModal(true)
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setSaving(true)
    setError('')

    const url = editingId ? `/api/admin/empresa/${editingId}` : '/api/admin/empresa'
    const method = editingId ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, active: form.active }),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(data.error || 'Error al guardar')
      return
    }

    setShowModal(false)
    fetchEmpresas()
  }

  async function handleDelete(id: number) {
    await fetch(`/api/admin/empresa/${id}`, { method: 'DELETE' })
    setDeleteConfirm(null)
    fetchEmpresas()
  }

  const activeCount = empresas.filter((e) => e.active).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Empresa</h2>
          <p className="text-muted-foreground text-sm">Gestiona las integraciones de proyectos</p>
        </div>
        <Button onClick={openCreate}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Nueva Empresa
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total empresas</CardDescription>
            <CardTitle className="text-3xl">{empresas.length}</CardTitle>
          </CardHeader>
          <CardContent><Building2 className="h-4 w-4 text-muted-foreground" /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Activas</CardDescription>
            <CardTitle className="text-3xl text-green-600">{activeCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="text-green-600">Activas</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-16 text-muted-foreground text-sm">Cargando empresas...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Robot</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empresas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                      No hay empresas registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  empresas.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.project_name ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{e.type ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{e.contact_city ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{e.nombre_robot ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={e.active ? 'outline' : 'destructive'}
                          className={e.active ? 'text-green-600 border-green-300' : ''}>
                          {e.active ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/admin/empresa/${e.id}`)}
                            title="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(e)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirm(e.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* Modal crear/editar */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Empresa' : 'Nueva Empresa'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project_name">Nombre del proyecto *</Label>
                <Input id="project_name" value={form.project_name}
                  onChange={(e) => setForm({ ...form, project_name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Input id="type" placeholder="inmobiliaria, constructora..." value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project_slogan">Slogan</Label>
                <Input id="project_slogan" value={form.project_slogan}
                  onChange={(e) => setForm({ ...form, project_slogan: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nombre_robot">Nombre del robot</Label>
                <Input id="nombre_robot" value={form.nombre_robot}
                  onChange={(e) => setForm({ ...form, nombre_robot: e.target.value })} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="project_description">Descripción</Label>
                <Input id="project_description" value={form.project_description}
                  onChange={(e) => setForm({ ...form, project_description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <Input id="location" value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_city">Ciudad</Label>
                <Input id="contact_city" value={form.contact_city}
                  onChange={(e) => setForm({ ...form, contact_city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Teléfono</Label>
                <Input id="contact_phone" value={form.contact_phone}
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_whatsapp">WhatsApp</Label>
                <Input id="contact_whatsapp" value={form.contact_whatsapp}
                  onChange={(e) => setForm({ ...form, contact_whatsapp: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">Correo contacto</Label>
                <Input id="contact_email" type="email" value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_office_name">Oficina</Label>
                <Input id="contact_office_name" value={form.contact_office_name}
                  onChange={(e) => setForm({ ...form, contact_office_name: e.target.value })} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="contact_address">Dirección</Label>
                <Input id="contact_address" value={form.contact_address}
                  onChange={(e) => setForm({ ...form, contact_address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_schedule">Horario</Label>
                <Input id="contact_schedule" placeholder="Lun-Vie 9:00-18:00" value={form.contact_schedule}
                  onChange={(e) => setForm({ ...form, contact_schedule: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_google_maps_url">Google Maps URL</Label>
                <Input id="contact_google_maps_url" value={form.contact_google_maps_url}
                  onChange={(e) => setForm({ ...form, contact_google_maps_url: e.target.value })} />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Eliminar empresa?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Esta acción eliminará la empresa y no se puede deshacer.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteConfirm !== null && handleDelete(deleteConfirm)}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
