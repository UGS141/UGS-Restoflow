import React, { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { FileText, Download, TrendingUp, AlertTriangle, CreditCard, ShieldAlert } from 'lucide-react'

const MOCK_ANALYTICS_DATA = [
  { date: 'Jul 20', sales: 12000, tickets: 45 },
  { date: 'Jul 21', sales: 18500, tickets: 62 },
  { date: 'Jul 22', sales: 15000, tickets: 55 },
  { date: 'Jul 23', sales: 22400, tickets: 80 },
  { date: 'Jul 24', sales: 29000, tickets: 95 },
  { date: 'Jul 25', sales: 34500, tickets: 110 },
]

export default function ReportsPage() {
  const [startDate, setStartDate] = useState('2026-07-20')
  const [endDate, setEndDate] = useState('2026-07-25')
  const [payMethod, setPayMethod] = useState('All')

  const [downloading, setDownloading] = useState(false)

  const handleExport = (format: 'pdf' | 'excel') => {
    setDownloading(true)
    const token = localStorage.getItem('ugs_access')
    
    // Construct query parameters
    let url = `/api/v1/reports/sales/${format}?`
    if (startDate) url += `start_date=${startDate}&`
    if (endDate) url += `end_date=${endDate}&`
    if (payMethod !== 'All') url += `payment_method=${payMethod.toLowerCase()}`

    // Trigger browser file download directly
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (response.ok) return response.blob()
      throw new Error('Export generation failed')
    })
    .then(blob => {
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `sales_report_${format === 'pdf' ? 'ledger.pdf' : 'ledger.xlsx'}`
      document.body.appendChild(a)
      a.click()
      a.remove()
    })
    .catch(err => {
      // Simulate file download for local mock bypass
      const a = document.createElement('a')
      a.href = '#'
      a.textContent = 'Simulated Download'
      console.log(`Simulated ${format.toUpperCase()} report generation for range: ${startDate} to ${endDate}`)
    })
    .finally(() => setDownloading(false))
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans text-zinc-100">
      <header className="border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-brand-500" />
          <h1 className="font-semibold text-zinc-200 tracking-tight">Reports & Analytics Engine</h1>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* KPI metrics cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-panel rounded-2xl p-5 border border-zinc-900">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Gross Sales Revenue</span>
            <span className="text-xl font-bold font-mono text-zinc-250">₹1,31,400.00</span>
          </div>
          <div className="glass-panel rounded-2xl p-5 border border-zinc-900">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block mb-1">GST Collected (5%)</span>
            <span className="text-xl font-bold font-mono text-emerald-450">₹6,570.00</span>
          </div>
          <div className="glass-panel rounded-2xl p-5 border border-zinc-900">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Sales Tickets Count</span>
            <span className="text-xl font-bold font-mono text-zinc-250">447 tickets</span>
          </div>
          <div className="glass-panel rounded-2xl p-5 border border-zinc-900">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Low-Stock Warnings</span>
            <span className="text-xl font-bold font-mono text-red-400">2 raw items</span>
          </div>
        </div>

        {/* Chart + Filters layout grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recharts area chart */}
          <div className="xl:col-span-2 glass-panel rounded-2xl border border-zinc-900 p-6 h-[400px] flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-500" />
                <span>Sales Trend Velocity</span>
              </h3>
            </div>
            
            <div className="flex-1 w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_ANALYTICS_DATA}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#52525b" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ background: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                    labelStyle={{ color: '#a1a1aa', fontWeight: 'bold', fontSize: '10px' }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Audit parameters & Exports */}
          <div className="glass-panel rounded-2xl border border-zinc-900 p-6 flex flex-col justify-between h-[400px]">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">Export parameters</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Payment Method</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none"
                  >
                    <option value="All">All Transactions</option>
                    <option value="Cash">Cash Ledger Only</option>
                    <option value="Card">Card Statements Only</option>
                    <option value="UPI">UPI Transfer Logs</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-zinc-900">
              <button
                onClick={() => handleExport('pdf')}
                disabled={downloading}
                className="w-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 rounded-xl py-3 text-xs font-semibold flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
              >
                <Download className="w-3.5 h-3.5 text-brand-500" />
                <span>Export PDF Ledger (ReportLab)</span>
              </button>
              
              <button
                onClick={() => handleExport('excel')}
                disabled={downloading}
                className="w-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 rounded-xl py-3 text-xs font-semibold flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
              >
                <Download className="w-3.5 h-3.5 text-brand-500" />
                <span>Export Excel Worksheet (OpenPyXL)</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
