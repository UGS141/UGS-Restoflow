import React, { useState } from 'react'
import { Plus, BookOpen, Layers, IndianRupee, Scale, ShieldAlert, Save } from 'lucide-react'

interface RawMaterial {
  id: string
  name: string
  unit: string
}

const SAMPLE_RAW_MATERIALS: RawMaterial[] = [
  { id: 'raw_paneer', name: 'Fresh Paneer (Cottage Cheese)', unit: 'kg' },
  { id: 'raw_butter', name: 'Salted Amul Butter', unit: 'kg' },
  { id: 'raw_flour', name: 'Tandoori Atta / Flour', unit: 'kg' },
  { id: 'raw_milk', name: 'Full Cream Milk', unit: 'liters' },
  { id: 'raw_spices', name: 'Mix Spices (Masala)', unit: 'gms' },
]

interface MenuItem {
  id: string
  name: string
  category: string
  price: number
  hasRecipe: boolean
  recipeIngredients?: Array<{ raw_material_id: string; quantity: number }>
}

const INITIAL_MENU: MenuItem[] = [
  { id: 'm_paneer', name: 'Paneer Butter Masala', category: 'Main Course', price: 280, hasRecipe: true, recipeIngredients: [{ raw_material_id: 'raw_paneer', quantity: 0.15 }, { raw_material_id: 'raw_butter', quantity: 0.03 }] },
  { id: 'm_roti', name: 'Butter Tandoori Roti', category: 'Main Course', price: 40, hasRecipe: true, recipeIngredients: [{ raw_material_id: 'raw_flour', quantity: 0.08 }, { raw_material_id: 'raw_butter', quantity: 0.01 }] },
  { id: 'm_dal', name: 'Dal Makhani Signature', category: 'Main Course', price: 240, hasRecipe: false },
]

