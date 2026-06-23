'use client'
import { Wifi, WifiOff, Trash2, QrCode, RefreshCw } from 'lucide-react'

interface Connection {
  id: string
  name: string
  status: string
  phoneNumber?: string | null
  type: string
  createdAt: string
}

interface Props {
  connection: Connection
  onDelete: (id: string) => void
  onQrCode: (id: string) => void
  onRefresh: (id: string) => void
}

export default function ConnectionCard({ connection, onDelete, onQrCode, onRefresh }: Props) {
  const isConnected = connection.status === 'connected'

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isConnected ? 'bg-emerald-50' : 'bg-slate-100'}`}>
            {isConnected
              ? <Wifi className="w-4 h-4 text-emerald-600" />
              : <WifiOff className="w-4 h-4 text-slate-400" />
            }
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{connection.name}</p>
            <p className="text-xs text-gray-400">{connection.phoneNumber || '—'}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          isConnected
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-slate-100 text-slate-500 border border-slate-200'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          {isConnected ? 'Conectada' : 'Desconectada'}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 capitalize">{connection.type}</td>
      <td className="px-6 py-4 text-sm text-gray-400">
        {new Date(connection.createdAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onRefresh(connection.id)}
            title="Verificar status"
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {!isConnected && (
            <button
              onClick={() => onQrCode(connection.id)}
              title="Conectar via QR Code"
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <QrCode className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onDelete(connection.id)}
            title="Remover conexão"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}
