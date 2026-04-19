'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Separator } from '@/components/ui/separator'
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

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside className="w-60 bg-white border-r flex flex-col h-screen sticky top-0">
      <div className="px-6 py-5">
        <h1 className="font-bold text-lg text-gray-900">De Altura</h1>
        <span className="text-xs text-gray-400">Panel Administrativo</span>
      </div>

      <Separator />

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? 'text-blue-600' : 'text-gray-400'}`} strokeWidth={1.8} />
              {label}
            </Link>
          )
        })}
      </nav>

      <Separator />

      <div className="px-4 py-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-400 border border-red-300 bg-white hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.8} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  )
}