export default function MenuManagementPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  
  // Creation States
  const [newItemName, setNewItemName] = useState('')
  const [newItemPrice, setNewItemPrice] = useState(100)
  const [newItemCategory, setNewItemCategory] = useState('Main Course')
  
  // Recipe building States
  const [selectedMaterialId, setSelectedMaterialId] = useState('raw_paneer')
  const [ingredientQty, setIngredientQty] = useState(0.1)

  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemName) return

    const newId = `m_${newItemName.toLowerCase().replace(/\s+/g, '_')}`
    const item: MenuItem = {
      id: newId,
      name: newItemName,
      price: newItemPrice,
      category: newItemCategory,
      hasRecipe: false
    }

    setMenuItems(prev => [...prev, item])
    setNewItemName('')
    setNewItemPrice(100)
    showToast('Menu item added successfully!')
  }

  const handleAddIngredient = () => {
    if (!selectedItemId) return

    setMenuItems(prev => prev.map(item => {
      if (item.id === selectedItemId) {
        const ingredients = item.recipeIngredients || []
        // Check if material already exists
        const exists = ingredients.find(i => i.raw_material_id === selectedMaterialId)
        let updated
        if (exists) {
          updated = ingredients.map(i => i.raw_material_id === selectedMaterialId ? { ...i, quantity: i.quantity + ingredientQty } : i)
        } else {
          updated = [...ingredients, { raw_material_id: selectedMaterialId, quantity: ingredientQty }]
        }
        return {
          ...item,
          hasRecipe: true,
          recipeIngredients: updated
        }
      }
      return item
    }))

    showToast('Ingredient added to recipe map.')
  }

  const handleRemoveIngredient = (matId: string) => {
    if (!selectedItemId) return

    setMenuItems(prev => prev.map(item => {
      if (item.id === selectedItemId) {
        const updated = (item.recipeIngredients || []).filter(i => i.raw_material_id !== matId)
        return {
          ...item,
          hasRecipe: updated.length > 0,
          recipeIngredients: updated
        }
      }
      return item
    }))

    showToast('Ingredient removed.')
  }

  const selectedItem = menuItems.find(item => item.id === selectedItemId)

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans text-zinc-100">
      <header className="border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-brand-500" />
          <h1 className="font-semibold text-zinc-200 tracking-tight">Menu Catalog & Recipe Mapping</h1>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 xl:grid-cols-3 gap-6 overflow-y-auto">
        {/* Left column: Menu list */}
        <section className="glass-panel rounded-2xl border border-zinc-900 p-6 flex flex-col h-[600px]">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">Catalog List</h3>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedItemId(item.id)}
                className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                  selectedItemId === item.id
                    ? 'bg-brand-500/10 border-brand-500/30 text-brand-400'
                    : 'bg-zinc-900/30 border-zinc-900 hover:border-zinc-800 text-zinc-300'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold">{item.name}</h4>
                  <span className="text-[10px] text-zinc-500 uppercase mt-1 block">{item.category}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  {item.hasRecipe && (
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-medium">
                      Recipe Mapped
                    </span>
                  )}
                  <span className="text-xs font-bold font-mono">₹{item.price}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Center column: Recipe editor */}
        <section className="glass-panel rounded-2xl border border-zinc-900 p-6 flex flex-col h-[600px]">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">Recipe Ingredients</h3>

          {selectedItem ? (
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="bg-zinc-900/50 border border-zinc-850 rounded-xl p-3.5 mb-6">
                  <h4 className="text-xs font-bold text-zinc-300">{selectedItem.name}</h4>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                    Set raw material deduct rates. Checked-out items will automatically decrement these quantities from inventory logs.
                  </p>
                </div>

                {/* List recipe ingredients */}
                <div className="space-y-2.5 max-h-[250px] overflow-y-auto mb-6 pr-1">
                  {!selectedItem.recipeIngredients || selectedItem.recipeIngredients.length === 0 ? (
                    <div className="text-center p-6 text-xs text-zinc-600 font-mono">No raw materials mapped to this dish yet.</div>
                  ) : (
                    selectedItem.recipeIngredients.map(ing => {
                      const mat = SAMPLE_RAW_MATERIALS.find(m => m.id === ing.raw_material_id)
                      return (
                        <div key={ing.raw_material_id} className="flex items-center justify-between bg-zinc-900/20 border border-zinc-900 rounded-xl p-3 text-xs">
                          <div>
                            <span className="font-semibold text-zinc-300">{mat?.name}</span>
                            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">{ing.raw_material_id}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-mono font-semibold text-zinc-400">{ing.quantity} {mat?.unit}</span>
                            <button
                              onClick={() => handleRemoveIngredient(ing.raw_material_id)}
                              className="text-red-500 hover:text-red-400 font-semibold"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Add raw material input */}
              <div className="space-y-4 pt-4 border-t border-zinc-900">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Material</label>
                    <select
                      value={selectedMaterialId}
                      onChange={(e) => setSelectedMaterialId(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none"
                    >
                      {SAMPLE_RAW_MATERIALS.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Quantity (per dish)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={ingredientQty}
                      onChange={(e) => setIngredientQty(Math.max(0.001, parseFloat(e.target.value) || 0))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none text-right font-mono"
                    />
                  </div>
                </div>

                <button
                  onClick={handleAddIngredient}
                  className="w-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Scale className="w-3.5 h-3.5 text-brand-500" />
                  <span>Map Ingredient Weight</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-600">
              <ShieldAlert className="w-8 h-8 mb-2 text-zinc-700" />
              <p className="text-xs">No item selected</p>
              <p className="text-[10px] text-zinc-700 mt-1 leading-relaxed">
                Click any dish in the catalog directory to inspect ingredients or map raw material weights.
              </p>
            </div>
          )}
        </section>

        {/* Right column: Create Menu Item Form */}
        <section className="glass-panel rounded-2xl border border-zinc-900 p-6 h-[600px] flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-4 h-4 text-brand-500" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Add Catalog Item</h3>
          </div>

          <form onSubmit={handleCreateItem} className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Item Name</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Masala Chai Signature"
                  required
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-brand-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Base Price (INR)</label>
                  <input
                    type="number"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(Math.max(1, parseFloat(e.target.value) || 0))}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-brand-500/50 font-mono text-right"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none"
                  >
                    <option value="Main Course">Main Course</option>
                    <option value="Starters">Starters</option>
                    <option value="Drinks">Drinks</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white rounded-xl py-3 text-xs font-semibold transition-all border border-brand-500/20 shadow-lg shadow-brand-500/10 active:scale-[0.98]"
            >
              Add Item to Directory
            </button>
          </form>
        </section>
      </main>

      {/* Floating status toast */}
      {toast && (
        <div className="fixed bottom-6 left-6 z-50 bg-zinc-900 border border-brand-500/20 text-brand-400 rounded-xl px-4 py-3 text-xs shadow-xl flex items-center gap-2 animate-slide-up">
          <Layers className="w-4 h-4 text-brand-500 animate-pulse" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}
