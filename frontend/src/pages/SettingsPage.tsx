import React, { useState } from 'react'
import { Settings, Save, Percent, ShieldCheck, CheckCircle } from 'lucide-react'

export default function SettingsPage() {
  const [restName, setRestName] = useState('Gourmet Garden Cafe')
  const [gstin, setGstin] = useState('07AAAAA1111A1Z1')
  const [taxInclusive, setTaxInclusive] = useState(true)
  const [cgst, setCgst] = useState(2.5)
  const [sgst, setSgst] = useState(2.5)
  const [currency, setCurrency] = useState('INR')
  const [receiptHeader, setReceiptHeader] = useState('Welcome to Gourmet Garden!')
  const [receiptFooter, setReceiptFooter] = useState('Thank you for dining with us!')

  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault()
    showToast('Business configurations updated successfully!')
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans text-zinc-100">
      <header className="border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-brand-500" />
          <h1 className="font-semibold text-zinc-200 tracking-tight">Business Configuration Center</h1>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full overflow-y-auto space-y-6">
        <form onSubmit={handleSaveSettings} className="space-y-6">
          
          {/* Restaurant Profile */}
          <div className="glass-panel rounded-2xl border border-zinc-900 p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Restaurant Profile</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Outlet Name</label>
                <input
                  type="text"
                  value={restName}
                  onChange={(e) => setRestName(e.target.value)}
                  required
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Currency Default</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none"
                >
                  <option value="INR">Indian Rupee (₹)</option>
                  <option value="USD">US Dollar ($)</option>
                </select>
              </div>
            </div>
          </div>

          {/* GST and Taxes */}
          <div className="glass-panel rounded-2xl border border-zinc-900 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-brand-500" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">GSTIN & Tax Settings</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">15-char GST Number</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase().substring(0, 15))}
                  placeholder="e.g. 07AAAAA1111A1Z1"
                  required
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">CGST (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={cgst}
                  onChange={(e) => setCgst(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">SGST (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={sgst}
                  onChange={(e) => setSgst(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={taxInclusive}
                  onChange={(e) => setTaxInclusive(e.target.checked)}
                  className="rounded bg-zinc-900 border-zinc-800 text-brand-500 focus:ring-0"
                />
                <span>Pricing values are inclusive of GST taxes</span>
              </label>
            </div>
          </div>

          {/* Receipt Customizer templates */}
          <div className="glass-panel rounded-2xl border border-zinc-900 p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Receipt Invoice Customizer</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Receipt Header Message</label>
                <input
                  type="text"
                  value={receiptHeader}
                  onChange={(e) => setReceiptHeader(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Receipt Footer Message</label>
                <input
                  type="text"
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="submit"
              className="bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white text-xs font-semibold px-6 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-lg active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              <span>Save Configurations</span>
            </button>
          </div>
        </form>
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
