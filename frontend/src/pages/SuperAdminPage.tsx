import React, { useState, useEffect } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Shield, Users, CreditCard, Sparkles, Plus, ToggleLeft, ToggleRight, Database, Settings, Mail, Bell, Activity, RefreshCw, AlertTriangle, CheckCircle, Search, Filter, MessageSquare, MapPin, Globe, Server, UserCheck, HardDrive, Key } from 'lucide-react'

// --- Types & Interfaces ---

interface RestaurantTenant {
  id: string
  name: string
  owner: string
  email: string
  phone: string
  city: string
  state: string
  country: string
  plan: 'free_trial' | 'starter' | 'professional' | 'enterprise'
  status: 'active' | 'suspended' | 'expired'
  renewalDate: string
  branchCount: number
  employeeCount: number
  storageGb: number
  healthScore: number
  featureFlags: Record<string, boolean>
}

interface SupportTicket {
  id: string
  restaurant: string
  subject: string
  priority: 'low' | 'medium' | 'high'
  status: 'open' | 'progress' | 'resolved'
  slaHours: number
}

// --- Seed Data ---

const INITIAL_RESTAURANTS: RestaurantTenant[] = [
  {
    id: 'ten_demo',
    name: 'Gourmet Garden Cafe',
    owner: 'Rohan Mehta',
    email: 'owner@gourmetgarden.com',
    phone: '9876543210',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    plan: 'free_trial',
    status: 'active',
    renewalDate: '2026-08-25',
    branchCount: 1,
    employeeCount: 5,
    storageGb: 1.2,
    healthScore: 98,
    featureFlags: { qr_ordering: true, crm_loyalty: true, ai_copilot: false, kds_display: true, ONDC: false, whatsapp: true }
  },
  {
    id: 'ten_cafe_tokai',
    name: 'Blue Tokai Cafe',
    owner: 'Vikram Singh',
    email: 'vikram@bluetokai.com',
    phone: '9822334455',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    plan: 'professional',
    status: 'active',
    renewalDate: '2027-02-15',
    branchCount: 3,
    employeeCount: 18,
    storageGb: 4.8,
    healthScore: 95,
    featureFlags: { qr_ordering: true, crm_loyalty: true, ai_copilot: true, kds_display: true, ONDC: true, whatsapp: true }
  },
  {
    id: 'ten_paradise',
    name: 'Paradise Biryani',
    owner: 'Aman Khan',
    email: 'aman@paradise.com',
    phone: '9766554433',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    plan: 'starter',
    status: 'suspended',
    renewalDate: '2026-07-20',
    branchCount: 2,
    employeeCount: 12,
    storageGb: 2.1,
    healthScore: 82,
    featureFlags: { qr_ordering: false, crm_loyalty: true, ai_copilot: false, kds_display: true, ONDC: false, whatsapp: false }
  },
  {
    id: 'ten_organic',
    name: 'The Organic Bistro',
    owner: 'Sita Nair',
    email: 'sita@organicbistro.in',
    phone: '9544332211',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    plan: 'enterprise',
    status: 'active',
    renewalDate: '2027-06-30',
    branchCount: 5,
    employeeCount: 35,
    storageGb: 9.4,
    healthScore: 99,
    featureFlags: { qr_ordering: true, crm_loyalty: true, ai_copilot: true, kds_display: true, ONDC: true, whatsapp: true }
  }
]

const INITIAL_TICKETS: SupportTicket[] = [
  { id: 't_101', restaurant: 'Gourmet Garden Cafe', subject: 'Printer setup connection issue', priority: 'high', status: 'open', slaHours: 4 },
  { id: 't_102', restaurant: 'Paradise Biryani', subject: 'Failed payment renewal query', priority: 'medium', status: 'progress', slaHours: 24 },
  { id: 't_103', restaurant: 'Blue Tokai Cafe', subject: 'KDS screen status refresh lag', priority: 'low', status: 'resolved', slaHours: 48 }
]

