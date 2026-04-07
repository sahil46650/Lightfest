'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Minus, Plus } from 'lucide-react'

interface QuantitySelectorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}

const QuantitySelector = React.forwardRef<
  HTMLDivElement,
  QuantitySelectorProps
>(
  (
    { className, value, onChange, min = 0, max = 40, step = 1, ...props },
    ref
  ) => {
    const handleMinus = () => {
      const newValue = Math.max(min, value - step)
      onChange(newValue)
    }

    const handlePlus = () => {
      const newValue = Math.min(max, value + step)
      onChange(newValue)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value, 10)
      if (!isNaN(newValue)) {
        const clampedValue = Math.max(min, Math.min(max, newValue))
        onChange(clampedValue)
      }
    }

    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-2', className)}
        {...props}
      >
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleMinus}
          disabled={value <= min}
          aria-label="Decrease quantity"
          className="h-10 w-10"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <Input
          type="number"
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          className="h-10 w-16 text-center"
          aria-label="Quantity"
        />

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handlePlus}
          disabled={value >= max}
          aria-label="Increase quantity"
          className="h-10 w-10"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    )
  }
)

QuantitySelector.displayName = 'QuantitySelector'

export { QuantitySelector }
