import React, { useState } from 'react'
import { Users, CreditCard, Sparkles, Plus, Wallet, ShieldAlert, History } from 'lucide-react'

interface CustomerProfile {
  phone: string
  name: string
  tier: 'bronze' | 'silver' | 'gold'
  loyaltyPoints: number
  walletBalance: number
  created_at: string
  visits: number
}

const INITIAL_CUSTOMERS: CustomerProfile[] = [
  { phone: '9876543210', name: 'Vikram Malhotra', tier: 'gold', loyaltyPoints: 480, walletBalance: 1200.0, created_at: '2026-03-10', visits: 18 },
  { phone: '9822334455', name: 'Aditi Rao', tier: 'silver', loyaltyPoints: 125, walletBalance: 350.0, created_at: '2026-05-15', visits: 7 },
  { phone: '9766554433', name: 'Kabir Mehta', tier: 'bronze', loyaltyPoints: 30, walletBalance: 0.0, created_at: '2026-07-01', visits: 2 },
]

export default function CRMPage() {
  const [customers, setCustomers] = useState<CustomerProfile[]>(INITIAL_CUSTOMERS)
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null)
  
  // Create Customer States
  const [custPhone, setCustPhone] = useState('')
  const [custName, setCustName] = useState('')
  
  // Wallet Load States
  const [walletLoadAmount, setWalletLoadAmount] = useState(500)

  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleRegisterCustomer = (e: React.FormEvent) => {
    e.preventDefault()
    if (custPhone.length !== 10 || !custName) {
      showToast('Enter valid 10-digit mobile and name!')
      return
    }

    // Check unique phone
    const exists = customers.find(c => c.phone === custPhone)
    if (exists) {
      showToast('Customer already registered!')
      return
    }

    const newC: CustomerProfile = {
      phone: custPhone,
      name: custName,
      tier: 'bronze',
      loyaltyPoints: 0,
      walletBalance: 0.0,
      created_at: new Date().toISOString().split('T')[0],
      visits: 1
    }

    setCustomers(prev => [...prev, newC])
    setSelectedPhone(custPhone)
    setCustPhone('')
    setCustName('')
    showToast('Customer registered successfully!')
  }

  const handleLoadWallet = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPhone) return

    setCustomers(prev => prev.map(c => {
      if (c.phone === selectedPhone) {
        return {
          ...c,
          walletBalance: c.walletBalance + walletLoadAmount
        }
      }
      return c
    }))

    showToast(`Loaded ₹${walletLoadAmount} to customer wallet.`)
    setWalletLoadAmount(500)
  }

  const selectedCustomer = customers.find(c => c.phone === selectedPhone)

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans text-zinc-100">
      <header className="border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-brand-500" />
          <h1 className="font-semibold text-zinc-200 tracking-tight">Customer CRM & Loyalty Wallets</h1>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 xl:grid-cols-3 gap-6 overflow-y-auto">
        {/* Left Column: Customer Directory */}
        <section className="glass-panel rounded-2xl border border-zinc-900 p-6 h-[600px] flex flex-col">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">Customer Directory</h3>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {customers.map(c => (
              <button
                key={c.phone}
                onClick={() => setSelectedPhone(c.phone)}
                className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                  selectedPhone === c.phone
                    ? 'bg-brand-500/10 border-brand-500/30 text-brand-400'
                    : 'bg-zinc-900/30 border-zinc-900 hover:border-zinc-800 text-zinc-300'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold">{c.name}</h4>
                  <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">{c.phone}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase ${
                    c.tier === 'gold' 
                      ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' 
                      : c.tier === 'silver'
                      ? 'bg-zinc-400/10 text-zinc-400 border-zinc-400/20'
                      : 'bg-zinc-900 text-zinc-600 border-zinc-800'
                  }`}>
                    {c.tier}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Center Column: Loyalty & Wallet Balance Statement */}
        <section className="glass-panel rounded-2xl border border-zinc-900 p-6 h-[600px] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">Loyalty Ledger</h3>

            {selectedCustomer ? (
              <div className="space-y-5">
                <div className="bg-zinc-900/50 border border-zinc-850 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-zinc-200">{selectedCustomer.name}</h4>
                  <p className="text-[10px] text-zinc-500 mt-1 font-mono">{selectedCustomer.phone}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Wallet Credits</span>
                    <span className="text-xl font-bold font-mono text-brand-500 mt-2">₹{selectedCustomer.walletBalance.toFixed(2)}</span>
                  </div>
                  <div className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Loyalty Points</span>
                    <span className="text-xl font-bold font-mono text-yellow-500 mt-2">{selectedCustomer.loyaltyPoints} pts</span>
                  </div>
                </div>

                {/* Wallet load form */}
                <form onSubmit={handleLoadWallet} className="pt-4 border-t border-zinc-900 space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Load Wallet Credit (INR)</label>
                    <input
                      type="number"
                      value={walletLoadAmount}
                      onChange={(e) => setWalletLoadAmount(Math.max(10, parseFloat(e.target.value) || 0))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 font-mono text-right"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Wallet className="w-3.5 h-3.5 text-brand-500" />
                    <span>Top-Up Customer Wallet</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-center p-12 text-xs text-zinc-600 font-mono">Select a customer profile to view balance ledgers.</div>
            )}
          </div>

          {selectedCustomer && (
            <div className="bg-zinc-900/10 border border-zinc-900 rounded-xl p-3 flex justify-between text-xs text-zinc-500 font-mono">
              <span className="flex items-center gap-1">
                <History className="w-3.5 h-3.5 text-zinc-600" />
                <span>Total Visits: {selectedCustomer.visits}</span>
              </span>
              <span>Joined: {selectedCustomer.created_at}</span>
            </div>
          )}
        </section>

        {/* Right Column: Register Customer */}
        <section className="glass-panel rounded-2xl border border-zinc-900 p-6 h-[600px] flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-4 h-4 text-brand-500" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Add Customer</h3>
          </div>

          <form onSubmit={handleRegisterCustomer} className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Customer Name</label>
                <input
                  type="text"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  required
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Mobile Number (10 digits)</label>
                <input
                  type="text"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value.replace(/\D/g, '').substring(0, 10))}
                  placeholder="e.g. 9876543210"
                  required
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white rounded-xl py-3 text-xs font-semibold transition-all shadow-lg active:scale-[0.98]"
            >
              Register Customer Profile
            </button>
          </form>
        </section>
      </main>

      {/* Floating status toast */}
      {toast && (
        <div className="fixed bottom-6 left-6 z-50 bg-zinc-900 border border-brand-500/20 text-brand-400 rounded-xl px-4 py-3 text-xs shadow-xl flex items-center gap-2 animate-slide-up">
          <Sparkles className="w-4 h-4 text-brand-500 animate-pulse" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}
