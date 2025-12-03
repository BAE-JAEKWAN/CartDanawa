'use client'

import React from 'react'
import { useCartStore } from '@/lib/store'

export const TotalBar = () => {
  const total = useCartStore(state => state.total())
  const itemCount = useCartStore(state => state.items.length)

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Total ({itemCount} items)</p>
          <p className="text-2xl font-bold text-gray-900">
            {total.toLocaleString()}원
          </p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition-colors">
          Checkout
        </button>
      </div>
    </div>
  )
}
