import test from 'node:test';
import assert from 'node:assert/strict';
import { addTaskEvidence, createReceivedTask, transitionTask } from './task';

test('nova tarefa permanece recebida e sem evidência fabricada', () => {
  const task = createReceivedTask({ goal: 'Auditar repositório', context: '', riskLevel: 'LOW' });
  assert.equal(task.status, 'RECEBIDA');
  assert.equal(task.attempts, 0);
  assert.deepEqual(task.evidence, []);
  assert.equal(task.completedAt, undefined);
});

test('não permite marcar tarefa recebida como concluída', () => {
  const task = createReceivedTask({ goal: 'Teste', context: '', riskLevel: 'LOW' });
  assert.throws(() => transitionTask(task, 'CONCLUÍDA', {
    verifiedBy: 'astro-auditor',
    verificationResult: 'Aprovado',
  }), /Transição inválida/);
});

test('conclusão exige evidência e auditor independente', () => {
  const task = createReceivedTask({ goal: 'Teste', context: '', riskLevel: 'LOW' });
  transitionTask(task, 'ANALISANDO');
  transitionTask(task, 'PLANEJADA');
  transitionTask(task, 'VALIDANDO');
  transitionTask(task, 'EXECUTANDO');
  transitionTask(task, 'VERIFICANDO');
  assert.equal(task.attempts, 1);
  assert.throws(() => transitionTask(task, 'CONCLUÍDA', {
    verifiedBy: 'astro-supervisor',
    verificationResult: 'Aprovado',
  }), /astro-auditor/);
  addTaskEvidence(task, 'Teste automatizado executado com saída 0.');
  transitionTask(task, 'CONCLUÍDA', {
    verifiedBy: 'astro-auditor',
    verificationResult: 'Evidência conferida; critérios satisfeitos.',
  });
  assert.equal(task.status, 'CONCLUÍDA');
  assert.equal(task.verifiedBy, 'astro-auditor');
  assert.ok(task.completedAt);
});
