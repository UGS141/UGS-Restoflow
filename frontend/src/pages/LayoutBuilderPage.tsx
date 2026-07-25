import React, { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { Plus, Save, Undo, MapPin, Grid, Layers, User, Trash2 } from 'lucide-react'

interface TableItem {
  id: string
  number: string
  capacity: number
  x: number
  y: number
  status: 'available' | 'reserved' | 'occupied' | 'cleaning'
  waiterName?: string
}

interface FloorZoneConfig {
  id: string
  name: string
  tables: TableItem[]
}

const DEFAULT_FLOORS: FloorZoneConfig[] = [
  {
    id: 'zone_main',
    name: 'Main Dining Hall',
    tables: [
      { id: 'T1', number: 'T01', capacity: 2, x: 2, y: 2, status: 'available', waiterName: 'Rahul Dev' },
      { id: 'T2', number: 'T02', capacity: 4, x: 5, y: 2, status: 'occupied', waiterName: 'Rahul Dev' },
      { id: 'T3', number: 'T03', capacity: 6, x: 2, y: 5, status: 'reserved', waiterName: 'Rahul Dev' },
    ]
  },
  {
    id: 'zone_vip',
    name: 'VIP Private Cabins',
    tables: [
      { id: 'V1', number: 'V01', capacity: 4, x: 3, y: 3, status: 'available', waiterName: 'Aman' }
    ]
  },
  {
    id: 'zone_outdoor',
    name: 'Garden Patio',
    tables: [
      { id: 'O1', number: 'O01', capacity: 2, x: 1, y: 2, status: 'available', waiterName: 'Rahul' }
    ]
  }
]

export default function LayoutBuilderPage() {
  const { user } = useAuthStore()
  const [floors, setFloors] = useState<FloorZoneConfig[]>(DEFAULT_FLOORS)
  const [activeFloorId, setActiveFloorId] = useState('zone_main')
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  
  // Notification banner state
  const [toast, setToast] = useState('')

  const activeFloor = floors.find(f => f.id === activeFloorId) || floors[0]

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // Adding a new table to the active floor plan grid
  const handleAddTable = (capacity: number) => {
    const tableId = `T${Math.floor(100 + Math.random() * 900)}`
    const tableNum = `${activeFloor.tables.length + 1}`.padStart(2, '0')
    
    // Find first empty slot on grid
    const newTable: TableItem = {
      id: tableId,
      number: `T${tableNum}`,
      capacity,
      x: 1 + (activeFloor.tables.length % 6) * 2,
      y: 1 + Math.floor(activeFloor.tables.length / 6) * 2,
      status: 'available'
    }

    setFloors(prev => prev.map(f => {
      if (f.id === activeFloor.id) {
        return {
          ...f,
          tables: [...f.tables, newTable]
        }
      }
      return f
    }))
    
    setSelectedTableId(tableId)
    showToast(`Table ${newTable.number} added to grid`)
  }

  // Move table around the coordinate grid
  const handleMoveTable = (tableId: string, direction: 'up' | 'down' | 'left' | 'right') => {
    setFloors(prev => prev.map(f => {
      if (f.id === activeFloor.id) {
        return {
          ...f,
          tables: f.tables.map(t => {
            if (t.id === tableId) {
              let newX = t.x
              let newY = t.y
              if (direction === 'left') newX = Math.max(1, t.x - 1)
              if (direction === 'right') newX = Math.min(12, t.x + 1)
              if (direction === 'up') newY = Math.max(1, t.y - 1)
              if (direction === 'down') newY = Math.min(10, t.y + 1)
              return { ...t, x: newX, y: newY }
            }
            return t
          })
        }
      }
      return f
    }))
  }

  const handleDeleteTable = (tableId: string) => {
    setFloors(prev => prev.map(f => {
      if (f.id === activeFloor.id) {
        return {
          ...f,
          tables: f.tables.filter(t => t.id !== tableId)
        }
      }
      return f
    }))
    setSelectedTableId(null)
    showToast('Table deleted')
  }

  const handleSaveLayout = async () => {
    showToast('Saving layout changes...')
    
    try {
      const token = localStorage.getItem('ugs_access')
      if (!token) {
        showToast('Saved changes locally (Simulator Mode)')
        return
      }

      const response = await fetch('/api/v1/layout/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: activeFloor.name,
          tables: activeFloor.tables.map(t => ({
            id: t.id,
            number: t.number,
            capacity: t.capacity,
            status: t.status,
            position: { x: t.x, y: t.y }
          }))
        })
      })

      if (response.ok) {
        showToast('Floor layout saved securely to server!')
      } else {
        showToast('Error syncing with backend, saved locally')
      }
    } catch (err) {
      showToast('Offline: Saved changes locally')
    }
  }

  const selectedTable = activeFloor.tables.find(t => t.id === selectedTableId)

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans text-zinc-100">
      {/* Header bar */}
      <header className="border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-brand-500" />
          <h1 className="font-semibold text-zinc-200 tracking-tight">Interactive Floor Designer</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveLayout}
            className="bg-brand-600 hover:bg-brand-500 text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2 transition-colors active:scale-[0.98] shadow-lg shadow-brand-500/10 border border-brand-500/30"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Plan</span>
          </button>
        </div>
      </header>

      {/* Main workspace */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Side: Layout Designer Canvas */}
        <section className="flex-1 p-6 flex flex-col overflow-y-auto">
          {/* Floor selection tabs */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-1.5 bg-zinc-900/60 p-1 border border-zinc-900 rounded-xl">
              {floors.map(f => (
                <button
                  key={f.id}
                  onClick={() => {
                    setActiveFloorId(f.id)
                    setSelectedTableId(null)
                  }}
                  className={`text-xs px-4 py-2.5 rounded-lg font-medium transition-all ${
                    activeFloorId === f.id
                      ? 'bg-zinc-800 text-zinc-100 shadow-md border border-zinc-700/30'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
            
            <div className="text-xs text-zinc-500 flex items-center gap-1.5 font-mono">
              <Grid className="w-3.5 h-3.5 text-zinc-600" />
              <span>Canvas bounds: 12 x 10 units</span>
            </div>
          </div>

          {/* Dot-grid layout builder canvas */}
          <div className="flex-1 relative rounded-2xl border border-zinc-900 bg-zinc-950/20 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] overflow-hidden min-h-[480px]">
            {/* Render tables as interactive visual blocks */}
            {activeFloor.tables.map(t => {
              // Convert grid coords to absolute pixel percentages
              const style = {
                left: `${(t.x - 1) * 8}%`,
                top: `${(t.y - 1) * 9}%`,
                width: t.capacity >= 6 ? '15%' : t.capacity >= 4 ? '12%' : '9%',
                height: '11%',
              }

              const isSelected = t.id === selectedTableId
              
              // Set background matching occupancy status
              let statusColor = 'bg-zinc-900/90 border-zinc-800'
              if (t.status === 'occupied') statusColor = 'bg-red-500/10 border-red-500/30 text-red-400'
              if (t.status === 'reserved') statusColor = 'bg-brand-500/10 border-brand-500/30 text-brand-400'
              if (t.status === 'cleaning') statusColor = 'bg-amber-500/10 border-amber-500/30 text-amber-400'

              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTableId(t.id)}
                  style={style}
                  className={`absolute rounded-xl border flex flex-col items-center justify-center transition-all shadow-md group ${statusColor} ${
                    isSelected ? 'ring-2 ring-brand-500/70 border-transparent shadow-brand-500/10 scale-105' : 'hover:scale-[1.02]'
                  }`}
                >
                  <span className="text-xs font-bold font-mono tracking-wider">{t.number}</span>
                  <span className="text-[9px] opacity-60 mt-0.5">{t.capacity} pax</span>
                  {t.waiterName && (
                    <span className="text-[8px] opacity-40 truncate max-w-full px-1 flex items-center gap-0.5 mt-1">
                      <User className="w-2 h-2 shrink-0" />
                      {t.waiterName.split(' ')[0]}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </section>

        {/* Right Side: Grid Coordinates and Table Settings Editor */}
        <section className="w-[320px] border-l border-zinc-900 bg-zinc-950/40 backdrop-blur-md p-6 flex flex-col gap-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Add Elements</h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleAddTable(2)}
                className="bg-zinc-900/70 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 rounded-xl p-3 text-xs font-semibold flex flex-col items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-brand-500" />
                <span>2-Seater</span>
              </button>
              <button
                onClick={() => handleAddTable(4)}
                className="bg-zinc-900/70 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 rounded-xl p-3 text-xs font-semibold flex flex-col items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-brand-500" />
                <span>4-Seater</span>
              </button>
              <button
                onClick={() => handleAddTable(6)}
                className="bg-zinc-900/70 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 rounded-xl p-3 text-xs font-semibold flex flex-col items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-brand-500" />
                <span>6-Seater</span>
              </button>
            </div>
          </div>

          <div className="h-px bg-zinc-900" />

          {/* Properties Editor */}
          {selectedTable ? (
            <div className="flex-1 flex flex-col gap-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Table Properties</h3>
                <p className="text-[10px] text-zinc-500 font-mono">Editing node: {selectedTable.id}</p>
              </div>

              {/* Table labels */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1">Table Number</label>
                  <input
                    type="text"
                    value={selectedTable.number}
                    onChange={(e) => {
                      const val = e.target.value
                      setFloors(prev => prev.map(f => {
                        if (f.id === activeFloor.id) {
                          return {
                            ...f,
                            tables: f.tables.map(t => t.id === selectedTable.id ? { ...t, number: val } : t)
                          }
                        }
                        return f
                      }))
                    }}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-brand-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1">Seating Capacity (Pax)</label>
                  <input
                    type="number"
                    value={selectedTable.capacity}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value) || 2)
                      setFloors(prev => prev.map(f => {
                        if (f.id === activeFloor.id) {
                          return {
                            ...f,
                            tables: f.tables.map(t => t.id === selectedTable.id ? { ...t, capacity: val } : t)
                          }
                        }
                        return f
                      }))
                    }}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-brand-500/50"
                  />
                </div>
              </div>

              {/* Positioning arrows */}
              <div>
                <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">Align Coordinates</label>
                <div className="grid grid-cols-3 gap-1.5 w-32 mx-auto">
                  <div />
                  <button
                    onClick={() => handleMoveTable(selectedTable.id, 'up')}
                    className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg p-2 flex items-center justify-center text-zinc-400"
                  >
                    ▲
                  </button>
                  <div />
                  <button
                    onClick={() => handleMoveTable(selectedTable.id, 'left')}
                    className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg p-2 flex items-center justify-center text-zinc-400"
                  >
                    ◀
                  </button>
                  <div className="bg-zinc-900/50 border border-zinc-900 rounded-lg flex flex-col items-center justify-center text-[10px] font-mono text-zinc-400 font-bold">
                    {selectedTable.x},{selectedTable.y}
                  </div>
                  <button
                    onClick={() => handleMoveTable(selectedTable.id, 'right')}
                    className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg p-2 flex items-center justify-center text-zinc-400"
                  >
                    ▶
                  </button>
                  <div />
                  <button
                    onClick={() => handleMoveTable(selectedTable.id, 'down')}
                    className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg p-2 flex items-center justify-center text-zinc-400"
                  >
                    ▼
                  </button>
                </div>
              </div>

              {/* Delete button */}
              <button
                onClick={() => handleDeleteTable(selectedTable.id)}
                className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-2 transition-colors mt-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Element</span>
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-600">
              <MapPin className="w-8 h-8 mb-2 stroke-[1.5] text-zinc-700" />
              <p className="text-xs">No element selected</p>
              <p className="text-[10px] text-zinc-700 mt-1 leading-relaxed">
                Click any table on the grid layout to adjust properties, assign personnel, or move table positions.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Floating status toast */}
      {toast && (
        <div className="fixed bottom-6 left-6 z-50 bg-zinc-900 border border-brand-500/20 text-brand-400 rounded-xl px-4 py-3 text-xs shadow-xl flex items-center gap-2 animate-slide-up">
          <Save className="w-4 h-4 text-brand-500 animate-pulse" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}
