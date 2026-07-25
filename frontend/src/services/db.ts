import { openDB, IDBPDatabase } from 'idb'

const DB_NAME = 'ugs_offline_db'
const STORE_NAME = 'orders'
const DB_VERSION = 1

export interface OfflineOrder {
  id: string // Client UUID
  table_id?: string
  items: Array<{
    menu_item_id: string
    name: string
    variant_name?: string
    price: number
    quantity: number
    taxes: Array<{ name: string; rate: number; amount: number }>
  }>
  subtotal: number
  tax_total: number
  discount_total: number
  grand_total: number
  payment_method: 'cash' | 'card' | 'upi' | 'split'
  status: 'paid' | 'pending'
  offline_created_at: string
  cashier_id: string
}

class OfflineDBManager {
  private dbPromise: Promise<IDBPDatabase>

  constructor() {
    this.dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      },
    })
  }

  async saveOfflineOrder(order: OfflineOrder): Promise<void> {
    const db = await this.dbPromise
    await db.put(STORE_NAME, order)
  }

  async getOfflineOrders(): Promise<OfflineOrder[]> {
    const db = await this.dbPromise
    return db.getAll(STORE_NAME)
  }

  async deleteOfflineOrder(id: string): Promise<void> {
    const db = await this.dbPromise
    await db.delete(STORE_NAME, id)
  }

  async clearAllOfflineOrders(): Promise<void> {
    const db = await this.dbPromise
    const tx = db.transaction(STORE_NAME, 'readwrite')
    await tx.objectStore(STORE_NAME).clear()
    await tx.done
  }
}

export const offlineDB = new OfflineDBManager()
