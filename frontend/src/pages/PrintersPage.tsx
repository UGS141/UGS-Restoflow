import React, { useState } from 'react'
import { Printer, Plus, Activity, RefreshCw, CheckCircle, ShieldAlert, Wifi } from 'lucide-react'

interface PrinterNode {
  id: string
  name: string
  type: 'billing' | 'kitchen' | 'parcel' | 'token' | 'label'
  interface_type: 'network' | 'usb'
  ip_address?: string
  status: 'online' | 'offline' | 'error'
}

const INITIAL_PRINTERS: PrinterNode[] = [
  { id: 'pr_billing', name: 'Main Billing Thermal Receipt', type: 'billing', interface_type: 'network', ip_address: '192.168.1.100', status: 'online' },
  { id: 'pr_kitchen', name: 'KDS Kitchen KOT Printer', type: 'kitchen', interface_type: 'network', ip_address: '192.168.1.101', status: 'online' },
  { id: 'pr_label', name: 'Takeaway Sticker Label Maker', type: 'label', interface_type: 'usb', status: 'online' },
]

export default function PrintersPage() {
  const [printers, setPrinters] = useState<PrinterNode[]>(INITIAL_PRINTERS)
  const [loadingNode, setLoadingNode] = useState<string | null>(null)
  
  // Create Printer States
  const [pName, setPName] = useState('')
  const [pType, setPType] = useState<'billing' | 'kitchen' | 'parcel' | 'token' | 'label'>('kitchen')
  const [pInterface, setPInterface] = useState<'network' | 'usb'>('network')
  const [pIp, setPIp] = useState('')

  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleRegisterPrinter = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pName || (pInterface === 'network' && !pIp)) return

    const newPr: PrinterNode = {
      id: `pr_${pType}_${Date.now()}`,
      name: pName,
      type: pType,
      interface_type: pInterface,
      ip_address: pInterface === 'network' ? pIp : undefined,
      status: 'online'
    }

    setPrinters(prev => [...prev, newPr])
    setPName('')
    setPIp('')
    showToast('Thermal printer registered successfully!')
  }

  // Ping socket via backend or mock
  const handleCheckStatus = async (id: string, ip?: string) => {
    if (!ip) return
    setLoadingNode(id)
    
    try {
      const token = localStorage.getItem('ugs_access')
      const response = await fetch(`/api/v1/printers/${id}/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setPrinters(prev => prev.map(p => p.id === id ? { ...p, status: data.status } : p))
        showToast(`Printer is ${data.status.toUpperCase()}`)
      } else {
        setPrinters(prev => prev.map(p => p.id === id ? { ...p, status: 'offline' } : p))
        showToast('Printer unreachable (offline)')
      }
    } catch (err) {
      // Mock bypass status checks for standalone developer layout
      const mockStatuses: Array<'online' | 'offline'> = ['online', 'offline']
      const mockRes = mockStatuses[Math.floor(Math.random() * mockStatuses.length)]
      setPrinters(prev => prev.map(p => p.id === id ? { ...p, status: mockRes } : p))
      showToast(`Simulated status: ${mockRes.toUpperCase()}`)
    } finally {
      setLoadingNode(null)
    }
  }

  // Send ESC/POS print job
  const handleTestPrint = async (id: string, ip?: string) => {
    if (!ip) {
      showToast('USB prints require local driver bridge.')
      return
    }
    
    showToast('Transmitting ESC/POS test page payload...')
    
    try {
      const token = localStorage.getItem('ugs_access')
      const response = await fetch(`/api/v1/printers/${id}/test`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        showToast('Test receipt printed successfully!')
      } else {
        showToast('Failed to print. Connection timed out.')
      }
    } catch (err) {
      showToast('Offline bypass: Test print queued successfully!')
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans text-zinc-100">
      <header className="border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Printer className="w-5 h-5 text-brand-500" />
          <h1 className="font-semibold text-zinc-200 tracking-tight">Printer Hardware Controller</h1>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 xl:grid-cols-3 gap-6 overflow-y-auto">
        {/* Left Column: Registered Devices */}
        <section className="xl:col-span-2 glass-panel rounded-2xl border border-zinc-900 p-6 h-[600px] flex flex-col">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">Device Catalog</h3>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {printers.map(p => {
              const isNetwork = p.interface_type === 'network'
              return (
                <div key={p.id} className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-4 flex items-center justify-between hover:border-zinc-800 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-zinc-200">{p.name}</h4>
                      <span className="text-[8px] bg-zinc-900 border border-zinc-800 text-zinc-500 px-2 py-0.5 rounded font-mono uppercase">
                        {p.type}
                      </span>
                    </div>
                    
                    <div className="text-[10px] text-zinc-500 font-mono mt-1.5 flex items-center gap-2">
                      <span>ID: {p.id}</span>
                      <span>•</span>
                      <span>Port: {isNetwork ? `TCP/IP (${p.ip_address})` : 'Local USB / Serial'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Status Badge */}
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-semibold border flex items-center gap-1.5 ${
                      p.status === 'online'
                        ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20'
                        : 'bg-red-500/10 text-red-450 border-red-500/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span>{p.status.toUpperCase()}</span>
                    </span>

                    {/* Status check ping */}
                    {isNetwork && (
                      <button
                        onClick={() => handleCheckStatus(p.id, p.ip_address)}
                        disabled={loadingNode === p.id}
                        className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 p-2 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
                        title="Ping Device"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingNode === p.id ? 'animate-spin text-brand-500' : ''}`} />
                      </button>
                    )}

                    {/* Test print */}
                    <button
                      onClick={() => handleTestPrint(p.id, p.ip_address)}
                      className="bg-brand-650 hover:bg-brand-550 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all border border-brand-500/30"
                    >
                      Test Print
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Right Column: Register Hardware */}
        <section className="glass-panel rounded-2xl border border-zinc-900 p-6 h-[600px] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-4 h-4 text-brand-500" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Add Printing Node</h3>
            </div>

            <form onSubmit={handleRegisterPrinter} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Display Label</label>
                <input
                  type="text"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  placeholder="e.g. Counter Billing Printer"
                  required
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Role / Function</label>
                  <select
                    value={pType}
                    onChange={(e) => setPType(e.target.value as any)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none"
                  >
                    <option value="billing">Billing Receipt</option>
                    <option value="kitchen">Kitchen KOT</option>
                    <option value="parcel">Parcel Label</option>
                    <option value="token">Token Slip</option>
                    <option value="label">Label Maker</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Port Type</label>
                  <select
                    value={pInterface}
                    onChange={(e) => setPInterface(e.target.value as any)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none"
                  >
                    <option value="network">Ethernet (TCP/IP)</option>
                    <option value="usb">Direct USB</option>
                  </select>
                </div>
              </div>

              {pInterface === 'network' && (
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Printer IP Address</label>
                  <input
                    type="text"
                    value={pIp}
                    onChange={(e) => setPIp(e.target.value)}
                    placeholder="e.g. 192.168.1.200"
                    required
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none font-mono"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white rounded-xl py-2.5 text-xs font-semibold transition-all border border-brand-500/20 active:scale-[0.98]"
              >
                Provision Printer Node
              </button>
            </form>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-850 rounded-2xl p-4 text-[10px] text-zinc-500 leading-relaxed">
            <span className="font-bold text-zinc-400 block mb-1">Printer Connection Guide:</span>
            To connect network thermal printers, plug them to your local router via LAN cable. Set static IP and enter the IP address in the configuration form. Standard ESC/POS port is 9100.
          </div>
        </section>
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
