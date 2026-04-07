'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

interface User {
  id: string
  name?: string
  email: string
  role: string
  createdAt: string
  _count?: {
    bookings: number
  }
}

interface UserTableProps {
  users: User[]
  onEdit?: (user: User) => void
  onDelete?: (userId: string) => void
}

const roleColors: Record<string, string> = {
  USER: 'bg-blue-100 text-blue-800',
  ADMIN: 'bg-purple-100 text-purple-800',
  SUPER_ADMIN: 'bg-red-100 text-red-800',
}

const roleDescriptions: Record<string, string> = {
  USER: 'Regular user',
  ADMIN: 'Can manage events and bookings',
  SUPER_ADMIN: 'Full system access',
}

export function UserTable({ users, onEdit, onDelete }: UserTableProps) {
  if (users.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <p className="text-gray-500 text-lg">No users found</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-4 px-6 font-semibold text-gray-700">
                Name
              </th>
              <th className="text-left py-4 px-6 font-semibold text-gray-700">
                Email
              </th>
              <th className="text-left py-4 px-6 font-semibold text-gray-700">
                Role
              </th>
              <th className="text-left py-4 px-6 font-semibold text-gray-700">
                Bookings
              </th>
              <th className="text-left py-4 px-6 font-semibold text-gray-700">
                Joined
              </th>
              <th className="text-center py-4 px-6 font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr
                key={user.id}
                className={`border-b border-gray-100 hover:bg-gray-50 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                }`}
              >
                <td className="py-4 px-6">
                  <p className="font-medium text-gray-900">{user.name || '-'}</p>
                </td>
                <td className="py-4 px-6 text-gray-700">{user.email}</td>
                <td className="py-4 px-6">
                  <div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        roleColors[user.role] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.role}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {roleDescriptions[user.role]}
                    </p>
                  </div>
                </td>
                <td className="py-4 px-6 text-gray-700">
                  {user._count?.bookings || 0}
                </td>
                <td className="py-4 px-6 text-gray-700">
                  {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit?.(user)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete?.(user.id)}
                      className="text-red-600 hover:bg-red-100"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
