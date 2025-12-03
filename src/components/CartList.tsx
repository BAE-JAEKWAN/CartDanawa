'use client'

import React from 'react'
import { useCartStore } from '@/lib/store'
import { Minus, Plus, Trash2 } from 'lucide-react'

export const CartList = () => {
  const { items, updateQuantity, removeItem } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <p>Your cart is empty.</p>
        <p className="text-sm">Scan a price tag to start!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-24">
      {items.map(item => (
        <div
          key={item.id}
          className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-100"
        >
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{item.name}</h3>
            <p className="text-blue-600 font-bold">
              {item.price.toLocaleString()}원
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
              <button
                onClick={() => updateQuantity(item.id, -1)}
                className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4 text-gray-600" />
              </button>
              <span className="w-6 text-center text-sm font-medium">
                {item.quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.id, 1)}
                className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            <button
              onClick={() => removeItem(item.id)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              aria-label="Remove item"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
