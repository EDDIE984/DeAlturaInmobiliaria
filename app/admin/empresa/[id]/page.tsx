'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Integration, Amenity, Lot, Zone } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, PlusCircle, Pencil, Trash2 } from 'lucide-react'

// ── helpers ──────────────────────────────────────────────────────────────────

function arrToStr(arr: string[] | null | undefined) {
  return arr ? arr.join(', ') : ''
}

function strToArr(str: string): string[] {
  return str.split(',').map((s) => s.trim()).filter(Boolean)
}

// ── sub-entity CRUD panel ────────────────────────────────────────────────────

interface CrudPanelProps<T extends { id: number }> {
  title: string
  baseUrl: string
  columns: { key: keyof T; label: string }[]
  emptyForm: Partial<T>
  fields: Array<{
    key: keyof T
    label: string
    type?: 'text' | 'number' | 'checkbox' | 'url'
    placeholder?: string
    isArray?: boolean
  }>
  renderCell?: (key: keyof T, value: unknown) => React.ReactNode
}

function CrudPanel<T extends { id: number }>({
  title, baseUrl, columns, emptyForm, fields, renderCell,
}: CrudPanelProps<T>) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<Partial<T>>({ ...emptyForm })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const res = await fetch(baseUrl)
    const data = await res.json()
    setItems(data)
    setLoading(false)
  }, [baseUrl])

  useEffect(() => { fetchItems() }, [fetchItems])

  function openCreate() {
    setForm({ ...emptyForm })
    setEditingId(null)
    setError('')
    setShowModal(true)
  }

  function openEdit(item: T) {
    const f: Partial<T> = {}
    fields.forEach(({ key, isArray }) => {
      const val = item[key]
      if (isArray) {
        (f as Record<string, unknown>)[key as string] = arrToStr(val as string[])
      } else {
        (f as Record<string, unknown>)[key as string] = val ?? ''
      }
    })
    setForm(f)
    setEditingId(item.id)
    setError('')
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload: Record<string, unknown> = {}
    fields.forEach(({ key, isArray, type }) => {
      const val = (form as Record<string, unknown>)[key as string]
      if (isArray) {
        payload[key as string] = strToArr(val as string)
      } else if (type === 'number') {
        payload[key as string] = val !== '' ? Number(val) : null
      } else if (type === 'checkbox') {
        payload[key as string] = val
      } else {
        payload[key as string] = val || null
      }
    })

    const url = editingId ? `${baseUrl}/${editingId}` : baseUrl
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
    fetchItems()
  }

  async function handleDelete(id: number) {
    await fetch(`${baseUrl}/${id}`, { method: 'DELETE' })
    setDeleteConfirm(null)
    fetchItems()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{items.length} registros</span>
        <Button size="sm" onClick={openCreate}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Agregar {title}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Cargando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((c) => <TableHead key={String(c.key)}>{c.label}</TableHead>)}
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length + 1} className="text-center py-10 text-muted-foreground">
                      Sin registros
                    </TableCell>
                  </TableRow>
                ) : items.map((item) => (
                  <TableRow key={item.id}>
                    {columns.map((c) => (
                      <TableCell key={String(c.key)} className="text-sm">
                        {renderCell ? renderCell(c.key, item[c.key]) : String(item[c.key] ?? '—')}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon"
                          onClick={() => setDeleteConfirm(item.id)}
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
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? `Editar ${title}` : `Nuevo ${title}`}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            {fields.map(({ key, label, type = 'text', placeholder, isArray }) => (
              <div key={String(key)} className="space-y-1.5">
                <Label htmlFor={String(key)}>
                  {label}
                  {isArray && <span className="text-xs text-muted-foreground ml-1">(separado por comas)</span>}
                </Label>
                {type === 'checkbox' ? (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={String(key)}
                      checked={!!(form as Record<string, unknown>)[key as string]}
                      onCheckedChange={(checked) =>
                        setForm({ ...form, [key]: !!checked } as Partial<T>)
                      }
                    />
                    <Label htmlFor={String(key)} className="cursor-pointer font-normal">{label}</Label>
                  </div>
                ) : (
                  <Input
                    id={String(key)}
                    type={type === 'number' ? 'number' : 'text'}
                    placeholder={placeholder}
                    value={String((form as Record<string, unknown>)[key as string] ?? '')}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value } as Partial<T>)}
                  />
                )}
              </div>
            ))}
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
          <DialogHeader><DialogTitle>¿Eliminar registro?</DialogTitle></DialogHeader>
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

// ── main page ────────────────────────────────────────────────────────────────

export default function EmpresaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [empresa, setEmpresa] = useState<Integration | null>(null)

  useEffect(() => {
    fetch(`/api/admin/empresa/${id}`)
      .then((r) => r.json())
      .then(setEmpresa)
  }, [id])

  const base = `/api/admin/empresa/${id}`

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/empresa')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {empresa?.project_name ?? 'Empresa'}
          </h2>
          <p className="text-muted-foreground text-sm">
            {empresa?.contact_city ?? ''}{empresa?.type ? ` · ${empresa.type}` : ''}
            {empresa?.active !== undefined && (
              <Badge
                variant={empresa.active ? 'outline' : 'destructive'}
                className={`ml-2 ${empresa.active ? 'text-green-600 border-green-300' : ''}`}
              >
                {empresa.active ? 'Activa' : 'Inactiva'}
              </Badge>
            )}
          </p>
        </div>
      </div>

      <Tabs defaultValue="amenidades">
        <TabsList>
          <TabsTrigger value="amenidades">Amenidades</TabsTrigger>
          <TabsTrigger value="lotes">Lotes</TabsTrigger>
          <TabsTrigger value="zonas">Zonas</TabsTrigger>
        </TabsList>

        <TabsContent value="amenidades" className="mt-4">
          <CrudPanel<Amenity>
            title="Amenidad"
            baseUrl={`${base}/amenidades`}
            columns={[
              { key: 'amenity_id', label: 'ID' },
              { key: 'name', label: 'Nombre' },
              { key: 'description', label: 'Descripción' },
              { key: 'icon', label: 'Ícono' },
            ]}
            emptyForm={{ amenity_id: '', name: '', description: '', icon: '' }}
            fields={[
              { key: 'amenity_id', label: 'ID amenidad', placeholder: 'pool, gym...' },
              { key: 'name', label: 'Nombre' },
              { key: 'description', label: 'Descripción' },
              { key: 'icon', label: 'Ícono' },
            ]}
          />
        </TabsContent>

        <TabsContent value="lotes" className="mt-4">
          <CrudPanel<Lot>
            title="Lote"
            baseUrl={`${base}/lotes`}
            columns={[
              { key: 'lot_id', label: 'ID Lote' },
              { key: 'zone', label: 'Zona' },
              { key: 'available', label: 'Disponible' },
            ]}
            emptyForm={{ lot_id: '', zone: '', features: [], available: true, google_maps_url: '', images: [] }}
            fields={[
              { key: 'lot_id', label: 'ID lote', placeholder: 'L001' },
              { key: 'zone', label: 'Zona', placeholder: 'A, B, C...' },
              { key: 'features', label: 'Características', isArray: true, placeholder: 'vista al mar, esquinero' },
              { key: 'available', label: 'Disponible', type: 'checkbox' },
              { key: 'google_maps_url', label: 'Google Maps URL', type: 'url' },
              { key: 'images', label: 'Imágenes (URLs)', isArray: true },
            ]}
            renderCell={(key, value) => {
              if (key === 'available') {
                return (
                  <Badge variant={(value as boolean) ? 'outline' : 'destructive'}
                    className={(value as boolean) ? 'text-green-600 border-green-300' : ''}>
                    {(value as boolean) ? 'Sí' : 'No'}
                  </Badge>
                )
              }
              return String(value ?? '—')
            }}
          />
        </TabsContent>

        <TabsContent value="zonas" className="mt-4">
          <CrudPanel<Zone>
            title="Zona"
            baseUrl={`${base}/zonas`}
            columns={[
              { key: 'zone_id', label: 'ID Zona' },
              { key: 'name', label: 'Nombre' },
              { key: 'size_m2', label: 'm²' },
              { key: 'price', label: 'Precio' },
              { key: 'monthly_payment', label: 'Cuota mensual' },
            ]}
            emptyForm={{
              zone_id: '', name: '', description: '', characteristics: [],
              google_maps_url: '', images: [], size_m2: undefined,
              price: undefined, monthly_payment: undefined, lot_id: '',
            }}
            fields={[
              { key: 'zone_id', label: 'ID zona', placeholder: 'Z001' },
              { key: 'name', label: 'Nombre' },
              { key: 'description', label: 'Descripción' },
              { key: 'lot_id', label: 'ID lote asociado', placeholder: 'L001' },
              { key: 'size_m2', label: 'Área (m²)', type: 'number' },
              { key: 'price', label: 'Precio', type: 'number' },
              { key: 'monthly_payment', label: 'Cuota mensual', type: 'number' },
              { key: 'characteristics', label: 'Características', isArray: true },
              { key: 'google_maps_url', label: 'Google Maps URL', type: 'url' },
              { key: 'images', label: 'Imágenes (URLs)', isArray: true },
            ]}
            renderCell={(key, value) => {
              if (key === 'price' || key === 'monthly_payment') {
                return value != null ? `$${Number(value).toLocaleString('es-ES')}` : '—'
              }
              return String(value ?? '—')
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
