import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import authOptions from '@/lib/auth/config'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'
import { prisma } from '@/lib/prisma'
import { ReactNode } from 'react'

interface AdminLayoutProps {
  children: ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getServerSession(authOptions)

  // Check if user is authenticated and has admin role
  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    redirect('/')
  }

  // Get pending emails count
  const pendingEmailsCount = await prisma.emailLog.count({
    where: { status: 'PENDING' },
  })

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col md:ml-0">
        <AdminHeader
          user={session.user}
          pendingEmailsCount={pendingEmailsCount}
        />
        <main className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
