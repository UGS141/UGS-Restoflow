import React, { useState } from 'react'
import { Shield, Users, CreditCard, Sparkles, Plus, ToggleLeft, ToggleRight, Database, Settings } from 'lucide-react'

interface MockTenant {
  id: string
  name: string
  ownerEmail: string
  plan: 'free_trial' | 'monthly' | 'quarterly' | 'yearly'
  status: 'active' | 'expired' | 'grace_period'
  expiresAt: string
}

const INITIAL_TENANTS: MockTenant[] = [
  { id: 'ten_001', name: 'Paradise Biryani Palace', ownerEmail: 'owner1@paradise.com', plan: 'monthly', status: 'active', expiresAt: '2026-08-25T15:00:00' },
  { id: 'ten_002', name: 'Blue Tokai Cafe Delhi', ownerEmail: 'manager@bluetokai.com', plan: 'yearly', status: 'active', expiresAt: '2027-02-15T10:00:00' },
  { id: 'ten_003', name: 'Cafe Coffee Day Mumbai', ownerEmail: 'owner3@ccd.com', plan: 'free_trial', status: 'expired', expiresAt: '2026-07-20T12:00:00' },
]

export default function SuperAdminPage() {
  const [tenants, setTenants] = useState<MockTenant[]>(INITIAL_TENANTS)
  
  // Platform feature flags
  const [flags, setFlags] = useState({
    qrOrdering: true,
    whatsappAlerts: false,
    aiPricingEngine: true,
    tallyIntegration: false
  })

  // Log lists
  const [logs, setLogs] = useState([
    { id: '1', time: '15:44:12', msg: 'Tenant ID ten_002 subscription upgraded to YEARLY by Priya' },
    { id: '2', time: '14:20:05', msg: 'System Database check: healthy (Motor 3.3.2 - MongoDB 6.0)' },
    { id: '3', time: '10:05:00', msg: 'Tenant ID ten_003 locked: Trial expired on 2026-07-20' },
  ])

  // States
  const [newTenantName, setNewTenantName] = useState('')
  const [newTenantEmail, setNewTenantEmail] = useState('')
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTenantName || !newTenantEmail) return

    const newId = `ten_${Math.floor(100 + Math.random() * 900)}`
    const mockT: MockTenant = {
      id: newId,
      name: newTenantName,
      ownerEmail: newTenantEmail,
      plan: 'free_trial',
      status: 'active',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    }

    setTenants(prev => [...prev, mockT])
    setLogs(prev => [
      { id: Date.now().toString(), time: new Date().toTimeString().split(' ')[0], msg: `New tenant '${newTenantName}' registered on 30-day Free Trial.` },
      ...prev
    ])

    setNewTenantName('')
    setNewTenantEmail('')
    showToast('Tenant Registered!')
  }

  const handleUpdatePlan = (id: string, plan: 'monthly' | 'yearly') => {
    const expires = plan === 'yearly' 
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    setTenants(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          plan,
          status: 'active',
          expiresAt: expires.toISOString()
        }
      }
      return t
    }))

    const tName = tenants.find(t => t.id === id)?.name || ''
    setLogs(prev => [
      { id: Date.now().toString(), time: new Date().toTimeString().split(' ')[0], msg: `Tenant '${tName}' subscription updated to ${plan.toUpperCase()}` },
      ...prev
    ])

    showToast('Subscription Renewed')
  }

  const handleToggleFlag = (key: keyof typeof flags) => {
    setFlags(prev => ({ ...prev, [key]: !prev[key] }))
    showToast('Feature Flag updated')
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans text-zinc-100">
      {/* Top Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-brand-500" />
          <h1 className="font-semibold text-zinc-200 tracking-tight">UGS Super Admin Control Center</h1>
        </div>
        <span className="text-xs bg-brand-500/10 text-brand-400 border border-brand-500/20 px-3 py-1 rounded-full font-semibold">
          System Node Active
        </span>
      </header>

      {/* Main Grid Workspace */}
      <main className="flex-1 p-6 grid grid-cols-1 xl:grid-cols-3 gap-6 overflow-y-auto">
        {/* Left 2 Columns: Tenant Directory & Metrics */}
        <section className="xl:col-span-2 space-y-6">
          {/* Top Platform Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-panel rounded-2xl p-5 border border-zinc-900">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Gross SaaS ARR</span>
              <span className="text-2xl font-bold font-mono text-zinc-200">₹14,80,000</span>
              <span className="text-[10px] text-emerald-400 block mt-1.5">+12.5% Month-over-Month</span>
            </div>
            <div className="glass-panel rounded-2xl p-5 border border-zinc-900">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Total Tenants</span>
              <span className="text-2xl font-bold font-mono text-zinc-200">{tenants.length}</span>
              <span className="text-[10px] text-zinc-500 block mt-1.5">Across 8 Indian States</span>
            </div>
            <div className="glass-panel rounded-2xl p-5 border border-zinc-900">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Active Trials</span>
              <span className="text-2xl font-bold font-mono text-zinc-200">
                {tenants.filter(t => t.plan === 'free_trial' && t.status === 'active').length}
              </span>
              <span className="text-[10px] text-brand-400 block mt-1.5">Conversion rate: 22%</span>
            </div>
          </div>

          {/* Tenants Directory Card */}
          <div className="glass-panel rounded-2xl border border-zinc-900 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">Tenant Restaurant Database</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 text-xs text-zinc-500">
                    <th className="pb-3.5 font-medium">Restaurant Details</th>
                    <th className="pb-3.5 font-medium">Plan Type</th>
                    <th className="pb-3.5 font-medium">State</th>
                    <th className="pb-3.5 font-medium">Expiration Timeline</th>
                    <th className="pb-3.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/60 text-xs">
                  {tenants.map(t => (
                    <tr key={t.id} className="hover:bg-zinc-900/20 transition-colors">
                      <td className="py-4">
                        <div className="font-semibold text-zinc-200">{t.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{t.id} • {t.ownerEmail}</div>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded font-medium border uppercase text-[9px] ${
                          t.plan === 'yearly' 
                            ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                            : t.plan === 'monthly'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                        }`}>
                          {t.plan.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                          t.status === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {t.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 font-mono text-zinc-400">
                        {new Date(t.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleUpdatePlan(t.id, 'monthly')}
                          className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1 transition-colors"
                        >
                          +30 Days
                        </button>
                        <button
                          onClick={() => handleUpdatePlan(t.id, 'yearly')}
                          className="bg-brand-600 hover:bg-brand-500 text-white rounded px-2.5 py-1 transition-colors shadow-sm shadow-brand-500/10 border border-brand-500/20"
                        >
                          +Yearly
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Right 1 Column: Onboarding & Feature Flags */}
        <section className="space-y-6">
          {/* Add New Tenant */}
          <div className="glass-panel rounded-2xl border border-zinc-900 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-4 h-4 text-brand-500" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Provision New Tenant</h3>
            </div>
            
            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Restaurant Name</label>
                <input
                  type="text"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  placeholder="e.g. Haldiram's Franchise"
                  required
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-brand-500/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Owner Email Address</label>
                <input
                  type="email"
                  value={newTenantEmail}
                  onChange={(e) => setNewTenantEmail(e.target.value)}
                  placeholder="owner@haldirams.com"
                  required
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-brand-500/50"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white rounded-xl py-2.5 text-xs font-semibold transition-all border border-brand-500/20 active:scale-[0.98]"
              >
                Provision Tenant Account
              </button>
            </form>
          </div>

          {/* Global Feature Flags */}
          <div className="glass-panel rounded-2xl border border-zinc-900 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4 text-brand-500" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Feature Flags Toggle</h3>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-300">QR Mobile Ordering</div>
                  <div className="text-[10px] text-zinc-500">Enable table QR scan routes</div>
                </div>
                <button onClick={() => handleToggleFlag('qrOrdering')}>
                  {flags.qrOrdering ? <ToggleRight className="w-8 h-8 text-brand-500" /> : <ToggleLeft className="w-8 h-8 text-zinc-700" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-300">WhatsApp Notification Hub</div>
                  <div className="text-[10px] text-zinc-500">Twilio and Meta Cloud API integration</div>
                </div>
                <button onClick={() => handleToggleFlag('whatsappAlerts')}>
                  {flags.whatsappAlerts ? <ToggleRight className="w-8 h-8 text-brand-500" /> : <ToggleLeft className="w-8 h-8 text-zinc-700" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-300">AI Pricing Optimizer</div>
                  <div className="text-[10px] text-zinc-500">Gemini model recommended pricing prompts</div>
                </div>
                <button onClick={() => handleToggleFlag('aiPricingEngine')}>
                  {flags.aiPricingEngine ? <ToggleRight className="w-8 h-8 text-brand-500" /> : <ToggleLeft className="w-8 h-8 text-zinc-700" />}
                </button>
              </div>
            </div>
          </div>

          {/* System Audit Trails */}
          <div className="glass-panel rounded-2xl border border-zinc-900 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-brand-500" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">System Logs</h3>
            </div>

            <div className="space-y-3 font-mono text-[10px] text-zinc-500 max-h-48 overflow-y-auto">
              {logs.map(log => (
                <div key={log.id} className="border-b border-zinc-900/60 pb-2">
                  <span className="text-brand-400 font-semibold">[{log.time}]</span> {log.msg}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Floating status toast */}
      {toast && (
        <div className="fixed bottom-6 left-6 z-50 bg-zinc-900 border border-brand-500/20 text-brand-400 rounded-xl px-4 py-3 text-xs shadow-xl flex items-center gap-2 animate-slide-up">
          <Shield className="w-4 h-4 text-brand-500 animate-pulse" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}
