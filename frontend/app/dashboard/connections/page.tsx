'use client'
import { useEffect, useState } from 'react'
import { Plus, Wifi } from 'lucide-react'
import api from '@/lib/api'
import ConnectionCard from '@/components/ConnectionCard'

interface Connection {
  id: string
  name: string
  status: string
  phoneNumber?: string | null
  type: string
  createdAt: string
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [qrModal, setQrModal] = useState<{ open: boolean; data?: string }>({ open: false })

  async function fetchConnections() {
    try {
      const res = await api.get('/api/connections')
      setConnections(res.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchConnections() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      await api.post('/api/connections', { name: newName.trim() })
      setNewName('')
      setShowModal(false)
      fetchConnections()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao criar conexão')
    }
    setCreating(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja remover esta conexão?')) return
    try {
      await api.delete(`/api/connections/${id}`)
      setConnections((prev) => prev.filter((c) => c.id !== id))
    } catch {
      alert('Erro ao remover conexão')
    }
  }

  async function handleRefresh(id: string) {
    try {
      const res = await api.get(`/api/connections/${id}/status`)
      setConnections((prev) =>
        prev.map((c) => c.id === id ? { ...c, status: res.data.status } : c)
      )
    } catch {
      alert('Erro ao verificar status')
    }
  }

  async function handleQrCode(id: string) {
    try {
      const res = await api.get(`/api/connections/${id}/qrcode`)
      setQrModal({ open: true, data: res.data.qrcode || res.data.base64 })
    } catch {
      alert('Erro ao obter QR Code')
    }
  }

  const connected = connections.filter((c) => c.status === 'connected').length

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conexões</h1>
          <p className="text-gray-500 mt-1">
            {connections.length} conexões · {connected} conectadas
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nova conexão
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Carregando...</div>
        ) : connections.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wifi className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">Nenhuma conexão encontrada</p>
            <p className="text-gray-400 text-sm mt-1">Clique em "Nova conexão" para começar</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Criada em</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {connections.map((conn) => (
                <ConnectionCard
                  key={conn.id}
                  connection={conn}
                  onDelete={handleDelete}
                  onQrCode={handleQrCode}
                  onRefresh={handleRefresh}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Nova conexão WhatsApp</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da instância</label>
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Suporte, Vendas..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  disabled={creating}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {creating ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {qrModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Escanear QR Code</h2>
            {qrModal.data ? (
              <img
                src={qrModal.data?.startsWith('data:') ? qrModal.data : `data:image/png;base64,${qrModal.data}`}
                alt="QR Code"
                className="w-64 h-64 mx-auto rounded-xl"
              />
            ) : (
              <p className="text-gray-400">QR Code indisponível</p>
            )}
            <p className="text-sm text-gray-500 mt-3">Abra o WhatsApp → Dispositivos vinculados → Vincular dispositivo</p>
            <button
              onClick={() => setQrModal({ open: false })}
              className="mt-4 w-full border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
