'use client'
import { FlowNodeType, NODE_META } from './nodeTypes'

const GROUPS = [
  {
    label: 'IA — OpenAI',
    types: ['ai_agent', 'ai_image', 'ai_receipt', 'ai_audio'] as FlowNodeType[],
    highlight: true,
  },
  {
    label: 'Mensagens',
    types: ['message', 'audio'] as FlowNodeType[],
  },
  {
    label: 'Interação',
    types: ['ask', 'condition', 'wait'] as FlowNodeType[],
  },
  {
    label: 'Integrações & Ações',
    types: ['integration', 'action', 'end'] as FlowNodeType[],
  },
]

export default function NodeSidebar() {
  function onDragStart(e: React.DragEvent, type: FlowNodeType) {
    e.dataTransfer.setData('application/reactflow', type)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="w-56 bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nós disponíveis</p>
        <p className="text-xs text-gray-400 mt-0.5">Arraste para o canvas</p>
      </div>

      <div className="flex-1 p-3 space-y-4">
        {GROUPS.map(group => (
          <div key={group.label}>
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 px-1 ${(group as any).highlight ? 'text-purple-500' : 'text-gray-400'}`}>{group.label}</p>
            <div className="space-y-1">
              {group.types.map(type => {
                const meta = NODE_META[type]
                const Icon = meta.icon
                return (
                  <div
                    key={type}
                    draggable
                    onDragStart={e => onDragStart(e, type)}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-grab active:cursor-grabbing border ${meta.border} ${meta.bg} hover:shadow-sm transition-all select-none`}
                  >
                    <Icon className={`w-4 h-4 ${meta.color} shrink-0`} />
                    <span className={`text-xs font-medium ${meta.color}`}>{meta.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
