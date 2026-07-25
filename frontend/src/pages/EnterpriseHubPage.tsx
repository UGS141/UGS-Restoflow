import React, { useState } from 'react'
import { Sparkles, Zap, Shield, GitPullRequest, Settings, Terminal, FileText, CheckSquare, Calendar, Phone, Activity, Heart, RefreshCw, Key, ToggleLeft, ToggleRight, Trash2, Check, X, Plus } from 'lucide-react'

// --- Types & Interfaces ---

interface ApprovalRequest {
  id: string
  restaurant: string
  type: 'void_bill' | 'refund' | 'large_discount' | 'price_change'
  details: string
  timestamp: string
  status: 'pending' | 'approved' | 'rejected'
}

interface AutomationRule {
  id: string
  name: string
  trigger: string
  condition: string
  action: string
  isActive: boolean
}

type EnterpriseTab = 'bi' | 'franchise' | 'automation' | 'approvals' | 'vendors' | 'documents' | 'crm' | 'integrations' | 'recovery'

export default function EnterpriseHubPage() {
  const [activeTab, setActiveTab] = useState<EnterpriseTab>('bi')
  const [toast, setToast] = useState('')

  // Approvals state
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([
    { id: 'app_201', restaurant: 'Gourmet Garden Cafe', type: 'void_bill', details: 'Void Bill #BILL-9842 (Value: ₹3,450) - Manager approval required', timestamp: '18:10', status: 'pending' },
    { id: 'app_202', restaurant: 'Blue Tokai Cafe', type: 'refund', details: 'Refund requested for customer Sita Nair (Value: ₹1,200)', timestamp: '17:45', status: 'pending' },
    { id: 'app_203', restaurant: 'Paradise Biryani', type: 'price_change', details: 'Menu Price Increase: Paneer Tikka (₹260 -> ₹290)', timestamp: '15:20', status: 'pending' }
  ])

  // Automation rules state
  const [rules, setRules] = useState<AutomationRule[]>([
    { id: 'rule_1', name: 'Low Stock Auto-Alert', trigger: 'Stock Level Drop', condition: 'Stock < reorder level', action: 'Notify Store Manager', isActive: true },
    { id: 'rule_2', name: 'Birthday Loyalty Boost', trigger: 'Customer Birthday', condition: 'Loyalty profile active', action: 'Send 15% coupon SMS', isActive: true },
    { id: 'rule_3', name: 'VIP Ticket Approval Escalation', trigger: 'Bill size exceed', condition: 'Bill > ₹10,000', action: 'Require Owner Pin', isActive: false }
  ])

  // Rule builder inputs
  const [newRuleName, setNewRuleName] = useState('')
  const [newRuleTrigger, setNewRuleTrigger] = useState('Stock Level Drop')
  const [newRuleAction, setNewRuleAction] = useState('Notify Store Manager')

  // Chat/Comms messages
  const [comms, setComms] = useState([
    { id: '1', sender: 'Owner', text: 'Team, please make sure the kitchen cleaning checklist is updated by 9 PM tonight.', time: '18:12' },
    { id: '2', sender: 'Chef Sanjay', text: 'Understood. Weekly refrigerator preventive service also completed.', time: '18:20' }
  ])
  const [commsInput, setCommsInput] = useState('')

  // Integrations states
  const [razorpayWebhook, setRazorpayWebhook] = useState('https://api.ugsrestoflow.com/v1/webhooks/razorpay')
  const [tallySync, setTallySync] = useState(true)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleActionRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r))
    showToast('Automation rule toggled!')
  }

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRuleName) return
    const newRule: AutomationRule = {
      id: `rule_${Date.now()}`,
      name: newRuleName,
      trigger: newRuleTrigger,
      condition: 'Custom logic constraints',
      action: newRuleAction,
      isActive: true
    }
    setRules(prev => [...prev, newRule])
    setNewRuleName('')
    showToast(`Rule '${newRuleName}' created successfully!`)
  }

  const handleProcessApproval = (id: string, action: 'approved' | 'rejected') => {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: action } : a))
    showToast(`Request ${action === 'approved' ? 'Approved' : 'Rejected'}!`)
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans text-zinc-100 select-none">
      
      {/* Top Banner indicating Version 2.0 Enterprise Mode */}
      <div className="bg-gradient-to-r from-brand-700 to-violet-750 px-6 py-2 flex items-center justify-between text-xs font-semibold border-b border-brand-500/20 shadow-md">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-white animate-pulse" />
          <span>Restoflow v2.0 Enterprise Business Operating System Active</span>
        </div>
        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-mono">Enterprise Level Node</span>
      </div>

      {/* Header Viewport Tabs */}
      <header className="border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <GitPullRequest className="w-5 h-5 text-brand-500" />
          <h1 className="font-semibold text-zinc-200 tracking-tight text-sm">Enterprise Business Hub</h1>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto max-w-2xl">
          {(['bi', 'franchise', 'automation', 'approvals', 'vendors', 'documents', 'crm', 'integrations', 'recovery'] as EnterpriseTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-[10px] font-semibold px-2.5 py-1.5 rounded-lg capitalize transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/20'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </nav>
      </header>

      {/* Workspace Area */}
      <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">

        {/* TAB 1: Business Intelligence (BI) Dashboard */}
        {activeTab === 'bi' && (
          <div className="space-y-6">
            {/* Executive KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-panel p-5 rounded-2xl border border-zinc-900">
                <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider">Live Revenue</span>
                <span className="text-xl font-bold font-mono text-zinc-200 mt-2 block">₹12,45,800.00</span>
                <span className="text-[9px] text-emerald-450 font-mono block mt-1">+14.2% MoM</span>
              </div>
              <div className="glass-panel p-5 rounded-2xl border border-zinc-900">
                <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider">Cost of Goods Sold (COGS)</span>
                <span className="text-xl font-bold font-mono text-zinc-200 mt-2 block">₹4,22,400.00</span>
                <span className="text-[9px] text-zinc-500 font-mono block mt-1">Food Cost: 33.9%</span>
              </div>
              <div className="glass-panel p-5 rounded-2xl border border-zinc-900">
                <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider">Labor Cost Ratio</span>
                <span className="text-xl font-bold font-mono text-zinc-200 mt-2 block">18.5% ratio</span>
                <span className="text-[9px] text-emerald-450 font-mono block mt-1">Optimal Target: &lt;20%</span>
              </div>
              <div className="glass-panel p-5 rounded-2xl border border-zinc-900">
                <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider">Business Health Score</span>
                <span className="text-xl font-bold font-mono text-brand-450 mt-2 block">96 / 100</span>
                <span className="text-[9px] text-brand-400 font-mono block mt-1">Excellent stability</span>
              </div>
            </div>

            {/* AI Business summaries */}
            <div className="glass-panel rounded-2xl border border-zinc-900 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-500 animate-pulse" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Daily AI Summary Insights</h3>
              </div>
              <div className="text-xs text-zinc-400 leading-relaxed space-y-2 font-mono">
                <p>• Anomalies: High consumption of "Fresh Paneer" during non-peak lunch window detected on Saturday. Recipe weights reconciliation suggested.</p>
                <p>• Profitability: Blue Tokai Delhi branch margins improved by 2.4% due to local supplier rate negotiation.</p>
                <p>• Action: Schedule preventive AC maintenance at Gourmet Garden branch to avoid summer outages.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Franchise Management */}
        {activeTab === 'franchise' && (
          <div className="glass-panel rounded-2xl border border-zinc-900 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">Branch Performance & Rankings</h3>
            <div className="space-y-4 font-mono text-xs">
              {[
                { name: 'Blue Tokai Cafe Delhi', sales: '₹4,85,000', royaltyDue: '₹48,500 (10%)', health: '98%' },
                { name: 'Gourmet Garden Cafe Delhi', sales: '₹3,45,000', royaltyDue: '₹34,500 (10%)', health: '95%' },
                { name: 'Paradise Biryani Palace', sales: '₹2,10,000', royaltyDue: '₹21,000 (10%)', health: '82%' }
              ].map((b, idx) => (
                <div key={idx} className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-zinc-550 font-bold">#0{idx+1}</span>
                    <span className="text-zinc-200 font-bold ml-2">{b.name}</span>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-brand-400 font-bold">{b.sales} Sales</div>
                    <div className="text-[10px] text-zinc-500">Royalty: {b.royaltyDue}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Workflow Automation Engine */}
        {activeTab === 'automation' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 glass-panel rounded-2xl border border-zinc-900 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">Active Automation Rules</h3>
              <div className="space-y-3">
                {rules.map(r => (
                  <div key={r.id} className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-zinc-200">{r.name}</div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-1">
                        IF <span className="text-brand-400 font-semibold">{r.trigger}</span> ({r.condition}) $\rightarrow$ THEN <span className="text-brand-400 font-semibold">{r.action}</span>
                      </div>
                    </div>

                    <button onClick={() => handleActionRule(r.id)}>
                      {r.isActive ? <ToggleRight className="w-8 h-8 text-brand-500" /> : <ToggleLeft className="w-8 h-8 text-zinc-700" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-2xl border border-zinc-900 p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">Add Custom Rule</h3>
                <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[9px] text-zinc-500 uppercase font-semibold mb-1">Rule Name</label>
                    <input
                      type="text"
                      value={newRuleName}
                      onChange={(e) => setNewRuleName(e.target.value)}
                      placeholder="e.g. High Discount Escalation"
                      required
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-zinc-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-zinc-500 uppercase font-semibold mb-1">Trigger Event</label>
                    <select
                      value={newRuleTrigger}
                      onChange={(e) => setNewRuleTrigger(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-zinc-200 focus:outline-none"
                    >
                      <option value="Stock Level Drop">Stock Level Drop</option>
                      <option value="Customer Birthday">Customer Birthday</option>
                      <option value="Bill size exceed">Bill size exceed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] text-zinc-500 uppercase font-semibold mb-1">Action</label>
                    <select
                      value={newRuleAction}
                      onChange={(e) => setNewRuleAction(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-zinc-200 focus:outline-none"
                    >
                      <option value="Notify Store Manager">Notify Store Manager</option>
                      <option value="Send 15% coupon SMS">Send 15% coupon SMS</option>
                      <option value="Require Owner Pin">Require Owner Pin</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-brand-650 hover:bg-brand-550 text-white rounded-xl py-2.5 text-xs font-semibold mt-4"
                  >
                    Deploy Rule
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Manager Approval Workflows */}
        {activeTab === 'approvals' && (
          <div className="glass-panel rounded-2xl border border-zinc-900 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">Pending Approvals Queue</h3>
            <div className="space-y-3">
              {approvals.filter(a => a.status === 'pending').map(a => (
                <div key={a.id} className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-250">{a.restaurant}</span>
                      <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono uppercase">{a.type}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1">{a.details}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleProcessApproval(a.id, 'rejected')}
                      className="bg-red-500/10 text-red-400 border border-red-500/20 p-2 rounded-xl"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleProcessApproval(a.id, 'approved')}
                      className="bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 p-2 rounded-xl"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {approvals.filter(a => a.status === 'pending').length === 0 && (
                <div className="text-center p-12 text-xs text-zinc-600 font-mono">
                  All approvals clear. No pending items.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: Vendor Workspace */}
        {activeTab === 'vendors' && (
          <div className="glass-panel rounded-2xl border border-zinc-900 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">Vendor registry</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <div className="font-bold text-zinc-200">Modern Farm Products</div>
                  <span className="text-[9px] text-zinc-500 mt-1 block">FSSAI License: 1122485293 • Category: Dairy</span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Active Vendor</span>
              </div>

              <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <div className="font-bold text-zinc-200">Gourmet Spice Traders</div>
                  <span className="text-[9px] text-zinc-500 mt-1 block">FSSAI License: 1332585222 • Category: Spices</span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Active Vendor</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: Document Center & Comms */}
        {activeTab === 'documents' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 glass-panel rounded-2xl border border-zinc-900 p-6 h-[400px] flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-zinc-500" />
                  <span>Team Chat Workspace</span>
                </h3>
                <div className="space-y-3 overflow-y-auto max-h-60 pr-1">
                  {comms.map(msg => (
                    <div key={msg.id} className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-3 text-xs leading-normal">
                      <div className="flex justify-between items-center mb-1 text-[10px] text-zinc-550 font-bold uppercase">
                        <span>{msg.sender}</span>
                        <span>{msg.time}</span>
                      </div>
                      <p className="text-zinc-350">{msg.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-zinc-900">
                <input
                  type="text"
                  value={commsInput}
                  onChange={(e) => setCommsInput(e.target.value)}
                  placeholder="Send chat update..."
                  className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none"
                />
                <button
                  onClick={() => {
                    if (!commsInput.trim()) return
                    setComms(prev => [...prev, { id: Date.now().toString(), sender: 'Owner', text: commsInput, time: 'Now' }])
                    setCommsInput('')
                  }}
                  className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  Send
                </button>
              </div>
            </div>

            {/* Document lockers */}
            <div className="bg-white/5 border border-zinc-900 rounded-2xl p-6 h-[400px] flex flex-col">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">Corporate Document Locker</h3>
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {[
                  { name: 'FSSAI License Certificate.pdf', size: '1.2 MB', expiry: 'Expires 2027-04-12' },
                  { name: 'GST Register Copy.pdf', size: '890 KB', expiry: 'Verified' },
                  { name: 'Lease Agreement Delhi.pdf', size: '4.8 MB', expiry: 'Expires 2028-10-30' }
                ].map((doc, idx) => (
                  <div key={idx} className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-3 flex justify-between items-center text-xs font-mono">
                    <div>
                      <div className="font-bold text-zinc-300 truncate max-w-[150px]">{doc.name}</div>
                      <span className="text-[8px] text-zinc-500 mt-1 block">{doc.size} • {doc.expiry}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: Customer Experience & Campaigns */}
        {activeTab === 'crm' && (
          <div className="space-y-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">NPS score & loyalty builders</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-panel p-5 rounded-2xl border border-zinc-900">
                <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider">NPS Score</span>
                <span className="text-xl font-bold font-mono text-zinc-200 mt-2 block">78 NPS</span>
                <span className="text-[9px] text-emerald-450 font-mono block mt-1">+2.1 Net promoter gain</span>
              </div>
              <div className="glass-panel p-5 rounded-2xl border border-zinc-900">
                <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider">CSAT Score</span>
                <span className="text-xl font-bold font-mono text-zinc-200 mt-2 block">4.8 / 5.0</span>
                <span className="text-[9px] text-emerald-450 font-mono block mt-1">Based on 210 feedbacks</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: APIs & Integrations */}
        {activeTab === 'integrations' && (
          <div className="glass-panel rounded-2xl border border-zinc-900 p-6 max-w-xl mx-auto w-full">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
              <Key className="w-4 h-4 text-brand-500" />
              <span>SaaS Integrations Center</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[9px] text-zinc-500 uppercase font-semibold mb-1.5">Active webhook destination</label>
                <input
                  type="text"
                  value={razorpayWebhook}
                  onChange={(e) => setRazorpayWebhook(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-zinc-200 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-zinc-300">Tally ERP Sync</span>
                  <p className="text-[9px] text-zinc-500 mt-0.5">Toggles auto ledger balance posts at shift closures</p>
                </div>
                <button onClick={() => setTallySync(!tallySync)}>
                  {tallySync ? <ToggleRight className="w-8 h-8 text-brand-500" /> : <ToggleLeft className="w-8 h-8 text-zinc-700" />}
                </button>
              </div>

              <button
                onClick={() => showToast('Integrations updated!')}
                className="w-full bg-brand-650 hover:bg-brand-550 text-white rounded-xl py-2.5 text-xs font-semibold mt-4"
              >
                Save configurations
              </button>
            </div>
          </div>
        )}

        {/* TAB 9: Disaster Recovery Snapshots */}
        {activeTab === 'recovery' && (
          <div className="glass-panel rounded-2xl border border-zinc-900 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">Restore Points</h3>
            <div className="space-y-3 font-mono text-xs">
              {[
                { name: 'Pre-Seeder Baseline snapshot', timestamp: '2026-07-25 02:00:00', size: '24 MB' },
                { name: 'Daily Automatic DB snapshot', timestamp: '2026-07-24 05:00:00', size: '23.8 MB' }
              ].map((snap, idx) => (
                <div key={idx} className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-zinc-200">{snap.name}</div>
                    <span className="text-[9px] text-zinc-550 mt-1 block">{snap.timestamp} • Size: {snap.size}</span>
                  </div>
                  <button
                    onClick={() => showToast('Database state restored.')}
                    className="bg-brand-600 hover:bg-brand-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Floating status toast */}
      {toast && (
        <div className="fixed bottom-6 left-6 z-50 bg-zinc-900 border border-brand-500/20 text-brand-400 rounded-xl px-4 py-3 text-xs shadow-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}
