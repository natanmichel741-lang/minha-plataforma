'use client'
import { useEffect, useState } from 'react'
import { Wifi, Users, MessageSquare, TrendingUp } from 'lucide-react'
import api from '@/lib/api'

interface Stats {
  connections: number
  connectedConnections: number
  contacts: number
  messagesToday: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ connections: 0, connectedConnections: 0, contacts: 0, messagesToday: 0 })
  const [user, setUser] = useState<{ name: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (u) setUser(JSON.parse(u))

    async function fetchStats() {
      try {
        const [connectionsRes, contactsRes, messagesRes] = await Promise.all([
          api.get('/api/connections'),
          api.get('/api/contacts?limit=1'),
          api.get('/api/messages/today/count'),
        ])

        const connections: any[] = connectionsRes.data
        setStats({
          connections: connections.length,
          connectedConnections: connections.filter((c) => c.status === 'connected').length,
          contacts: contactsRes.data.total,
          messagesToday: messagesRes.data.count,
        })
      } catch {}
      setLoading(false)
    }

    fetchStats()
  }, [])

  const cards = [
    {
      label: 'Total de Conexões',
      value: stats.connections,
      sub: `${stats.connectedConnections} conectadas`,
      icon: Wifi,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Contatos',
      value: stats.contacts,
      sub: 'cadastrados',
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Mensagens Hoje',
      value: stats.messagesToday,
      sub: 'enviadas e recebidas',
      icon: MessageSquare,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Taxa de Conexão',
      value: stats.connections > 0 ? `${Math.round((stats.connectedConnections / stats.connections) * 100)}%` : '—',
      sub: 'instâncias ativas',
      icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {user?.name?.split(' ')[0] || 'usuário'} 👋
        </h1>
        <p className="text-gray-500 mt-1">Aqui está um resumo da sua plataforma</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="w-10 h-10 bg-gray-100 rounded-xl mb-4" />
              <div className="h-8 bg-gray-100 rounded w-16 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-24" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {cards.map((card) => (
            <div key={card.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-4`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm font-medium text-gray-500 mt-1">{card.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Início rápido</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Adicionar conexão', desc: 'Conecte uma instância do WhatsApp', href: '/dashboard/connections', color: 'indigo' },
            { title: 'Importar contatos', desc: 'Adicione sua lista de contatos', href: '/dashboard/contacts', color: 'emerald' },
            { title: 'Criar fluxo', desc: 'Automatize suas conversas', href: '/dashboard/flows', color: 'blue' },
          ].map((item) => (
            <a key={item.title} href={item.href} className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group">
              <div className={`w-2 h-2 rounded-full bg-${item.color}-500 mt-1.5 shrink-0`} />
              <div>
                <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-700">{item.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
