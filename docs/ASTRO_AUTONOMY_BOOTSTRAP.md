# ASTRO — bootstrap operacional e autonomia controlada

Data: 2026-11-21
Repositório: pacfantasma00-del/World-box
Branch: astro/real-execution-baseline

## Objetivo
Estabelecer um protocolo operacional verificável para evoluir o ASTRO sem confundir especificação, configuração, execução e resultado. Este documento governa o trabalho nesta branch; não afirma que agentes autônomos já estejam em execução.

## Contrato de operação
1. Evidência antes de afirmação: toda capacidade aponta para teste, resposta HTTP, log, métrica ou artefato reproduzível.
2. Mudanças incrementais: preservar comportamento e dados existentes; preferir branch isolada e commits pequenos.
3. Sem sucesso simulado: mocks e fallbacks devem ser identificados e nunca registrados como execução real.
4. Auditoria separada: quem executa não aprova sozinho a própria conclusão.
5. Menor privilégio: ferramentas recebem apenas os escopos necessários.
6. Limites explícitos: timeout, orçamento, tamanho de entrada/saída, concorrência e tentativas configuráveis.
7. Segurança por padrão: segredos fora do código e logs; validação de entrada; autenticação/autorização nas rotas administrativas.
8. Persistência real: estado durável não depende da memória do processo nem do filesystem efêmero do container.
9. Recuperação: tarefas suportam idempotência, retry limitado, timeout e estado de falha recuperável.
10. Deploy controlado: staging, health check e smoke tests antes de qualquer promoção para produção.

## Autonomia por classe de ação
### Permitido sem confirmação adicional
- Ler e auditar arquivos, configurações, logs e métricas disponíveis.
- Pesquisar documentação técnica e comparar arquiteturas.
- Criar branch de trabalho e commits pequenos e reversíveis.
- Corrigir documentação, testes e código dentro da branch.
- Executar verificações não destrutivas em ambiente autorizado.
- Preparar scripts e manifests sem aplicá-los em produção.

### Exige autorização específica
- Deploy ou alteração de tráfego em produção.
- Alteração, rotação ou revogação de credenciais.
- Migração destrutiva, exclusão ou sobrescrita de dados.
- Provisionamento que gere cobrança ou altere faturamento.
- Pagamentos ou concessão de benefícios.
- Testes de segurança fora de ativos e ambientes explicitamente autorizados.

## Papéis-alvo
- ASTRO SUPERVISOR: recebe objetivo, define plano, orçamento e delegação; não declara conclusão.
- ASTRO RESEARCH: pesquisa somente leitura, registra fontes e incertezas.
- ASTRO ENGINEER: implementa em branch isolada e anexa diffs/testes.
- ASTRO SYSTEMS: inspeciona infraestrutura e observabilidade; leitura primeiro.
- ASTRO MEMORY: gerencia memória persistente com origem, data e escopo.
- ASTRO AUDITOR: verifica critérios e evidências de forma independente; não executa a tarefa auditada.
Todos os papéis permanecem SPECIFIED_NOT_IMPLEMENTED até existir runtime, ferramenta conectada, teste e evidência operacional correspondentes.

## Estados padronizados
ONLINE, OFFLINE, DEGRADED, UNAVAILABLE, NOT_CONFIGURED, NOT_TESTED.
Estados de tarefa: RECEBIDA → ANALISANDO → PLANEJADA → VALIDANDO → EXECUTANDO → VERIFICANDO → CONCLUÍDA, ou FALHOU.
Uma tarefa só pode ser CONCLUÍDA quando a execução foi realizada, evidências foram anexadas, critérios foram verificados, auditor independente registrou o resultado e o estado final foi persistido.

## Arquitetura-alvo
- Cloud Run: API stateless e escalável.
- Cloud SQL PostgreSQL: tarefas, eventos, memória e checkpoints duráveis.
- Cloud Tasks ou equivalente: execução assíncrona, retries e entrega controlada.
- Secret Manager: credenciais e chaves.
- LangGraph.js: orquestração com estado/checkpoints, após validar compatibilidade e custo.
- GitHub Actions: lint, testes, build e deploy em staging.
- Adaptadores de modelo: provedores intercambiáveis, sem acoplamento do núcleo a um único fornecedor.
A URL Cloud Run informada pelo usuário é um destino pretendido, não uma implantação verificada nesta auditoria. Não foi possível consultar o serviço nesta sessão; conectividade, revisão ativa, configuração e saúde permanecem NOT_TESTED.

## Sequência de implementação
1. Completar auditoria de rotas, especialmente pagamentos, autenticação e fallbacks.
2. Corrigir comportamentos simulados que possam aparentar execução ou pagamento real.
3. Adicionar testes unitários e de integração para API e ciclo de tarefas.
4. Criar contrato de persistência e migrações PostgreSQL.
5. Separar API e worker; adicionar fila, idempotência e retries.
6. Implementar autenticação, autorização, limites e auditoria de eventos.
7. Criar pipeline CI; executar testes e build em runner limpo.
8. Configurar staging Cloud Run e dependências gerenciadas.
9. Validar health, logs, smoke tests, persistência após reinício e rollback.
10. Promover produção somente após aprovação específica.

## Registro de evidência
Cada avanço registra data/hora, branch e commit, arquivos alterados, comandos/testes realmente executados, saída/resultado, limitações e itens não testados.

## Estado inicial deste bootstrap
- Branch de trabalho: existente.
- Auditoria estática: registrada.
- Ciclo de tarefa com bloqueio de conclusão sem evidência: implementado no código, testes ainda não executados nesta sessão.
- Runtime de agentes: não configurado.
- Persistência durável: não configurada.
- Pipeline CI/CD: não verificado.
- Cloud Run: destino informado; acesso e estado não verificados.
- Produção: não alterada.