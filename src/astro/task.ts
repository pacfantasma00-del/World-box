import { randomUUID } from 'node:crypto';
import type { AstroTask } from './matrix';

type NewTaskInput = {
  goal: string;
  context: string;
  riskLevel: AstroTask['riskLevel'];
};

const allowedTransitions: Record<AstroTask['status'], AstroTask['status'][]> = {
  RECEBIDA: ['ANALISANDO'],
  ANALISANDO: ['PLANEJADA', 'FALHOU'],
  PLANEJADA: ['VALIDANDO', 'FALHOU'],
  VALIDANDO: ['EXECUTANDO', 'FALHOU'],
  EXECUTANDO: ['VERIFICANDO', 'FALHOU'],
  VERIFICANDO: ['CONCLUÍDA', 'FALHOU'],
  CONCLUÍDA: [],
  FALHOU: [],
};

export function createReceivedTask(input: NewTaskInput): AstroTask {
  const now = Date.now();
  return {
    id: `task_${randomUUID()}`,
    goal: input.goal,
    context: input.context,
    prerequisites: [],
    plan: [],
    authorizedTools: [],
    riskLevel: input.riskLevel,
    status: 'RECEBIDA',
    attempts: 0,
    evidence: [],
    verificationResult: 'PENDENTE: nenhuma execução ou verificação realizada.',
    nextAction: 'Classificar risco e elaborar plano.',
    createdAt: now,
  };
}

export function addTaskEvidence(task: AstroTask, evidence: string): void {
  const value = evidence.trim();
  if (!value) throw new Error('Evidência vazia não é permitida.');
  task.evidence.push(value.slice(0, 2000));
}

export function transitionTask(
  task: AstroTask,
  nextStatus: AstroTask['status'],
  verification?: { verifiedBy?: string; verificationResult?: string },
): AstroTask {
  if (!allowedTransitions[task.status].includes(nextStatus)) {
    throw new Error(`Transição inválida: ${task.status} -> ${nextStatus}`);
  }

  if (nextStatus === 'CONCLUÍDA') {
    if (task.status !== 'VERIFICANDO' || task.evidence.length === 0) {
      throw new Error('Conclusão exige estado VERIFICANDO e evidência.');
    }
    if (verification?.verifiedBy !== 'astro-auditor') {
      throw new Error('Conclusão exige verificação independente do astro-auditor.');
    }
    if (!verification.verificationResult?.trim()) {
      throw new Error('Resultado da verificação é obrigatório.');
    }
    task.verifiedBy = verification.verifiedBy;
    task.verificationResult = verification.verificationResult.trim().slice(0, 2000);
    task.completedAt = Date.now();
  }

  if (nextStatus === 'EXECUTANDO') task.attempts += 1;
  task.status = nextStatus;
  return task;
}
