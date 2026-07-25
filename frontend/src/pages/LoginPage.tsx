import React, { useState } from 'react'
import { useAuthStore, UserRole } from '../store/authStore'
import { Shield, Sparkles, Key, Mail, Terminal, Database } from 'lucide-react'
import Logo from '../components/Logo'

export default function LoginPage() {
  const { setSession } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSimulate, setShowSimulate] = useState(true)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        setSession(
          {
            email: data.email,
            fullName: data.full_name,
            role: data.role as UserRole,
            tenantId: data.tenant_id,
            branchId: data.branch_id,
            isActive: true,
          },
          data.access_token,
          data.refresh_token,
          {
            plan: 'free_trial',
            status: 'active',
            startsAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            graceEndsAt: null,
          }
        )
      } else {
        const errData = await response.json()
        setError(errData.detail || 'Invalid email or password.')
      }
    } catch (err) {
      // Offline fallback login for Vercel/mock preview environments
      console.warn("FastAPI database server is unreachable. Initializing offline preview session.")
      
      let resolvedRole: UserRole = 'owner'
      let resolvedName = 'Rohan Mehta (Offline Preview)'
      let resolvedSetupComplete = false

      if (email.includes('admin')) {
        resolvedRole = 'super_admin'
        resolvedName = 'Priya Sharma (Platform Admin)'
        resolvedSetupComplete = true
      } else if (email.includes('cashier')) {
        resolvedRole = 'cashier'
        resolvedName = 'Karan Singh (POS Cashier)'
      } else if (email.includes('chef') || email.includes('kitchen')) {
        resolvedRole = 'kitchen'
        resolvedName = 'Chef Sanjay (KDS Chef)'
      } else if (email.includes('accountant')) {
        resolvedRole = 'accountant'
        resolvedName = 'Neha Sen (Finance Lead)'
      } else if (email.includes('waiter')) {
        resolvedRole = 'waiter'
        resolvedName = 'Rahul Dev (Server)'
      }

      setSession(
        {
          email: email || 'owner@gourmetgarden.com',
          fullName: resolvedName,
          role: resolvedRole,
          tenantId: resolvedRole === 'super_admin' ? 'platform' : 'ten_demo',
          branchId: resolvedRole === 'super_admin' ? 'platform' : 'br_main',
          isActive: true,
          setupComplete: resolvedSetupComplete
        },
        'mock_access_token_123',
        'mock_refresh_token_123',
        {
          plan: 'free_trial',
          status: 'active',
          startsAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          graceEndsAt: null,
        }
      )
    } finally {
      setLoading(false)
    }
  }

  // Simulator helper to test layout, POS billing, and KDS without manual DB creation
  const handleSimulatedLogin = (role: UserRole) => {
    const mockNames: Record<UserRole, string> = {
      super_admin: 'Priya Sharma (Platform Administrator)',
      owner: 'Rohan Mehta (Restaurateur)',
      manager: 'Aman Verma (General Manager)',
      cashier: 'Karan Singh (POS Billing Lead)',
      kitchen: 'Chef Sanjay (Executive Chef)',
      waiter: 'Rahul Dev (Senior Waiter)',
      accountant: 'Neha Sen (Finance Lead)',
    }

    setSession(
      {
        email: `${role}@ugsrestoflow.com`,
        fullName: mockNames[role],
        role: role,
        tenantId: 'ten_mock_999',
        branchId: 'br_main',
        isActive: true,
      },
      'mock_access_token_123',
      'mock_refresh_token_123',
      {
        plan: role === 'super_admin' ? 'yearly' : 'free_trial',
        status: 'active',
        startsAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days left
        graceEndsAt: null,
      }
    )
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-zinc-950 p-6 overflow-hidden">
      {/* Decorative premium violet glow shapes */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[450px] relative z-10">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-8">
          <Logo className="w-16 h-16 mb-2" />
          <h1 className="text-3xl font-bold tracking-tight font-sans bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">
            UGS-Restoflow
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Enterprise Restaurant Operating System</p>
        </div>

        {/* Login glass card */}
        <div className="glass-panel rounded-2xl p-8 shadow-2xl relative">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-xs leading-relaxed flex items-start gap-2 animate-fade-in">
                <Database className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@ugsrestoflow.com"
                  required
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-sm text-zinc-200 focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/30 transition-all placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-sm text-zinc-200 focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/30 transition-all placeholder:text-zinc-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white rounded-xl py-3 text-sm font-medium transition-all duration-200 border border-brand-500/20 shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 disabled:opacity-50 active:scale-[0.98] btn-glow"
            >
              {loading ? 'Verifying Credentials...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Access Channels */}
          <div className="mt-6 border-t border-zinc-900 pt-5">
            <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider block mb-3 text-center">Fast Login Channels</span>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => handleSimulatedLogin('super_admin')}
                className="bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800 text-[10px] py-2.5 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                SaaS Admin Portal
              </button>
              <button 
                onClick={() => handleSimulatedLogin('owner')}
                className="bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800 text-[10px] py-2.5 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Resto Owner
              </button>
              <button 
                onClick={() => handleSimulatedLogin('cashier')}
                className="bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800 text-[10px] py-2.5 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                POS Cashier
              </button>
              <button 
                onClick={() => handleSimulatedLogin('kitchen')}
                className="bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800 text-[10px] py-2.5 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Kitchen KDS
              </button>
              <button 
                onClick={() => handleSimulatedLogin('accountant')}
                className="bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800 text-[10px] py-2.5 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors col-span-2"
              >
                Accountant Shift Drawer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
