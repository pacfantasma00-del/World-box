# ASTRO — Arquitetura de agentes autônomos

Status: **PROPOSTA TÉCNICA DOCUMENTADA — NÃO IMPLANTADA**  
Data: 2026-11-21  
Branch: `astro/real-execution-baseline`

## Decisão arquitetural

Adotar uma arquitetura **Supervisor + especialistas**, com fluxo explícito e execução serial por padrão. O primeiro runtime recomendado é **LangGraph.js** porque o repositório existente é TypeScript/Node e LangGraph oferece grafos de estado, checkpoints, retomada, streaming e interrupções para aprovação humana. O núcleo deve manter interfaces próprias para modelos e ferramentas, evitando acoplamento irreversível a um provedor.

Documentação de referência:
- https://docs.langchain.com/oss/javascript/langgraph/overview
- https://docs.langchain.com/oss/javascript/langgraph/persistence
- https://docs.langchain.com/oss/javascript/langgraph/multi-agent
- https://developers.openai.com/api/docs/guides/agents/sdk
- https://developers.openai.com/api/docs/guides/agents/guardrails-approvals

A escolha é uma recomendação baseada na compatibilidade e nos requisitos atuais; não significa que o pacote já esteja instalado ou que exista agente em execução.

## Agentes essenciais

### 1. ASTRO SUPERVISOR — coordenador central
- Recebe o objetivo e identifica escopo, risco, restrições e critérios de aceite.
- Divide trabalho em subtarefas pequenas e seleciona o especialista adequado.
- Controla orçamento, prazo, número de iterações e chamadas a modelos.
- Mantém a propriedade da resposta final.
- Não executa diretamente ferramentas de alto impacto.
- Só declara conclusão após receber evidências e aprovação do Auditor.

### 2. ASTRO RESEARCH — pesquisa e inteligência
- Pesquisa documentação oficial, APIs, repositórios e fontes atuais.
- Compara alternativas, identifica versões, custos, limites e dependências.
- Registra URL, data de consulta, trecho/afirmação sustentada e nível de confiança.
- Separa FACT, INFERENCE, HYPOTHESIS e UNKNOWN.
- Não altera código nem sistemas externos.

### 3. ASTRO ENGINEER — engenharia de software
- Inspeciona estrutura, dependências, testes e contratos antes de editar.
- Implementa alterações pequenas em branch isolada.
- Mantém compatibilidade e evita reescritas desnecessárias.
- Executa testes disponíveis e registra comandos, códigos de saída e artefatos.
- Não faz merge ou deploy de produção sem autorização explícita.

### 4. ASTRO SYSTEMS — infraestrutura e operação
- Analisa runtime, deploy, rede, armazenamento, observabilidade, filas e custos.
- Gera plano de implantação, health checks, rollback e runbooks.
- Pode operar apenas em ambientes e escopos explicitamente autorizados.
- Não altera discos, partições, LVM, GRUB, firewall ou produção por iniciativa própria.

### 5. ASTRO MEMORY — conhecimento e continuidade
- Organiza fatos confirmados, preferências operacionais, decisões, projetos e histórico de tarefas.
- Separa memória de conversa, estado temporário de execução e conhecimento durável.
- Aplica proveniência, data, confiança, escopo e política de retenção.
- Não transforma inferências em fatos nem armazena segredos em texto claro.

### 6. ASTRO AUDITOR — segurança e verificação independente
- Revisa plano, permissões, resultados, diffs, testes e evidências.
- Procura simulação, falsa conclusão, dados inventados, vazamento de segredo e efeitos colaterais.
- Reprova evidência insuficiente e solicita correção.
- Não pode ser substituído pelo agente que executou a tarefa.
- Aprova a declaração de conclusão somente quando critérios objetivos forem satisfeitos.

## Fluxo de execução

1. Receber objetivo e gerar `task_id`.
2. Classificar risco e definir escopo, orçamento e critérios de aceite.
3. Supervisor cria plano com etapas e especialistas.
4. Auditor valida o plano e as permissões.
5. Especialista executa uma etapa por vez; ferramentas retornam saída estruturada.
6. Resultado é persistido como evento/checkpoint.
7. Auditor verifica a saída por testes, leitura independente ou consulta externa.
8. Se falhar, permitir correção limitada; após o limite, marcar `FALHOU` ou `BLOQUEADA`.
9. Supervisor comunica o resultado com evidências e itens não testados.

Não usar swarm livre na primeira versão. Delegação dinâmica e paralelismo ficam desabilitados inicialmente para controlar custo, concorrência e efeitos colaterais.

## Contrato de tarefa

Cada tarefa deve ter:
- `task_id`, `parent_task_id`, `created_at`, `updated_at`
- `goal`, `context_ref`, `owner_agent`, `assigned_agent`
- `risk_level`, `required_approvals`, `authorized_tools`
- `plan[]`, `acceptance_criteria[]`, `budget`, `deadline`
- `status`, `attempts`, `events[]`, `artifacts[]`
- `verification_status`, `verified_by`, `completed_at`

Estados permitidos:
`RECEBIDA` → `CLASSIFICANDO` → `PLANEJADA` → `AGUARDANDO_APROVACAO` (quando necessário) → `EXECUTANDO` → `VERIFICANDO` → `CONCLUÍDA`.

Estados de exceção: `BLOQUEADA`, `FALHOU`, `CANCELADA`, `EXPIRADA`.

É proibido criar diretamente uma tarefa em `CONCLUÍDA`. Só o verificador pode solicitar essa transição, e a transição deve exigir evidência associada.

## Política de risco e autorização

