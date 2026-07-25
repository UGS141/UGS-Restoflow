import React, { useState, useEffect, useRef } from 'react'
import { usePOSStore } from '../store/posStore'
import { useAuthStore } from '../store/authStore'
import { Search, Trash2, Wifi, WifiOff, CreditCard, DollarSign, QrCode, Keyboard, LogOut, Layout } from 'lucide-react'

// Concrete, production menu items list (India first menu items)
const INITIAL_MENU = [
  { id: 'm_paneer', name: 'Paneer Butter Masala', category: 'Main Course', price: 280, code: '101' },
  { id: 'm_roti', name: 'Butter Tandoori Roti', category: 'Main Course', price: 40, code: '102' },
  { id: 'm_dal', name: 'Dal Makhani Signature', category: 'Main Course', price: 240, code: '103' },
  { id: 'm_biryani', name: 'Hyderabadi Veg Biryani', category: 'Main Course', price: 320, code: '104' },
  { id: 's_samosa', name: 'Cocktail Samosa (4pcs)', category: 'Starters', price: 120, code: '201' },
  { id: 's_chilli', name: 'Crispy Chilli Babycorn', category: 'Starters', price: 210, code: '202' },
  { id: 's_tikka', name: 'Tandoori Paneer Tikka', category: 'Starters', price: 260, code: '203' },
  { id: 'd_lassi', name: 'Kesar Sweet Lassi', category: 'Drinks', price: 90, code: '301' },
  { id: 'd_mojito', name: 'Fresh Mint Mojito', category: 'Drinks', price: 140, code: '302' },
  { id: 'de_jamun', name: 'Gulab Jamun with Rabri', category: 'Desserts', price: 150, code: '401' },
  { id: 'de_brownie', name: 'Sizzling Brownie Fudge', category: 'Desserts', price: 220, code: '402' },
]

