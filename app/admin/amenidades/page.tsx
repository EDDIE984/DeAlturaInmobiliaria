'use client'

import { useEffect, useState } from 'react'
import { Integration } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PlusCircle, Pencil, Trash2, Sparkles } from 'lucide-react'

interface AmenityRow {
  id: number
  integration_id: number | null
  amenity_id: string | null
  name: string | null
  description: string | null
  icon: string | null
  integrations: { project_name: string | null } | null
}

const EMPTY_FORM = { integration_id: '', amenity_id: '', name: '', description: '', icon: '' }

export default function AmenidadesPage() {
  const [amenidades, setAmenidades] = useState<AmenityRow[]>([])
  const [empresas, setEmpresas] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  async function fetchData() {
    setLoading(true)
    const [amenRes, empRes] = await Promise.all([
      fetch('/api/admin/amenidades'),
      fetch('/api/admin/empresa'),
    ])
    setAmenidades(await amenRes.json())
    setEmpresas(await empRes.json())
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  function openCreate() {
    setForm({ ...EMPTY_FORM })
    setEditingId(null)
    setError('')
    setShowModal(true)
  }

  function openEdit(a: AmenityRow) {
    setForm({
      integration_id: a.integration_id != null ? String(a.integration_id) : '',
      amenity_id: a.amenity_id ?? '',
      name: a.name ?? '',
      description: a.description ?? '',
      icon: a.icon ?? '',
    })
    setEditingId(a.id)
    setError('')
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const url = editingId ? `/api/admin/amenidades/${editingId}` : '/api/admin/amenidades'
    const method = editingId ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)

    if (!res.ok) { setError(data.error || 'Error al guardar'); return }
    setShowModal(false)
    fetchData()
  }

  async function handleDelete(id: number) {
    await fetch(`/api/admin/amenidades/${id}`, { method: 'DELETE' })
    setDeleteConfirm(null)
    fetchData()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Amenidades</h2>
          <p className="text-muted-foreground text-sm">Gestiona las amenidades por empresa</p>
        </div>
        <Button onClick={openCreate}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Nueva Amenidad
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 max-w-xs">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total amenidades</CardDescription>
            <CardTitle className="text-3xl">{amenidades.length}</CardTitle>
          </CardHeader>
          <CardContent><Sparkles className="h-4 w-4 text-muted-foreground" /></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-16 text-muted-foreground text-sm">Cargando amenidades...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>ID Amenidad</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Ícono</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {amenidades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                      No hay amenidades registradas
                    </TableCell>
                  </TableRow>
                ) : amenidades.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{a.amenity_id ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-48 truncate">{a.description ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{a.icon ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {a.integrations?.project_name ?? '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(a)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirm(a.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Amenidad' : 'Nueva Amenidad'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select
                value={form.integration_id !== '' ? form.integration_id : 'none'}
                onValueChange={(val) => setForm({ ...form, integration_id: val === 'none' || val == null ? '' : val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empresa..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin empresa</SelectItem>
                  {empresas.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.project_name ?? String(e.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amenity_id">ID amenidad</Label>
              <Input
                id="amenity_id"
                placeholder="pool, gym, parking..."
                value={form.amenity_id}
                onChange={(e) => setForm({ ...form, amenity_id: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                placeholder="Piscina, Gimnasio..."
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Ícono</Label>
              <Input
                id="icon"
                placeholder="nombre del ícono o URL"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
              />
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
          <DialogHeader><DialogTitle>¿Eliminar amenidad?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Esta acción no se puede deshacer.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteConfirm !== null && handleDelete(deleteConfirm)}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
