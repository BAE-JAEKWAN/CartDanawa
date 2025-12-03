import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

interface CartState {
  items: CartItem[]
  addItem: (name: string, price: number) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, delta: number) => void
  updateItem: (id: string, updates: Partial<CartItem>) => void
  clearCart: () => void
  total: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (name, price) =>
        set(state => ({
          items: [
            ...state.items,
            {
              id: Math.random().toString(36).substring(7),
              name: name || 'Unknown Item',
              price: price || 0,
              quantity: 1,
            },
          ],
        })),
      removeItem: id =>
        set(state => ({
          items: state.items.filter(item => item.id !== id),
        })),
      updateQuantity: (id, delta) =>
        set(state => ({
          items: state.items.map(item => {
            if (item.id === id) {
              const newQuantity = Math.max(1, item.quantity + delta)
              return { ...item, quantity: newQuantity }
            }
            return item
          }),
        })),
      updateItem: (id, updates) =>
        set(state => ({
          items: state.items.map(item =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),
      clearCart: () => set({ items: [] }),
      total: () => {
        return get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        )
      },
    }),
    {
      name: 'cart-storage',
    }
  )
)
