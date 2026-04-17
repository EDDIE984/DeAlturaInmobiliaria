'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

interface Props {
  name: string
}

const NAV_ITEMS = [
  { label: 'Usuarios', href: '/admin/usuarios' },
]

export default function AdminSidebar({ name }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside className="w-60 bg-white shadow-sm flex flex-col">
      <div className="px-6 py-5 border-b border-gray-100">
        <h1 className="font-bold text-gray-900 text-lg">De Altura</h1>
        <p className="text-xs text-gray-400 mt-0.5">Panel Administrativo</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith(item.href)
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <div className="px-3 mb-3">
          <p className="text-xs text-gray-400">Sesión activa</p>
          <p className="text-sm font-medium text-gray-700 truncate">{name}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
