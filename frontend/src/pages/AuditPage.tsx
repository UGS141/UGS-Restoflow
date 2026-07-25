import React, { useState } from 'react'
import { ShieldAlert, Search, Calendar, User, Eye, CheckCircle } from 'lucide-react'

interface AuditLog {
  id: string
  timestamp: string
  actor_email: string
  action: 'bill_voided' | 'bill_refunded' | 'bill_split' | 'inventory_adjustment' | 'cash_register_opened' | 'cash_register_closed'
  details: Record<string, any>
}

const INITIAL_LOGS: AuditLog[] = [
  { 
    id: 'a_1', 
    timestamp: '2026-07-25 12:45:10', 
    actor_email: 'owner@gourmetgarden.com', 
    action: 'bill_voided', 
    details: { bill_id: 'INV-MAIN-1002', reason: 'Customer changed mind after punch', authorized_by: 'owner@gourmetgarden.com' } 
  },
  { 
    id: 'a_2', 
    timestamp: '2026-07-25 13:20:00', 
    actor_email: 'manager@gourmetgarden.com', 
    action: 'inventory_adjustment', 
    details: { raw_material_id: 'raw_paneer', quantity_change: -2.5, reason: 'Spillage / kitchen prep loss' } 
  },
  { 
    id: 'a_3', 
    timestamp: '2026-07-25 14:02:45', 
    actor_email: 'cashier@gourmetgarden.com', 
    action: 'cash_register_opened', 
    details: { opening_balance: 2000.0 } 
  }
]

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_LOGS)
  const [filterAction, setFilterAction] = useState('All')
  const [filterEmail, setFilterEmail] = useState('')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const filteredLogs = logs.filter(log => {
    if (filterAction !== 'All' && log.action !== filterAction) return false
    if (filterEmail && !log.actor_email.toLowerCase().includes(filterEmail.toLowerCase())) return false
    return true
  })

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans text-zinc-100">
      <header className="border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-brand-500" />
          <h1 className="font-semibold text-zinc-200 tracking-tight">Enterprise Security Audit Center</h1>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 xl:grid-cols-3 gap-6 overflow-y-auto">
        {/* Left Column: Filter Parameters & Logs table */}
        <section className="xl:col-span-2 glass-panel rounded-2xl border border-zinc-900 p-6 h-[600px] flex flex-col">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Actor Email</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={filterEmail}
                  onChange={(e) => setFilterEmail(e.target.value)}
                  placeholder="e.g. manager@gourmetgarden.com"
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Action Type</label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-250 focus:outline-none"
              >
                <option value="All">All Operations</option>
                <option value="bill_voided">Bill Voids</option>
                <option value="bill_refunded">Refund Issues</option>
                <option value="inventory_adjustment">Stock Adjustments</option>
                <option value="cash_register_opened">Register Opens</option>
                <option value="cash_register_closed">Register Closes</option>
              </select>
            </div>
          </div>

          {/* Table area */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredLogs.map(log => (
              <button
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                  selectedLog?.id === log.id
                    ? 'bg-brand-500/10 border-brand-500/30 text-brand-400'
                    : 'bg-zinc-900/30 border-zinc-900 hover:border-zinc-800 text-zinc-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-zinc-200 uppercase">{log.action.replace('_', ' ')}</span>
                    <span className="text-[9px] text-zinc-500 font-mono">ID: {log.id}</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-2">
                    <User className="w-3 h-3" />
                    <span>{log.actor_email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-zinc-650 font-mono">{log.timestamp}</span>
                  <Eye className="w-3.5 h-3.5 text-zinc-500" />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Right Column: Log Event details */}
        <section className="glass-panel rounded-2xl border border-zinc-900 p-6 h-[600px] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">Metadata Payload</h3>

            {selectedLog ? (
              <div className="space-y-4">
                <div className="bg-zinc-900/50 border border-zinc-850 rounded-xl p-4 space-y-2">
                  <span className="text-[9px] text-zinc-500 font-mono uppercase">Event Action</span>
                  <h4 className="text-xs font-bold text-zinc-200">{selectedLog.action.toUpperCase()}</h4>
                  <div className="text-[10px] text-zinc-550 pt-2 border-t border-zinc-900 flex justify-between">
                    <span>Timestamp:</span>
                    <span className="font-mono text-zinc-300">{selectedLog.timestamp}</span>
                  </div>
                  <div className="text-[10px] text-zinc-550 flex justify-between">
                    <span>Authorized Operator:</span>
                    <span className="font-mono text-zinc-300">{selectedLog.actor_email}</span>
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Change details</span>
                  <pre className="w-full bg-zinc-950/70 border border-zinc-900 rounded-xl p-3.5 text-[10px] text-brand-350 font-mono overflow-x-auto leading-relaxed">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center p-12 text-xs text-zinc-600 font-mono leading-relaxed">
                Click on any log event on the left pane to extract structural change records.
              </div>
            )}
          </div>

          <div className="bg-zinc-900/10 border border-zinc-900 rounded-xl p-3 text-[10px] text-zinc-600 leading-relaxed font-mono">
            SECURE COMPLIANCE: Every critical action (pricing updates, overrides, cash register status) compiles device hashes, worker roles, and is immutably stored in the database.
          </div>
        </section>
      </main>
    </div>
  )
}
