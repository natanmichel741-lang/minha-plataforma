'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ReactFlow, Background, Controls, MiniMap,
  addEdge, useNodesState, useEdgesState,
  type Connection, type Edge, type Node,
  MarkerType, BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ArrowLeft, Save, Check, Play, Pause, Trash2 } from 'lucide-react'
import api from '@/lib/api'
import { nodeTypes, FlowNodeType, NODE_META } from '@/components/flow/nodeTypes'
import NodeSidebar from '@/components/flow/NodeSidebar'
import NodeConfigPanel from '@/components/flow/NodeConfigPanel'

const INITIAL_TRIGGER: Node = {
  id: 'trigger-1',
  type: 'trigger',
  position: { x: 300, y: 60 },
  data: { triggerType: 'any' },
  deletable: false,
}

export default function FlowEditorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)

  const [flow, setFlow] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([INITIAL_TRIGGER])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)

  // Carrega o fluxo
  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/api/flows')
        const found = res.data.find((f: any) => f.id === id)
        if (!found) { router.push('/dashboard/flows'); return }
        setFlow(found)

        const savedNodes = JSON.parse(found.nodes || '[]')
        const savedEdges = JSON.parse(found.edges || '[]')

        if (savedNodes.length > 0) {
          setNodes(savedNodes)
          setEdges(savedEdges)
        } else {
          setNodes([INITIAL_TRIGGER])
          setEdges([])
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [id])

  const onConnect = useCallback((params: Connection) => {
    setEdges(eds => addEdge({
      ...params,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
      style: { stroke: '#6366f1', strokeWidth: 2 },
      animated: true,
    }, eds))
  }, [])

  // Drag & drop do sidebar
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('application/reactflow') as FlowNodeType
    if (!type || !reactFlowInstance || !reactFlowWrapper.current) return

    const bounds = reactFlowWrapper.current.getBoundingClientRect()
    const position = reactFlowInstance.screenToFlowPosition({
      x: e.clientX - bounds.left,
      y: e.clientY - bounds.top,
    })

    const newNode: Node = {
      id: crypto.randomUUID(),
      type,
      position,
      data: getDefaultData(type),
    }
    setNodes(nds => [...nds, newNode])
  }, [reactFlowInstance])

  function getDefaultData(type: FlowNodeType): Record<string, string> {
    const defaults: Record<FlowNodeType, Record<string, string>> = {
      trigger:     { triggerType: 'any' },
      message:     { text: '', delay: '1' },
      audio:       { text: '', speed: 'normal' },
      ask:         { question: '', variable: '', validation: 'none' },
      condition:   { variable: '', operator: 'equals', value: '' },
      wait:        { waitType: 'time', seconds: '5' },
      integration: { url: '', method: 'POST', body: '', responseVar: '' },
      action:      { action: 'transfer' },
      end:         { message: 'Obrigado pelo contato! Até logo 👋' },
      ai_agent:    { prompt: '', model: 'gpt-4o-mini', temperature: '0.7', maxTurns: '10', handoffKeywords: 'falar com humano, atendente' },
      ai_image:    { prompt: '', size: '1024x1024', quality: 'standard', caption: '' },
      ai_receipt:  { currency: 'brl', minValue: '', saveValue: 'valor_pago', saveName: 'nome_pagador', extraInstruction: '' },
      ai_audio:    { language: 'pt', saveVar: 'transcricao', mode: 'transcribe', fallback: 'skip' },
    }
    return defaults[type] || {}
  }

  function onNodeClick(_: any, node: Node) {
    setSelectedNode(node)
  }

  function onPaneClick() {
    setSelectedNode(null)
  }

  function handleNodeDataChange(nodeId: string, newData: Record<string, string>) {
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: newData } : n))
    setSelectedNode(prev => prev?.id === nodeId ? { ...prev, data: newData } : prev)
  }

  function handleDeleteNode(nodeId: string) {
    setNodes(nds => nds.filter(n => n.id !== nodeId))
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId))
    setSelectedNode(null)
  }

  async function handleSave() {
    if (!flow) return
    setSaving(true)
    try {
      await api.patch(`/api/flows/${flow.id}`, {
        name: flow.name,
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      alert('Erro ao salvar fluxo')
    }
    setSaving(false)
  }

  async function handleToggleActive() {
    try {
      const updated = await api.patch(`/api/flows/${flow.id}`, { active: !flow.active })
      setFlow((f: any) => ({ ...f, active: updated.data.active }))
    } catch {
      alert('Erro ao atualizar status')
    }
  }

  if (loading) return (
    <div className="flex h-full items-center justify-center bg-gray-50">
      <div className="text-gray-400 text-sm animate-pulse">Carregando fluxo…</div>
    </div>
  )

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-gray-200 shadow-sm z-10 shrink-0">
        <button onClick={() => router.push('/dashboard/flows')}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </button>

        <input
          type="text"
          value={flow?.name || ''}
          onChange={e => setFlow((f: any) => ({ ...f, name: e.target.value }))}
          className="flex-1 text-base font-bold text-gray-900 bg-transparent border-none outline-none max-w-xs"
        />

        <div className="flex items-center gap-2 ml-auto">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${flow?.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
            {flow?.active ? '● Ativo' : '○ Pausado'}
          </span>

          <button onClick={handleToggleActive}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              flow?.active
                ? 'border-gray-200 text-gray-600 hover:bg-gray-50'
                : 'border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
            }`}>
            {flow?.active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {flow?.active ? 'Pausar' : 'Ativar'}
          </button>

          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Salvo!' : saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <NodeSidebar />

        {/* Canvas */}
        <div ref={reactFlowWrapper} className="flex-1 h-full" onDrop={onDrop} onDragOver={onDragOver}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            deleteKeyCode="Delete"
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />
            <Controls />
            <MiniMap
              nodeColor={n => {
                const meta = NODE_META[n.type as FlowNodeType]
                return meta ? meta.bg.replace('bg-', '#').replace('-50', '') : '#e5e7eb'
              }}
              className="rounded-xl border border-gray-200 shadow-sm"
            />
          </ReactFlow>
        </div>

        {/* Config panel */}
        {selectedNode && (
          <NodeConfigPanel
            nodeId={selectedNode.id}
            type={selectedNode.type as FlowNodeType}
            data={selectedNode.data as Record<string, string>}
            onChange={handleNodeDataChange}
            onDelete={handleDeleteNode}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </div>
  )
}
