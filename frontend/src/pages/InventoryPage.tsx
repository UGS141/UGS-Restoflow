import React, { useState } from 'react'
import { Scale, Truck, Clipboard, Plus, ShieldAlert, CheckCircle, Package } from 'lucide-react'

interface StockItem {
  id: string
  name: string
  sku: string
  currentStock: number
  minStockLevel: number
  unit: string
}

const INITIAL_STOCK: StockItem[] = [
  { id: 'raw_paneer', name: 'Fresh Paneer (Cottage Cheese)', sku: 'RAW-PAN-01', currentStock: 12.5, minStockLevel: 15.0, unit: 'kg' },
  { id: 'raw_butter', name: 'Salted Amul Butter', sku: 'RAW-BUT-02', currentStock: 4.8, minStockLevel: 3.0, unit: 'kg' },
  { id: 'raw_flour', name: 'Tandoori Atta / Flour', sku: 'RAW-FLO-03', currentStock: 45.0, minStockLevel: 20.0, unit: 'kg' },
  { id: 'raw_milk', name: 'Full Cream Milk', sku: 'RAW-MIL-04', currentStock: 8.0, minStockLevel: 10.0, unit: 'liters' },
  { id: 'raw_spices', name: 'Mix Spices (Masala)', sku: 'RAW-SPI-05', currentStock: 2500, minStockLevel: 1000, unit: 'gms' },
]

