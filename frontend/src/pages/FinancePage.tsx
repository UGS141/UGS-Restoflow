import React, { useState } from 'react'
import { DollarSign, Landmark, Plus, ArrowUpRight, ArrowDownRight, Clipboard, CheckCircle, RefreshCw } from 'lucide-react'

interface CashRegisterState {
  status: 'open' | 'closed'
  opening_balance: number
  cash_in_hand: number
  opened_at?: string
}

interface FinTransaction {
  id: string
  type: 'income' | 'expense' | 'vendor_payment' | 'cash_in' | 'cash_out'
  amount: number
  category: string
  description: string
  timestamp: string
}

const INITIAL_TXS: FinTransaction[] = [
  { id: 'TXN-01', type: 'expense', amount: 1500.0, category: 'Raw Materials', description: 'Fresh vegetables and milk delivery', timestamp: '2026-07-25 10:15:00' },
  { id: 'TXN-02', type: 'expense', amount: 450.0, category: 'Salaries', description: 'Daily wage for kitchen helper', timestamp: '2026-07-25 11:30:00' },
  { id: 'TXN-03', type: 'income', amount: 2800.0, category: 'POS Sales', description: 'Consolidated cash orders segment', timestamp: '2026-07-25 14:00:00' },
]

export default function FinancePage() {
  const [register, setRegister] = useState<CashRegisterState>({ status: 'closed', opening_balance: 0, cash_in_hand: 0 })
  const [txs, setTxs] = useState<FinTransaction[]>(INITIAL_TXS)
  
  // Register Open/Close input
  const [cashFloat, setCashFloat] = useState(2000)
  const [closingCash, setClosingCash] = useState(0)

  // Transaction logging
  const [txType, setTxType] = useState<'income' | 'expense'>('expense')
  const [txAmount, setTxAmount] = useState(100)
  const [txCategory, setTxCategory] = useState('Raw Materials')
  const [txDesc, setTxDesc] = useState('')

  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleOpenRegister = (e: React.FormEvent) => {
    e.preventDefault()
    setRegister({
      status: 'open',
      opening_balance: cashFloat,
      cash_in_hand: cashFloat,
      opened_at: new Date().toLocaleTimeString()
    })
    showToast(`Cash drawer opened with ₹${cashFloat} float.`)
  }

  const handleCloseRegister = (e: React.FormEvent) => {
    e.preventDefault()
    const discrepancy = closingCash - register.cash_in_hand
    setRegister({ status: 'closed', opening_balance: 0, cash_in_hand: 0 })
    
    if (discrepancy === 0) {
      showToast('Shift closed. Cash count matched expected balance!')
    } else {
      showToast(`Shift closed. Discrepancy logged: ₹${discrepancy > 0 ? '+' : ''}${discrepancy}`)
    }
  }

  const handleLogTransaction = (e: React.FormEvent) => {
    e.preventDefault()
    if (txAmount <= 0) return

    const newTx: FinTransaction = {
      id: `TXN-${Date.now()}`,
      type: txType,
      amount: txAmount,
      category: txCategory,
      description: txDesc,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    }

    setTxs(prev => [newTx, ...prev])
    
    // Update cash drawer in hand if register is open
    if (register.status === 'open') {
      const multiplier = txType === 'income' ? 1 : -1
      setRegister(prev => ({
        ...prev,
        cash_in_hand: prev.cash_in_hand + (txAmount * multiplier)
      }))
    }

    setTxAmount(100)
    setTxDesc('')
    showToast(`Logged ₹${txAmount} ${txType.toUpperCase()} under ${txCategory}.`)
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans text-zinc-100">
      <header className="border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Landmark className="w-5 h-5 text-brand-500" />
          <h1 className="font-semibold text-zinc-200 tracking-tight">Finance, Ledgers & Expenses</h1>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 xl:grid-cols-3 gap-6 overflow-y-auto">
        {/* Left Column: Cash Register Shifts */}
        <section className="glass-panel rounded-2xl border border-zinc-900 p-6 h-[600px] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">Cash Drawer Shift</h3>

            {register.status === 'open' ? (
              <div className="space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <span className="text-[9px] font-bold text-emerald-450 uppercase tracking-widest block mb-1">Shift Active</span>
                  <div className="text-xs text-zinc-500">Opened today at: <span className="font-mono text-zinc-300 font-semibold">{register.opened_at}</span></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-3.5">
                    <span className="text-[9px] text-zinc-500 uppercase block mb-1">Opening Float</span>
                    <span className="text-sm font-bold font-mono text-zinc-300">₹{register.opening_balance}</span>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-3.5">
                    <span className="text-[9px] text-zinc-500 uppercase block mb-1">Drawer Cash</span>
                    <span className="text-sm font-bold font-mono text-brand-450">₹{register.cash_in_hand}</span>
                  </div>
                </div>

                <form onSubmit={handleCloseRegister} className="pt-4 border-t border-zinc-900 space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Actual Cash in Drawer</label>
                    <input
                      type="number"
                      value={closingCash}
                      onChange={(e) => setClosingCash(parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 text-right font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 rounded-xl py-2.5 text-xs font-semibold"
                  >
                    Close Shift & Reconcile
                  </button>
                </form>
              </div>
            ) : (
              <form onSubmit={handleOpenRegister} className="space-y-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest block mb-1">Drawer Locked</span>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                    Opening the register logs your user ID as cashier and locks the drawer float. Required before POS checkouts.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Opening Float Cash (INR)</label>
                  <input
                    type="number"
                    value={cashFloat}
                    onChange={(e) => setCashFloat(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 font-mono text-right"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white rounded-xl py-2.5 text-xs font-semibold"
                >
                  Start Cash Shift
                </button>
              </form>
            )}
          </div>

          <div className="bg-zinc-900/10 border border-zinc-900 rounded-xl p-3 flex justify-between text-xs text-zinc-500 font-mono">
            <span>Terminal: #01</span>
            <span>DRAWER STATUS: {register.status.toUpperCase()}</span>
          </div>
        </section>

        {/* Center Column: Recent Audit Transactions */}
        <section className="glass-panel rounded-2xl border border-zinc-900 p-6 h-[600px] flex flex-col">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">Ledger Transactions</h3>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {txs.map(tx => {
              const isExpense = tx.type === 'expense' || tx.type === 'cash_out' || tx.type === 'vendor_payment'
              return (
                <div key={tx.id} className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-3.5 flex items-center justify-between hover:border-zinc-800 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-zinc-200">{tx.category}</h4>
                      <span className={`text-[8px] px-1.5 rounded uppercase border font-semibold ${
                        isExpense 
                          ? 'bg-red-500/10 text-red-400 border-red-500/10'
                          : 'bg-emerald-500/10 text-emerald-450 border-emerald-500/10'
                      }`}>
                        {tx.type}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 block">{tx.description}</span>
                  </div>

                  <div className="text-right">
                    <span className={`text-xs font-bold font-mono ${isExpense ? 'text-red-400' : 'text-emerald-450'}`}>
                      {isExpense ? '-' : '+'} ₹{tx.amount.toFixed(2)}
                    </span>
                    <span className="text-[8px] text-zinc-600 block mt-1 font-mono">{tx.timestamp.substring(11)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Right Column: Log Expense / Income */}
        <section className="glass-panel rounded-2xl border border-zinc-900 p-6 h-[600px] flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-4 h-4 text-brand-500" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Log Transaction</h3>
          </div>

          <form onSubmit={handleLogTransaction} className="flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Transaction Type</label>
                <select
                  value={txType}
                  onChange={(e) => setTxType(e.target.value as any)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none"
                >
                  <option value="expense">Expense (Debit -)</option>
                  <option value="income">Other Income (Credit +)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Amount (INR)</label>
                <input
                  type="number"
                  value={txAmount}
                  onChange={(e) => setTxAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                  required
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none text-right font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Account Category</label>
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none"
                >
                  <option value="Raw Materials">Raw Materials (Food Supply)</option>
                  <option value="Salaries">Employee Shifts / Salaries</option>
                  <option value="Rent & Power">Rent & Utility Bills</option>
                  <option value="Other Income">Catering / Event Bookings</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  placeholder="e.g. Paid Gopal for daily milk dispatch receipt #1029"
                  required
                  rows={3}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-250 focus:outline-none resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
            >
              <Clipboard className="w-3.5 h-3.5 text-brand-500" />
              <span>Register Transaction Entry</span>
            </button>
          </form>
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
