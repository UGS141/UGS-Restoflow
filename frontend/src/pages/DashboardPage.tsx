import React, { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Sparkles, TrendingUp, Users, Clock, AlertTriangle, Layers, CreditCard, Search, Bell, Send, ArrowUpRight, ArrowDownRight, Calendar, UserCheck, Flame, Shield, CheckCircle, ChevronRight, Zap } from 'lucide-react'

// --- Types & Structures ---

interface MockTable {
  id: string
  status: 'available' | 'occupied' | 'reserved' | 'cleaning' | 'billing' | 'waiting'
  customer?: string
  waiter?: string
  timeElapsed?: string
}

interface KDSTicket {
  id: string
  tableNumber: string
  items: Array<{ name: string; quantity: number }>
  status: 'preparing' | 'ready' | 'delayed'
  chef: string
  timer: number // in seconds
}

type SubTab = 'overview' | 'floor' | 'kds' | 'analytics' | 'inventory' | 'crm' | 'finance' | 'employees' | 'reservations'

export default function DashboardPage() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('overview')
  const [aiOpen, setAiOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false)
  const [cmdInput, setCmdInput] = useState('')

  // AI Chat states
  const [aiMessages, setAiMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    { sender: 'ai', text: 'Hello! I am your UGS-Restoflow AI Copilot. Ask me anything about menu sales, inventory runout forecasts, or staff scheduling.' }
  ])
  const [aiInput, setAiInput] = useState('')

  // Live Floor tables state
  const [tables, setTables] = useState<MockTable[]>([
    { id: 'T01', status: 'occupied', customer: 'Rohan Sharma', waiter: 'Rahul', timeElapsed: '45m' },
    { id: 'T02', status: 'available' },
    { id: 'T03', status: 'reserved', customer: 'Priya Sen', timeElapsed: '8 PM' },
    { id: 'T04', status: 'billing', customer: 'Aman Varma', waiter: 'Karan', timeElapsed: '1h 10m' },
    { id: 'T05', status: 'cleaning' },
    { id: 'T06', status: 'waiting', customer: 'Sonia Roy', waiter: 'Rahul', timeElapsed: '12m' }
  ])

  // Live Kitchen state
  const [kdsTickets, setKdsTickets] = useState<KDSTicket[]>([
    { id: 'KOT-8491', tableNumber: 'T01', items: [{ name: 'Paneer Butter Masala', quantity: 1 }, { name: 'Butter Tandoori Roti', quantity: 3 }], status: 'preparing', chef: 'Chef Sanjay', timer: 145 },
    { id: 'KOT-8490', tableNumber: 'T04', items: [{ name: 'Hyderabadi Veg Biryani', quantity: 2 }, { name: 'Sweet Lassi', quantity: 2 }], status: 'delayed', chef: 'Chef Deepak', timer: 712 },
    { id: 'KOT-8489', tableNumber: 'T06', items: [{ name: 'Crispy Chilli Babycorn', quantity: 1 }], status: 'ready', chef: 'Chef Sanjay', timer: 0 }
  ])

  // Notifications
  const [notifications, setNotifications] = useState([
    { id: '1', type: 'stock', text: 'Critical Stock: Fresh Paneer is below minimum threshold.', time: '2m ago' },
    { id: '2', type: 'payment', text: 'Cash shift register successfully closed by cashier.', time: '15m ago' },
    { id: '3', type: 'reservation', text: 'New booking received for Table T03 at 8:00 PM.', time: '30m ago' }
  ])

  // Command palette search items
  const quickActions = [
    { title: 'Create Bill / Open POS', action: 'pos' },
    { title: 'Add New Reservation', action: 'reservations' },
    { title: 'Log Debit Expense Entry', action: 'finance' },
    { title: 'Add Menu Item', action: 'menu' },
    { title: 'Generate Sales Report', action: 'reports' }
  ]

  // Keyboard shortcut listener (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setCmdPaletteOpen(prev => !prev)
      }
    };
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Dynamic KDS cooking timer decrements
  useEffect(() => {
    const timer = setInterval(() => {
      setKdsTickets(prev => prev.map(t => {
        if (t.status === 'preparing' || t.status === 'delayed') {
          return { ...t, timer: t.timer + 1 }
        }
        return t
      }))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleSendAi = (textToSend?: string) => {
    const query = textToSend || aiInput
    if (!query.trim()) return

    setAiMessages(prev => [...prev, { sender: 'user', text: query }])
    if (!textToSend) setAiInput('')

    // Simulated responses based on keywords
    setTimeout(() => {
      let response = "I am processing that prompt. For advanced analytics, ensure historical billing data is seeded."
      if (query.includes('sales')) {
        response = "Sales are up 12% compared to last Saturday. Lunch rush contributed 45% of today's gross revenue."
      } else if (query.includes('stock') || query.includes('predict')) {
        response = "Based on consumption trends, you will run out of 'Fresh Paneer' in 1.4 days. Suggest drafting an auto-purchase order."
      } else if (query.includes('menu')) {
        response = "Your best-selling dish is 'Butter Tandoori Roti' followed by 'Paneer Butter Masala'. 'Crispy Chilli Babycorn' is slow-moving."
      } else if (query.includes('offer')) {
        response = "Suggest offering a 10% discount on slow-moving Chinese starters during the 3 PM - 6 PM slow valley window."
      }

      setAiMessages(prev => [...prev, { sender: 'ai', text: response }])
    }, 800)
  }

  const handleTableClick = (tableId: string) => {
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        // Simple cycle table states
        const nextStatusMap: Record<MockTable['status'], MockTable['status']> = {
          available: 'occupied',
          occupied: 'billing',
          billing: 'cleaning',
          cleaning: 'reserved',
          reserved: 'waiting',
          waiting: 'available'
        }
        return {
          ...t,
          status: nextStatusMap[t.status],
          customer: t.status === 'available' ? 'Walk-in Guest' : undefined
        }
      }
      return t
    }))
    showToast(`Table ${tableId} state updated.`)
  }

  const showToast = (msg: string) => {
    // Basic logs trigger
    console.log(`[UGS-Restoflow] ${msg}`)
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans text-zinc-100 relative overflow-hidden">
      {/* Top Premium Toolbar */}
      <header className="border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30 select-none">
        {/* Left Search input (triggers cmd palette) */}
        <button 
          onClick={() => setCmdPaletteOpen(true)}
          className="bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-zinc-500 flex items-center gap-2.5 transition-colors w-64"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search or Ctrl+K...</span>
        </button>

        {/* Inner Sub-navigation tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto max-w-xl mx-4">
          {(['overview', 'floor', 'kds', 'analytics', 'inventory', 'crm', 'finance', 'employees', 'reservations'] as SubTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`text-[10px] font-semibold px-2.5 py-1.5 rounded-lg capitalize transition-all whitespace-nowrap ${
                activeSubTab === tab
                  ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/20'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </nav>

        {/* Right side buttons (Notif & AI toggle) */}
        <div className="flex items-center gap-2">
          {/* Notification dropdown trigger */}
          <div className="relative">
            <button 
              onClick={() => setNotifOpen(!notifOpen)}
              className={`p-2.5 rounded-xl border transition-colors ${
                notifOpen ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-zinc-900/40 border-zinc-900 text-zinc-400'
              }`}
            >
              <Bell className="w-4 h-4" />
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2.5 w-80 bg-zinc-950 border border-zinc-900 rounded-2xl p-4 shadow-2xl space-y-3 z-50">
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Alert Center</div>
                <div className="space-y-2.5 max-h-60 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-3 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-zinc-300 leading-relaxed">{n.text}</p>
                        <span className="text-[8px] text-zinc-650 font-mono mt-1 block">{n.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Drawer toggle */}
          <button 
            onClick={() => setAiOpen(!aiOpen)}
            className={`p-2.5 rounded-xl border transition-colors flex items-center gap-1.5 ${
              aiOpen ? 'bg-brand-500/10 border-brand-500/30 text-brand-400' : 'bg-zinc-900/40 border-zinc-900 text-zinc-400'
            }`}
          >
            <Sparkles className="w-4 h-4 text-brand-500" />
            <span className="text-xs font-semibold">AI Assistant</span>
          </button>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full relative z-10">
        
        {/* SUBTAB 1: Overview Dashboard (17 metrics) */}
        {activeSubTab === 'overview' && (
          <div className="space-y-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Live Restaurant Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="glass-panel p-4 rounded-xl border border-zinc-900">
                <span className="text-[9px] text-zinc-500 block uppercase font-medium">Today's Sales</span>
                <span className="text-lg font-bold font-mono text-zinc-200 mt-1 block">₹34,500</span>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-zinc-900">
                <span className="text-[9px] text-zinc-500 block uppercase font-medium">Active Orders</span>
                <span className="text-lg font-bold font-mono text-brand-400 mt-1 block">6 orders</span>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-zinc-900">
                <span className="text-[9px] text-zinc-500 block uppercase font-medium">Occupied Tables</span>
                <span className="text-lg font-bold font-mono text-zinc-200 mt-1 block">4 tables</span>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-zinc-900">
                <span className="text-[9px] text-zinc-500 block uppercase font-medium">Customers served</span>
                <span className="text-lg font-bold font-mono text-zinc-200 mt-1 block">48</span>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-zinc-900">
                <span className="text-[9px] text-zinc-500 block uppercase font-medium">Staff Present</span>
                <span className="text-lg font-bold font-mono text-emerald-450 mt-1 block">8 present</span>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-zinc-900">
                <span className="text-[9px] text-zinc-500 block uppercase font-medium">Average Order Value</span>
                <span className="text-lg font-bold font-mono text-zinc-200 mt-1 block">₹580</span>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-zinc-900">
                <span className="text-[9px] text-zinc-500 block uppercase font-medium">Kitchen Queue</span>
                <span className="text-lg font-bold font-mono text-zinc-200 mt-1 block">3 tickets</span>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-zinc-900">
                <span className="text-[9px] text-zinc-500 block uppercase font-medium">Stock Alerts</span>
                <span className="text-lg font-bold font-mono text-red-400 mt-1 block">2 warnings</span>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-zinc-900">
                <span className="text-[9px] text-zinc-500 block uppercase font-medium">Reservations today</span>
                <span className="text-lg font-bold font-mono text-zinc-200 mt-1 block">5 bookings</span>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-zinc-900">
                <span className="text-[9px] text-zinc-500 block uppercase font-medium">Net Profit</span>
                <span className="text-lg font-bold font-mono text-emerald-450 mt-1 block">₹12,400</span>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-zinc-900">
                <span className="text-[9px] text-zinc-500 block uppercase font-medium">Pending Payments</span>
                <span className="text-lg font-bold font-mono text-amber-500 mt-1 block">₹1,850</span>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-zinc-900">
                <span className="text-[9px] text-zinc-500 block uppercase font-medium">Wallet Balances</span>
                <span className="text-lg font-bold font-mono text-zinc-200 mt-1 block">₹45,000</span>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: Live Interactive Floor Layout */}
        {activeSubTab === 'floor' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Dining Room Table Grid</h3>
              <div className="flex gap-2 text-[9px] font-mono">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" /> Occupied</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Reserved</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-zinc-800" /> Cleaning</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {tables.map(table => (
                <button
                  key={table.id}
                  onClick={() => handleTableClick(table.id)}
                  className={`border rounded-2xl p-5 flex flex-col justify-between h-36 transition-all text-left ${
                    table.status === 'occupied'
                      ? 'bg-brand-500/5 border-brand-500/20 text-brand-400'
                      : table.status === 'reserved'
                      ? 'bg-blue-500/5 border-blue-500/20 text-blue-400'
                      : table.status === 'cleaning'
                      ? 'bg-zinc-900/30 border-zinc-800 text-zinc-500'
                      : table.status === 'billing'
                      ? 'bg-amber-500/5 border-amber-500/20 text-amber-400 animate-pulse'
                      : 'bg-zinc-950 border-zinc-900 hover:border-zinc-850 text-zinc-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold font-mono uppercase">{table.id}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold font-mono uppercase ${
                      table.status === 'occupied' ? 'bg-brand-500/20' : 'bg-zinc-900 text-zinc-500'
                    }`}>
                      {table.status}
                    </span>
                  </div>

                  {table.customer && (
                    <div className="mt-4">
                      <span className="text-[10px] text-zinc-300 block truncate font-medium">{table.customer}</span>
                      <span className="text-[8px] text-zinc-500 font-mono mt-0.5 block">Waiter: {table.waiter} • {table.timeElapsed}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB 3: Live Kitchen Display Queue */}
        {activeSubTab === 'kds' && (
          <div className="space-y-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">Kitchen prep line</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {kdsTickets.map(ticket => (
                <div 
                  key={ticket.id} 
                  className={`bg-zinc-900/30 border rounded-2xl p-5 flex flex-col justify-between h-64 ${
                    ticket.status === 'delayed' ? 'border-red-500/30' : 'border-zinc-900'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center border-b border-zinc-900 pb-2 mb-3">
                      <div>
                        <span className="text-xs font-bold font-mono text-zinc-300">{ticket.id}</span>
                        <span className="text-[9px] text-zinc-500 font-mono block">Chef: {ticket.chef}</span>
                      </div>
                      <span className="text-xs bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded-md font-bold font-mono text-zinc-300">
                        Table {ticket.tableNumber}
                      </span>
                    </div>

                    <ul className="space-y-2 max-h-24 overflow-y-auto pr-1">
                      {ticket.items.map((item, idx) => (
                        <li key={idx} className="flex justify-between items-start text-xs">
                          <span className="text-zinc-400">{item.name}</span>
                          <span className="font-bold text-brand-400 font-mono">x{item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-zinc-900/40">
                    <div className="flex items-center gap-1.5 font-mono text-xs">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      <span className={ticket.status === 'delayed' ? 'text-red-400 font-bold' : 'text-zinc-400'}>
                        {Math.floor(ticket.timer / 60)}:{(ticket.timer % 60).toString().padStart(2, '0')}
                      </span>
                    </div>

                    <button 
                      onClick={() => showToast(`Ticket ${ticket.id} prepared.`)}
                      className="bg-brand-600 hover:bg-brand-500 text-white rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-[0.98]"
                    >
                      Bump order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB 4: Sales Analytics charts */}
        {activeSubTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 glass-panel rounded-2xl border border-zinc-900 p-6 h-[320px] flex flex-col justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Gross Sales Analytics</h3>
                <div className="flex-1 w-full min-h-[220px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { day: 'Mon', sales: 12000 },
                      { day: 'Tue', sales: 18500 },
                      { day: 'Wed', sales: 15000 },
                      { day: 'Thu', sales: 22400 },
                      { day: 'Fri', sales: 29000 },
                      { day: 'Sat', sales: 34500 }
                    ]}>
                      <defs>
                        <linearGradient id="glowSalesDash" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" stroke="#52525b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#52525b" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#09090b', borderColor: '#27272a', borderRadius: '12px' }} />
                      <Area type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#glowSalesDash)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-panel rounded-2xl border border-zinc-900 p-6 h-[320px] flex flex-col justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Peak hours rush</h3>
                <div className="flex-1 min-h-[200px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { hour: '12 PM', orders: 12 },
                      { hour: '1 PM', orders: 25 },
                      { hour: '2 PM', orders: 18 },
                      { hour: '8 PM', orders: 42 },
                      { hour: '9 PM', orders: 35 }
                    ]}>
                      <XAxis dataKey="hour" stroke="#52525b" fontSize={9} tickLine={false} />
                      <YAxis stroke="#52525b" fontSize={9} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#09090b', borderColor: '#27272a' }} />
                      <Bar dataKey="orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 5: Inventory Prediction */}
        {activeSubTab === 'inventory' && (
          <div className="space-y-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Stock Threshold Predictions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-zinc-300">Fresh Paneer (Cottage Cheese)</div>
                  <span className="text-[9px] text-zinc-500 block font-mono mt-1">Current: 2.1kg • Min threshold: 5.0kg</span>
                </div>
                <span className="text-[10px] text-red-400 font-mono font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                  Runout in 1.4 days
                </span>
              </div>

              <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-zinc-300">Amul Salted Butter</div>
                  <span className="text-[9px] text-zinc-500 block font-mono mt-1">Current: 4.8kg • Min threshold: 4.0kg</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Stock Healthy
                </span>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 6: CRM Wallet Anniversaries */}
        {activeSubTab === 'crm' && (
          <div className="space-y-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Customer profiles & wallets</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-panel rounded-2xl border border-zinc-900 p-5 space-y-4">
                <span className="text-[9px] text-zinc-500 block font-bold uppercase tracking-wider">Top customers</span>
                <div className="space-y-3 text-xs leading-normal">
                  <div className="flex justify-between">
                    <span className="text-zinc-300 font-medium">Aman Varma</span>
                    <span className="font-mono text-brand-400">12 visits (₹8,450 spent)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-300 font-medium">Sita Sen</span>
                    <span className="font-mono text-brand-400">8 visits (₹5,120 spent)</span>
                  </div>
                </div>
              </div>

              <div className="glass-panel rounded-2xl border border-zinc-900 p-5 space-y-4">
                <span className="text-[9px] text-zinc-500 block font-bold uppercase tracking-wider">Birthdays Today</span>
                <div className="text-xs text-zinc-400 leading-normal flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-zinc-500" />
                  <span>Sonia Roy (Loyalty code: HBD50 generated)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 7: Finance Cash Register ledger */}
        {activeSubTab === 'finance' && (
          <div className="space-y-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Finance Ledger</h3>
            <div className="glass-panel rounded-2xl border border-zinc-900 p-5 space-y-4">
              <span className="text-[9px] text-zinc-500 block font-bold uppercase tracking-wider">Shift cash summary</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
                <div className="bg-zinc-900/50 p-4 border border-zinc-850 rounded-xl">
                  <span className="text-[9px] text-zinc-550 block">Opening Cash float</span>
                  <span className="text-lg font-bold text-zinc-200 mt-1 block">₹5,000</span>
                </div>
                <div className="bg-zinc-900/50 p-4 border border-zinc-850 rounded-xl">
                  <span className="text-[9px] text-zinc-550 block">Drawer Expected</span>
                  <span className="text-lg font-bold text-zinc-200 mt-1 block">₹14,500</span>
                </div>
                <div className="bg-zinc-900/50 p-4 border border-zinc-850 rounded-xl">
                  <span className="text-[9px] text-zinc-550 block">Expenses debited</span>
                  <span className="text-lg font-bold text-zinc-200 mt-1 block">₹1,200</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 8: Employees Attendance */}
        {activeSubTab === 'employees' && (
          <div className="space-y-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Staff Shift Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserCheck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold text-zinc-200">Rahul Dev</div>
                    <span className="text-[9px] text-zinc-500 block mt-0.5">Role: Waiter • Shift: 1 PM - 10 PM</span>
                  </div>
                </div>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 px-2 py-0.5 rounded font-bold font-mono">
                  PRESENT
                </span>
              </div>

              <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserCheck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold text-zinc-200">Karan Singh</div>
                    <span className="text-[9px] text-zinc-500 block mt-0.5">Role: Cashier • Shift: 9 AM - 6 PM</span>
                  </div>
                </div>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 px-2 py-0.5 rounded font-bold font-mono">
                  PRESENT
                </span>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 9: Reservations Grid */}
        {activeSubTab === 'reservations' && (
          <div className="space-y-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Upcoming Reservations</h3>
            <div className="space-y-3">
              {[
                { name: 'Priya Sen', guests: 4, table: 'T03', time: '8:00 PM', status: 'confirmed' },
                { name: 'Aman Varma', guests: 2, table: 'T02', time: '9:30 PM', status: 'confirmed' }
              ].map((res, idx) => (
                <div key={idx} className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-4 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-zinc-300">{res.name}</div>
                    <span className="text-[9px] text-zinc-500 block mt-0.5">Table {res.table} • Guests: {res.guests}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-zinc-400 font-bold block">{res.time}</span>
                    <span className="text-[8px] bg-emerald-500/10 text-emerald-450 px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-block">{res.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* AI SIDE-DRAWER PANEL */}
      {aiOpen && (
        <aside className="fixed top-0 right-0 h-full w-96 bg-zinc-950 border-l border-zinc-900 shadow-2xl z-50 flex flex-col justify-between animate-slide-left">
          {/* Header */}
          <div className="p-4 border-b border-zinc-900 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-500 animate-pulse" />
              <span className="text-xs font-bold text-zinc-200">AI Copilot Business Assistant</span>
            </div>
            <button onClick={() => setAiOpen(false)} className="text-xs text-zinc-500 hover:text-zinc-300">Close</button>
          </div>

          {/* Prompt quick chips */}
          <div className="p-3 border-b border-zinc-900/40 flex gap-1.5 overflow-x-auto select-none shrink-0">
            <button 
              onClick={() => handleSendAi('Why are sales down?')}
              className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 rounded-lg px-2.5 py-1 text-[9px] font-semibold text-zinc-400 whitespace-nowrap"
            >
              Why are sales down?
            </button>
            <button 
              onClick={() => handleSendAi('Predict stock limits')}
              className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 rounded-lg px-2.5 py-1 text-[9px] font-semibold text-zinc-400 whitespace-nowrap"
            >
              Predict stock limits
            </button>
            <button 
              onClick={() => handleSendAi('Recommend offers')}
              className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 rounded-lg px-2.5 py-1 text-[9px] font-semibold text-zinc-400 whitespace-nowrap"
            >
              Recommend offers
            </button>
          </div>

          {/* Message timeline */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {aiMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-brand-650 text-white rounded-br-none' 
                      : 'bg-zinc-900 border border-zinc-900 text-zinc-300 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Form sender */}
          <div className="p-4 border-t border-zinc-900 flex gap-2">
            <input 
              type="text" 
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendAi()}
              placeholder="Ask Restoflow AI..."
              className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-brand-500/50"
            />
            <button 
              onClick={() => handleSendAi()}
              className="bg-brand-600 hover:bg-brand-500 text-white p-2 rounded-xl transition-all"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>
      )}

      {/* COMMAND PALETTE OVERLAY (Ctrl+K) */}
      {cmdPaletteOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-24">
          <div className="w-full max-w-xl bg-zinc-950 border border-zinc-900 rounded-2xl shadow-2xl overflow-hidden animate-zoom-in">
            {/* Input bar */}
            <div className="p-4 border-b border-zinc-900 flex items-center gap-3">
              <Search className="w-4 h-4 text-zinc-500" />
              <input
                type="text"
                autoFocus
                value={cmdInput}
                onChange={(e) => setCmdInput(e.target.value)}
                placeholder="Type quick action or search module..."
                className="flex-1 bg-transparent text-sm text-zinc-200 focus:outline-none"
              />
              <button 
                onClick={() => setCmdPaletteOpen(false)}
                className="text-[10px] bg-zinc-900 border border-zinc-850 px-1.5 py-0.5 rounded text-zinc-500 uppercase font-mono"
              >
                ESC
              </button>
            </div>

            {/* List options */}
            <div className="p-3 max-h-80 overflow-y-auto space-y-1">
              <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-wider block p-2">Quick Commands</span>
              {quickActions
                .filter(a => a.title.toLowerCase().includes(cmdInput.toLowerCase()))
                .map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCmdPaletteOpen(false)
                      showToast(`Opened ${action.action} workspace.`)
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-zinc-900/50 flex items-center justify-between text-xs text-zinc-350 hover:text-zinc-250 transition-colors"
                  >
                    <span>{action.title}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-650" />
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
