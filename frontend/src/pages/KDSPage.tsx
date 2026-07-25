import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { Flame, Clock, CheckCircle2, Play, Bell, AlertTriangle, CheckCircle, LogOut } from 'lucide-react'

interface KDSItem {
  name: string
  quantity: number
  variantName?: string
}

interface KDSTicket {
  id: string // KOT-0001
  tableNumber: string
  items: KDSItem[]
  status: 'pending' | 'preparing' | 'ready'
  timestamp: Date // Created time
}

const INITIAL_TICKETS: KDSTicket[] = [
  {
    id: 'KOT-8491',
    tableNumber: 'T02',
    items: [
      { name: 'Paneer Butter Masala', quantity: 1 },
      { name: 'Butter Tandoori Roti', quantity: 3 }
    ],
    status: 'pending',
    timestamp: new Date(Date.now() - 3 * 60 * 1000) // 3 mins ago
  },
  {
    id: 'KOT-8490',
    tableNumber: 'T03',
    items: [
      { name: 'Hyderabadi Veg Biryani', quantity: 2 },
      { name: 'Kesar Sweet Lassi', quantity: 2 }
    ],
    status: 'preparing',
    timestamp: new Date(Date.now() - 12 * 60 * 1000) // 12 mins ago
  },
  {
    id: 'KOT-8489',
    tableNumber: 'V01',
    items: [
      { name: 'Tandoori Paneer Tikka', quantity: 1 },
      { name: 'Cocktail Samosa (4pcs)', quantity: 1 }
    ],
    status: 'ready',
    timestamp: new Date(Date.now() - 25 * 60 * 1000) // 25 mins ago
  }
]

