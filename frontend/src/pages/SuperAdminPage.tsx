import React, { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Shield, Users, CreditCard, Sparkles, Plus, ToggleLeft, ToggleRight, Database, Settings, Mail, Bell, Activity, RefreshCw, AlertTriangle, CheckCircle, Search, Filter, MessageSquare, MapPin, Globe, Server, UserCheck, HardDrive, Key, BarChart, ChevronRight, LogOut } from 'lucide-react'
import Logo from '../components/Logo'
import { useAuthStore } from '../store/authStore'

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

  const handleToggleFeature = (tenantId: string, flag: string) => {
    setRestaurants(prev => prev.map(t => {
      if (t.id === tenantId) {
        const updatedFlags = { ...t.featureFlags, [flag]: !t.featureFlags[flag] }
        const updated = { ...t, featureFlags: updatedFlags }
        if (selectedTenant?.id === tenantId) {
          setSelectedTenant(updated)
        }
        return updated
      }
      return t
    }))
    showToast('Tenant feature flags updated!')
  }

  const handleToggleSuspend = (tenantId: string) => {
    setRestaurants(prev => prev.map(t => {
      if (t.id === tenantId) {
        const nextStatus = t.status === 'suspended' ? 'active' : 'suspended'
        const updated = { ...t, status: nextStatus as any }
        if (selectedTenant?.id === tenantId) {
          setSelectedTenant(updated)
        }
        return updated
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
    <div className="min-h-screen bg-[#FAFAFB] flex font-sans text-[#111827] overflow-hidden">
      
      {/* Spacious Left Sidebar (280px width) */}
      <aside className="w-[280px] border-r border-[#E8EAF0] bg-white flex flex-col justify-between p-6 select-none shrink-0 h-screen sticky top-0">
        <div className="space-y-8">
          {/* UGS IT Solutions Logo block */}
          <div className="flex items-center gap-3 px-1">
            <Logo className="w-8 h-8" />
            <div>
              <span className="font-bold text-[#111827] tracking-tight text-sm block">UGS IT Solutions</span>
              <span className="text-[9px] text-[#6B7280] block uppercase tracking-wider font-mono">SaaS Engine Panel</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {(['dashboard', 'map', 'analytics', 'tenants', 'subscriptions', 'support', 'feature_flags', 'broadcast', 'monitoring', 'audit', 'settings'] as PlatformTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all capitalize ${
                  activeTab === tab
                    ? 'bg-[#5B5CEB]/10 text-[#5B5CEB] border border-[#5B5CEB]/25'
                    : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F5F7FB]'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </nav>
        </div>

        {/* Footer Profile info */}
        <div className="border-t border-[#E8EAF0] pt-4 space-y-4">
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full bg-[#F5F7FB] border border-[#E8EAF0] flex items-center justify-center text-xs font-bold text-[#5B5CEB] uppercase">
              A
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-[#111827] block truncate leading-tight">Priya Sharma</span>
              <span className="text-[9px] text-[#6B7280] block uppercase tracking-wider mt-0.5">Platform Admin</span>
            </div>
          </div>
          <button
            onClick={() => useAuthStore.getState().logout()}
            className="w-full bg-[#F5F7FB] hover:bg-red-50 text-[#6B7280] hover:text-red-650 rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-[#E8EAF0] hover:border-red-100 active:scale-[0.98]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Platform</span>
          </button>
        </div>
      </aside>

      {/* Main Area Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Sticky Top Header bar */}
        <header className="border-b border-[#E8EAF0] bg-white/70 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30 select-none">
          <div className="flex items-center gap-2 text-xs text-[#6B7280]">
            <span className="font-semibold text-[#111827]">Super Admin Portal</span>
            <span>/</span>
            <span className="capitalize">{activeTab.replace('_', ' ')}</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] text-[#6B7280] font-mono">Nodes Status: <span className="text-[#16C784] font-bold">ONLINE</span></span>
            <span className="text-[10px] text-[#6B7280] font-mono">{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
        </header>

        {/* Main Content Workspace */}
        <main className="flex-1 p-8 space-y-8 max-w-6xl w-full mx-auto">

          {/* TAB 1: Platform Overview */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Redesigned 12 KPI Cards Grid */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-4">Executive Performance</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Total Restaurants */}
                  <div className="bg-white p-5 rounded-2xl border border-[#E8EAF0] shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#6B7280] block uppercase font-bold tracking-wider">Total Restaurants</span>
                      <span className="text-2xl font-bold font-mono text-[#111827] mt-2 block">{restaurants.length}</span>
                      <span className="text-[10px] text-[#16C784] font-mono block mt-1">↑ 12.5% this Mo.</span>
                    </div>
                    {/* SVG Sparkline */}
                    <svg className="w-12 h-6 text-[#16C784]" viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M0,10 L4,8 L8,9 L12,4 L16,7 L20,2 L24,5" />
                    </svg>
                  </div>

                  {/* Active Subscriptions */}
                  <div className="bg-white p-5 rounded-2xl border border-[#E8EAF0] shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#6B7280] block uppercase font-bold tracking-wider">Active Outlets</span>
                      <span className="text-2xl font-bold font-mono text-[#111827] mt-2 block">
                        {restaurants.filter(r => r.status === 'active').length}
                      </span>
                      <span className="text-[10px] text-[#6B7280] font-mono block mt-1">98.5% conversion</span>
                    </div>
                    <svg className="w-12 h-6 text-[#5B5CEB]" viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M0,8 L4,6 L8,7 L12,5 L16,4 L20,3 L24,2" />
                    </svg>
                  </div>

                  {/* Monthly Recurring Revenue */}
                  <div className="bg-white p-5 rounded-2xl border border-[#E8EAF0] shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#6B7280] block uppercase font-bold tracking-wider">Monthly MRR</span>
                      <span className="text-2xl font-bold font-mono text-[#111827] mt-2 block">₹1,18,500</span>
                      <span className="text-[10px] text-[#16C784] font-mono block mt-1">↑ 18.4% growth</span>
                    </div>
                    <svg className="w-12 h-6 text-[#16C784]" viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M0,9 L4,7 L8,8 L12,5 L16,6 L20,3 L24,1" />
                    </svg>
                  </div>

                  {/* Open Support Tickets */}
                  <div className="bg-white p-5 rounded-2xl border border-[#E8EAF0] shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#6B7280] block uppercase font-bold tracking-wider">Open Support Tickets</span>
                      <span className="text-2xl font-bold font-mono text-red-500 mt-2 block">
                        {tickets.filter(t => t.status === 'open').length}
                      </span>
                      <span className="text-[10px] text-red-400 font-mono block mt-1">Action Required</span>
                    </div>
                    <svg className="w-12 h-6 text-red-400" viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M0,2 L4,4 L8,3 L12,7 L16,6 L20,9 L24,10" />
                    </svg>
                  </div>

                </div>
              </div>

              {/* Hardware diagnostics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-[#E8EAF0] p-6 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-4 flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-[#5B5CEB]" />
                    <span>Platform Hardware Cluster</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                    <div className="bg-[#F5F7FB] p-4 border border-[#E8EAF0] rounded-xl">
                      <span className="text-[9px] text-[#6B7280] block uppercase">CPU Load</span>
                      <span className="text-lg font-bold text-[#111827] mt-1 block">{sysHealth.cpu}%</span>
                    </div>
                    <div className="bg-[#F5F7FB] p-4 border border-[#E8EAF0] rounded-xl">
                      <span className="text-[9px] text-[#6B7280] block uppercase">RAM Allocation</span>
                      <span className="text-lg font-bold text-[#111827] mt-1 block">{sysHealth.ram} GB</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#E8EAF0] p-6 shadow-sm flex flex-col justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Platform Maintenance Mode</h3>
                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <span className="text-xs font-bold text-[#111827]">Global Lock</span>
                      <p className="text-[9px] text-[#6B7280] mt-0.5">Toggles public access block for all tenant subdomains</p>
                    </div>
                    <button onClick={() => {
                      setMaintenanceMode(!maintenanceMode)
                      showToast(maintenanceMode ? "Maintenance disabled" : "Maintenance enabled")
                    }}>
                      {maintenanceMode ? <ToggleRight className="w-9 h-9 text-[#5B5CEB]" /> : <ToggleLeft className="w-9 h-9 text-[#6B7280]" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Interactive Regional Hotspots */}
          {activeTab === 'map' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 bg-white rounded-2xl border border-[#E8EAF0] p-6 h-[450px] flex flex-col shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#6B7280] mb-4 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#5B5CEB]" />
                  <span>Regional Hotspots (India)</span>
                </h3>
                
                <div className="flex-1 bg-[#F5F7FB] border border-[#E8EAF0] rounded-xl relative overflow-hidden flex items-center justify-center">
                  <button 
                    onClick={() => setSelectedCity(selectedCity === 'New Delhi' ? null : 'New Delhi')}
                    className={`absolute top-1/4 left-1/3 p-3 rounded-full flex items-center gap-2 border transition-all ${
                      selectedCity === 'New Delhi' ? 'bg-[#5B5CEB]/10 border-[#5B5CEB] text-[#5B5CEB] scale-105 shadow-sm' : 'bg-white border-[#E8EAF0] text-[#6B7280]'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">Delhi NCR ({getCityMetrics('New Delhi').count})</span>
                  </button>

                  <button 
                    onClick={() => setSelectedCity(selectedCity === 'Mumbai' ? null : 'Mumbai')}
                    className={`absolute bottom-1/3 left-1/4 p-3 rounded-full flex items-center gap-2 border transition-all ${
                      selectedCity === 'Mumbai' ? 'bg-[#5B5CEB]/10 border-[#5B5CEB] text-[#5B5CEB] scale-105 shadow-sm' : 'bg-white border-[#E8EAF0] text-[#6B7280]'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">Mumbai ({getCityMetrics('Mumbai').count})</span>
                  </button>

                  <button 
                    onClick={() => setSelectedCity(selectedCity === 'Bengaluru' ? null : 'Bengaluru')}
                    className={`absolute bottom-1/4 left-1/2 p-3 rounded-full flex items-center gap-2 border transition-all ${
                      selectedCity === 'Bengaluru' ? 'bg-[#5B5CEB]/10 border-[#5B5CEB] text-[#5B5CEB] scale-105 shadow-sm' : 'bg-white border-[#E8EAF0] text-[#6B7280]'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">Bengaluru ({getCityMetrics('Bengaluru').count})</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#E8EAF0] p-6 h-[450px] flex flex-col justify-between shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Regional Statistics</h3>
                
                {selectedCity ? (
                  <div className="flex-1 flex flex-col justify-between mt-4">
                    <div className="bg-[#5B5CEB]/5 border border-[#5B5CEB]/25 rounded-xl p-4">
                      <span className="text-[9px] text-[#6B7280] font-mono block uppercase">Selected Region</span>
                      <h4 className="text-xs font-bold text-[#5B5CEB] mt-1">{selectedCity}</h4>
                    </div>

                    <div className="space-y-4 font-mono text-xs">
                      <div className="flex justify-between border-b border-[#E8EAF0] pb-2">
                        <span className="text-[#6B7280]">Restaurants:</span>
                        <span className="font-bold text-[#111827]">{getCityMetrics(selectedCity).count}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#E8EAF0] pb-2">
                        <span className="text-[#6B7280]">Active Branches:</span>
                        <span className="font-bold text-[#111827]">{getCityMetrics(selectedCity).branches}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#E8EAF0] pb-2">
                        <span className="text-[#6B7280]">Online Employees:</span>
                        <span className="font-bold text-[#111827]">{getCityMetrics(selectedCity).staff}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center p-6 text-xs text-[#6B7280] font-mono">
                    Select a city hotspot to query.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Revenue Analytics */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white rounded-2xl border border-[#E8EAF0] p-6 h-[350px] flex flex-col shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-4">SaaS Monthly Recurring Revenue (MRR)</h3>
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
                          <linearGradient id="glowSalesLight" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#5B5CEB" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#5B5CEB" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" stroke="#6B7280" fontSize={10} tickLine={false} />
                        <YAxis stroke="#6B7280" fontSize={10} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#FFFFFF', borderColor: '#E8EAF0', borderRadius: '12px' }} />
                        <Area type="monotone" dataKey="revenue" stroke="#5B5CEB" strokeWidth={2} fillOpacity={1} fill="url(#glowSalesLight)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#E8EAF0] p-6 h-[350px] flex flex-col justify-between shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Churn Rate Analytics</h3>
                  <div className="space-y-4 font-mono text-xs">
                    <div className="flex justify-between border-b border-[#E8EAF0] pb-2">
                      <span className="text-[#6B7280]">Gross Churn:</span>
                      <span className="font-bold text-red-500">1.8%</span>
                    </div>
                    <div className="flex justify-between border-b border-[#E8EAF0] pb-2">
                      <span className="text-[#6B7280]">Net MRR Growth:</span>
                      <span className="font-bold text-emerald-500">+10.2%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Restaurant Tenants Enterprise Table */}
          {activeTab === 'tenants' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-[#E8EAF0] p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#6B7280]">Enterprise Database</h3>
                  
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-3" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search name, owner, city..."
                        className="bg-[#F5F7FB] border border-[#E8EAF0] rounded-xl pl-9 pr-4 py-2 text-xs text-[#111827] focus:outline-none focus:border-[#5B5CEB]/50 w-64"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E8EAF0] text-xs text-[#6B7280]">
                        <th className="pb-3.5 font-semibold">Restaurant Details</th>
                        <th className="pb-3.5 font-semibold">Location</th>
                        <th className="pb-3.5 font-semibold">Plan Type</th>
                        <th className="pb-3.5 font-semibold">Renewal Date</th>
                        <th className="pb-3.5 font-semibold">Status</th>
                        <th className="pb-3.5 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8EAF0] text-xs text-[#111827]">
                      {filteredRestaurants.map(r => (
                        <tr key={r.id} className="hover:bg-[#F5F7FB] transition-colors">
                          <td className="py-4">
                            <div className="font-bold text-[#111827]">{r.name}</div>
                            <div className="text-[10px] text-[#6B7280] font-mono mt-0.5">{r.id} • Owner: {r.owner} • {r.email}</div>
                          </td>
                          <td className="py-4">
                            <div>{r.city}</div>
                            <div className="text-[9px] text-[#6B7280] font-mono">{r.state}, {r.country}</div>
                          </td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded font-bold border uppercase text-[9px] ${
                              r.plan === 'enterprise'
                                ? 'bg-violet-500/10 text-violet-600 border-violet-500/20'
                                : r.plan === 'professional'
                                ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                : 'bg-[#F5F7FB] text-[#6B7280] border-[#E8EAF0]'
                            }`}>
                              {r.plan}
                            </span>
                          </td>
                          <td className="py-4 font-mono text-[#6B7280]">{r.renewalDate}</td>
                          <td className="py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                              r.status === 'active' 
                                ? 'bg-[#16C784]/10 text-[#16C784]' 
                                : 'bg-red-500/10 text-red-500'
                            }`}>
                              {r.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => handleToggleSuspend(r.id)}
                              className="bg-[#F5F7FB] hover:bg-[#E8EAF0] border border-[#E8EAF0] text-[#111827] rounded-lg px-2.5 py-1 transition-colors text-[10px] font-semibold"
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
              <div className="xl:col-span-2 bg-white rounded-2xl border border-[#E8EAF0] p-6 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#6B7280] mb-4">Pricing Plans Matrix</h3>
                <div className="space-y-4">
                  {plans.map(p => (
                    <div key={p.id} className="bg-[#F5F7FB] border border-[#E8EAF0] rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-[#111827]">{p.name} Plan</div>
                        <div className="text-[10px] text-[#6B7280] mt-1 font-mono">
                          Branches: {p.branchLimit} • Staff: {p.empLimit} • Storage: {p.storageLimitGb} GB
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-[#5B5CEB]">₹{p.mPrice.toLocaleString()} / mo</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#E8EAF0] p-6 flex flex-col justify-between shadow-sm">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-4">Create Plan</h3>
                  <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-[9px] text-[#6B7280] uppercase font-bold mb-1">Plan Title</label>
                      <input
                        type="text"
                        value={newPlanName}
                        onChange={(e) => setNewPlanName(e.target.value)}
                        placeholder="e.g. Standard Plus"
                        required
                        className="w-full bg-[#F5F7FB] border border-[#E8EAF0] rounded-xl p-2.5 text-[#111827] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#6B7280] uppercase font-bold mb-1">Price (₹)</label>
                      <input
                        type="number"
                        value={newPlanPrice}
                        onChange={(e) => setNewPlanPrice(+e.target.value)}
                        required
                        className="w-full bg-[#F5F7FB] border border-[#E8EAF0] rounded-xl p-2.5 text-[#111827] focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#5B5CEB] hover:bg-[#5B5CEB]/90 text-white rounded-xl py-2.5 text-xs font-semibold mt-4 shadow-sm"
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
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#6B7280]">Support Ticket Board</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Column 1: OPEN */}
                <div className="bg-[#F5F7FB] border border-[#E8EAF0] rounded-2xl p-4 flex flex-col h-[400px]">
                  <span className="text-[10px] text-[#6B7280] uppercase tracking-wider font-bold mb-3 block">Open</span>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {tickets.filter(t => t.status === 'open').map(t => (
                      <button
                        key={t.id}
                        onClick={() => setActiveTicket(t)}
                        className="w-full text-left bg-white border border-[#E8EAF0] hover:border-[#5B5CEB]/50 rounded-xl p-4 transition-all shadow-sm"
                      >
                        <div className="text-[10px] font-bold text-[#111827]">{t.restaurant}</div>
                        <p className="text-[10px] text-[#6B7280] mt-1">{t.subject}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Column 2: PROGRESS */}
                <div className="bg-[#F5F7FB] border border-[#E8EAF0] rounded-2xl p-4 flex flex-col h-[400px]">
                  <span className="text-[10px] text-[#6B7280] uppercase tracking-wider font-bold mb-3 block">In Progress</span>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {tickets.filter(t => t.status === 'progress').map(t => (
                      <button
                        key={t.id}
                        onClick={() => setActiveTicket(t)}
                        className="w-full text-left bg-white border border-[#E8EAF0] hover:border-[#5B5CEB]/50 rounded-xl p-4 transition-all shadow-sm"
                      >
                        <div className="text-[10px] font-bold text-[#111827]">{t.restaurant}</div>
                        <p className="text-[10px] text-[#6B7280] mt-1">{t.subject}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Column 3: RESOLVED */}
                <div className="bg-[#F5F7FB] border border-[#E8EAF0] rounded-2xl p-4 flex flex-col h-[400px]">
                  <span className="text-[10px] text-[#6B7280] uppercase tracking-wider font-bold mb-3 block">Resolved</span>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {tickets.filter(t => t.status === 'resolved').map(t => (
                      <button
                        key={t.id}
                        className="w-full text-left bg-white border border-[#E8EAF0] rounded-xl p-4 opacity-60"
                      >
                        <div className="text-[10px] font-bold text-[#6B7280]">{t.restaurant}</div>
                        <p className="text-[10px] text-[#6B7280] mt-1 line-through">{t.subject}</p>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {activeTicket && (
                <div className="bg-white border border-[#E8EAF0] rounded-2xl p-6 max-w-xl mx-auto w-full flex flex-col gap-4 shadow-md">
                  <div className="flex justify-between items-start border-b border-[#E8EAF0] pb-3">
                    <div>
                      <span className="text-[8px] text-[#6B7280] font-mono">Ticket {activeTicket.id}</span>
                      <h4 className="text-xs font-bold text-[#111827] mt-1">{activeTicket.restaurant}</h4>
                    </div>
                    <button onClick={() => setActiveTicket(null)} className="text-xs text-[#6B7280] hover:text-[#111827]">Close</button>
                  </div>
                  <p className="text-xs text-[#6B7280]">{activeTicket.subject}</p>

                  <div className="space-y-3">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type official support response..."
                      rows={3}
                      className="w-full bg-[#F5F7FB] border border-[#E8EAF0] rounded-xl p-3 text-xs text-[#111827] focus:outline-none resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleUpdateTicketStatus(activeTicket.id, 'resolved')}
                        className="bg-[#16C784]/10 text-[#16C784] border border-[#16C784]/20 text-[10px] font-semibold px-3 py-1.5 rounded-lg"
                      >
                        Mark Resolved
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
              <div className="xl:col-span-2 bg-white rounded-2xl border border-[#E8EAF0] p-6 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#6B7280] mb-4">Restaurants Feature Toggles</h3>
                <div className="space-y-3">
                  {restaurants.map(r => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedTenant(r)}
                      className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all ${
                        selectedTenant?.id === r.id
                          ? 'bg-[#5B5CEB]/10 border-[#5B5CEB]/30 text-[#5B5CEB]'
                          : 'bg-white border-[#E8EAF0] text-[#111827]'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold">{r.name}</div>
                        <div className="text-[10px] text-[#6B7280] mt-1 font-mono">
                          Active Features: {Object.keys(r.featureFlags).filter(k => r.featureFlags[k]).join(', ')}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#E8EAF0] p-6 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-4">Feature Flags Controller</h3>
                {selectedTenant ? (
                  <div className="space-y-5">
                    <div className="bg-[#F5F7FB] border border-[#E8EAF0] rounded-xl p-3.5">
                      <span className="text-[9px] text-[#6B7280] font-mono block">Selected Restaurant</span>
                      <h4 className="text-xs font-bold text-[#111827] mt-1">{selectedTenant.name}</h4>
                    </div>

                    <div className="space-y-4 text-xs">
                      {['qr_ordering', 'crm_loyalty', 'ai_copilot', 'kds_display', 'ONDC', 'whatsapp'].map(flag => (
                        <div key={flag} className="flex items-center justify-between">
                          <span className="font-bold text-[#111827] uppercase tracking-wider text-[10px]">{flag.replace('_', ' ')}</span>
                          <button onClick={() => handleToggleFeature(selectedTenant.id, flag)}>
                            {selectedTenant.featureFlags[flag] ? <ToggleRight className="w-8 h-8 text-[#5B5CEB]" /> : <ToggleLeft className="w-8 h-8 text-[#6B7280]" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-12 text-xs text-[#6B7280] font-mono">
                    Select a restaurant to modify its active SaaS modules.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: Broadcast Center */}
          {activeTab === 'broadcast' && (
            <div className="bg-white rounded-2xl border border-[#E8EAF0] p-6 max-w-xl mx-auto w-full shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#6B7280] mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#5B5CEB]" />
                <span>Broadcast Center Dispatcher</span>
              </h3>

              <form onSubmit={handleSendBroadcast} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] text-[#6B7280] uppercase font-bold mb-1.5">Scope Target</label>
                    <select
                      value={broadTarget}
                      onChange={(e) => setBroadTarget(e.target.value)}
                      className="w-full bg-[#F5F7FB] border border-[#E8EAF0] rounded-xl p-2.5 text-xs text-[#111827] focus:outline-none"
                    >
                      <option value="all">All Restaurants</option>
                      <option value="free_trial">Free Trial Users</option>
                      <option value="premium">Starter & Pro Premium Plans</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] text-[#6B7280] uppercase font-bold mb-1.5">Channel</label>
                    <select
                      value={broadChannel}
                      onChange={(e) => setBroadChannel(e.target.value)}
                      className="w-full bg-[#F5F7FB] border border-[#E8EAF0] rounded-xl p-2.5 text-xs text-[#111827] focus:outline-none"
                    >
                      <option value="in_app">In-App Alert Notification</option>
                      <option value="sms">SMS Text Message</option>
                      <option value="whatsapp">WhatsApp Direct Template</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] text-[#6B7280] uppercase font-bold mb-1.5">Subject Title</label>
                  <input
                    type="text"
                    value={broadTitle}
                    onChange={(e) => setBroadTitle(e.target.value)}
                    placeholder="e.g. Server Upgrade Schedule Notice"
                    required
                    className="w-full bg-[#F5F7FB] border border-[#E8EAF0] rounded-xl p-2.5 text-xs text-[#111827] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-[#6B7280] uppercase font-bold mb-1.5">Alert Details</label>
                  <textarea
                    value={broadMsg}
                    onChange={(e) => setBroadMsg(e.target.value)}
                    placeholder="Type broadcast text message..."
                    required
                    rows={4}
                    className="w-full bg-[#F5F7FB] border border-[#E8EAF0] rounded-xl p-2.5 text-xs text-[#111827] focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#5B5CEB] hover:bg-[#5B5CEB]/90 text-white rounded-xl py-2.5 text-xs font-semibold transition-all shadow-sm"
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
                <div className="bg-white rounded-2xl border border-[#E8EAF0] p-6 h-[260px] flex flex-col justify-between shadow-sm">
                  <div>
                    <h4 className="text-xs font-bold text-[#111827]">Cluster CPU Load</h4>
                    <span className="text-[9px] text-[#6B7280]">FastAPI threads performance</span>
                  </div>
                  <div className="flex items-end justify-between h-24 mt-4 gap-2">
                    {[28, 35, 42, 30, 25, 45, sysHealth.cpu].map((v, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        <div 
                          style={{ height: `${v * 1.5}px` }} 
                          className={`w-full rounded-t-md transition-all ${
                            idx === 6 ? 'bg-[#5B5CEB]' : 'bg-[#F5F7FB] border border-[#E8EAF0]'
                          }`} 
                        />
                        <span className="text-[8px] text-[#6B7280] font-mono mt-1">T-{6 - idx}m</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#E8EAF0] p-6 h-[260px] flex flex-col justify-between shadow-sm">
                  <div>
                    <h4 className="text-xs font-bold text-[#111827]">RAM allocation</h4>
                    <span className="text-[9px] text-[#6B7280]">Container memory usage limits</span>
                  </div>
                  <div className="space-y-4 mt-6">
                    <div className="flex justify-between text-xs text-[#6B7280] font-mono">
                      <span>Allocated: {sysHealth.ram} GB</span>
                      <span>Total Limit: 8.0 GB</span>
                    </div>
                    <div className="w-full bg-[#F5F7FB] rounded-full h-3 overflow-hidden border border-[#E8EAF0]">
                      <div style={{ width: `${(sysHealth.ram / 8.0) * 100}%` }} className="bg-[#5B5CEB] h-full rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: Audit Logs Center */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-[#E8EAF0] p-6 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#6B7280] mb-4">Platform Audit Logs</h3>
                <div className="space-y-4">
                  {[
                    { actor: 'admin@ugsrestoflow.com', action: 'SUSPEND_TENANT', target: 'Paradise Biryani', time: '2026-07-25 17:40:12', ip: '192.168.1.45', device: 'Chrome / Windows 11' },
                    { actor: 'admin@ugsrestoflow.com', action: 'UPDATE_FEATURE_FLAGS', target: 'Blue Tokai Cafe', time: '2026-07-25 16:32:05', ip: '192.168.1.45', device: 'Chrome / Windows 11' },
                    { actor: 'system@ugsrestoflow.com', action: 'AUTO_BACKUP_COMPLETED', target: 'Database Clusters', time: '2026-07-25 05:00:00', ip: 'localhost', device: 'Worker Instance' }
                  ].map((log, idx) => (
                    <div key={idx} className="bg-[#F5F7FB] border border-[#E8EAF0] rounded-xl p-4 font-mono text-[10px] text-[#6B7280] space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#5B5CEB] font-bold">{log.actor}</span>
                        <span className="text-[#111827] font-bold">{log.action}</span>
                      </div>
                      <div>Target: <span className="text-[#111827] font-medium">{log.target}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: Platform Gateway Settings */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-2xl border border-[#E8EAF0] p-6 max-w-xl mx-auto w-full shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#6B7280] mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#5B5CEB]" />
                <span>Platform Integrations</span>
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[9px] text-[#6B7280] uppercase font-bold mb-1.5">Razorpay API Key</label>
                  <input
                    type="text"
                    value={razorpayKey}
                    onChange={(e) => setRazorpayKey(e.target.value)}
                    className="w-full bg-[#F5F7FB] border border-[#E8EAF0] rounded-xl p-2.5 text-[#111827] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-[#6B7280] uppercase font-bold mb-1.5">SMTP Host</label>
                  <input
                    type="text"
                    value={smtpServer}
                    onChange={(e) => setSmtpServer(e.target.value)}
                    className="w-full bg-[#F5F7FB] border border-[#E8EAF0] rounded-xl p-2.5 text-[#111827] focus:outline-none"
                  />
                </div>

                <button
                  onClick={() => showToast('Integrations credentials updated!')}
                  className="w-full bg-[#5B5CEB] hover:bg-[#5B5CEB]/90 text-white rounded-xl py-2.5 text-xs font-semibold mt-4 shadow-sm"
                >
                  Save Integration Keys
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating status toast */}
      {toast && (
        <div className="fixed bottom-6 left-6 z-50 bg-white border border-[#E8EAF0] text-[#5B5CEB] rounded-xl px-4 py-3 text-xs shadow-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-[#16C784]" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}
