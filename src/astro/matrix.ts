/**
 * ASTRO CORE MATRIX — NÚCLEO DE ORQUESTRAÇÃO, MEMÓRIA E CONTROLE ANTI-QUOTA
 *
 * Implementa a arquitetura de 12 camadas:
 * Personalidade, Memória, Contexto, Planejador, Orquestrador, Router, Providers,
 * Ferramentas, Executor, Auditor, Observabilidade, Aprendizado Persistente.
 */

export interface AstroTask {
  id: string;
  goal: string;
  context: string;
  prerequisites: string[];
  plan: string[];
  authorizedTools: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status:
    | 'RECEBIDA'
    | 'ANALISANDO'
    | 'PLANEJADA'
    | 'VALIDANDO'
    | 'EXECUTANDO'
    | 'VERIFICANDO'
    | 'CONCLUÍDA'
    | 'FALHOU';
  attempts: number;
  evidence: string[];
  verificationResult: string;
  nextAction: string;
  createdAt: number;
  completedAt?: number;
  verifiedBy?: string;
}

export interface AntiQuotaMetrics {
  totalRequests: number;
  totalTokensEstimate: number;
  cacheHits: number;
  http429Errors: number;
  circuitBreakerState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  concurrencyLimit: number;
  activeRequests: number;
  backoffDelayMs: number;
  lastFailureTime: number;
}

export interface AstroMemory {
  CURRENT_CONTEXT: Record<string, any>;
  PREVIOUS_CONTEXT: Record<string, any>;
  PERSISTED_MEMORY: Array<{ key: string; value: any; confidence: 'CONFIRMADO' | 'INFERÊNCIA' | 'HIPÓTESE'; updatedAt: string }>;
  EXECUTION_HISTORY: Array<{ action: string; result: string; timestamp: number; success: boolean }>;
  PROJECT_STATE: Record<string, { status: 'CONFIRMADO' | 'PENDENTE' | 'DESATUALIZADO' | 'CONFLITANTE'; evidence: string }>;
}

export class AstroMatrixCore {
  private static instance: AstroMatrixCore;

  public memory: AstroMemory = {
    // Contexto padrão da simulação; não representa memória persistida do usuário.
    CURRENT_CONTEXT: {
      activeSimulation: 'WorldBox God Sandbox',
      selectedRaces: ['human', 'elf', 'orc', 'dwarf'],
      mode: 'ASTRO HÍBRIDO: Gateway + Autonomia Controlada',
      deviceTarget: 'Termux / Android / Linux',
    },
    PREVIOUS_CONTEXT: {},
    PERSISTED_MEMORY: [],
    EXECUTION_HISTORY: [],
    PROJECT_STATE: {},
  };

  public antiQuota: AntiQuotaMetrics = {
    totalRequests: 0,
    totalTokensEstimate: 0,
    cacheHits: 0,
    http429Errors: 0,
    circuitBreakerState: 'CLOSED',
    concurrencyLimit: 1,
    activeRequests: 0,
    backoffDelayMs: 0,
    lastFailureTime: 0,
  };

  // Não inserir histórico fictício: tarefas surgem apenas por requisições reais.
  public tasks: AstroTask[] = [];

  public static getInstance(): AstroMatrixCore {
    if (!AstroMatrixCore.instance) {
      AstroMatrixCore.instance = new AstroMatrixCore();
    }
    return AstroMatrixCore.instance;
  }

  public registerRequest(tokens: number = 250, isCacheHit: boolean = false) {
    this.antiQuota.totalRequests++;
    if (isCacheHit) {
      this.antiQuota.cacheHits++;
    } else {
      this.antiQuota.totalTokensEstimate += tokens;
    }
  }

  public registerHttp429() {
    this.antiQuota.http429Errors++;
    this.antiQuota.circuitBreakerState = 'OPEN';
    this.antiQuota.lastFailureTime = Date.now();
    this.antiQuota.backoffDelayMs = Math.min(60000, (this.antiQuota.backoffDelayMs || 2000) * 2);
  }

  public getStatus() {
    // Check if circuit breaker can transition from OPEN to HALF_OPEN
    if (
      this.antiQuota.circuitBreakerState === 'OPEN' &&
      Date.now() - this.antiQuota.lastFailureTime > this.antiQuota.backoffDelayMs
    ) {
      this.antiQuota.circuitBreakerState = 'HALF_OPEN';
    }

    return {
      name: 'ASTRO MATRIX',
      core: 'ASTRO CORE PRO V10',
      status: 'DEGRADED',
      architecture: {
        identity: 'NOT_TESTED',
        memory: 'DEGRADED',
        context: 'NOT_TESTED',
        planner: 'NOT_CONFIGURED',
        orchestrator: 'NOT_CONFIGURED',
        router: 'NOT_CONFIGURED',
        providers: process.env.GEMINI_API_KEY ? 'NOT_TESTED' : 'NOT_CONFIGURED',
        tools: 'NOT_CONFIGURED',
        executor: 'NOT_CONFIGURED',
        auditor: 'NOT_CONFIGURED',
        observability: 'NOT_CONFIGURED',
        learning: 'NOT_CONFIGURED',
      },
      antiQuota: this.antiQuota,
      tasks: this.tasks,
      memory: this.memory,
      timestamp: Date.now(),
    };
  }
}

export const astroMatrix = AstroMatrixCore.getInstance();
