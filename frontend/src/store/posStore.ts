import { create } from 'zustand'
import { offlineDB, OfflineOrder } from '../services/db'

export interface CartItem {
  id: string // menu_item_id + variant suffix
  menu_item_id: string
  name: string
  price: number
  quantity: number
  variant_name?: string
}

interface POSState {
  cart: CartItem[]
  isOnline: boolean
  syncing: boolean
  offlineQueueCount: number
  selectedTableId: string | null
  discountTotal: number
  taxRate: number // default GST 5% (CGST 2.5% + SGST 2.5%)
  
  // Cart Actions
  addToCart: (item: Omit<CartItem, 'quantity'>) => void
  removeFromCart: (itemId: string) => void
  updateQuantity: (itemId: string, qty: number) => void
  clearCart: () => void
  setSelectedTable: (tableId: string | null) => void
  
  // Checkout & Sync Actions
  setOnlineStatus: (status: boolean) => void
  loadQueueCount: () => Promise<void>
  checkout: (paymentMethod: 'cash' | 'card' | 'upi' | 'split', cashierId: string) => Promise<boolean>
  syncOfflineQueue: () => Promise<void>
}

// Simple UUID generator for offline environment
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const usePOSStore = create<POSState>((set, get) => {
  // Listen to network status
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      set({ isOnline: true })
      get().syncOfflineQueue()
    })
    window.addEventListener('offline', () => set({ isOnline: false }))
  }

  return {
    cart: [],
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    syncing: false,
    offlineQueueCount: 0,
    selectedTableId: null,
    discountTotal: 0,
    taxRate: 0.05, // 5% total GST

    addToCart: (newItem) => {
      const { cart } = get()
      const existing = cart.find(item => item.id === newItem.id)
      
      if (existing) {
        set({
          cart: cart.map(item => 
            item.id === newItem.id 
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        })
      } else {
        set({ cart: [...cart, { ...newItem, quantity: 1 }] })
      }
    },

    removeFromCart: (itemId) => {
      set({ cart: get().cart.filter(item => item.id !== itemId) })
    },

    updateQuantity: (itemId, qty) => {
      if (qty <= 0) {
        get().removeFromCart(itemId)
        return
      }
      set({
        cart: get().cart.map(item => 
          item.id === itemId ? { ...item, quantity: qty } : item
        )
      })
    },

    clearCart: () => set({ cart: [], selectedTableId: null, discountTotal: 0 }),
    
    setSelectedTable: (tableId) => set({ selectedTableId: tableId }),

    setOnlineStatus: (status) => set({ isOnline: status }),

    loadQueueCount: async () => {
      const orders = await offlineDB.getOfflineOrders()
      set({ offlineQueueCount: orders.length })
    },

    checkout: async (paymentMethod, cashierId) => {
      const { cart, selectedTableId, discountTotal, taxRate, isOnline } = get()
      if (cart.length === 0) return false

      // Calculate totals
      const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
      const taxableAmount = Math.max(0, subtotal - discountTotal)
      
      // Calculate 5% GST (split as 2.5% CGST + 2.5% SGST)
      const cgstAmount = taxableAmount * (taxRate / 2)
      const sgstAmount = taxableAmount * (taxRate / 2)
      const tax_total = cgstAmount + sgstAmount
      const grand_total = taxableAmount + tax_total

      const orderItems = cart.map(item => ({
        menu_item_id: item.menu_item_id,
        name: item.name,
        variant_name: item.variant_name,
        price: item.price,
        quantity: item.quantity,
        taxes: [
          { name: 'CGST', rate: (taxRate / 2) * 100, amount: cgstAmount },
          { name: 'SGST', rate: (taxRate / 2) * 100, amount: sgstAmount }
        ]
      }))

      const newOrder: OfflineOrder = {
        id: generateUUID(),
        table_id: selectedTableId || undefined,
        items: orderItems,
        subtotal,
        tax_total,
        discount_total: discountTotal,
        grand_total,
        payment_method: paymentMethod,
        status: 'paid',
        offline_created_at: new Date().toISOString(),
        cashier_id: cashierId
      }

      // 1. Critical offline-first rule: Always write transaction to local IndexedDB first
      await offlineDB.saveOfflineOrder(newOrder)
      await get().loadQueueCount()
      
      // 2. Clear frontend active cart
      get().clearCart()

      // 3. Trigger asynchronous background sync if online
      if (isOnline) {
        // Run sync in non-blocking fashion
        get().syncOfflineQueue()
      }

      return true
    },

    syncOfflineQueue: async () => {
      const { syncing, isOnline } = get()
      if (syncing || !isOnline) return

      set({ syncing: true })
      try {
        const offlineOrders = await offlineDB.getOfflineOrders()
        if (offlineOrders.length === 0) {
          set({ syncing: false })
          return
        }

        const token = localStorage.getItem('ugs_access')
        if (!token) {
          set({ syncing: false })
          return
        }

        // Post batch of offline bills to FastAPI sync gateway
        const response = await fetch('/api/v1/billing/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ bills: offlineOrders })
        })

        if (response.ok) {
          const result = await response.json()
          
          // Clear synced orders from local storage
          for (const order of offlineOrders) {
            await offlineDB.deleteOfflineOrder(order.id)
          }
          await get().loadQueueCount()
          console.log(`UGS-Restoflow Sync Completed: Synced ${result.synced_count} bills.`)
        } else {
          console.error("UGS-Restoflow Sync Failed, server returned status:", response.status)
        }
      } catch (err) {
        console.error("UGS-Restoflow Sync Engine Network Error:", err)
      } finally {
        set({ syncing: false })
      }
    }
  }
})
