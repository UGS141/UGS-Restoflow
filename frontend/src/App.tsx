import React, { useState } from 'react'
import { useAuthStore } from './store/authStore'
import LoginPage from './pages/LoginPage'
import POSBillingPage from './pages/POSBillingPage'
import LayoutBuilderPage from './pages/LayoutBuilderPage'
import KDSPage from './pages/KDSPage'
import SetupWizardPage from './pages/SetupWizardPage'
import SuperAdminPage from './pages/SuperAdminPage'
import MenuManagementPage from './pages/MenuManagementPage'
import InventoryPage from './pages/InventoryPage'
import CRMPage from './pages/CRMPage'
import ReportsPage from './pages/ReportsPage'
import PrintersPage from './pages/PrintersPage'
import FinancePage from './pages/FinancePage'
import AuditPage from './pages/AuditPage'
import SettingsPage from './pages/SettingsPage'
import DashboardPage from './pages/DashboardPage'
import { Shield, Sparkles, LogOut, Database, Layers, Flame, CreditCard, BookOpen, Scale, Users, FileText, Printer, Landmark, Settings, TrendingUp } from 'lucide-react'
import Logo from './components/Logo'

type TabName = 'dashboard' | 'pos' | 'layout' | 'kds' | 'menu' | 'inventory' | 'crm' | 'reports' | 'printers' | 'finance' | 'audit' | 'settings' | 'superadmin'

export default function App() {
  const { user, logout, completeSetup } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TabName>('dashboard')

  // 1. Enforce Authentication view
  if (!user) {
    return <LoginPage />
  }

  // 1.5 Enforce Setup Wizard for fresh Restaurant Owners
  if (user.role === 'owner' && !user.setupComplete) {
    return <SetupWizardPage onComplete={completeSetup} />
  }

  // 2. Multi-tenant SaaS role routing redirects
  // Direct Super Admins directly to their control panel
  if (user.role === 'super_admin') {
    return <SuperAdminPage />
  }

  // 3. For Cashiers, Kitchen, and Accountants, lock navigation to their specific tasks
  if (user.role === 'cashier') {
    return <POSBillingPage />
  }

  if (user.role === 'kitchen') {
    return <KDSPage />
  }

  if (user.role === 'accountant') {
    return <FinancePage />
  }

  // Owners and Managers have access to the modular dashboard sidebar layout
  return (
    <div className="min-h-screen bg-zinc-950 flex font-sans text-zinc-100 overflow-hidden">
      {/* Sleek Apple-style Sidebar navigation */}
      <aside className="w-64 border-r border-zinc-900 bg-zinc-950 flex flex-col justify-between p-5 select-none">
        <div className="space-y-8">
          {/* Brand header */}
          <div className="flex items-center gap-2.5 px-1">
            <Logo className="w-8 h-8" />
            <div>
              <span className="font-bold text-zinc-200 tracking-tight text-sm block leading-none">UGS-Restoflow</span>
              <span className="text-[9px] text-zinc-500 mt-1 block uppercase tracking-wider font-mono">Restaurant OS</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Real-Time Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('pos')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'pos'
                  ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>POS Billing Desk</span>
            </button>

            <button
              onClick={() => setActiveTab('layout')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'layout'
                  ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Floor Layout Builder</span>
            </button>

            <button
              onClick={() => setActiveTab('kds')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'kds'
                  ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>Kitchen Display Board</span>
            </button>

            <button
              onClick={() => setActiveTab('menu')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'menu'
                  ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Menu Manager</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'inventory'
                  ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Inventory Controller</span>
            </button>

            <button
              onClick={() => setActiveTab('crm')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'crm'
                  ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>CRM Customers</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'reports'
                  ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Audits & Reports</span>
            </button>

            <button
              onClick={() => setActiveTab('printers')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'printers'
                  ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Printers Manager</span>
            </button>

            <button
              onClick={() => setActiveTab('finance')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'finance'
                  ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'
              }`}
            >
              <Landmark className="w-4 h-4" />
              <span>Finance Ledgers</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'audit'
                  ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Audit Center</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'settings'
                  ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Business Settings</span>
            </button>
          </nav>
        </div>

        {/* User profile details and log out */}
        <div className="border-t border-zinc-900 pt-5 space-y-4">
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 uppercase">
              {user.fullName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-zinc-300 block truncate leading-tight">{user.fullName}</span>
              <span className="text-[9px] text-zinc-500 block uppercase tracking-wider mt-0.5">{user.role}</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-900 text-zinc-400 hover:text-red-400 rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Main viewport area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {activeTab === 'dashboard' && <DashboardPage />}
        {activeTab === 'pos' && <POSBillingPage />}
        {activeTab === 'layout' && <LayoutBuilderPage />}
        {activeTab === 'kds' && <KDSPage />}
        {activeTab === 'menu' && <MenuManagementPage />}
        {activeTab === 'inventory' && <InventoryPage />}
        {activeTab === 'crm' && <CRMPage />}
        {activeTab === 'reports' && <ReportsPage />}
        {activeTab === 'printers' && <PrintersPage />}
        {activeTab === 'finance' && <FinancePage />}
        {activeTab === 'audit' && <AuditPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>
    </div>
  )
}