export default function KDSPage() {
  const { user, logout } = useAuthStore()
  const [tickets, setTickets] = useState<KDSTicket[]>(INITIAL_TICKETS)
  const [tick, setTick] = useState(0) // Forces component timer updates every second
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Timer update tick
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  // Simulate receiving a new order over WebSocket for demo
  const handleSimulateNewOrder = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    const tableNum = ['T01', 'T02', 'V01', 'O01'][Math.floor(Math.random() * 4)]
    const mockKOT: KDSTicket = {
      id: `KOT-${randomNum}`,
      tableNumber: tableNum,
      items: [
        { name: 'Crispy Chilli Babycorn', quantity: 1 },
        { name: 'Fresh Mint Mojito', quantity: 2 }
      ],
      status: 'pending',
      timestamp: new Date()
    }

    setTickets(prev => [mockKOT, ...prev])
    
    // Play alert sound if enabled
    if (soundEnabled) {
      triggerAudioAlert()
    }
  }

  // Generate synthetic beep tone using Web Audio API (no external file dependencies)
  const triggerAudioAlert = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(660, audioCtx.currentTime) // High clear pitch
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime)

      oscillator.start()
      oscillator.stop(audioCtx.currentTime + 0.15) // Brief 150ms notification beep
    } catch (e) {
      console.warn("Audio Context blocked by browser auto-play policy.")
    }
  }

  // Progress KOT tickets across statuses
  const updateTicketStatus = (id: string, newStatus: 'preparing' | 'ready' | 'completed') => {
    if (newStatus === 'completed') {
      setTickets(prev => prev.filter(t => t.id !== id))
    } else {
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))
    }
  }

  // Calculate elapsed time and set threshold colors (Green <10m, Amber 10-20m, Red >20m)
  const getTicketAgeDetails = (date: Date) => {
    const elapsedSeconds = Math.floor((Date.now() - date.getTime()) / 1000)
    const minutes = Math.floor(elapsedSeconds / 60)
    const seconds = elapsedSeconds % 60
    
    let color = 'text-emerald-400'
    let borderColor = 'border-zinc-900'
    let isUrgent = false

    if (minutes >= 20) {
      color = 'text-red-400 font-bold'
      borderColor = 'border-red-500/40 shadow-lg shadow-red-500/5'
      isUrgent = true
    } else if (minutes >= 10) {
      color = 'text-amber-400 font-semibold'
      borderColor = 'border-amber-500/30'
    }

    return {
      timeStr: `${minutes}:${seconds.toString().padStart(2, '0')}`,
      color,
      borderColor,
      isUrgent
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans text-zinc-100">
      {/* Top Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Flame className="w-5 h-5 text-brand-500" />
          <h1 className="font-semibold text-zinc-200 tracking-tight">Kitchen Display System (KDS)</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Toggle Audio Bleeps */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`text-xs px-3.5 py-1.5 rounded-full border font-medium transition-all ${
              soundEnabled
                ? 'bg-zinc-900 text-zinc-300 border-zinc-800'
                : 'bg-zinc-900 text-zinc-600 border-zinc-800 line-through'
            }`}
          >
            {soundEnabled ? 'Audio Alerts: ON' : 'Audio Alerts: OFF'}
          </button>

          <button
            onClick={logout}
            className="bg-[#1C1C1E] hover:bg-zinc-800 border border-zinc-800 p-2.5 rounded-xl text-zinc-400 hover:text-red-400 transition-colors active:scale-[0.98]"
            title="Sign Out KDS Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Grid columns of cooking stages */}
      <main className="flex-1 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        {/* PENDING TICKETS */}
        <section className="flex flex-col bg-zinc-900/10 border border-zinc-900/80 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Incoming Queue</h3>
            <span className="text-xs bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-800 font-mono">
              {tickets.filter(t => t.status === 'pending').length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {tickets.filter(t => t.status === 'pending').map(ticket => {
              const { timeStr, color, borderColor } = getTicketAgeDetails(ticket.timestamp)
              return (
                <div key={ticket.id} className={`bg-zinc-900/30 border rounded-xl p-4 flex flex-col justify-between ${borderColor}`}>
                  <div>
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-3">
                      <span className="text-xs font-bold font-mono text-zinc-300">{ticket.id}</span>
                      <span className="text-xs bg-zinc-800 text-zinc-200 px-2.5 py-0.5 rounded-md font-bold font-mono">
                        Table {ticket.tableNumber}
                      </span>
                    </div>

                    <ul className="space-y-2 mb-4">
                      {ticket.items.map((item, idx) => (
                        <li key={idx} className="flex items-start justify-between text-sm">
                          <span className="text-zinc-400">{item.name}</span>
                          <span className="font-bold text-brand-400 font-mono">x{item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-900/40">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      <span className={`text-xs font-mono ${color}`}>{timeStr}</span>
                    </div>

                    <button
                      onClick={() => updateTicketStatus(ticket.id, 'preparing')}
                      className="bg-brand-600 hover:bg-brand-500 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors active:scale-[0.98]"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Start Cooking</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* PREPARING TICKETS */}
        <section className="flex flex-col bg-zinc-900/10 border border-zinc-900/80 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Preparation Desk</h3>
            <span className="text-xs bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-800 font-mono">
              {tickets.filter(t => t.status === 'preparing').length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {tickets.filter(t => t.status === 'preparing').map(ticket => {
              const { timeStr, color, borderColor, isUrgent } = getTicketAgeDetails(ticket.timestamp)
              return (
                <div key={ticket.id} className={`bg-zinc-900/30 border rounded-xl p-4 flex flex-col justify-between ${borderColor}`}>
                  <div>
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-zinc-300">{ticket.id}</span>
                        {isUrgent && <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />}
                      </div>
                      <span className="text-xs bg-zinc-800 text-zinc-200 px-2.5 py-0.5 rounded-md font-bold font-mono">
                        Table {ticket.tableNumber}
                      </span>
                    </div>

                    <ul className="space-y-2 mb-4">
                      {ticket.items.map((item, idx) => (
                        <li key={idx} className="flex items-start justify-between text-sm">
                          <span className="text-zinc-400">{item.name}</span>
                          <span className="font-bold text-brand-400 font-mono">x{item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-900/40">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      <span className={`text-xs font-mono ${color}`}>{timeStr}</span>
                    </div>

                    <button
                      onClick={() => updateTicketStatus(ticket.id, 'ready')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors active:scale-[0.98]"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Mark Ready</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* READY TICKETS */}
        <section className="flex flex-col bg-zinc-900/10 border border-zinc-900/80 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Ready for Dispatch</h3>
            <span className="text-xs bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-800 font-mono">
              {tickets.filter(t => t.status === 'ready').length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {tickets.filter(t => t.status === 'ready').map(ticket => {
              const { timeStr, color, borderColor } = getTicketAgeDetails(ticket.timestamp)
              return (
                <div key={ticket.id} className={`bg-zinc-900/30 border rounded-xl p-4 flex flex-col justify-between ${borderColor}`}>
                  <div>
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-3">
                      <span className="text-xs font-bold font-mono text-zinc-300">{ticket.id}</span>
                      <span className="text-xs bg-zinc-800 text-zinc-200 px-2.5 py-0.5 rounded-md font-bold font-mono">
                        Table {ticket.tableNumber}
                      </span>
                    </div>

                    <ul className="space-y-2 mb-4">
                      {ticket.items.map((item, idx) => (
                        <li key={idx} className="flex items-start justify-between text-sm">
                          <span className="text-zinc-400 line-through decoration-zinc-700">{item.name}</span>
                          <span className="font-bold text-zinc-500 font-mono">x{item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-900/40">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs text-emerald-500 font-medium">Ready</span>
                    </div>

                    <button
                      onClick={() => updateTicketStatus(ticket.id, 'completed')}
                      className="bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border border-zinc-750 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors active:scale-[0.98]"
                    >
                      <span>Complete</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}
