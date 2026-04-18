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
import { PlusCircle, Pencil, Trash2, LayoutGrid } from 'lucide-react'

interface ZoneRow {
  id: number
  integration_id: number | null
  zone_id: string | null
  name: string | null
  description: string | null
  characteristics: string[] | null
  google_maps_url: string | null
  images: string[] | null
  size_m2: number | null
  price: number | null
  monthly_payment: number | null
  lot_id: string | null
  integrations: { project_name: string | null } | null
}

const EMPTY_FORM = {
  integration_id: '', zone_id: '', name: '', description: '',
  characteristics: '', google_maps_url: '', images: '',
  size_m2: '', price: '', monthly_payment: '', lot_id: '',
}

export default function ZonasPage() {
  const [zonas, setZonas] = useState<ZoneRow[]>([])
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
    const [zonRes, empRes] = await Promise.all([
      fetch('/api/admin/zonas'),
      fetch('/api/admin/empresa'),
    ])
    setZonas(await zonRes.json())
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

  function openEdit(z: ZoneRow) {
    setForm({
      integration_id: z.integration_id != null ? String(z.integration_id) : '',
      zone_id: z.zone_id ?? '',
      name: z.name ?? '',
      description: z.description ?? '',
      characteristics: z.characteristics ? z.characteristics.join(', ') : '',
      google_maps_url: z.google_maps_url ?? '',
      images: z.images ? z.images.join(', ') : '',
      size_m2: z.size_m2 != null ? String(z.size_m2) : '',
      price: z.price != null ? String(z.price) : '',
      monthly_payment: z.monthly_payment != null ? String(z.monthly_payment) : '',
      lot_id: z.lot_id ?? '',
    })
    setEditingId(z.id)
    setError('')
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      integration_id: form.integration_id || null,
      zone_id: form.zone_id || null,
      name: form.name || null,
      description: form.description || null,
      characteristics: form.characteristics ? form.characteristics.split(',').map((s) => s.trim()).filter(Boolean) : [],
      google_maps_url: form.google_maps_url || null,
      images: form.images ? form.images.split(',').map((s) => s.trim()).filter(Boolean) : [],
      size_m2: form.size_m2 ? Number(form.size_m2) : null,
      price: form.price ? Number(form.price) : null,
      monthly_payment: form.monthly_payment ? Number(form.monthly_payment) : null,
      lot_id: form.lot_id || null,
    }

    const url = editingId ? `/api/admin/zonas/${editingId}` : '/api/admin/zonas'
    const method = editingId ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    setSaving(false)

    if (!res.ok) { setError(data.error || 'Error al guardar'); return }
    setShowModal(false)
    fetchData()
  }

  async function handleDelete(id: number) {
    await fetch(`/api/admin/zonas/${id}`, { method: 'DELETE' })
    setDeleteConfirm(null)
    fetchData()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Zonas</h2>
          <p className="text-muted-foreground text-sm">Gestiona las zonas por empresa</p>
        </div>
        <Button onClick={openCreate}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Nueva Zona
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 max-w-xs">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total zonas</CardDescription>
            <CardTitle className="text-3xl">{zonas.length}</CardTitle>
          </CardHeader>
          <CardContent><LayoutGrid className="h-4 w-4 text-muted-foreground" /></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-16 text-muted-foreground text-sm">Cargando zonas...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Zona</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>m²</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Cuota mensual</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zonas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                      No hay zonas registradas
                    </TableCell>
                  </TableRow>
                ) : zonas.map((z) => (
                  <TableRow key={z.id}>
                    <TableCell className="font-medium">{z.zone_id ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{z.name ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {z.size_m2 != null ? `${z.size_m2} m²` : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {z.price != null ? `$${z.price.toLocaleString('es-ES')}` : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {z.monthly_payment != null ? `$${z.monthly_payment.toLocaleString('es-ES')}` : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {z.integrations?.project_name ?? '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(z)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon"
                          onClick={() => setDeleteConfirm(z.id)}
                          className="text-muted-foreground hover:text-destructive">
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
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Zona' : 'Nueva Zona'}</DialogTitle>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zone_id">ID zona</Label>
                <Input id="zone_id" placeholder="Z001" value={form.zone_id}
                  onChange={(e) => setForm({ ...form, zone_id: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lot_id">ID lote asociado</Label>
                <Input id="lot_id" placeholder="L001" value={form.lot_id}
                  onChange={(e) => setForm({ ...form, lot_id: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input id="description" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size_m2">Área (m²)</Label>
                <Input id="size_m2" type="number" value={form.size_m2}
                  onChange={(e) => setForm({ ...form, size_m2: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Precio ($)</Label>
                <Input id="price" type="number" value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly_payment">Cuota mensual ($)</Label>
                <Input id="monthly_payment" type="number" value={form.monthly_payment}
                  onChange={(e) => setForm({ ...form, monthly_payment: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="characteristics">
                Características
                <span className="text-xs text-muted-foreground ml-1">(separado por comas)</span>
              </Label>
              <Input id="characteristics" value={form.characteristics}
                onChange={(e) => setForm({ ...form, characteristics: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="google_maps_url">Google Maps URL</Label>
              <Input id="google_maps_url" value={form.google_maps_url}
                onChange={(e) => setForm({ ...form, google_maps_url: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="images">
                Imágenes
                <span className="text-xs text-muted-foreground ml-1">(URLs separadas por comas)</span>
              </Label>
              <Input id="images" value={form.images}
                onChange={(e) => setForm({ ...form, images: e.target.value })} />
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
          <DialogHeader><DialogTitle>¿Eliminar zona?</DialogTitle></DialogHeader>
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
