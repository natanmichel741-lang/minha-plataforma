'use client'
import { useEffect, useState } from 'react'
import { Plus, GripVertical, MessageSquare, User } from 'lucide-react'
import api from '@/lib/api'

interface Contact {
  id: string
  name: string
  phone: string
}

interface KanbanCard {
  id: string
  contact: Contact
  lastMessage: string
  connectionId: string
  createdAt: string
}

interface Column {
  id: string
  label: string
  color: string
  bg: string
  cards: KanbanCard[]
}

const DEFAULT_COLUMNS: Omit<Column, 'cards'>[] = [
  { id: 'novo',        label: 'Novo',          color: 'text-blue-600',   bg: 'bg-blue-50'   },
  { id: 'em_andamento',label: 'Em andamento',  color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { id: 'aguardando',  label: 'Aguardando',    color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'resolvido',   label: 'Resolvido',     color: 'text-emerald-600',bg: 'bg-emerald-50'},
]

export default function KanbanPage() {
  const [columns, setColumns] = useState<Column[]>(
    DEFAULT_COLUMNS.map(c => ({ ...c, cards: [] }))
  )
  const [loading, setLoading] = useState(true)
  const [dragging, setDragging] = useState<{ card: KanbanCard; fromCol: string } | null>(null)

  useEffect(() => {
    async function fetchChats() {
      try {
        const res = await api.get('/api/contacts?limit=50')
        const contacts: Contact[] = res.data.contacts || []

        // Distribuir contatos nas colunas a partir do localStorage (persistência local)
        const saved = JSON.parse(localStorage.getItem('kanban_state') || '{}')

        const columnCards: Record<string, KanbanCard[]> = {
          novo: [], em_andamento: [], aguardando: [], resolvido: []
        }

        contacts.forEach((c, i) => {
          const colId = saved[c.id] || (i === 0 ? 'em_andamento' : 'novo')
          if (!columnCards[colId]) columnCards[colId] = []
          columnCards[colId].push({
            id: c.id,
            contact: c,
            lastMessage: '—',
            connectionId: '',
            createdAt: new Date().toISOString(),
          })
        })

        setColumns(DEFAULT_COLUMNS.map(col => ({ ...col, cards: columnCards[col.id] || [] })))
      } catch {}
      setLoading(false)
    }
    fetchChats()
  }, [])

  function saveState(newColumns: Column[]) {
    const state: Record<string, string> = {}
    newColumns.forEach(col => col.cards.forEach(card => { state[card.id] = col.id }))
    localStorage.setItem('kanban_state', JSON.stringify(state))
  }

  function onDragStart(card: KanbanCard, fromCol: string) {
    setDragging({ card, fromCol })
  }

  function onDrop(toColId: string) {
    if (!dragging || dragging.fromCol === toColId) { setDragging(null); return }

    const newColumns = columns.map(col => {
      if (col.id === dragging.fromCol) return { ...col, cards: col.cards.filter(c => c.id !== dragging.card.id) }
      if (col.id === toColId) return { ...col, cards: [...col.cards, dragging.card] }
      return col
    })
    setColumns(newColumns)
    saveState(newColumns)
    setDragging(null)
  }

  const total = columns.reduce((sum, c) => sum + c.cards.length, 0)

  return (
    <div className="p-8 h-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Kanban</h1>
        <p className="text-gray-500 mt-1">{total} contatos organizados em {columns.length} colunas</p>
      </div>

      {loading ? (
        <div className="flex gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-1 bg-white rounded-2xl p-4 animate-pulse border border-gray-100">
              <div className="h-5 bg-gray-100 rounded w-24 mb-4" />
              {[...Array(2)].map((_, j) => (
                <div key={j} className="bg-gray-50 rounded-xl p-4 mb-3">
                  <div className="h-4 bg-gray-100 rounded w-32 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-24" />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map(col => (
            <div
              key={col.id}
              className="flex-1 min-w-[240px] flex flex-col"
              onDragOver={e => e.preventDefault()}
              onDrop={() => onDrop(col.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${col.color}`}>{col.label}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${col.bg} ${col.color}`}>
                    {col.cards.length}
                  </span>
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-2 min-h-[200px] p-2 rounded-xl bg-gray-50 border border-gray-100">
                {col.cards.length === 0 && (
                  <div className="flex-1 flex items-center justify-center text-gray-300 text-xs">
                    Arraste cards aqui
                  </div>
                )}
                {col.cards.map(card => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={() => onDragStart(card, col.id)}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow select-none"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                            <User className="w-3 h-3 text-indigo-600" />
                          </div>
                          <p className="text-sm font-medium text-gray-800 truncate">{card.contact.name}</p>
                        </div>
                        <p className="text-xs text-gray-400 ml-8">{card.contact.phone}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && total === 0 && (
        <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-600 font-semibold">Nenhum contato ainda</p>
          <p className="text-gray-400 text-sm mt-1">Adicione contatos para organizar no Kanban</p>
        </div>
      )}
    </div>
  )
}
