'use client'

import { useEffect, useState } from 'react'
import { Integration } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
import { PlusCircle, Pencil, Trash2, MapPin } from 'lucide-react'

interface LotRow {
  id: number
  integration_id: number | null
  lot_id: string | null
  zone: string | null
  features: string[] | null
  available: boolean | null
  google_maps_url: string | null
  images: string[] | null
  integrations: { project_name: string | null } | null
}

const EMPTY_FORM = {
  integration_id: '', lot_id: '', zone: '', features: '',
  available: true, google_maps_url: '', images: '',
}

export default function LotesPage() {
  const [lotes, setLotes] = useState<LotRow[]>([])
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
    const [lotRes, empRes] = await Promise.all([
      fetch('/api/admin/lotes'),
      fetch('/api/admin/empresa'),
    ])
    setLotes(await lotRes.json())
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

  function openEdit(l: LotRow) {
    setForm({
      integration_id: l.integration_id != null ? String(l.integration_id) : '',
      lot_id: l.lot_id ?? '',
      zone: l.zone ?? '',
      features: l.features ? l.features.join(', ') : '',
      available: l.available ?? true,
      google_maps_url: l.google_maps_url ?? '',
      images: l.images ? l.images.join(', ') : '',
    })
    setEditingId(l.id)
    setError('')
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      integration_id: form.integration_id || null,
      lot_id: form.lot_id || null,
      zone: form.zone || null,
      features: form.features ? form.features.split(',').map((s) => s.trim()).filter(Boolean) : [],
      available: form.available,
      google_maps_url: form.google_maps_url || null,
      images: form.images ? form.images.split(',').map((s) => s.trim()).filter(Boolean) : [],
    }

    const url = editingId ? `/api/admin/lotes/${editingId}` : '/api/admin/lotes'
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
    await fetch(`/api/admin/lotes/${id}`, { method: 'DELETE' })
    setDeleteConfirm(null)
    fetchData()
  }

  const availableCount = lotes.filter((l) => l.available).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Lotes</h2>
          <p className="text-muted-foreground text-sm">Gestiona los lotes por empresa</p>
        </div>
        <Button onClick={openCreate}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Nuevo Lote
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total lotes</CardDescription>
            <CardTitle className="text-3xl">{lotes.length}</CardTitle>
          </CardHeader>
          <CardContent><MapPin className="h-4 w-4 text-muted-foreground" /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Disponibles</CardDescription>
            <CardTitle className="text-3xl text-green-600">{availableCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="text-green-600">Disponibles</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-16 text-muted-foreground text-sm">Cargando lotes...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Lote</TableHead>
                  <TableHead>Zona</TableHead>
                  <TableHead>Características</TableHead>
                  <TableHead>Disponible</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                      No hay lotes registrados
                    </TableCell>
                  </TableRow>
                ) : lotes.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.lot_id ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{l.zone ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-48 truncate">
                      {l.features?.join(', ') ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={l.available ? 'outline' : 'destructive'}
                        className={l.available ? 'text-green-600 border-green-300' : ''}>
                        {l.available ? 'Sí' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {l.integrations?.project_name ?? '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(l)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon"
                          onClick={() => setDeleteConfirm(l.id)}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Lote' : 'Nuevo Lote'}</DialogTitle>
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
              <Label htmlFor="lot_id">ID lote</Label>
              <Input id="lot_id" placeholder="L001" value={form.lot_id}
                onChange={(e) => setForm({ ...form, lot_id: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zone">Zona</Label>
              <Input id="zone" placeholder="A, B, C..." value={form.zone}
                onChange={(e) => setForm({ ...form, zone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="features">
                Características
                <span className="text-xs text-muted-foreground ml-1">(separado por comas)</span>
              </Label>
              <Input id="features" placeholder="vista al mar, esquinero" value={form.features}
                onChange={(e) => setForm({ ...form, features: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="available"
                checked={form.available}
                onCheckedChange={(checked) => setForm({ ...form, available: !!checked })}
              />
              <Label htmlFor="available" className="cursor-pointer">Disponible</Label>
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
          <DialogHeader><DialogTitle>¿Eliminar lote?</DialogTitle></DialogHeader>
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
