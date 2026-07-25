import React, { useState, useEffect } from 'react'
import { Shield, Users, CreditCard, Sparkles, Plus, ToggleLeft, ToggleRight, Database, Settings, Mail, Bell, Activity, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react'

interface TenantData {
  id: string
  name: string
  owner: string
  email: string
  phone: string
  plan: 'free_trial' | 'starter' | 'professional' | 'enterprise'
  status: 'active' | 'suspended' | 'expired'
  expiresAt: string
  branchCount: number
  employeeCount: number
  featureFlags: {
    qr_ordering: boolean
    crm_loyalty: boolean
    ai_copilot: boolean
    kds_display: boolean
  }
}

const INITIAL_TENANTS: TenantData[] = [
  {
    id: 'ten_demo',
    name: 'Gourmet Garden Cafe',
    owner: 'Rohan Mehta',
    email: 'owner@gourmetgarden.com',
    phone: '9876543210',
    plan: 'free_trial',
    status: 'active',
    expiresAt: '2026-08-25',
    branchCount: 1,
    employeeCount: 5,
    featureFlags: { qr_ordering: true, crm_loyalty: true, ai_copilot: false, kds_display: true }
  },
  {
    id: 'ten_cafe_coffee',
    name: 'Blue Tokai Cafe Delhi',
    owner: 'Vikram Singh',
    email: 'vikram@bluetokai.com',
    phone: '9822334455',
    plan: 'professional',
    status: 'active',
    expiresAt: '2027-02-15',
    branchCount: 3,
    employeeCount: 18,
    featureFlags: { qr_ordering: true, crm_loyalty: true, ai_copilot: true, kds_display: true }
  },
  {
    id: 'ten_paradise',
    name: 'Paradise Biryani',
    owner: 'Aman Khan',
    email: 'aman@paradise.com',
    phone: '9766554433',
    plan: 'starter',
    status: 'suspended',
    expiresAt: '2026-07-20',
    branchCount: 2,
    employeeCount: 12,
    featureFlags: { qr_ordering: false, crm_loyalty: true, ai_copilot: false, kds_display: true }
  }
]

type PlatformTab = 'dashboard' | 'tenants' | 'subscriptions' | 'support' | 'broadcast' | 'monitoring'

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<PlatformTab>('dashboard')
  const [tenants, setTenants] = useState<TenantData[]>(INITIAL_TENANTS)
  const [selectedTenant, setSelectedTenant] = useState<TenantData | null>(null)
  
  // Health states
  const [health, setHealth] = useState({
    cpu: 34.2,
    ram: 4.8,
    ramTotal: 8.0,
    mongo: '1.2ms',
    redis: '0.8ms'
  })

  // Support tickets
  const [tickets, setTickets] = useState([
    { id: 't_101', restaurant: 'Gourmet Garden Cafe', subject: 'Printer setup connection issue', priority: 'high', status: 'open' },
    { id: 't_102', restaurant: 'Paradise Biryani', subject: 'Failed payment renewal query', priority: 'medium', status: 'closed' }
  ])
  const [supportReply, setSupportReply] = useState('')

  // Broadcast states
  const [broadTitle, setBroadTitle] = useState('')
  const [broadMsg, setBroadMsg] = useState('')
  const [broadTarget, setBroadTarget] = useState('all')

  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // Poll system health metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setHealth(prev => ({
        ...prev,
        cpu: +(prev.cpu + (Math.random() * 4 - 2)).toFixed(1)
      }))
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const handleToggleFeature = (tenantId: string, flag: 'qr_ordering' | 'crm_loyalty' | 'ai_copilot' | 'kds_display') => {
    setTenants(prev => prev.map(t => {
      if (t.id === tenantId) {
        const updatedFlags = { ...t.featureFlags, [flag]: !t.featureFlags[flag] }
        return { ...t, featureFlags: updatedFlags }
      }
      return t
    }))
    showToast('Tenant feature flags updated!')
  }

  const handleToggleSuspend = (tenantId: string) => {
    setTenants(prev => prev.map(t => {
      if (t.id === tenantId) {
        const nextStatus = t.status === 'suspended' ? 'active' : 'suspended'
        return { ...t, status: nextStatus }
      }
      return t
    }))
    showToast('Tenant operational status toggled!')
  }

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault()
    if (!broadTitle || !broadMsg) return
    showToast(`Broadcast sent to ${broadTarget} tenants via push notifications!`)
    setBroadTitle('')
    setBroadMsg('')
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans text-zinc-100">
      <header className="border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-brand-500" />
          <h1 className="font-semibold text-zinc-200 tracking-tight">UGS-Restoflow Platform Dashboard</h1>
        </div>
        <nav className="flex items-center gap-1.5">
          {(['dashboard', 'tenants', 'subscriptions', 'support', 'broadcast', 'monitoring'] as PlatformTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all capitalize ${
                activeTab === tab
                  ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* TAB 1: Platform Overview */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass-panel rounded-2xl p-5 border border-zinc-900">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Gross SaaS ARR</span>
                <span className="text-xl font-bold font-mono text-zinc-200">₹14,80,000.00</span>
              </div>
              <div className="glass-panel rounded-2xl p-5 border border-zinc-900">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Total Restaurants</span>
                <span className="text-xl font-bold font-mono text-zinc-200">{tenants.length} active</span>
              </div>
              <div className="glass-panel rounded-2xl p-5 border border-zinc-900">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block mb-1">SaaS Active Users</span>
                <span className="text-xl font-bold font-mono text-zinc-200">35 personnel</span>
              </div>
              <div className="glass-panel rounded-2xl p-5 border border-zinc-900">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Open Support Tickets</span>
                <span className="text-xl font-bold font-mono text-red-400">{tickets.filter(t => t.status === 'open').length} tickets</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 glass-panel rounded-2xl border border-zinc-900 p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">API cluster logs</h3>
                <div className="space-y-2.5 font-mono text-[10px] text-zinc-500">
                  <div className="pb-2 border-b border-zinc-900">
                    <span className="text-emerald-500 font-semibold">[17:40:02]</span> GET /api/v1/auth/me completed 200 OK (0.8ms)
                  </div>
                  <div className="pb-2 border-b border-zinc-900">
                    <span className="text-emerald-500 font-semibold">[17:40:15]</span> POST /api/v1/billing/sync completed 201 Created (14.2ms)
                  </div>
                  <div className="pb-2 border-b border-zinc-900">
                    <span className="text-emerald-500 font-semibold">[17:41:10]</span> GET /api/v1/inventory completed 200 OK (1.1ms)
                  </div>
                </div>
              </div>

              <div className="glass-panel rounded-2xl border border-zinc-900 p-6 flex flex-col justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Cluster Status</h3>
                <div className="space-y-3 font-mono text-xs mt-4">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">MongoDB:</span>
                    <span className="font-bold text-emerald-400">HEALTHY</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Redis Cache:</span>
                    <span className="font-bold text-emerald-400">ONLINE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">FastAPI Node:</span>
                    <span className="font-bold text-emerald-400">ACTIVE</span>
                  </div>
                </div>
                <div className="text-[9px] text-zinc-600 font-mono text-center pt-4">
                  PLATFORM ENGINE VERSION 1.0.0
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Restaurant Tenants */}
        {activeTab === 'tenants' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 glass-panel rounded-2xl border border-zinc-900 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">Restaurants Directory</h3>
              <div className="space-y-3">
                {tenants.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTenant(t)}
                    className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all ${
                      selectedTenant?.id === t.id
                        ? 'bg-brand-500/10 border-brand-500/30 text-brand-400'
                        : 'bg-zinc-900/30 border-zinc-900 hover:border-zinc-800 text-zinc-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-200">{t.name}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono uppercase ${
                          t.plan === 'enterprise' 
                            ? 'bg-violet-500/10 text-violet-400' 
                            : 'bg-zinc-900 text-zinc-500'
                        }`}>
                          {t.plan}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-1 font-mono">{t.id} • Owner: {t.owner}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        t.status === 'active' ? 'bg-emerald-500/10 text-emerald-450' : 'bg-red-500/10 text-red-450'
                      }`}>
                        {t.status.toUpperCase()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Feature Flags Configuration details */}
            <div className="glass-panel rounded-2xl border border-zinc-900 p-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">Feature Modules Config</h3>
              {selectedTenant ? (
                <div className="space-y-5">
                  <div className="bg-zinc-900/50 border border-zinc-850 rounded-xl p-3.5">
                    <span className="text-[9px] text-zinc-500 font-mono block">Selected Restaurant</span>
                    <h4 className="text-xs font-bold text-zinc-200 mt-1">{selectedTenant.name}</h4>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-zinc-300">QR Mobile Ordering</div>
                        <span className="text-[9px] text-zinc-500">Enable table QR menu</span>
                      </div>
                      <button onClick={() => handleToggleFeature(selectedTenant.id, 'qr_ordering')}>
                        {selectedTenant.featureFlags.qr_ordering ? <ToggleRight className="w-8 h-8 text-brand-500" /> : <ToggleLeft className="w-8 h-8 text-zinc-700" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-zinc-300">CRM & Loyalty Wallet</div>
                        <span className="text-[9px] text-zinc-500">Enable points ledger</span>
                      </div>
                      <button onClick={() => handleToggleFeature(selectedTenant.id, 'crm_loyalty')}>
                        {selectedTenant.featureFlags.crm_loyalty ? <ToggleRight className="w-8 h-8 text-brand-500" /> : <ToggleLeft className="w-8 h-8 text-zinc-700" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-zinc-300">AI Analytics Copilot</div>
                        <span className="text-[9px] text-zinc-500">Enable Gemini moving-averages</span>
                      </div>
                      <button onClick={() => handleToggleFeature(selectedTenant.id, 'ai_copilot')}>
                        {selectedTenant.featureFlags.ai_copilot ? <ToggleRight className="w-8 h-8 text-brand-500" /> : <ToggleLeft className="w-8 h-8 text-zinc-700" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-900">
                    <button
                      onClick={() => handleToggleSuspend(selectedTenant.id)}
                      className={`w-full text-xs font-semibold py-2.5 rounded-xl transition-all border ${
                        selectedTenant.status === 'suspended'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}
                    >
                      {selectedTenant.status === 'suspended' ? 'Unsuspend Restaurant Service' : 'Suspend Restaurant Service'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-12 text-xs text-zinc-600 font-mono">
                  Select a restaurant tenant profile to configure flags.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Subscriptions */}
        {activeTab === 'subscriptions' && (
          <div className="glass-panel rounded-2xl border border-zinc-900 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">SaaS Plans Configurations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-5 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">Starter Plan</h4>
                  <p className="text-[10px] text-zinc-500 mt-1">For small bistros and bakeries</p>
                </div>
                <div className="text-lg font-bold font-mono">₹1,999<span className="text-xs font-normal text-zinc-500"> / month</span></div>
                <div className="text-[10px] text-zinc-400 space-y-1">
                  <div>✓ 1 Active Branch</div>
                  <div>✓ Basic POS Billing</div>
                  <div>✗ AI Analytics</div>
                </div>
              </div>

              <div className="bg-brand-500/5 border border-brand-500/20 rounded-2xl p-5 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-brand-400">Professional Plan</h4>
                  <p className="text-[10px] text-zinc-500 mt-1">For high-volume restaurants</p>
                </div>
                <div className="text-lg font-bold font-mono text-brand-400">₹4,999<span className="text-xs font-normal text-zinc-500"> / month</span></div>
                <div className="text-[10px] text-zinc-400 space-y-1">
                  <div>✓ 3 Active Branches</div>
                  <div>✓ KDS Display Boards</div>
                  <div>✓ Inventory PO Tracking</div>
                  <div>✗ AI Analytics</div>
                </div>
              </div>

              <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-5 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">Enterprise Plan</h4>
                  <p className="text-[10px] text-zinc-500 mt-1">Multi-city chains & franchises</p>
                </div>
                <div className="text-lg font-bold font-mono">₹12,499<span className="text-xs font-normal text-zinc-500"> / month</span></div>
                <div className="text-[10px] text-zinc-400 space-y-1">
                  <div>✓ Unlimited Branches</div>
                  <div>✓ Full Recipe stock locks</div>
                  <div>✓ Gemini AI Forecasting</div>
                  <div>✓ 24/7 Priority Support</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Support Ticket Center */}
        {activeTab === 'support' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 glass-panel rounded-2xl border border-zinc-900 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">Support Ticket Inbox</h3>
              <div className="space-y-3">
                {tickets.map(ticket => (
                  <div key={ticket.id} className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-300">{ticket.restaurant}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono uppercase ${
                          ticket.priority === 'high' ? 'bg-red-500/10 text-red-450' : 'bg-zinc-800 text-zinc-550'
                        }`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1">{ticket.subject}</p>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      ticket.status === 'open' ? 'bg-amber-500/10 text-amber-450' : 'bg-zinc-950 text-zinc-600'
                    }`}>
                      {ticket.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-2xl border border-zinc-900 p-6 flex flex-col justify-between h-[300px]">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">Respond to ticket</h3>
                <textarea
                  value={supportReply}
                  onChange={(e) => setSupportReply(e.target.value)}
                  placeholder="Type official response..."
                  rows={4}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none resize-none"
                />
              </div>
              <button
                onClick={() => {
                  setSupportReply('')
                  showToast('Reply dispatched!')
                }}
                className="w-full bg-brand-650 hover:bg-brand-550 text-white rounded-xl py-2 text-xs font-semibold"
              >
                Send Official Response
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: Broadcast Announcements */}
        {activeTab === 'broadcast' && (
          <div className="glass-panel rounded-2xl border border-zinc-900 p-6 max-w-xl mx-auto w-full">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-brand-500" />
              <span>Draft SaaS Broadcast Notification</span>
            </h3>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Target Plans Scope</label>
                <select
                  value={broadTarget}
                  onChange={(e) => setBroadTarget(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none"
                >
                  <option value="all">All Subscribed Outlets</option>
                  <option value="free_trial">Free Trial Restrict Outlets Only</option>
                  <option value="premium">Professional & Enterprise Outlets Only</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Announcement Title</label>
                <input
                  type="text"
                  value={broadTitle}
                  onChange={(e) => setBroadTitle(e.target.value)}
                  placeholder="e.g. Schedule Maintenance Notice"
                  required
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Message Content</label>
                <textarea
                  value={broadMsg}
                  onChange={(e) => setBroadMsg(e.target.value)}
                  placeholder="Write message details..."
                  required
                  rows={4}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white rounded-xl py-2.5 text-xs font-semibold transition-all shadow-lg active:scale-[0.98]"
              >
                Dispatch Broadcast Announcement
              </button>
            </form>
          </div>
        )}

        {/* TAB 6: Platform Monitoring */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CPU Chart */}
              <div className="glass-panel rounded-2xl border border-zinc-900 p-6 h-[250px] flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-300">Cluster CPU Load</h4>
                  <p className="text-[10px] text-zinc-500 mt-1">Multi-core processor utilization rates</p>
                </div>
                <div className="flex items-end justify-between h-24 mt-4 gap-2">
                  {[28, 35, 42, 30, 25, 45, 34].map((v, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div 
                        style={{ height: `${v * 1.5}px` }} 
                        className={`w-full rounded-t-md transition-all ${
                          idx === 6 ? 'bg-brand-500' : 'bg-zinc-800'
                        }`} 
                      />
                      <span className="text-[8px] text-zinc-600 font-mono mt-1">T-{6 - idx}h</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* RAM Usage */}
              <div className="glass-panel rounded-2xl border border-zinc-900 p-6 h-[250px] flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-300">Cluster RAM Allocation</h4>
                  <p className="text-[10px] text-zinc-500 mt-1">Active Memory footings</p>
                </div>
                <div className="space-y-4 mt-6">
                  <div className="flex justify-between text-xs text-zinc-400 font-mono">
                    <span>Allocated: {health.ram} GB</span>
                    <span>Total: {health.ramTotal} GB</span>
                  </div>
                  <div className="w-full bg-zinc-900 rounded-full h-3 overflow-hidden border border-zinc-850">
                    <div style={{ width: `${(health.ram / health.ramTotal) * 100}%` }} className="bg-brand-500 h-full rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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
