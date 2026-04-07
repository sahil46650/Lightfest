'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { UserTable } from '@/components/admin/user-table'
import { UserEditModal } from '@/components/admin/user-edit-modal'
import { Search, X } from 'lucide-react'

interface User {
  id: string
  name?: string
  email: string
  phone?: string
  role: string
  createdAt: string
  _count?: {
    bookings: number
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [searchQuery, roleFilter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (roleFilter !== 'all') params.append('role', roleFilter)

      const response = await fetch(`/api/admin/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
  }

  const handleSave = async (userId: string, data: Partial<User>) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (response.ok) {
        const updated = await response.json()
        setUsers(users.map(u => (u.id === userId ? updated.user : u)))
      }
    } catch (error) {
      console.error('Failed to update user:', error)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId))
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setRoleFilter('all')
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-600 mt-1">
          Manage user accounts and permissions
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4"
              />
            </div>
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-magenta-500"
          >
            <option value="all">All Roles</option>
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>

          {/* Clear Button */}
          {(searchQuery || roleFilter !== 'all') && (
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="gap-2"
            >
              <X size={16} />
              Clear
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {(searchQuery || roleFilter !== 'all') && (
          <div className="text-sm text-gray-600">
            Showing results
            {searchQuery && ` for "${searchQuery}"`}
            {searchQuery && roleFilter !== 'all' && ' with'}
            {roleFilter !== 'all' && ` role: ${roleFilter}`}
          </div>
        )}
      </div>

      {/* Users Table */}
      {loading ? (
        <Card className="p-12">
          <div className="text-center text-gray-500">Loading users...</div>
        </Card>
      ) : (
        <UserTable
          users={users}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* User Count */}
      <div className="text-sm text-gray-600">
        Showing {users.length} user{users.length !== 1 ? 's' : ''}
      </div>

      {/* Edit Modal */}
      <UserEditModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onSave={handleSave}
      />
    </div>
  )
}
