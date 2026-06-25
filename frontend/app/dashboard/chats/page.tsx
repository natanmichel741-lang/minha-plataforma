'use client'
import { useEffect, useState, useRef } from 'react'
import { Send, MessageSquare } from 'lucide-react'
import api from '@/lib/api'
import { io, Socket } from 'socket.io-client'

interface Message {
  id: string
  body: string
  fromMe: boolean
  createdAt: string
  contact?: { name: string; phone: string }
}

interface Chat {
  contactId: string
  contactName: string
  contactPhone: string
  connectionId: string
  lastMessage: string
  lastAt: string
  unread: number
}

export default function ChatsPage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    fetchChats()
    const interval = setInterval(fetchChats, 3000)

    const company = localStorage.getItem('company')
    const companyId = company ? JSON.parse(company).id : null

    if (companyId) {
      const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
        transports: ['polling', 'websocket'],
      })
      socketRef.current = socket
      socket.emit('join', companyId)

      socket.on('message:new', ({ message, contact, connectionId }) => {
        const newMsg: Message = { ...message, contact }
        setMessages((prev) => {
          if (prev.find((m) => m.id === message.id)) return prev
          return [...prev, newMsg]
        })
        setChats((prev) => {
          const existing = prev.findIndex((c) => c.contactId === message.contactId)
          const updated: Chat = {
            contactId: message.contactId,
            contactName: contact?.name || contact?.phone || '',
            contactPhone: contact?.phone || '',
            connectionId,
            lastMessage: message.body,
            lastAt: message.createdAt,
            unread: 1,
          }
          if (existing >= 0) {
            const copy = [...prev]
            copy[existing] = { ...copy[existing], lastMessage: message.body, lastAt: message.createdAt }
            return copy
          }
          return [updated, ...prev]
        })
      })

      return () => { socket.disconnect(); clearInterval(interval) }
    }

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!selectedChat) return
    const interval = setInterval(() => loadMessages(selectedChat), 3000)
    return () => clearInterval(interval)
  }, [selectedChat?.contactId])

  async function fetchChats() {
    try {
      const res = await api.get('/api/messages', { params: { limit: 200 } })
      const msgs: any[] = res.data.messages
      const map = new Map<string, Chat>()

      for (const m of msgs) {
        if (!map.has(m.contactId)) {
          map.set(m.contactId, {
            contactId: m.contactId,
            contactName: m.contact?.name || m.contact?.phone || '',
            contactPhone: m.contact?.phone || '',
            connectionId: m.connectionId,
            lastMessage: m.body,
            lastAt: m.createdAt,
            unread: 0,
          })
        }
      }

      setChats(Array.from(map.values()))
    } catch {}
    setLoading(false)
  }

  async function loadMessages(chat: Chat) {
    setSelectedChat(chat)
    try {
      const res = await api.get('/api/messages', {
        params: { contactId: chat.contactId, connectionId: chat.connectionId, limit: 100 },
      })
      setMessages(res.data.messages.reverse())
    } catch {}
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || !selectedChat) return
    setSending(true)
    try {
      await api.post('/api/messages/send', {
        connectionId: selectedChat.connectionId,
        contactId: selectedChat.contactId,
        body: text.trim(),
      })
      setText('')
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao enviar mensagem')
    }
    setSending(false)
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col shrink-0">
        <div className="px-4 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Chats ao vivo</h2>
          <p className="text-xs text-gray-400 mt-0.5">{chats.length} conversas</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Carregando...</div>
          ) : chats.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Nenhuma conversa ainda</div>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.contactId}
                onClick={() => loadMessages(chat)}
                className={`w-full text-left px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selectedChat?.contactId === chat.contactId ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-sm font-semibold shrink-0">
                    {chat.contactName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">{chat.contactName}</p>
                      <p className="text-xs text-gray-400 shrink-0 ml-2">{formatTime(chat.lastAt)}</p>
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{chat.lastMessage}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedChat ? (
          <>
            <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-sm font-semibold">
                {selectedChat.contactName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{selectedChat.contactName}</p>
                <p className="text-xs text-gray-400">{selectedChat.contactPhone}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                    msg.fromMe
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
                  }`}>
                    <p>{msg.body}</p>
                    <p className={`text-xs mt-1 ${msg.fromMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="px-6 py-4 bg-white border-t border-gray-200 flex gap-3">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Digite uma mensagem..."
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={sending || !text.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">Selecione uma conversa</p>
              <p className="text-gray-400 text-sm mt-1">Escolha um chat à esquerda para começar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
