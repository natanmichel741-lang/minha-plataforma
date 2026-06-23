'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, GitBranch, Play, Pause, Trash2, ChevronRight } from 'lucide-react'
import api from '@/lib/api'

interface Flow {
  id: string
  name: string
  description?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export default function FlowsPage() {
  const router = useRouter()
  const [flows, setFlows] = useState<Flow[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)

  async function fetchFlows() {
    try {
      const res = await api.get('/api/flows')
      setFlows(res.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchFlows() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await api.post('/api/flows', { name: form.name.trim(), description: form.description.trim() })
      setForm({ name: '', description: '' })
      setShowModal(false)
      fetchFlows()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao criar fluxo')
    }
    setSaving(false)
  }

  async function handleToggle(flow: Flow) {
    try {
      await api.patch(`/api/flows/${flow.id}`, { active: !flow.active })
      setFlows(prev => prev.map(f => f.id === flow.id ? { ...f, active: !f.active } : f))
    } catch {
      alert('Erro ao atualizar fluxo')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja remover este fluxo?')) return
    try {
      await api.delete(`/api/flows/${id}`)
      setFlows(prev => prev.filter(f => f.id !== id))
    } catch {
      alert('Erro ao remover fluxo')
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fluxos</h1>
          <p className="text-gray-500 mt-1">Automatize suas conversas com fluxos inteligentes</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo fluxo
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse border border-gray-100">
              <div className="w-10 h-10 bg-gray-100 rounded-xl mb-4" />
              <div className="h-5 bg-gray-100 rounded w-32 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-48" />
            </div>
          ))}
        </div>
      ) : flows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GitBranch className="w-8 h-8 text-indigo-400" />
          </div>
          <p className="text-gray-700 font-semibold">Nenhum fluxo criado</p>
          <p className="text-gray-400 text-sm mt-1 mb-6">Crie seu primeiro fluxo para automatizar atendimentos</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Criar fluxo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {flows.map(flow => (
            <div key={flow.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${flow.active ? 'bg-emerald-50' : 'bg-gray-100'}`}>
                    <GitBranch className={`w-5 h-5 ${flow.active ? 'text-emerald-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{flow.name}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${flow.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {flow.active ? 'Ativo' : 'Pausado'}
                    </span>
                  </div>
                </div>
              </div>

              {flow.description && (
                <p className="text-sm text-gray-500 leading-relaxed">{flow.description}</p>
              )}

              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-50">
                <button
                  onClick={() => handleToggle(flow)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    flow.active
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {flow.active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {flow.active ? 'Pausar' : 'Ativar'}
                </button>
                <button
                  onClick={() => router.push(`/dashboard/flows/${flow.id}`)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(flow.id)}
                  className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Novo fluxo</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  autoFocus
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Boas-vindas, Suporte..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição <span className="text-gray-400 font-normal">(opcional)</span></label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="O que este fluxo faz?"
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
