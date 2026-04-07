import { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface StatsCardProps {
  icon: LucideIcon
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'blue' | 'magenta' | 'green' | 'orange'
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600',
  magenta: 'bg-magenta-50 text-magenta-600',
  green: 'bg-green-50 text-green-600',
  orange: 'bg-orange-50 text-orange-600',
}

export function StatsCard({
  icon: Icon,
  title,
  value,
  subtitle,
  trend,
  color = 'blue',
}: StatsCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={`text-xs font-semibold ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '+' : '-'}{trend.value}%
              </span>
              <span className="text-xs text-gray-500">vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </Card>
  )
}
