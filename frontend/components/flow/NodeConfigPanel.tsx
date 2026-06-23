'use client'
import { X } from 'lucide-react'
import { FlowNodeType, NODE_META } from './nodeTypes'

interface Props {
  nodeId: string
  type: FlowNodeType
  data: Record<string, string>
  onChange: (id: string, data: Record<string, string>) => void
  onDelete: (id: string) => void
  onClose: () => void
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white'
const selectCls = inputCls
const textareaCls = `${inputCls} resize-none`

export default function NodeConfigPanel({ nodeId, type, data, onChange, onDelete, onClose }: Props) {
  const meta = NODE_META[type]
  const Icon = meta.icon

  function set(key: string, value: string) {
    onChange(nodeId, { ...data, [key]: value })
  }

  return (
    <div className="w-80 flex flex-col bg-white border-l border-gray-200 shadow-xl h-full">
      {/* Header */}
      <div className={`flex items-center gap-3 px-4 py-3 ${meta.bg} border-b border-gray-100`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white/60`}>
          <Icon className={`w-4 h-4 ${meta.color}`} />
        </div>
        <span className={`flex-1 text-sm font-semibold ${meta.color}`}>{meta.label}</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-black/10 transition-colors">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {type === 'trigger' && (
          <>
            <Field label="Tipo de gatilho">
              <select value={data.triggerType || 'any'} onChange={e => set('triggerType', e.target.value)} className={selectCls}>
                <option value="any">Qualquer mensagem recebida</option>
                <option value="keyword">Palavra-chave específica</option>
                <option value="first">Primeira mensagem do contato</option>
              </select>
            </Field>
            {(data.triggerType === 'keyword' || !data.triggerType) && data.triggerType === 'keyword' && (
              <Field label="Palavra-chave">
                <input className={inputCls} placeholder="Ex: oi, olá, iniciar" value={data.keyword || ''}
                  onChange={e => set('keyword', e.target.value)} />
              </Field>
            )}
          </>
        )}

        {type === 'message' && (
          <>
            <Field label="Texto da mensagem">
              <textarea className={textareaCls} rows={5}
                placeholder={"Olá {{nome}}! Como posso te ajudar?\n\n1 - Suporte\n2 - Vendas\n3 - Financeiro"}
                value={data.text || ''} onChange={e => set('text', e.target.value)} />
            </Field>
            <Field label="Atraso antes de enviar (segundos)">
              <input type="number" min={0} max={30} className={inputCls} value={data.delay || '1'}
                onChange={e => set('delay', e.target.value)} />
            </Field>
            <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 space-y-1">
              <p className="font-semibold">Variáveis disponíveis:</p>
              <p><code>{'{{nome}}'}</code> — nome do contato</p>
              <p><code>{'{{telefone}}'}</code> — número do contato</p>
              <p><code>{'{{resposta}}'}</code> — última resposta salva</p>
            </div>
          </>
        )}

        {type === 'audio' && (
          <>
            <Field label="Texto para simular como áudio">
              <textarea className={textareaCls} rows={4}
                placeholder="Este texto será enviado como nota de voz simulada no WhatsApp"
                value={data.text || ''} onChange={e => set('text', e.target.value)} />
            </Field>
            <Field label="Velocidade do áudio">
              <select className={selectCls} value={data.speed || 'normal'} onChange={e => set('speed', e.target.value)}>
                <option value="slow">Lenta</option>
                <option value="normal">Normal</option>
                <option value="fast">Rápida</option>
              </select>
            </Field>
            <div className="bg-pink-50 rounded-lg p-3 text-xs text-pink-700">
              <p className="font-semibold mb-1">Como funciona:</p>
              <p>O texto é convertido em nota de voz e enviado como áudio no WhatsApp, simulando atendimento humano.</p>
            </div>
          </>
        )}

        {type === 'ask' && (
          <>
            <Field label="Pergunta para o contato">
              <textarea className={textareaCls} rows={3}
                placeholder="Ex: Qual é o seu nome completo?"
                value={data.question || ''} onChange={e => set('question', e.target.value)} />
            </Field>
            <Field label="Salvar resposta na variável">
              <input className={inputCls} placeholder="Ex: nome, email, cpf, opcao"
                value={data.variable || ''} onChange={e => set('variable', e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">Use <code>{'{{variavel}}'}</code> nos próximos nós</p>
            </Field>
            <Field label="Validação da resposta">
              <select className={selectCls} value={data.validation || 'none'} onChange={e => set('validation', e.target.value)}>
                <option value="none">Sem validação</option>
                <option value="number">Apenas números</option>
                <option value="email">E-mail válido</option>
                <option value="cpf">CPF válido</option>
                <option value="phone">Telefone</option>
              </select>
            </Field>
            {data.validation && data.validation !== 'none' && (
              <Field label="Mensagem de erro (formato inválido)">
                <input className={inputCls} placeholder="Formato inválido. Tente novamente:"
                  value={data.errorMsg || ''} onChange={e => set('errorMsg', e.target.value)} />
              </Field>
            )}
          </>
        )}

        {type === 'condition' && (
          <>
            <Field label="Variável a verificar">
              <input className={inputCls} placeholder="Ex: opcao, nome, resposta"
                value={data.variable || ''} onChange={e => set('variable', e.target.value)} />
            </Field>
            <Field label="Operador">
              <select className={selectCls} value={data.operator || 'equals'} onChange={e => set('operator', e.target.value)}>
                <option value="equals">É igual a</option>
                <option value="contains">Contém</option>
                <option value="starts">Começa com</option>
                <option value="not_equals">É diferente de</option>
                <option value="empty">Está vazio</option>
                <option value="not_empty">Não está vazio</option>
              </select>
            </Field>
            {!['empty', 'not_empty'].includes(data.operator || '') && (
              <Field label="Valor esperado">
                <input className={inputCls} placeholder='Ex: "1", "sim", "cancelar"'
                  value={data.value || ''} onChange={e => set('value', e.target.value)} />
              </Field>
            )}
            <div className="bg-orange-50 rounded-lg p-3 text-xs text-orange-700">
              <p>O conector <strong>verde (Sim)</strong> segue se a condição for verdadeira.</p>
              <p className="mt-1">O conector <strong>vermelho (Não)</strong> segue se for falsa.</p>
            </div>
          </>
        )}

        {type === 'wait' && (
          <>
            <Field label="Tipo de espera">
              <select className={selectCls} value={data.waitType || 'time'} onChange={e => set('waitType', e.target.value)}>
                <option value="time">Tempo fixo</option>
                <option value="reply">Aguardar resposta do contato</option>
              </select>
            </Field>
            {(!data.waitType || data.waitType === 'time') && (
              <Field label="Duração (segundos)">
                <input type="number" min={1} max={86400} className={inputCls}
                  value={data.seconds || '5'} onChange={e => set('seconds', e.target.value)} />
              </Field>
            )}
            {data.waitType === 'reply' && (
              <Field label="Timeout sem resposta (minutos)">
                <input type="number" min={1} max={1440} className={inputCls}
                  value={data.timeout || '30'} onChange={e => set('timeout', e.target.value)} />
              </Field>
            )}
          </>
        )}

        {type === 'integration' && (
          <>
            <Field label="URL do webhook">
              <input className={inputCls} placeholder="https://seu-sistema.com/webhook"
                value={data.url || ''} onChange={e => set('url', e.target.value)} />
            </Field>
            <Field label="Método HTTP">
              <select className={selectCls} value={data.method || 'POST'} onChange={e => set('method', e.target.value)}>
                <option value="POST">POST</option>
                <option value="GET">GET</option>
                <option value="PUT">PUT</option>
              </select>
            </Field>
            <Field label="Corpo (JSON)">
              <textarea className={`${textareaCls} font-mono text-xs`} rows={5}
                placeholder={'{\n  "nome": "{{nome}}",\n  "telefone": "{{telefone}}"\n}'}
                value={data.body || ''} onChange={e => set('body', e.target.value)} />
            </Field>
            <Field label="Salvar resposta na variável">
              <input className={inputCls} placeholder="Ex: resultado_api"
                value={data.responseVar || ''} onChange={e => set('responseVar', e.target.value)} />
            </Field>
          </>
        )}

        {type === 'action' && (
          <>
            <Field label="Tipo de ação">
              <select className={selectCls} value={data.action || 'transfer'} onChange={e => set('action', e.target.value)}>
                <option value="transfer">Transferir para humano</option>
                <option value="close">Encerrar atendimento</option>
                <option value="tag">Adicionar tag ao contato</option>
                <option value="assign">Atribuir a atendente</option>
                <option value="kanban">Mover no Kanban</option>
              </select>
            </Field>
            {data.action === 'tag' && (
              <Field label="Tag">
                <input className={inputCls} placeholder="Ex: lead, vip, interessado"
                  value={data.tag || ''} onChange={e => set('tag', e.target.value)} />
              </Field>
            )}
            {data.action === 'kanban' && (
              <Field label="Coluna de destino">
                <select className={selectCls} value={data.kanbanCol || 'em_andamento'} onChange={e => set('kanbanCol', e.target.value)}>
                  <option value="novo">Novo</option>
                  <option value="em_andamento">Em andamento</option>
                  <option value="aguardando">Aguardando</option>
                  <option value="resolvido">Resolvido</option>
                </select>
              </Field>
            )}
            {data.action === 'transfer' && (
              <Field label="Mensagem ao transferir">
                <input className={inputCls} placeholder="Transferindo para um atendente..."
                  value={data.transferMsg || ''} onChange={e => set('transferMsg', e.target.value)} />
              </Field>
            )}
          </>
        )}

        {type === 'end' && (
          <>
            <Field label="Mensagem de encerramento">
              <textarea className={textareaCls} rows={3}
                placeholder="Obrigado pelo contato! Até logo 👋"
                value={data.message || ''} onChange={e => set('message', e.target.value)} />
            </Field>
          </>
        )}

        {/* ═══════════════ NÓS DE IA ═══════════════ */}

        {type === 'ai_agent' && (
          <>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs text-purple-800">
              <p className="font-bold mb-1">🤖 Agente de IA — OpenAI GPT-4o</p>
              <p>A IA assume a conversa e responde automaticamente com base no contexto e nas instruções abaixo.</p>
            </div>
            <Field label="Instrução do agente (system prompt)">
              <textarea className={textareaCls} rows={6}
                placeholder={"Você é um assistente de vendas da empresa X. Responda em português, seja simpático e objetivo. Seu objetivo é qualificar leads e agendar demonstrações. Se o cliente quiser falar com humano, diga que vai transferir."}
                value={data.prompt || ''} onChange={e => set('prompt', e.target.value)} />
            </Field>
            <Field label="Modelo">
              <select className={selectCls} value={data.model || 'gpt-4o-mini'} onChange={e => set('model', e.target.value)}>
                <option value="gpt-4o-mini">GPT-4o Mini (rápido e barato)</option>
                <option value="gpt-4o">GPT-4o (mais inteligente)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
              </select>
            </Field>
            <Field label="Temperatura (criatividade)">
              <div className="flex items-center gap-3">
                <input type="range" min="0" max="10" step="1"
                  value={String(Math.round(parseFloat(data.temperature || '0.7') * 10))}
                  onChange={e => set('temperature', String(parseInt(e.target.value) / 10))}
                  className="flex-1" />
                <span className="text-sm font-mono w-8 text-gray-700">{data.temperature || '0.7'}</span>
              </div>
            </Field>
            <Field label="Máximo de trocas antes de transferir (0 = ilimitado)">
              <input type="number" min={0} max={50} className={inputCls}
                value={data.maxTurns || '10'} onChange={e => set('maxTurns', e.target.value)} />
            </Field>
            <Field label="Palavras que disparam transferência para humano">
              <input className={inputCls} placeholder="falar com humano, atendente, supervisor"
                value={data.handoffKeywords || ''} onChange={e => set('handoffKeywords', e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">Separe por vírgula</p>
            </Field>
            <div className="bg-orange-50 rounded-lg p-3 text-xs text-orange-700">
              <p><strong>↻ Continua</strong> — IA segue respondendo</p>
              <p className="mt-1"><strong>→ Humano</strong> — transfere ao atingir limite ou detectar palavra-chave</p>
            </div>
          </>
        )}

        {type === 'ai_image' && (
          <>
            <div className="bg-fuchsia-50 border border-fuchsia-200 rounded-lg p-3 text-xs text-fuchsia-800">
              <p className="font-bold mb-1">🖼 Geração de imagem — DALL·E 3</p>
              <p>Gera uma imagem com IA e envia diretamente no WhatsApp.</p>
            </div>
            <Field label="Prompt da imagem">
              <textarea className={textareaCls} rows={4}
                placeholder={"Logo minimalista de empresa de tecnologia em fundo branco, estilo clean, cores azul e branco"}
                value={data.prompt || ''} onChange={e => set('prompt', e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">Use <code>{'{{resposta}}'}</code> para incluir o texto do usuário</p>
            </Field>
            <Field label="Tamanho">
              <select className={selectCls} value={data.size || '1024x1024'} onChange={e => set('size', e.target.value)}>
                <option value="1024x1024">1024×1024 — Quadrado</option>
                <option value="1792x1024">1792×1024 — Paisagem</option>
                <option value="1024x1792">1024×1792 — Retrato</option>
              </select>
            </Field>
            <Field label="Qualidade">
              <select className={selectCls} value={data.quality || 'standard'} onChange={e => set('quality', e.target.value)}>
                <option value="standard">Standard (mais rápido)</option>
                <option value="hd">HD (mais detalhado)</option>
              </select>
            </Field>
            <Field label="Legenda ao enviar (opcional)">
              <input className={inputCls} placeholder="Aqui está sua imagem gerada!"
                value={data.caption || ''} onChange={e => set('caption', e.target.value)} />
            </Field>
          </>
        )}

        {type === 'ai_receipt' && (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              <p className="font-bold mb-1">🔍 Reconhecer comprovante PIX — GPT-4o Vision</p>
              <p>A IA analisa a imagem enviada pelo contato e identifica se é um comprovante de pagamento válido.</p>
            </div>
            <Field label="Moeda esperada">
              <select className={selectCls} value={data.currency || 'brl'} onChange={e => set('currency', e.target.value)}>
                <option value="brl">BRL (Real)</option>
                <option value="usd">USD (Dólar)</option>
                <option value="any">Qualquer moeda</option>
              </select>
            </Field>
            <Field label="Valor mínimo esperado (opcional)">
              <input type="number" min={0} step={0.01} className={inputCls}
                placeholder="Ex: 50.00 — deixe vazio para ignorar"
                value={data.minValue || ''} onChange={e => set('minValue', e.target.value)} />
            </Field>
            <Field label="Salvar valor extraído na variável">
              <input className={inputCls} placeholder="valor_pago"
                value={data.saveValue || ''} onChange={e => set('saveValue', e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">Ex: <code>{'{{valor_pago}}'}</code></p>
            </Field>
            <Field label="Salvar nome do pagador na variável">
              <input className={inputCls} placeholder="nome_pagador"
                value={data.saveName || ''} onChange={e => set('saveName', e.target.value)} />
            </Field>
            <Field label="Instrução extra para a IA (opcional)">
              <textarea className={textareaCls} rows={3}
                placeholder="Aceite somente comprovantes com data de hoje"
                value={data.extraInstruction || ''} onChange={e => set('extraInstruction', e.target.value)} />
            </Field>
            <div className="rounded-lg border border-gray-200 divide-y text-xs overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-semibold text-emerald-700">Válido</span>
                <span className="text-gray-500 ml-1">— imagem é um comprovante PIX legítimo</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0" />
                <span className="font-semibold text-red-600">Inválido</span>
                <span className="text-gray-500 ml-1">— não é comprovante ou valor incorreto</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-400 shrink-0" />
                <span className="font-semibold text-gray-500">Erro</span>
                <span className="text-gray-400 ml-1">— imagem ilegível ou não enviou imagem</span>
              </div>
            </div>
          </>
        )}

        {type === 'ai_audio' && (
          <>
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-xs text-sky-800">
              <p className="font-bold mb-1">🎧 Entender áudio — Whisper + GPT-4o</p>
              <p>Quando o contato enviar uma nota de voz, a IA transcreve e interpreta o áudio automaticamente.</p>
            </div>
            <Field label="Idioma esperado">
              <select className={selectCls} value={data.language || 'pt'} onChange={e => set('language', e.target.value)}>
                <option value="pt">Português</option>
                <option value="en">Inglês</option>
                <option value="es">Espanhol</option>
                <option value="auto">Detectar automaticamente</option>
              </select>
            </Field>
            <Field label="Salvar transcrição na variável">
              <input className={inputCls} placeholder="transcricao"
                value={data.saveVar || ''} onChange={e => set('saveVar', e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">Use <code>{'{{transcricao}}'}</code> nos próximos nós</p>
            </Field>
            <Field label="O que fazer com o áudio">
              <select className={selectCls} value={data.mode || 'transcribe'} onChange={e => set('mode', e.target.value)}>
                <option value="transcribe">Apenas transcrever</option>
                <option value="understand">Transcrever + interpretar intenção</option>
                <option value="reply">Transcrever + responder com IA</option>
              </select>
            </Field>
            {data.mode === 'understand' && (
              <Field label="Variável para salvar a intenção">
                <input className={inputCls} placeholder="intencao"
                  value={data.intentVar || ''} onChange={e => set('intentVar', e.target.value)} />
                <p className="text-xs text-gray-400 mt-1">Ex: comprar, cancelar, suporte…</p>
              </Field>
            )}
            {data.mode === 'reply' && (
              <Field label="Instrução para a resposta">
                <textarea className={textareaCls} rows={3}
                  placeholder="Responda de forma amigável e objetiva com base no que o usuário disse no áudio"
                  value={data.replyPrompt || ''} onChange={e => set('replyPrompt', e.target.value)} />
              </Field>
            )}
            <Field label="Se não enviar áudio (texto normal)">
              <select className={selectCls} value={data.fallback || 'skip'} onChange={e => set('fallback', e.target.value)}>
                <option value="skip">Pular e continuar</option>
                <option value="ask">Pedir para enviar áudio</option>
                <option value="treat_as_text">Tratar o texto como transcrição</option>
              </select>
            </Field>
          </>
        )}
      </div>

      {/* Footer */}
      {type !== 'trigger' && (
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => { onDelete(nodeId); onClose() }}
            className="w-full py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
          >
            Remover este nó
          </button>
        </div>
      )}
    </div>
  )
}
