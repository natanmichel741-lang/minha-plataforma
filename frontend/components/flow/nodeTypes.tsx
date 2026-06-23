import { Handle, Position } from '@xyflow/react'
import {
  MessageSquare, GitBranch, Clock, Zap, Mic,
  BookOpen, Globe, PhoneOff, User, Bot,
  ImagePlus, FileSearch, Headphones
} from 'lucide-react'

export type FlowNodeType =
  | 'trigger' | 'message' | 'audio' | 'ask'
  | 'condition' | 'wait' | 'integration' | 'action' | 'end'
  | 'ai_agent' | 'ai_image' | 'ai_receipt' | 'ai_audio'

export const NODE_META: Record<FlowNodeType, {
  label: string; icon: any; color: string; bg: string; border: string
  hasSource: boolean; hasTarget: boolean; isAI?: boolean
}> = {
  trigger:     { label: 'Gatilho',              icon: Zap,           color: 'text-indigo-700',  bg: 'bg-indigo-50',   border: 'border-indigo-300',  hasSource: true,  hasTarget: false },
  message:     { label: 'Enviar mensagem',       icon: MessageSquare, color: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-300',    hasSource: true,  hasTarget: true  },
  audio:       { label: 'Simular áudio',         icon: Mic,           color: 'text-pink-700',    bg: 'bg-pink-50',     border: 'border-pink-300',    hasSource: true,  hasTarget: true  },
  ask:         { label: 'Salvar resposta',        icon: BookOpen,      color: 'text-violet-700',  bg: 'bg-violet-50',   border: 'border-violet-300',  hasSource: true,  hasTarget: true  },
  condition:   { label: 'Condição',              icon: GitBranch,     color: 'text-orange-700',  bg: 'bg-orange-50',   border: 'border-orange-300',  hasSource: true,  hasTarget: true  },
  wait:        { label: 'Aguardar',              icon: Clock,         color: 'text-cyan-700',    bg: 'bg-cyan-50',     border: 'border-cyan-300',    hasSource: true,  hasTarget: true  },
  integration: { label: 'Integração HTTP',       icon: Globe,         color: 'text-teal-700',    bg: 'bg-teal-50',     border: 'border-teal-300',    hasSource: true,  hasTarget: true  },
  action:      { label: 'Ação',                  icon: User,          color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-300', hasSource: true,  hasTarget: true  },
  end:         { label: 'Encerrar',              icon: PhoneOff,      color: 'text-red-700',     bg: 'bg-red-50',      border: 'border-red-300',     hasSource: false, hasTarget: true  },
  // IA
  ai_agent:    { label: 'Agente de IA',          icon: Bot,           color: 'text-purple-700',  bg: 'bg-purple-50',   border: 'border-purple-400',  hasSource: true,  hasTarget: true,  isAI: true },
  ai_image:    { label: 'Gerar imagem',           icon: ImagePlus,     color: 'text-fuchsia-700', bg: 'bg-fuchsia-50',  border: 'border-fuchsia-400', hasSource: true,  hasTarget: true,  isAI: true },
  ai_receipt:  { label: 'Reconhecer comprovante', icon: FileSearch,    color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-400',   hasSource: true,  hasTarget: true,  isAI: true },
  ai_audio:    { label: 'Entender áudio',         icon: Headphones,    color: 'text-sky-700',     bg: 'bg-sky-50',      border: 'border-sky-400',     hasSource: true,  hasTarget: true,  isAI: true },
}

function AIBadge() {
  return (
    <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 tracking-wide">
      AI
    </span>
  )
}

function BaseNode({ data, selected, type }: any) {
  const t = type as FlowNodeType
  const meta = NODE_META[t]
  if (!meta) return null
  const Icon = meta.icon
  const preview = getPreview(t, data)

  return (
    <div className={`min-w-[210px] max-w-[250px] rounded-xl border-2 shadow-md transition-shadow ${meta.border} ${selected ? 'shadow-lg ring-2 ring-indigo-400 ring-offset-1' : 'shadow-sm'} bg-white`}>
      {meta.hasTarget && (
        <Handle type="target" position={Position.Top}
          className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white" />
      )}

      <div className={`flex items-center gap-2 px-3 py-2 rounded-t-xl ${meta.bg}`}>
        <Icon className={`w-4 h-4 ${meta.color} shrink-0`} />
        <span className={`text-xs font-semibold ${meta.color} truncate`}>{meta.label}</span>
        {meta.isAI && <AIBadge />}
      </div>

      {preview && (
        <div className="px-3 py-2 text-xs text-gray-500 leading-relaxed border-t border-gray-100 line-clamp-2">
          {preview}
        </div>
      )}

      {/* Handles de saída por tipo */}
      {t === 'condition' && (
        <>
          <Handle type="source" position={Position.Bottom} id="yes"
            style={{ left: '30%' }}
            className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white" />
          <Handle type="source" position={Position.Bottom} id="no"
            style={{ left: '70%' }}
            className="!w-3 !h-3 !bg-red-400 !border-2 !border-white" />
          <div className="flex justify-between px-4 pb-1.5 pt-0">
            <span className="text-[10px] text-emerald-600 font-medium">✓ Sim</span>
            <span className="text-[10px] text-red-500 font-medium">✗ Não</span>
          </div>
        </>
      )}

      {t === 'ai_receipt' && (
        <>
          <Handle type="source" position={Position.Bottom} id="valid"
            style={{ left: '20%' }}
            className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white" />
          <Handle type="source" position={Position.Bottom} id="invalid"
            style={{ left: '50%' }}
            className="!w-3 !h-3 !bg-red-400 !border-2 !border-white" />
          <Handle type="source" position={Position.Bottom} id="error"
            style={{ left: '80%' }}
            className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white" />
          <div className="flex justify-between px-2 pb-2 pt-1">
            <span className="text-[9px] text-emerald-600 font-semibold">✓ Válido</span>
            <span className="text-[9px] text-red-500 font-semibold">✗ Inválido</span>
            <span className="text-[9px] text-gray-400 font-semibold">⚠ Erro</span>
          </div>
        </>
      )}

      {t === 'ai_agent' && (
        <>
          <Handle type="source" position={Position.Bottom} id="continue"
            style={{ left: '35%' }}
            className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white" />
          <Handle type="source" position={Position.Bottom} id="handoff"
            style={{ left: '65%' }}
            className="!w-3 !h-3 !bg-orange-400 !border-2 !border-white" />
          <div className="flex justify-between px-4 pb-1.5 pt-0">
            <span className="text-[10px] text-purple-600 font-medium">↻ Continua</span>
            <span className="text-[10px] text-orange-500 font-medium">→ Humano</span>
          </div>
        </>
      )}

      {!['condition', 'ai_receipt', 'ai_agent'].includes(t) && meta.hasSource && (
        <Handle type="source" position={Position.Bottom}
          className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white" />
      )}
    </div>
  )
}

function getPreview(type: FlowNodeType, data: any): string {
  switch (type) {
    case 'trigger':     return data.triggerType === 'keyword' ? `🔑 Palavra: "${data.keyword || '...'}"` : '📨 Qualquer mensagem'
    case 'message':     return data.text ? data.text.slice(0, 70) + (data.text.length > 70 ? '…' : '') : 'Sem texto'
    case 'audio':       return data.text ? `🎙 ${data.text.slice(0, 50)}` : '🎙 Áudio simulado'
    case 'ask':         return data.question ? data.question.slice(0, 55) : 'Pergunta não definida'
    case 'condition':   return data.variable ? `${data.variable} ${data.operator || '='} "${data.value || ''}"` : 'Sem condição'
    case 'wait':        return data.waitType === 'reply' ? '⏳ Aguardar resposta' : `⏱ ${data.seconds || 5}s`
    case 'integration': return data.url ? data.url.slice(0, 50) : 'URL não definida'
    case 'action':      return data.action === 'transfer' ? '👤 Transferir humano' : data.action === 'close' ? '🔴 Encerrar' : data.action === 'tag' ? `🏷 ${data.tag || 'Tag'}` : 'Ação'
    case 'end':         return data.message || 'Encerrar conversa'
    // IA
    case 'ai_agent':    return data.prompt ? `🤖 ${data.prompt.slice(0, 55)}` : '🤖 Agente de IA'
    case 'ai_image':    return data.prompt ? `🖼 ${data.prompt.slice(0, 55)}` : '🖼 Gerar imagem'
    case 'ai_receipt':  return `🔍 ${data.currency === 'usd' ? 'USD' : 'BRL'} · ${data.tolerance || 'Qualquer valor'}`
    case 'ai_audio':    return data.saveVar ? `🎧 → {{${data.saveVar}}}` : '🎧 Transcrever áudio'
    default:            return ''
  }
}

export const nodeTypes: Record<string, any> = Object.fromEntries(
  (Object.keys(NODE_META) as FlowNodeType[]).map(t => [
    t,
    (props: any) => <BaseNode {...props} type={t} />
  ])
)
