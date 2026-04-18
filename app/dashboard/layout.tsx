import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import UserSidebar from '@/components/UserSidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || session.role === 'admin') redirect('/login')

  return (
    <div className="min-h-screen flex bg-gray-100">
      <UserSidebar />
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
