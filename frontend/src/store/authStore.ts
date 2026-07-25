import { create } from 'zustand'

export type UserRole = 'super_admin' | 'owner' | 'manager' | 'cashier' | 'kitchen' | 'waiter' | 'accountant'

export interface UserSession {
  email: string
  fullName: string
  role: UserRole
  tenantId: string | null
  branchId: string | null
  isActive: boolean
  setupComplete?: boolean
}

interface SubscriptionInfo {
  plan: 'free_trial' | 'monthly' | 'quarterly' | 'yearly'
  status: 'active' | 'expired' | 'grace_period'
  startsAt: string
  expiresAt: string
  graceEndsAt: string | null
}

interface AuthState {
  user: UserSession | null
  accessToken: string | null
  refreshToken: string | null
  subscription: SubscriptionInfo | null
  
  // Actions
  setSession: (
    user: UserSession, 
    accessToken: string, 
    refreshToken: string, 
    subscription?: SubscriptionInfo | null
  ) => void
  updateSubscription: (sub: SubscriptionInfo) => void
  completeSetup: () => void
  logout: () => void
  isSubscriptionExpired: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Load initial state from localStorage if available
  const savedUser = localStorage.getItem('ugs_user')
  const savedAccess = localStorage.getItem('ugs_access')
  const savedRefresh = localStorage.getItem('ugs_refresh')
  const savedSub = localStorage.getItem('ugs_sub')

  return {
    user: savedUser ? JSON.parse(savedUser) : null,
    accessToken: savedAccess || null,
    refreshToken: savedRefresh || null,
    subscription: savedSub ? JSON.parse(savedSub) : null,

    setSession: (user, accessToken, refreshToken, subscription = null) => {
      localStorage.setItem('ugs_user', JSON.stringify(user))
      localStorage.setItem('ugs_access', accessToken)
      localStorage.setItem('ugs_refresh', refreshToken)
      if (subscription) {
        localStorage.setItem('ugs_sub', JSON.stringify(subscription))
      } else {
        localStorage.removeItem('ugs_sub')
      }
      set({ user, accessToken, refreshToken, subscription })
    },

    updateSubscription: (subscription) => {
      localStorage.setItem('ugs_sub', JSON.stringify(subscription))
      set({ subscription })
    },

    completeSetup: () => {
      const { user } = get()
      if (user) {
        const updated = { ...user, setupComplete: true }
        localStorage.setItem('ugs_user', JSON.stringify(updated))
        set({ user: updated })
      }
    },

    logout: () => {
      localStorage.removeItem('ugs_user')
      localStorage.removeItem('ugs_access')
      localStorage.removeItem('ugs_refresh')
      localStorage.removeItem('ugs_sub')
      set({ user: null, accessToken: null, refreshToken: null, subscription: null })
    },

    isSubscriptionExpired: () => {
      const { user, subscription } = get()
      
      // Super admins do not have subscription restrictions
      if (user?.role === 'super_admin') return false

      if (!subscription) return true

      // If active, it's not expired
      if (subscription.status === 'active') return false

      // If grace period, check if current date is within grace limits
      if (subscription.status === 'grace_period' && subscription.graceEndsAt) {
        const graceEnd = new Date(subscription.graceEndsAt)
        return new Date() > graceEnd
      }

      // If marked expired, or now is past expires_at
      const expiry = new Date(subscription.expiresAt)
      return new Date() > expiry
    }
  }
})