type PlatformTab = 'dashboard' | 'map' | 'analytics' | 'tenants' | 'subscriptions' | 'support' | 'feature_flags' | 'broadcast' | 'monitoring' | 'audit' | 'settings'

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<PlatformTab>('dashboard')
  const [restaurants, setRestaurants] = useState<RestaurantTenant[]>(INITIAL_RESTAURANTS)
  const [selectedTenant, setSelectedTenant] = useState<RestaurantTenant | null>(null)
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Tickets
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS)
  const [replyText, setReplyText] = useState('')
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null)

  // Map Filter Hotspots
  const [selectedCity, setSelectedCity] = useState<string | null>(null)

  // Subscriptions & Plans
  const [plans, setPlans] = useState([
    { id: 'plan_starter', name: 'Starter', mPrice: 1999, yPrice: 19990, branchLimit: 1, empLimit: 10, storageLimitGb: 5, aiCredits: 0 },
    { id: 'plan_pro', name: 'Professional', mPrice: 4999, yPrice: 49990, branchLimit: 5, empLimit: 50, storageLimitGb: 25, aiCredits: 500 },
    { id: 'plan_enterprise', name: 'Enterprise', mPrice: 12499, yPrice: 124990, branchLimit: 99, empLimit: 500, storageLimitGb: 200, aiCredits: 9999 }
  ])

  // New Plan form states
  const [newPlanName, setNewPlanName] = useState('')
  const [newPlanPrice, setNewPlanPrice] = useState(2999)
  const [newPlanBranchLimit, setNewPlanBranchLimit] = useState(3)

  // Broadcast Center
  const [broadTitle, setBroadTitle] = useState('')
  const [broadMsg, setBroadMsg] = useState('')
  const [broadTarget, setBroadTarget] = useState('all')
  const [broadChannel, setBroadChannel] = useState('in_app')

  // Health Monitoring
  const [sysHealth, setSysHealth] = useState({
    cpu: 32.5,
    ram: 4.8,
    mongo: '1.2ms',
    redis: '0.8ms',
    activeSockets: 44,
    backgroundJobs: 2
  })

  // Settings Credentials Config
  const [razorpayKey, setRazorpayKey] = useState('rzp_live_84Fhs82')
  const [smtpServer, setSmtpServer] = useState('smtp.sendgrid.net')
  const [whatsappToken, setWhatsappToken] = useState('EAAHdsi848Aas8888')
  const [geminiKey, setGeminiKey] = useState('AIzaSyD-84hFas82')
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // Dynamic simulation timer for platform CPU / Sockets
  useEffect(() => {
    const timer = setInterval(() => {
      setSysHealth(prev => ({
        ...prev,
        cpu: +(prev.cpu + (Math.random() * 4 - 2)).toFixed(1),
        activeSockets: prev.activeSockets + Math.floor(Math.random() * 3 - 1)
      }))
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  // Filtering Logic for Restaurant Enterprise Table
  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.city.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPlan = planFilter === 'all' || r.plan === planFilter
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    const matchesCity = !selectedCity || r.city === selectedCity
    return matchesSearch && matchesPlan && matchesStatus && matchesCity
  })

  // City Statistics Helper for Map Tab
  const getCityMetrics = (city: string) => {
    const cityRestos = restaurants.filter(r => r.city === city)
    const branches = cityRestos.reduce((sum, r) => sum + r.branchCount, 0)
    const staff = cityRestos.reduce((sum, r) => sum + r.employeeCount, 0)
    const active = cityRestos.filter(r => r.status === 'active').length
    return { count: cityRestos.length, branches, staff, active }
  }

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlanName) return
    const newP = {
      id: `plan_${Date.now()}`,
      name: newPlanName,
      mPrice: newPlanPrice,
      yPrice: newPlanPrice * 10,
      branchLimit: newPlanBranchLimit,
      empLimit: newPlanBranchLimit * 10,
      storageLimitGb: 20,
      aiCredits: 100
    }
    setPlans(prev => [...prev, newP])
    setNewPlanName('')
    showToast(`New Plan '${newPlanName}' successfully configured!`)
  }

  const handleUpdateTicketStatus = (ticketId: string, status: 'open' | 'progress' | 'resolved') => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t))
    showToast(`Ticket status updated to ${status.toUpperCase()}`)
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans text-zinc-100">
      {/* Top Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-brand-500" />
          <div>
            <h1 className="font-semibold text-zinc-200 tracking-tight text-sm">UGS IT Solutions</h1>
            <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono">Platform Admin Portal</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1 overflow-x-auto max-w-2xl">
          {(['dashboard', 'map', 'analytics', 'tenants', 'subscriptions', 'support', 'feature_flags', 'broadcast', 'monitoring', 'audit', 'settings'] as PlatformTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-all capitalize whitespace-nowrap ${
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

      {/* Main Workspace Frame */}
      <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
        
        {/* TAB 1: Platform Overview */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* KPI grid of 22 metrics */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Executive Platform Indicators</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <div className="glass-panel p-4 rounded-xl border border-zinc-900">
                  <span className="text-[9px] text-zinc-500 block uppercase font-medium">Total Restaurants</span>
                  <span className="text-lg font-bold font-mono text-zinc-200 mt-1 block">{restaurants.length}</span>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-zinc-900">
                  <span className="text-[9px] text-zinc-500 block uppercase font-medium">Active Subscriptions</span>
                  <span className="text-lg font-bold font-mono text-emerald-400 mt-1 block">{restaurants.filter(r => r.status === 'active').length}</span>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-zinc-900">
                  <span className="text-[9px] text-zinc-500 block uppercase font-medium">Trial Accounts</span>
                  <span className="text-lg font-bold font-mono text-brand-400 mt-1 block">{restaurants.filter(r => r.plan === 'free_trial').length}</span>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-zinc-900">
                  <span className="text-[9px] text-zinc-500 block uppercase font-medium">Suspended Outlets</span>
                  <span className="text-lg font-bold font-mono text-red-400 mt-1 block">{restaurants.filter(r => r.status === 'suspended').length}</span>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-zinc-900">
                  <span className="text-[9px] text-zinc-500 block uppercase font-medium">Expected Renewals</span>
                  <span className="text-lg font-bold font-mono text-zinc-200 mt-1 block">3</span>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-zinc-900">
                  <span className="text-[9px] text-zinc-500 block uppercase font-medium">Failed Invoices</span>
                  <span className="text-lg font-bold font-mono text-amber-500 mt-1 block">0</span>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-zinc-900">
                  <span className="text-[9px] text-zinc-500 block uppercase font-medium">Monthly MRR</span>
                  <span className="text-lg font-bold font-mono text-zinc-200 mt-1 block">₹1,18,500</span>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-zinc-900">
                  <span className="text-[9px] text-zinc-500 block uppercase font-medium">Annualized ARR</span>
                  <span className="text-lg font-bold font-mono text-zinc-200 mt-1 block">₹14,22,000</span>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-zinc-900">
                  <span className="text-[9px] text-zinc-500 block uppercase font-medium">Growth Rate</span>
                  <span className="text-lg font-bold font-mono text-emerald-450 mt-1 block">+18.4%</span>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-zinc-900">
                  <span className="text-[9px] text-zinc-500 block uppercase font-medium">Active Devices</span>
                  <span className="text-lg font-bold font-mono text-zinc-200 mt-1 block">18 active</span>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-zinc-900">
                  <span className="text-[9px] text-zinc-500 block uppercase font-medium">API Cluster Health</span>
                  <span className="text-lg font-bold font-mono text-emerald-400 mt-1 block">99.9%</span>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-zinc-900">
                  <span className="text-[9px] text-zinc-500 block uppercase font-medium">Total Workers Queue</span>
                  <span className="text-lg font-bold font-mono text-zinc-200 mt-1 block">{sysHealth.backgroundJobs} jobs</span>
                </div>
              </div>
            </div>

            {/* Quick action grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-panel rounded-2xl border border-zinc-900 p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-zinc-500" />
                  <span>SaaS Hardware Clusters</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900/50 p-4 border border-zinc-850 rounded-xl">
                    <span className="text-[9px] text-zinc-500 block">CPU load</span>
                    <span className="text-lg font-mono font-bold text-zinc-200 mt-1 block">{sysHealth.cpu}%</span>
                  </div>
                  <div className="bg-zinc-900/50 p-4 border border-zinc-850 rounded-xl">
                    <span className="text-[9px] text-zinc-500 block">RAM usage</span>
                    <span className="text-lg font-mono font-bold text-zinc-200 mt-1 block">{sysHealth.ram} GB</span>
                  </div>
                </div>
              </div>

              <div className="glass-panel rounded-2xl border border-zinc-900 p-6 flex flex-col justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Maintenance mode toggle</h3>
                <div className="flex items-center justify-between mt-4">
                  <div>
                    <span className="text-xs font-bold text-zinc-300">Set SaaS Offline</span>
                    <p className="text-[9px] text-zinc-500 mt-0.5">Locks restaurant client portals with maintenance page</p>
                  </div>
                  <button onClick={() => {
                    setMaintenanceMode(!maintenanceMode)
                    showToast(maintenanceMode ? "Maintenance disabled" : "Maintenance enabled")
                  }}>
                    {maintenanceMode ? <ToggleRight className="w-9 h-9 text-brand-500" /> : <ToggleLeft className="w-9 h-9 text-zinc-700" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Interactive Map Hotspots */}
        {activeTab === 'map' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 glass-panel rounded-2xl border border-zinc-900 p-6 h-[450px] flex flex-col">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-brand-500" />
                <span>Regional Hotspots (India)</span>
              </h3>
              
              <div className="flex-1 bg-zinc-900/30 border border-zinc-900/60 rounded-xl relative overflow-hidden flex items-center justify-center">
                {/* Dynamic graphic representation of Indian cities */}
                <div className="absolute inset-0 bg-grid-pattern opacity-10" />
                
                {/* Hotspot Delhi */}
                <button 
                  onClick={() => setSelectedCity(selectedCity === 'New Delhi' ? null : 'New Delhi')}
                  className={`absolute top-1/4 left-1/3 p-3 rounded-full flex items-center gap-2 border transition-all ${
                    selectedCity === 'New Delhi' ? 'bg-brand-500/20 border-brand-500 text-brand-400 scale-110' : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="text-[10px] font-bold">Delhi NCR ({getCityMetrics('New Delhi').count})</span>
                </button>

                {/* Hotspot Mumbai */}
                <button 
                  onClick={() => setSelectedCity(selectedCity === 'Mumbai' ? null : 'Mumbai')}
                  className={`absolute bottom-1/3 left-1/4 p-3 rounded-full flex items-center gap-2 border transition-all ${
                    selectedCity === 'Mumbai' ? 'bg-brand-500/20 border-brand-500 text-brand-400 scale-110' : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="text-[10px] font-bold">Mumbai ({getCityMetrics('Mumbai').count})</span>
                </button>

                {/* Hotspot Bengaluru */}
                <button 
                  onClick={() => setSelectedCity(selectedCity === 'Bengaluru' ? null : 'Bengaluru')}
                  className={`absolute bottom-1/4 left-1/2 p-3 rounded-full flex items-center gap-2 border transition-all ${
                    selectedCity === 'Bengaluru' ? 'bg-brand-500/20 border-brand-500 text-brand-400 scale-110' : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="text-[10px] font-bold">Bengaluru ({getCityMetrics('Bengaluru').count})</span>
                </button>

                {/* Hotspot Hyderabad */}
                <button 
                  onClick={() => setSelectedCity(selectedCity === 'Hyderabad' ? null : 'Hyderabad')}
                  className={`absolute bottom-1/3 left-1/2 p-3 rounded-full flex items-center gap-2 border transition-all ${
                    selectedCity === 'Hyderabad' ? 'bg-brand-500/20 border-brand-500 text-brand-400 scale-110' : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="text-[10px] font-bold">Hyderabad ({getCityMetrics('Hyderabad').count})</span>
                </button>

                <div className="absolute bottom-4 left-4 text-[9px] text-zinc-600 font-mono">
                  CLICK HOTSPOT BUBBLES TO FILTER THE RIGHT METRICS SIDEBAR
                </div>
              </div>
            </div>

            {/* City metrics panel */}
            <div className="glass-panel rounded-2xl border border-zinc-900 p-6 h-[450px] flex flex-col justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Regional Statistics</h3>
              
              {selectedCity ? (
                <div className="flex-1 flex flex-col justify-between mt-4">
                  <div className="bg-brand-500/5 border border-brand-500/20 rounded-xl p-4">
                    <span className="text-[9px] text-zinc-500 font-mono block">Selected Region</span>
                    <h4 className="text-sm font-bold text-brand-400 mt-1">{selectedCity}</h4>
                  </div>

                  <div className="space-y-4 font-mono text-xs">
                    <div className="flex justify-between border-b border-zinc-900 pb-2">
                      <span className="text-zinc-500">Restaurants:</span>
                      <span className="font-bold text-zinc-200">{getCityMetrics(selectedCity).count}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 pb-2">
                      <span className="text-zinc-500">Active branches:</span>
                      <span className="font-bold text-zinc-200">{getCityMetrics(selectedCity).branches}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 pb-2">
                      <span className="text-zinc-500">Online employees:</span>
                      <span className="font-bold text-zinc-200">{getCityMetrics(selectedCity).staff}</span>
                    </div>
                  </div>

                  <div className="text-[9px] text-zinc-500 leading-relaxed font-mono">
                    * Metrics aggregated from live REST API payload handshakes in this city territory.
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center p-6 text-xs text-zinc-600 font-mono">
                  Select a city hotspot on the map to filter.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Revenue Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 glass-panel rounded-2xl border border-zinc-900 p-6 h-[350px] flex flex-col">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">SaaS Monthly Recurring Revenue (MRR)</h3>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { month: 'Jan', revenue: 65000 },
                      { month: 'Feb', revenue: 78000 },
                      { month: 'Mar', revenue: 95000 },
                      { month: 'Apr', revenue: 104000 },
                      { month: 'May', revenue: 112000 },
                      { month: 'Jun', revenue: 118500 }
                    ]}>
                      <defs>
                        <linearGradient id="revenueGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" stroke="#52525b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#52525b" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#09090b', borderColor: '#27272a', borderRadius: '12px' }} />
                      <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#revenueGlow)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-panel rounded-2xl border border-zinc-900 p-6 h-[350px] flex flex-col justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Churn Rate Analytics</h3>
                <div className="space-y-4 font-mono text-xs">
                  <div className="flex justify-between border-b border-zinc-900 pb-2">
                    <span className="text-zinc-500">Gross Churn:</span>
                    <span className="font-bold text-red-400">1.8%</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900 pb-2">
                    <span className="text-zinc-500">New Additions:</span>
                    <span className="font-bold text-emerald-400">+12%</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900 pb-2">
                    <span className="text-zinc-500">Net MRR Growth:</span>
                    <span className="font-bold text-brand-400">+10.2%</span>
                  </div>
                </div>
                <div className="text-[9px] text-zinc-500 leading-normal font-mono">
                  Calculated against a rolling 30-day window of active restaurant subscription accounts.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Restaurant Tenants Enterprise Table */}
        {activeTab === 'tenants' && (
          <div className="space-y-6">
            <div className="glass-panel rounded-2xl border border-zinc-900 p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Enterprise Database</h3>
                
                {/* Search and Filters */}
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search name, owner, city..."
                      className="bg-zinc-900/60 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 focus:outline-none focus:border-brand-500/50 w-64"
                    />
                  </div>

                  <select
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value)}
                    className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none"
                  >
                    <option value="all">All Plans</option>
                    <option value="free_trial">Free Trial</option>
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 text-xs text-zinc-500">
                      <th className="pb-3.5 font-medium">Restaurant Details</th>
                      <th className="pb-3.5 font-medium">Location</th>
                      <th className="pb-3.5 font-medium">Plan Type</th>
                      <th className="pb-3.5 font-medium">Renewal Date</th>
                      <th className="pb-3.5 font-medium">Status</th>
                      <th className="pb-3.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60 text-xs">
                    {filteredRestaurants.map(r => (
                      <tr key={r.id} className="hover:bg-zinc-900/20 transition-colors">
                        <td className="py-4">
                          <div className="font-semibold text-zinc-200">{r.name}</div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{r.id} • Owner: {r.owner} • {r.email}</div>
                        </td>
                        <td className="py-4">
                          <div className="text-zinc-300">{r.city}</div>
                          <div className="text-[9px] text-zinc-500 font-mono">{r.state}, {r.country}</div>
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 rounded font-medium border uppercase text-[9px] ${
                            r.plan === 'enterprise'
                              ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                              : r.plan === 'professional'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                          }`}>
                            {r.plan.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 font-mono text-zinc-400">{r.renewalDate}</td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                            r.status === 'active' 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'bg-red-500/10 text-red-400'
                          }`}>
                            {r.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 text-right space-x-1.5">
                          <button
                            onClick={() => handleToggleSuspend(r.id)}
                            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-350 rounded px-2.5 py-1 transition-colors text-[10px]"
                          >
                            {r.status === 'suspended' ? 'Activate' : 'Suspend'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Subscription Plans Manager */}
        {activeTab === 'subscriptions' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 glass-panel rounded-2xl border border-zinc-900 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">Pricing Plans & Limits Matrix</h3>
              <div className="space-y-4">
                {plans.map(p => (
                  <div key={p.id} className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-zinc-200">{p.name} Plan</div>
                      <div className="text-[10px] text-zinc-500 mt-1 font-mono">
                        Branches Limit: {p.branchLimit} • Staff Limit: {p.empLimit} • Storage: {p.storageLimitGb} GB • AI Credits: {p.aiCredits}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-brand-400">₹{p.mPrice.toLocaleString()} / mo</div>
                      <div className="text-[9px] text-zinc-500 font-mono mt-0.5">₹{p.yPrice.toLocaleString()} / yr</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-2xl border border-zinc-900 p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">Provision Custom Plan</h3>
                <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[9px] text-zinc-500 uppercase font-semibold mb-1">Plan Title</label>
                    <input
                      type="text"
                      value={newPlanName}
                      onChange={(e) => setNewPlanName(e.target.value)}
                      placeholder="e.g. Standard Plus"
                      required
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-zinc-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-zinc-500 uppercase font-semibold mb-1">Monthly Pricing (₹)</label>
                    <input
                      type="number"
                      value={newPlanPrice}
                      onChange={(e) => setNewPlanPrice(+e.target.value)}
                      required
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-zinc-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-zinc-500 uppercase font-semibold mb-1">Branch Limit</label>
                    <input
                      type="number"
                      value={newPlanBranchLimit}
                      onChange={(e) => setNewPlanBranchLimit(+e.target.value)}
                      required
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-zinc-200 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-brand-650 hover:bg-brand-550 text-white rounded-xl py-2.5 text-xs font-semibold mt-4"
                  >
                    Add Plan Model
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: Support Kanban System */}
        {activeTab === 'support' && (
          <div className="space-y-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Support Ticket Board</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Column 1: OPEN */}
              <div className="bg-zinc-900/10 border border-zinc-900 rounded-2xl p-4 flex flex-col h-[400px]">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-3 block">Open ({tickets.filter(t => t.status === 'open').length})</span>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {tickets.filter(t => t.status === 'open').map(t => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTicket(t)}
                      className="w-full text-left bg-zinc-900/50 border border-zinc-850 hover:border-zinc-800 rounded-xl p-4 transition-all"
                    >
                      <div className="text-[10px] font-bold text-zinc-200">{t.restaurant}</div>
                      <p className="text-[10px] text-zinc-500 mt-1">{t.subject}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-[8px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded font-mono uppercase">{t.priority}</span>
                        <span className="text-[8px] text-zinc-650 font-mono">SLA: {t.slaHours}h</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Column 2: IN PROGRESS */}
              <div className="bg-zinc-900/10 border border-zinc-900 rounded-2xl p-4 flex flex-col h-[400px]">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-3 block">In Progress ({tickets.filter(t => t.status === 'progress').length})</span>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {tickets.filter(t => t.status === 'progress').map(t => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTicket(t)}
                      className="w-full text-left bg-zinc-900/50 border border-zinc-850 hover:border-zinc-800 rounded-xl p-4 transition-all"
                    >
                      <div className="text-[10px] font-bold text-zinc-200">{t.restaurant}</div>
                      <p className="text-[10px] text-zinc-500 mt-1">{t.subject}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-[8px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-mono uppercase">{t.priority}</span>
                        <span className="text-[8px] text-zinc-650 font-mono">SLA: {t.slaHours}h</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Column 3: RESOLVED */}
              <div className="bg-zinc-900/10 border border-zinc-900 rounded-2xl p-4 flex flex-col h-[400px]">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-3 block">Resolved ({tickets.filter(t => t.status === 'resolved').length})</span>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {tickets.filter(t => t.status === 'resolved').map(t => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTicket(t)}
                      className="w-full text-left bg-zinc-900/50 border border-zinc-850 hover:border-zinc-850 rounded-xl p-4 opacity-60"
                    >
                      <div className="text-[10px] font-bold text-zinc-250">{t.restaurant}</div>
                      <p className="text-[10px] text-zinc-600 mt-1 line-through">{t.subject}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Ticket Dialog Reply overlay */}
            {activeTicket && (
              <div className="bg-zinc-900/50 border border-zinc-900 rounded-2xl p-6 max-w-xl mx-auto w-full flex flex-col gap-4">
                <div className="flex justify-between items-start border-b border-zinc-900 pb-3">
                  <div>
                    <span className="text-[8px] text-zinc-500 font-mono">Ticket {activeTicket.id}</span>
                    <h4 className="text-xs font-bold text-zinc-200 mt-1">{activeTicket.restaurant}</h4>
                  </div>
                  <button onClick={() => setActiveTicket(null)} className="text-xs text-zinc-500 hover:text-zinc-300">Close</button>
                </div>
                <p className="text-xs text-zinc-400">{activeTicket.subject}</p>

                <div className="space-y-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type official support response..."
                    rows={3}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleUpdateTicketStatus(activeTicket.id, 'resolved')}
                      className="bg-emerald-600/10 text-emerald-450 border border-emerald-500/20 text-[10px] font-semibold px-3 py-1.5 rounded-lg"
                    >
                      Mark Resolved
                    </button>
                    <button
                      onClick={() => {
                        setReplyText('')
                        showToast('Reply dispatched!')
                      }}
                      className="bg-brand-600 hover:bg-brand-500 text-white text-[10px] font-semibold px-4 py-1.5 rounded-lg"
                    >
                      Send Reply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: Granular Feature Flags */}
        {activeTab === 'feature_flags' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 glass-panel rounded-2xl border border-zinc-900 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">Restaurants Feature Toggles</h3>
              <div className="space-y-3">
                {restaurants.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedTenant(r)}
                    className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all ${
                      selectedTenant?.id === r.id
                        ? 'bg-brand-500/10 border-brand-500/30 text-brand-400'
                        : 'bg-zinc-900/30 border-zinc-900 hover:border-zinc-850 text-zinc-350'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-zinc-200">{r.name}</div>
                      <div className="text-[10px] text-zinc-500 mt-1 font-mono">
                        Active Features: {Object.keys(r.featureFlags).filter(k => r.featureFlags[k]).join(', ')}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-2xl border border-zinc-900 p-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">Feature Flags Controller</h3>
              {selectedTenant ? (
                <div className="space-y-5">
                  <div className="bg-zinc-900/50 border border-zinc-850 rounded-xl p-3.5">
                    <span className="text-[9px] text-zinc-500 font-mono block">Selected Restaurant</span>
                    <h4 className="text-xs font-bold text-zinc-200 mt-1">{selectedTenant.name}</h4>
                  </div>

                  <div className="space-y-4 text-xs">
                    {['qr_ordering', 'crm_loyalty', 'ai_copilot', 'kds_display', 'ONDC', 'whatsapp'].map(flag => (
                      <div key={flag} className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-zinc-300 uppercase tracking-wider text-[10px]">{flag.replace('_', ' ')}</div>
                        </div>
                        <button onClick={() => handleToggleFeature(selectedTenant.id, flag as any)}>
                          {selectedTenant.featureFlags[flag] ? <ToggleRight className="w-8 h-8 text-brand-500" /> : <ToggleLeft className="w-8 h-8 text-zinc-700" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center p-12 text-xs text-zinc-650 font-mono">
                  Select a restaurant to modify its active SaaS modules.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 8: Broadcast Center */}
        {activeTab === 'broadcast' && (
          <div className="glass-panel rounded-2xl border border-zinc-900 p-6 max-w-xl mx-auto w-full">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-brand-500" />
              <span>Broadcast Center Dispatcher</span>
            </h3>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] text-zinc-500 uppercase font-semibold mb-1.5">Scope Target</label>
                  <select
                    value={broadTarget}
                    onChange={(e) => setBroadTarget(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none"
                  >
                    <option value="all">All Restaurants</option>
                    <option value="free_trial">Free Trial Users</option>
                    <option value="premium">Starter & Pro Premium Plans</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] text-zinc-500 uppercase font-semibold mb-1.5">Channel</label>
                  <select
                    value={broadChannel}
                    onChange={(e) => setBroadChannel(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none"
                  >
                    <option value="in_app">In-App Alert Notification</option>
                    <option value="sms">SMS Text Message</option>
                    <option value="whatsapp">WhatsApp Direct Template</option>
                    <option value="email">Email Broadcast</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] text-zinc-500 uppercase font-semibold mb-1.5">Subject Title</label>
                <input
                  type="text"
                  value={broadTitle}
                  onChange={(e) => setBroadTitle(e.target.value)}
                  placeholder="e.g. Server Upgrade Schedule Notice"
                  required
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] text-zinc-500 uppercase font-semibold mb-1.5">Alert Details</label>
                <textarea
                  value={broadMsg}
                  onChange={(e) => setBroadMsg(e.target.value)}
                  placeholder="Type broadcast text message..."
                  required
                  rows={4}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white rounded-xl py-2.5 text-xs font-semibold transition-all shadow-md"
              >
                Send Broadcast Alert
              </button>
            </form>
          </div>
        )}

        {/* TAB 9: Platform Monitoring */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CPU Load */}
              <div className="glass-panel rounded-2xl border border-zinc-900 p-6 h-[260px] flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-300">Cluster CPU Load</h4>
                  <span className="text-[9px] text-zinc-500">FastAPI threads performance</span>
                </div>
                <div className="flex items-end justify-between h-24 mt-4 gap-2">
                  {[28, 35, 42, 30, 25, 45, sysHealth.cpu].map((v, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div 
                        style={{ height: `${v * 1.5}px` }} 
                        className={`w-full rounded-t-md transition-all ${
                          idx === 6 ? 'bg-brand-500' : 'bg-zinc-900 border border-zinc-850'
                        }`} 
                      />
                      <span className="text-[8px] text-zinc-600 font-mono mt-1">T-{6 - idx}m</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Memory Allocation */}
              <div className="glass-panel rounded-2xl border border-zinc-900 p-6 h-[260px] flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-300">RAM allocation</h4>
                  <span className="text-[9px] text-zinc-500">Container memory usage limits</span>
                </div>
                <div className="space-y-4 mt-6">
                  <div className="flex justify-between text-xs text-zinc-450 font-mono">
                    <span>Allocated: {sysHealth.ram} GB</span>
                    <span>Total Limit: 8.0 GB</span>
                  </div>
                  <div className="w-full bg-zinc-950 rounded-full h-3 overflow-hidden border border-zinc-900">
                    <div style={{ width: `${(sysHealth.ram / 8.0) * 100}%` }} className="bg-brand-500 h-full rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Socket, queue alerts */}
            <div className="glass-panel rounded-2xl border border-zinc-900 p-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">WebSocket active channels</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
                <div className="bg-zinc-900/50 p-4 border border-zinc-850 rounded-xl text-center">
                  <span className="text-[9px] text-zinc-550 block">Connected POS Sockets</span>
                  <span className="text-lg font-bold text-zinc-200 mt-1 block">{sysHealth.activeSockets} sockets</span>
                </div>
                <div className="bg-zinc-900/50 p-4 border border-zinc-850 rounded-xl text-center">
                  <span className="text-[9px] text-zinc-550 block">Database Ping</span>
                  <span className="text-lg font-bold text-emerald-450 mt-1 block">{sysHealth.mongo}</span>
                </div>
                <div className="bg-zinc-900/50 p-4 border border-zinc-850 rounded-xl text-center">
                  <span className="text-[9px] text-zinc-550 block">Redis Ping</span>
                  <span className="text-lg font-bold text-emerald-450 mt-1 block">{sysHealth.redis}</span>
                </div>
                <div className="bg-zinc-900/50 p-4 border border-zinc-850 rounded-xl text-center">
                  <span className="text-[9px] text-zinc-550 block">Auto Backups Status</span>
                  <span className="text-lg font-bold text-zinc-200 mt-1 block">Completed (12h ago)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: Audit Logs Center */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="glass-panel rounded-2xl border border-zinc-900 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">Platform Audit Logs</h3>
              <div className="space-y-4">
                {[
                  { actor: 'admin@ugsrestoflow.com', action: 'SUSPEND_TENANT', target: 'Paradise Biryani', time: '2026-07-25 17:40:12', ip: '192.168.1.45', device: 'Chrome / Windows 11' },
                  { actor: 'admin@ugsrestoflow.com', action: 'UPDATE_FEATURE_FLAGS', target: 'Blue Tokai Cafe', time: '2026-07-25 16:32:05', ip: '192.168.1.45', device: 'Chrome / Windows 11' },
                  { actor: 'system@ugsrestoflow.com', action: 'AUTO_BACKUP_COMPLETED', target: 'Database Clusters', time: '2026-07-25 05:00:00', ip: 'localhost', device: 'Worker Instance' }
                ].map((log, idx) => (
                  <div key={idx} className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-4 font-mono text-[10px] text-zinc-500 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-brand-400 font-bold">{log.actor}</span>
                      <span className="text-zinc-400 font-semibold">{log.action}</span>
                    </div>
                    <div>Target: <span className="text-zinc-300 font-medium">{log.target}</span></div>
                    <div className="flex justify-between text-[9px] text-zinc-600 mt-1 pt-1.5 border-t border-zinc-900/40">
                      <span>IP: {log.ip} • Browser: {log.device}</span>
                      <span>{log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 11: Platform Gateway Settings */}
        {activeTab === 'settings' && (
          <div className="glass-panel rounded-2xl border border-zinc-900 p-6 max-w-xl mx-auto w-full">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4 text-brand-500" />
              <span>Platform Integrations</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[9px] text-zinc-500 uppercase font-semibold mb-1.5">Razorpay Payment Gateway API Key</label>
                <input
                  type="text"
                  value={razorpayKey}
                  onChange={(e) => setRazorpayKey(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-zinc-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] text-zinc-500 uppercase font-semibold mb-1.5">SMTP Server Gateway Host</label>
                <input
                  type="text"
                  value={smtpServer}
                  onChange={(e) => setSmtpServer(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-zinc-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] text-zinc-500 uppercase font-semibold mb-1.5">WhatsApp Cloud API Gateway Token</label>
                <input
                  type="password"
                  value={whatsappToken}
                  onChange={(e) => setWhatsappToken(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-zinc-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] text-zinc-500 uppercase font-semibold mb-1.5">Gemini AI Model API Key</label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-zinc-200 focus:outline-none"
                />
              </div>

              <button
                onClick={() => showToast('Integrations credentials updated!')}
                className="w-full bg-brand-650 hover:bg-brand-550 text-white rounded-xl py-2.5 text-xs font-semibold mt-4"
              >
                Save Integration Keys
              </button>
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
