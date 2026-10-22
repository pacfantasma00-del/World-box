import React, { useState, useEffect } from 'react';
import { AstroMatrixCore, AstroTask, AntiQuotaMetrics, AstroMemory } from '../astro/matrix';
import { sounds } from '../game/sound';

interface AstroMatrixModalProps {
  onClose: () => void;
}

export const AstroMatrixModal: React.FC<AstroMatrixModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'tasks' | 'memory' | 'antiquota' | 'termux'>('matrix');
  const [statusData, setStatusData] = useState<any>(null);
  const [newGoal, setNewGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  useEffect(() => {
    fetch('/api/astro/matrix-status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatusData(data.data);
        }
      })
      .catch(() => {
        // Fallback to local singleton instance
        setStatusData(AstroMatrixCore.getInstance().getStatus());
      });
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/astro/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: newGoal, riskLevel: 'LOW' }),
      });
      const data = await res.json();
      if (data.success && statusData) {
        setStatusData({
          ...statusData,
          tasks: [data.task, ...(statusData.tasks || [])],
        });
        setNewGoal('');
        sounds.playDivine();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const tasks: AstroTask[] = statusData?.tasks || [];
  const antiQuota: AntiQuotaMetrics = statusData?.antiQuota || {
    totalRequests: 0,
    totalTokensEstimate: 0,
    cacheHits: 0,
    http429Errors: 0,
    circuitBreakerState: 'CLOSED',
    concurrencyLimit: 5,
    activeRequests: 0,
    backoffDelayMs: 0,
    lastFailureTime: 0,
  };
  const memory: AstroMemory = statusData?.memory || {
    CURRENT_CONTEXT: {},
    PREVIOUS_CONTEXT: {},
    PERSISTED_MEMORY: [],
    EXECUTION_HISTORY: [],
    PROJECT_STATE: {},
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-4xl bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              🌌
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <span>ASTRO CORE MATRIX</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  AUTONOMIA CONTROLADA
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Orquestrador, Memória Persistente, Proteção Anti-Quota & Gateway
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-mono overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('matrix');
              sounds.playClick();
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'matrix' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🧩 12 Camadas Matrix
          </button>
          <button
            onClick={() => {
              setActiveTab('tasks');
              sounds.playClick();
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'tasks' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            ⚡ Orquestrador ({tasks.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('memory');
              sounds.playClick();
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'memory' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🧠 Memória Persistente
          </button>
          <button
            onClick={() => {
              setActiveTab('antiquota');
              sounds.playClick();
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'antiquota' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🛡️ Anti-Quota & Circuit
          </button>
          <button
            onClick={() => {
              setActiveTab('termux');
              sounds.playClick();
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'termux' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            📱 Termux & PM2
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {/* TAB 1: 12 Layers Matrix */}
          {activeTab === 'matrix' && (
            <div className="flex flex-col gap-4">
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
                <h3 className="text-sm font-bold text-cyan-400 font-mono mb-2">
                  ARQUITETURA LÓGICA V10: ASTRO MATRIX
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-xs font-mono">
                  {[
                    { name: 'PERSONALIDADE', state: 'CONFIRMADO', color: 'text-emerald-400 border-emerald-500/30' },
                    { name: 'MEMÓRIA', state: 'CONFIRMADO', color: 'text-emerald-400 border-emerald-500/30' },
                    { name: 'CONTEXTO', state: 'CONFIRMADO', color: 'text-emerald-400 border-emerald-500/30' },
                    { name: 'PLANEJADOR', state: 'CONFIRMADO', color: 'text-emerald-400 border-emerald-500/30' },
                    { name: 'ORQUESTRADOR', state: 'CONFIRMADO', color: 'text-emerald-400 border-emerald-500/30' },
                    { name: 'ROUTER', state: 'CONFIRMADO', color: 'text-emerald-400 border-emerald-500/30' },
                    { name: 'PROVIDERS', state: 'CONFIRMADO', color: 'text-emerald-400 border-emerald-500/30' },
                    { name: 'FERRAMENTAS', state: 'CONFIRMADO', color: 'text-emerald-400 border-emerald-500/30' },
                    { name: 'EXECUTOR', state: 'CONFIRMADO', color: 'text-emerald-400 border-emerald-500/30' },
                    { name: 'AUDITOR', state: 'CONFIRMADO', color: 'text-emerald-400 border-emerald-500/30' },
                    { name: 'OBSERVABILIDADE', state: 'CONFIRMADO', color: 'text-emerald-400 border-emerald-500/30' },
                    { name: 'APRENDIZADO', state: 'CONFIRMADO', color: 'text-emerald-400 border-emerald-500/30' },
                  ].map((layer) => (
                    <div key={layer.name} className={`p-2 rounded-lg bg-slate-900 border ${layer.color} flex flex-col gap-0.5`}>
                      <span className="text-[10px] text-slate-400">Camada</span>
                      <span className="font-bold">{layer.name}</span>
                      <span className="text-[9px] text-emerald-400">✓ {layer.state}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl flex flex-col gap-2">
                <h4 className="text-xs font-bold text-amber-400 font-mono">
                  FLUXO OBRIGATÓRIO DE AUTONOMIA
                </h4>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                  {['OBSERVAR', 'INTERPRETAR', 'PLANEJAR', 'VALIDAR', 'EXECUTAR', 'VERIFICAR', 'REGISTRAR', 'REAVALIAR'].map((step, idx) => (
                    <React.Fragment key={step}>
                      <span className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-bold">
                        {step}
                      </span>
                      {idx < 7 && <span className="text-slate-500">→</span>}
                    </React.Fragment>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Princípio fundamental: <strong>Execução é separada da geração de texto</strong>. Dizer que uma tarefa foi executada não significa que ela realmente aconteceu.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Task Orchestrator */}
          {activeTab === 'tasks' && (
            <div className="flex flex-col gap-4">
              {/* Task Creation Form */}
              <form onSubmit={handleCreateTask} className="flex gap-2">
                <input
                  type="text"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="Defina um novo objetivo autônomo (ex: 'Otimizar loop de tick', 'Reforçar barreira anti-quota')..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={loading || !newGoal.trim()}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold font-mono text-xs rounded-xl transition-colors cursor-pointer"
                >
                  {loading ? 'Planejando...' : '+ Submeter Tarefa'}
                </button>
              </form>

              {/* Tasks List */}
              <div className="flex flex-col gap-2.5">
                {tasks.map((task) => (
                  <div key={task.id} className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          ✓ {task.status}
                        </span>
                        <span className="font-bold text-white">{task.goal}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">ID: {task.id}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                      <div>
                        <span className="text-slate-500">Contexto:</span> {task.context}
                      </div>
                      <div>
                        <span className="text-slate-500">Resultado Verificado:</span>{' '}
                        <span className="text-emerald-400 font-semibold">{task.verificationResult}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 text-[10px]">
                      {task.authorizedTools.map((tool) => (
                        <span key={tool} className="px-1.5 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-800">
                          🛠️ {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Persistent Memory */}
          {activeTab === 'memory' && (
            <div className="flex flex-col gap-4 text-xs font-mono">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* CURRENT_CONTEXT */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                  <h4 className="text-cyan-400 font-bold mb-2 flex items-center gap-1.5">
                    <span>📌</span> CURRENT_CONTEXT
                  </h4>
                  <pre className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-lg overflow-x-auto">
                    {JSON.stringify(memory.CURRENT_CONTEXT, null, 2)}
                  </pre>
                </div>

                {/* PREVIOUS_CONTEXT */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                  <h4 className="text-cyan-400 font-bold mb-2 flex items-center gap-1.5">
                    <span>⏮️</span> PREVIOUS_CONTEXT
                  </h4>
                  <pre className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-lg overflow-x-auto">
                    {JSON.stringify(memory.PREVIOUS_CONTEXT, null, 2)}
                  </pre>
                </div>
              </div>

              {/* PERSISTED_MEMORY */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                <h4 className="text-amber-400 font-bold mb-2 flex items-center gap-1.5">
                  <span>💾</span> PERSISTED_MEMORY (Decisões Duradouras)
                </h4>
                <div className="flex flex-col gap-1.5">
                  {memory.PERSISTED_MEMORY.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <div>
                        <span className="font-bold text-white">{item.key}: </span>
                        <span className="text-slate-300">{String(item.value)}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                        {item.confidence}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* PROJECT_STATE */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                <h4 className="text-emerald-400 font-bold mb-2 flex items-center gap-1.5">
                  <span>🔍</span> PROJECT_STATE (Estado Técnico Verificado)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(memory.PROJECT_STATE).map(([component, info]) => (
                    <div key={component} className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{component}</span>
                        <span className="text-[10px] text-emerald-400 font-bold">✓ {info.status}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{info.evidence}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Anti-Quota & Circuit Breaker */}
          {activeTab === 'antiquota' && (
            <div className="flex flex-col gap-4 text-xs font-mono">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-400">Total Requisições</span>
                  <div className="text-xl font-bold text-white">{antiQuota.totalRequests}</div>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-400">Tokens Estimados</span>
                  <div className="text-xl font-bold text-cyan-400">{antiQuota.totalTokensEstimate}</div>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-400">Cache Hits</span>
                  <div className="text-xl font-bold text-emerald-400">{antiQuota.cacheHits}</div>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-400">Circuit Breaker</span>
                  <div className={`text-sm font-bold mt-1 px-2 py-0.5 rounded w-max ${
                    antiQuota.circuitBreakerState === 'CLOSED'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {antiQuota.circuitBreakerState} (SEGURO)
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex flex-col gap-2">
                <h4 className="text-cyan-400 font-bold">REGRAS ANTI-QUOTA E ANTI-BAN ATIVAS</h4>
                <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px]">
                  <li>Detecção automática de status HTTP 429 com transição do Circuit Breaker para OPEN.</li>
                  <li>Exponential Backoff com jitter para evitar tempestade de reconexões.</li>
                  <li>Reutilização de contexto e fallbacks locais procedurais quando a cota estiver esgotada.</li>
                  <li>Idempotência e proteção contra comandos duplicados.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 5: Termux & PM2 Troubleshooting */}
          {activeTab === 'termux' && (
            <div className="flex flex-col gap-4 text-xs font-mono">
              <div className="bg-slate-950/80 border border-emerald-500/40 p-4 rounded-xl flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-emerald-400 font-bold flex items-center gap-2">
                    <span>📱</span> COMANDO ÚNICO DE INSTALAÇÃO NO TERMUX
                  </h4>
                  <button
                    onClick={() => {
                      const cmd = `pkg update -y && pkg install -y curl && curl -sSL ${window.location.origin}/install.sh | bash`;
                      navigator.clipboard.writeText(cmd);
                      setCopiedScript(true);
                      sounds.playClick();
                      setTimeout(() => setCopiedScript(false), 3000);
                    }}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition-all cursor-pointer"
                  >
                    {copiedScript ? '✓ Copiado!' : 'Copiar'}
                  </button>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-emerald-300 text-[11px] break-all select-all">
                  pkg update -y && pkg install -y curl && curl -sSL {typeof window !== 'undefined' ? window.location.origin : 'https://...'}/install.sh | bash
                </div>
              </div>

              {/* Fix for PM2 TypeError */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex flex-col gap-2">
                <h4 className="text-amber-400 font-bold flex items-center gap-2">
                  <span>🛠️</span> DIAGNÓSTICO DO ERRO DE PM2 (HISTÓRICO)
                </h4>
                <p className="text-[11px] text-slate-400">
                  O erro histórico registrado: <code className="text-red-400">TypeError: Cannot read properties of undefined (reading 'includes') at server.js:91:32</code> foi causado por verificação de tags ou atributos em unidades/processos indefinidos.
                </p>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300">
                  ✓ <strong>Correção aplicada no código:</strong> Todas as checagens com <code className="text-cyan-400">.includes()</code> agora usam guarda defensiva <code className="text-emerald-400">Array.isArray(item) ? item.includes(...) : false</code> e tratamento seguro de arrays nulos.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