export default function InventoryPage() {
  const [stock, setStock] = useState<StockItem[]>(INITIAL_STOCK)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  
  // Adjustment States
  const [adjustQty, setAdjustQty] = useState(1)
  const [adjustReason, setAdjustReason] = useState('audit')
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add')

  // Vendor Register States
  const [vendors, setVendors] = useState([
    { id: 'v_1', name: 'Standard Dairy Co.', contact: 'Harish', phone: '9876543210' },
    { id: 'v_2', name: 'Metro Cash & Carry', contact: 'Kirti', phone: '9988776655' }
  ])
  const [vendorName, setVendorName] = useState('')
  const [vendorContact, setVendorContact] = useState('')
  const [vendorPhone, setVendorPhone] = useState('')

  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItemId) return

    const change = adjustType === 'add' ? adjustQty : -adjustQty
    setStock(prev => prev.map(item => {
      if (item.id === selectedItemId) {
        return {
          ...item,
          currentStock: Math.max(0, item.currentStock + change)
        }
      }
      return item
    }))

    const itemName = stock.find(i => i.id === selectedItemId)?.name || ''
    showToast(`Adjusted '${itemName}' quantity by ${change > 0 ? '+' : ''}${change}`)
    setAdjustQty(1)
  }

  const handleRegisterVendor = (e: React.FormEvent) => {
    e.preventDefault()
    if (!vendorName || !vendorPhone) return

    const newV = {
      id: `v_${Date.now()}`,
      name: vendorName,
      contact: vendorContact,
      phone: vendorPhone
    }

    setVendors(prev => [...prev, newV])
    setVendorName('')
    setVendorContact('')
    setVendorPhone('')
    showToast('Supplier vendor registered!')
  }

  const selectedItem = stock.find(item => item.id === selectedItemId)

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans text-zinc-100">
      <header className="border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Scale className="w-5 h-5 text-brand-500" />
          <h1 className="font-semibold text-zinc-200 tracking-tight">Raw Materials Inventory Controller</h1>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 xl:grid-cols-3 gap-6 overflow-y-auto">
        {/* Left Column: Stock levels with warnings */}
        <section className="glass-panel rounded-2xl border border-zinc-900 p-6 h-[600px] flex flex-col">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">Stock Registry</h3>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {stock.map(item => {
              const isLow = item.currentStock < item.minStockLevel
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    selectedItemId === item.id
                      ? 'bg-brand-500/10 border-brand-500/30 text-brand-400'
                      : 'bg-zinc-900/30 border-zinc-900 hover:border-zinc-800 text-zinc-300'
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-bold">{item.name}</h4>
                    <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">{item.sku}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {isLow && (
                      <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                        <ShieldAlert className="w-2.5 h-2.5" />
                        <span>Low</span>
                      </span>
                    )}
                    <span className="text-xs font-bold font-mono text-zinc-200">
                      {item.currentStock} {item.unit}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* Center Column: Manual Audits & GRN Goods Received */}
        <section className="glass-panel rounded-2xl border border-zinc-900 p-6 h-[600px] flex flex-col">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">Audit Adjustments</h3>

          {selectedItem ? (
            <form onSubmit={handleAdjustStock} className="flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="bg-zinc-900/50 border border-zinc-850 rounded-xl p-3.5">
                  <span className="text-[9px] text-zinc-500 font-mono uppercase">Selected Item</span>
                  <h4 className="text-xs font-bold text-zinc-300 mt-1">{selectedItem.name}</h4>
                  <div className="flex justify-between text-xs text-zinc-500 mt-2 pt-2 border-t border-zinc-900">
                    <span>Registry level:</span>
                    <span className="font-semibold text-zinc-300 font-mono">
                      {selectedItem.currentStock} {selectedItem.unit}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Action Type</label>
                    <select
                      value={adjustType}
                      onChange={(e) => setAdjustType(e.target.value as any)}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none"
                    >
                      <option value="add">Increment (+)</option>
                      <option value="subtract">Decrement (Wastage -)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Quantity Change</label>
                    <input
                      type="number"
                      step="0.01"
                      value={adjustQty}
                      onChange={(e) => setAdjustQty(Math.max(0.01, parseFloat(e.target.value) || 0))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none text-right font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Audit Reason</label>
                  <select
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none"
                  >
                    <option value="audit">Physical Stock Count Audit</option>
                    <option value="spillage">Spillage & Prep Loss</option>
                    <option value="wastage">Expired Material / Spoiled</option>
                    <option value="received">Direct Purchase Receipt</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
              >
                <Clipboard className="w-3.5 h-3.5 text-brand-500" />
                <span>Submit Inventory Adjustment</span>
              </button>
            </form>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-600">
              <Package className="w-8 h-8 mb-2 text-zinc-700" />
              <p className="text-xs">No item selected</p>
              <p className="text-[10px] text-zinc-700 mt-1 leading-relaxed">
                Click any raw item in the registry to apply physical count corrections or log waste reports.
              </p>
            </div>
          )}
        </section>

        {/* Right Column: Supplier Management */}
        <section className="glass-panel rounded-2xl border border-zinc-900 p-6 h-[600px] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-4 h-4 text-brand-500" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Supplier Register</h3>
            </div>

            <form onSubmit={handleRegisterVendor} className="space-y-4 mb-6">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Supplier Name</label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="e.g. Reliance Fresh Supply"
                  required
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={vendorContact}
                    onChange={(e) => setVendorContact(e.target.value)}
                    placeholder="e.g. Ramesh"
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={vendorPhone}
                    onChange={(e) => setVendorPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    required
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white rounded-xl py-2 text-xs font-semibold transition-all"
              >
                Add Supplier
              </button>
            </form>
          </div>

          {/* Vendors list scroll area */}
          <div className="flex-1 overflow-y-auto space-y-2 border-t border-zinc-900 pt-4 max-h-[180px] pr-1">
            {vendors.map(v => (
              <div key={v.id} className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-3 text-xs flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-300">{v.name}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Contact: {v.contact || 'None'}</div>
                </div>
                <span className="font-mono text-zinc-400">{v.phone}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Floating status toast */}
      {toast && (
        <div className="fixed bottom-6 left-6 z-50 bg-zinc-900 border border-brand-500/20 text-brand-400 rounded-xl px-4 py-3 text-xs shadow-xl flex items-center gap-2 animate-slide-up">
          <CheckCircle className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}