| Nível | Exemplos | Política |
|---|---|---|
| LOW | Pesquisa, leitura de arquivos, análise estática | Pode executar dentro do escopo autorizado |
| MEDIUM | Criar arquivos em branch, instalar dependência em sandbox | Revisão de diff e limites de recursos |
| HIGH | Alterar configuração de serviço, publicar versão, acessar dados sensíveis | Aprovação humana explícita antes da ação |
| CRITICAL | Pagamento real, exclusão/alteração irreversível, credenciais, partições/discos, produção crítica | Bloqueado por padrão; aprovação específica e controles adicionais |

A autorização para pesquisar não implica autorização para editar. A autorização para editar branch não implica autorização para merge ou deploy. A aprovação é vinculada à ação, alvo e parâmetros exatos.

## Registro e evidência

Cada chamada de ferramenta gera evento imutável com:
- identidade do agente e da ferramenta;
- argumentos validados (segredos redigidos);
- horário de início/fim;
- resultado e código de saída;
- referências aos artefatos;
- estado antes/depois;
- verificação independente.

Nunca registrar API keys, tokens, senhas, cookies ou conteúdo sensível integralmente.

## Provedores de modelos

Criar interface interna `ModelProvider` e adaptadores separados. O supervisor seleciona provedor conforme disponibilidade, custo, latência e política de dados. Modelos locais só podem ser usados quando o serviço local estiver realmente acessível e o teste de inferência for aprovado. Fallback deve retornar metadados explícitos e não pode ser contado como resposta do provedor primário.

## Persistência

Separar:
- Checkpoint do grafo e estado de tarefa: PostgreSQL em ambiente de produção.
- Memória durável do usuário/projeto: tabelas com proveniência e política de retenção.
- Artefatos: armazenamento de objetos, com hashes e controle de acesso.
- Cache: opcional, efêmero, nunca fonte autoritativa.
- Desenvolvimento local: SQLite apenas para testes e desenvolvimento; não confundir com alta disponibilidade.

## Segurança de ferramentas

- Lista de ferramentas permitidas por agente e por tarefa.
- Esquemas validados; rejeitar argumentos desconhecidos.
- Timeout, limite de saída, limite de chamadas e concorrência.
- Execução de código em sandbox isolada, sem credenciais montadas por padrão.
- Bloqueio de SSRF, acesso a metadados cloud, caminhos fora do workspace e comandos destrutivos.
- Segredos via secret manager/variáveis protegidas; nunca no repositório.
- Proteção contra prompt injection em páginas, arquivos e resultados de ferramentas: conteúdo recuperado é dado não confiável, não instrução.
- Aprovação humana para efeitos externos ou irreversíveis.

## Matriz inicial de capacidades

Todas as capacidades abaixo estão **NOT_CONFIGURED** no runtime novo até serem implementadas e testadas. A existência deste documento não ativa agentes.

| Capacidade | Estado inicial |
|---|---|
| Supervisor LangGraph.js | NOT_CONFIGURED |
| Research Agent | NOT_CONFIGURED |
| Engineer Agent | NOT_CONFIGURED |
| Systems Agent | NOT_CONFIGURED |
| Memory Agent | NOT_CONFIGURED |
| Auditor Agent | NOT_CONFIGURED |
| Persistência PostgreSQL | NOT_CONFIGURED |
| Checkpoint/recovery | NOT_CONFIGURED |
| Tool registry e sandbox | NOT_CONFIGURED |
| Guardrails e aprovações | NOT_CONFIGURED |
| Tracing e métricas | NOT_CONFIGURED |
| CI com testes de agente | NOT_CONFIGURED |

## Plano de implementação

### Fase 0 — Baseline
- Preservar branch principal.
- Confirmar lockfile, versão Node, scripts, testes e build.
- Corrigir endpoint de tarefa para não declarar conclusão sem execução.
- Remover status declarativo de camadas sem prova.

### Fase 1 — Runtime mínimo
- Adicionar LangGraph.js e validação de schemas.
- Implementar um supervisor e dois especialistas iniciais (Research e Auditor).
- Usar ferramenta somente de leitura no primeiro ciclo.
- Persistir checkpoint e eventos em PostgreSQL antes de habilitar tarefas longas.
- Criar endpoint de execução com estados reais e polling.

### Fase 2 — Engenharia e sistemas
- Adicionar Engineer e Systems em branch isolada.
- Ferramentas de leitura primeiro; escrita apenas em workspace de branch.
- Testes, diff e auditoria obrigatórios.

### Fase 3 — Memória e provedores
- Implementar contratos de memória e proveniência.
- Integrar provedores por adaptadores.
- Testar fallback, indisponibilidade, timeout e limite de custo.

### Fase 4 — Produção controlada
- CI, staging, health checks, tracing, alertas, backup e rollback.
- Testes de carga e recuperação.
- Só depois solicitar autorização separada para produção.

## Critérios de aceite mínimos

- Uma tarefa simples percorre estados reais e termina com artefato verificável.
- Reiniciar o processo não perde o checkpoint nem duplica efeitos externos.
- Falha de modelo/ferramenta resulta em estado de falha ou retomada, nunca sucesso fictício.
- Cada agente só enxerga as ferramentas necessárias.
- Auditor consegue reprovar uma tarefa e apontar evidência ausente.
- Testes cobrem limites de orçamento, timeout, prompt injection, autorização e idempotência.
- Métricas distinguem chamadas reais, cache, fallback e simulação de teste.

## Não realizado

Nenhum pacote foi instalado, nenhum agente foi iniciado, nenhum banco foi provisionado, nenhuma credencial foi criada e nenhum deploy foi feito. Esta especificação é o contrato de implementação para a próxima etapa.
