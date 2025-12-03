'use client'

import React, { useState } from 'react'
import { useCartStore } from '@/lib/store'
import { Minus, Plus, Trash2 } from 'lucide-react'

export const CartList = () => {
  const { items, updateQuantity, removeItem, updateItem } = useCartStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<'name' | 'price' | null>(
    null
  )
  const [editValue, setEditValue] = useState<string>('')

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <p>Your cart is empty.</p>
        <p className="text-sm">Scan a price tag to start!</p>
      </div>
    )
  }

  const handleStartEdit = (
    id: string,
    field: 'name' | 'price',
    currentValue: string | number
  ) => {
    setEditingId(id)
    setEditingField(field)
    setEditValue(currentValue.toString())
  }

  const handleSaveEdit = () => {
    if (!editingId || !editingField) return

    if (editingField === 'name') {
      updateItem(editingId, { name: editValue })
    } else if (editingField === 'price') {
      const numericValue = parseInt(editValue.replace(/[^0-9]/g, ''), 10)
      if (!isNaN(numericValue)) {
        updateItem(editingId, { price: numericValue })
      }
    }

    setEditingId(null)
    setEditingField(null)
    setEditValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      setEditingId(null)
      setEditingField(null)
      setEditValue('')
    }
  }

  return (
    <div className="space-y-4 pb-24">
      {items.map(item => (
        <div
          key={item.id}
          className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-100"
        >
          <div className="flex-1 mr-3">
            {editingId === item.id && editingField === 'name' ? (
              <input
                type="text"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={handleKeyDown}
                autoFocus
                className="w-full font-medium text-gray-900 border border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <h3
                className="font-medium text-gray-900 cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -mx-2 transition-colors"
                onClick={() => handleStartEdit(item.id, 'name', item.name)}
              >
                {item.name}
              </h3>
            )}

            {editingId === item.id && editingField === 'price' ? (
              <input
                type="text"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={handleKeyDown}
                autoFocus
                className="w-32 text-blue-600 font-bold border border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p
                className="text-blue-600 font-bold cursor-pointer hover:bg-blue-50 rounded px-2 py-1 -mx-2 inline-block transition-colors"
                onClick={() => handleStartEdit(item.id, 'price', item.price)}
              >
                {item.price.toLocaleString()}원
              </p>
            )}
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