export default function POSBillingPage() {
  const { user, logout, isSubscriptionExpired } = useAuthStore()
  const {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isOnline,
    setOnlineStatus,
    checkout,
    syncOfflineQueue,
    offlineQueueCount,
    loadQueueCount
  } = usePOSStore()

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [discountVal, setDiscountVal] = useState<number>(0)
  
  // Custom states for notifications
  const [notification, setNotification] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Initialize and load queue count
  useEffect(() => {
    loadQueueCount()
    // Focus search input on startup (Linear-style speed)
    searchInputRef.current?.focus()
  }, [])

  // Keyboard shortcut listener (F1: Cash, F2: UPI, Esc: Clear Cart)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault()
        triggerCheckout('cash')
      } else if (e.key === 'F2') {
        e.preventDefault()
        triggerCheckout('upi')
      } else if (e.key === 'Escape') {
        e.preventDefault()
        clearCart()
        showToast('Cart cleared')
      } else if (e.key === '/') {
        // Focus search on pressing /
        if (document.activeElement !== searchInputRef.current) {
          e.preventDefault()
          searchInputRef.current?.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cart, discountVal])

  const showToast = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(''), 3000)
  }

  const triggerCheckout = async (method: 'cash' | 'card' | 'upi') => {
    if (cart.length === 0) {
      showToast('Cart is empty!')
      return
    }
    const success = await checkout(method, user?.email || 'unknown')
    if (success) {
      showToast(`Order logged successfully via ${method.toUpperCase()}!`)
      setDiscountVal(0)
    }
  }

  // Filter products based on search query & categories
  const categories = ['All', 'Main Course', 'Starters', 'Drinks', 'Desserts']
  const filteredProducts = INITIAL_MENU.filter(prod => {
    const matchesCat = selectedCategory === 'All' || prod.category === selectedCategory
    const matchesSearch = prod.name.toLowerCase().includes(search.toLowerCase()) || prod.code.includes(search)
    return matchesCat && matchesSearch
  })

  // Cart math calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  const taxableAmount = Math.max(0, subtotal - discountVal)
  const cgst = taxableAmount * 0.025 // 2.5% CGST
  const sgst = taxableAmount * 0.025 // 2.5% SGST
  const totalTax = cgst + sgst
  const grandTotal = taxableAmount + totalTax

  // Subscription block layout validation
  const isExpired = isSubscriptionExpired()
  if (isExpired) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-red-500/10 blur-[100px] pointer-events-none" />
        <div className="glass-panel max-w-md w-full rounded-2xl p-8 border border-red-500/20 text-center relative z-10">
          <WifiOff className="w-16 h-16 text-red-500 mx-auto mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">License Expired</h2>
          <p className="text-zinc-400 text-sm mt-3 leading-relaxed">
            Your **UGS-Restoflow** trial license has expired. Subscription fees must be paid to reactivate cashier billing endpoints.
          </p>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3.5 mt-6 text-xs text-zinc-500">
            Tenant Account: <span className="text-zinc-300 font-semibold">{user?.tenantId}</span>
          </div>
          <button
            onClick={logout}
            className="w-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 rounded-xl py-3 text-sm font-medium mt-6 transition-colors"
          >
            Switch Accounts / Log Out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-violet-500 flex items-center justify-center border border-brand-500/30">
              <span className="font-bold text-sm text-white font-sans">R</span>
            </div>
            <span className="font-semibold text-zinc-200 tracking-tight">UGS-Restoflow</span>
          </div>
          <span className="text-xs text-zinc-600">|</span>
          <span className="text-xs bg-zinc-900 text-zinc-400 border border-zinc-800 rounded-full px-3 py-1 font-medium font-sans">
            Branch: Main Dining
          </span>
        </div>

        {/* Dynamic connection indicator dashboard */}
        <div className="flex items-center gap-4">
          {/* Diagnostic Sync Stats */}
          {offlineQueueCount > 0 && (
            <button
              onClick={syncOfflineQueue}
              className="bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs px-3.5 py-1.5 rounded-full font-medium flex items-center gap-2 animate-pulse hover:bg-brand-500/20 transition-all"
            >
              <span>{offlineQueueCount} Offline Bills Queued</span>
            </button>
          )}

          {/* Interactive online/offline test toggle */}
          <button
            onClick={() => setOnlineStatus(!isOnline)}
            className={`text-xs px-3.5 py-1.5 rounded-full border font-medium flex items-center gap-2 transition-all ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span>Online Mode</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Simulated Offline</span>
              </>
            )}
          </button>

          <span className="text-zinc-700">|</span>

          {/* Logged in profile */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-medium text-zinc-300">{user?.fullName}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{user?.role}</div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-900 rounded-lg transition-colors"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main split dashboard view */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Side: Product Search & Grid Panel */}
        <section className="flex-1 flex flex-col p-6 overflow-y-auto">
          {/* Search bar & Keyboard shortcuts */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu item or barcode... (Press '/' to focus)"
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-sm text-zinc-200 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 placeholder:text-zinc-600 transition-all"
              />
            </div>

            {/* Category filter pills */}
            <div className="flex items-center gap-1.5 bg-zinc-900/50 p-1 border border-zinc-800 rounded-xl">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-3.5 py-2 rounded-lg font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-zinc-800 text-zinc-100 shadow-md'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of menu items */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(prod => (
              <button
                key={prod.id}
                onClick={() => addToCart({ id: prod.id, menu_item_id: prod.id, name: prod.name, price: prod.price })}
                className="glass-panel text-left p-4 rounded-xl flex flex-col justify-between h-[130px] glass-card-hover active:scale-[0.98] group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-500 px-2 py-0.5 rounded font-mono">
                      #{prod.code}
                    </span>
                    <span className="text-[10px] text-zinc-500">{prod.category}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-zinc-200 mt-2.5 leading-tight group-hover:text-brand-500 transition-colors">
                    {prod.name}
                  </h4>
                </div>
                <div className="text-sm font-bold text-zinc-100 font-mono mt-2">
                  ₹{prod.price.toFixed(2)}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Right Side: Invoice Billing POS Cart */}
        <section className="w-[420px] border-l border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col relative z-20">
          <div className="p-5 border-b border-zinc-900 flex items-center justify-between">
            <h3 className="font-semibold text-zinc-200 tracking-tight">Active Ticket</h3>
            <button
              onClick={() => {
                clearCart()
                showToast('Ticket cleared')
              }}
              className="text-xs text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Ticket</span>
            </button>
          </div>

          {/* Cart list scroll area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-600">
                <Keyboard className="w-10 h-10 mb-3 stroke-[1.5] text-zinc-700" />
                <p className="text-sm font-medium">Ticket is empty</p>
                <p className="text-xs text-zinc-700 mt-1 leading-relaxed">
                  Select menu items to check out. Press Esc to clear, or F1/F2 keys for quick payment.
                </p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3.5 bg-zinc-900/30 border border-zinc-900 rounded-xl hover:border-zinc-800 transition-colors">
                  <div className="flex-1 pr-3">
                    <h5 className="text-xs font-semibold text-zinc-300 leading-tight">{item.name}</h5>
                    <span className="text-[10px] text-zinc-500 font-mono">₹{item.price} each</span>
                  </div>
                  
                  {/* Quantity adjustments */}
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-md bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-sm font-semibold border border-zinc-800 text-zinc-400 hover:text-zinc-250 transition-colors"
                    >
                      -
                    </button>
                    <span className="text-xs font-mono font-semibold w-5 text-center text-zinc-300">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-md bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-sm font-semibold border border-zinc-800 text-zinc-400 hover:text-zinc-250 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  
                  {/* Item total */}
                  <div className="w-16 text-right text-xs font-mono font-semibold text-zinc-300 pl-3">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pricing breakdowns */}
          <div className="p-5 border-t border-zinc-900 bg-zinc-950/60 space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Subtotal</span>
              <span className="font-mono font-medium">₹{subtotal.toFixed(2)}</span>
            </div>

            {/* Discount Form Input */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Discount Amount</span>
              <input
                type="number"
                value={discountVal || ''}
                onChange={(e) => setDiscountVal(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-20 bg-zinc-900/60 border border-zinc-900 rounded px-1.5 py-0.5 text-right font-mono text-zinc-300 focus:outline-none focus:border-brand-500/50"
                placeholder="₹0"
              />
            </div>

            {/* Tax breakdowns (India standard 5% GST split) */}
            <div className="flex items-center justify-between text-xs text-zinc-600">
              <span>CGST (2.5%)</span>
              <span className="font-mono">₹{cgst.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-600">
              <span>SGST (2.5%)</span>
              <span className="font-mono">₹{sgst.toFixed(2)}</span>
            </div>

            <div className="h-px bg-zinc-900 my-1" />

            <div className="flex items-center justify-between text-sm font-bold text-zinc-200">
              <span>Total Payable</span>
              <span className="font-mono text-brand-500">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Checkout Payments Action Buttons */}
          <div className="p-5 border-t border-zinc-900 bg-zinc-950 grid grid-cols-3 gap-2.5">
            <button
              onClick={() => triggerCheckout('cash')}
              className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 rounded-xl py-3 text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
            >
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span>Cash (F1)</span>
            </button>
            <button
              onClick={() => triggerCheckout('upi')}
              className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 rounded-xl py-3 text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
            >
              <QrCode className="w-4 h-4 text-brand-500" />
              <span>UPI (F2)</span>
            </button>
            <button
              onClick={() => triggerCheckout('card')}
              className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 rounded-xl py-3 text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
            >
              <CreditCard className="w-4 h-4 text-blue-500" />
              <span>Card</span>
            </button>
          </div>
        </section>
      </main>

      {/* Floating status toast */}
      {notification && (
        <div className="fixed bottom-6 left-6 z-50 bg-zinc-900 border border-brand-500/20 text-brand-400 rounded-xl px-4 py-3 text-xs shadow-xl flex items-center gap-2 animate-slide-up">
          <Keyboard className="w-4 h-4 text-brand-500 animate-pulse" />
          <span>{notification}</span>
        </div>
      )}
    </div>
  )
}
