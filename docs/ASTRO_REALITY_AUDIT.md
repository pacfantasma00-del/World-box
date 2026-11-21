# ASTRO — baseline de realidade e migração

Data da inspeção: 2026-11-21  
Repositório: `pacfantasma00-del/World-box`  
Base examinada: branch `main`  
Branch desta auditoria: `astro/real-execution-baseline`

## Escopo e limite

Esta auditoria é estática: os arquivos foram lidos pela API do GitHub. Nenhum build, teste automatizado, chamada de pagamento, execução de agente ou deploy foi realizado nesta inspeção. Portanto, os achados abaixo descrevem o comportamento visível no código, não um teste de produção.

## Achados confirmados no código

### 1. O endpoint de tarefas declara conclusão sem executar o plano

Arquivo: `server.ts`, rota `POST /api/astro/task`.

A rota constrói um objeto com `status: 'CONCLUÍDA'`, `attempts: 1`, evidência textual genérica e resultado de verificação positivo imediatamente. Não há execução dos passos do plano, chamada de ferramenta, verificação externa ou persistência antes da resposta.

**Classificação:** comportamento simulado / conclusão não comprovada.  
**Correção necessária:** iniciar em `RECEBIDA`; avançar estados somente após cada etapa real; anexar saída verificável; registrar falhas sem convertê-las em sucesso.

### 2. A memória e o estado do núcleo são voláteis

Arquivo: `src/astro/matrix.ts`.

O núcleo mantém `memory`, `antiQuota` e `tasks` em propriedades de objetos e arrays em memória do processo. O arquivo contém valores iniciais estáticos e históricos predefinidos. Não há, neste módulo, adaptador de banco, escrita em disco ou recuperação após reinício.

**Classificação:** memória em processo; persistência durável não demonstrada.  
**Correção necessária:** definir contrato de armazenamento e implementar um adaptador persistente com migrações, leitura na inicialização e testes de reinício.

### 3. Os rótulos das 12 camadas não comprovam implementação

Arquivo: `src/astro/matrix.ts`, método `getStatus()`.

O retorno marca como `CONFIRMADO` todos os componentes de arquitetura, embora o módulo exposto seja essencialmente um estado em memória, contadores simples e uma lista de tarefas. O próprio objeto de status não executa testes de capacidade.

**Classificação:** telemetria declarativa; não é evidência de funcionamento.  
**Correção necessária:** cada capacidade deve reportar `ONLINE`, `DEGRADED`, `NOT_CONFIGURED` ou `NOT_TESTED` com prova técnica associada.

### 4. O fluxo Pix contém caminho local de simulação

Arquivo: `server.ts`, rotas `/api/nexus/pix-charge`, `/api/nexus/charge-status/:chargeId` e `/api/nexus/simulate-payment/:chargeId`; interface em `src/components/PixModal.tsx`.

Se não houver resposta utilizável do upstream, a rota cria um código local por `generatePixBrCode()`. O status da cobrança é guardado em um `Map` local e a rota `POST /api/nexus/simulate-payment/:chargeId` altera diretamente o status para `completed`. A interface interpreta esse estado como pagamento confirmado e aplica benefícios no jogo. O QR visual mostrado no componente é desenhado por SVG estático, não renderizado a partir do payload Pix.

**Classificação:** confirmação simulável; liquidação bancária não comprovada.  
**Correção necessária:** em produção, remover ou bloquear a rota de simulação; aceitar confirmação somente por webhook autenticado/consulta oficial do provedor; validar assinatura, valor, moeda, identificador e idempotência; gerar QR a partir do payload efetivamente retornado pelo provedor. Nunca conceder benefícios com base em estado local manipulável.

### 5. Porta fixa dificulta a execução portátil

Arquivo: `server.ts`, inicialização do Express.

O servidor declara `const PORT = 3000` em vez de ler `process.env.PORT`. O bind em `0.0.0.0` já está presente. Cloud Run injeta `PORT` no container de entrada e exige que o processo escute nesse valor.

**Classificação:** incompatibilidade de configuração para implantação padrão no Cloud Run.  
**Correção mínima:** usar `Number(process.env.PORT || 3000)`, validar faixa/valor e manter o bind em `0.0.0.0`.

### 6. Fallbacks de IA podem ser confundidos com inferência real

Arquivo: `server.ts`, rotas `/api/generate-lore` e `/api/unit-mind-monologue`.

Sem `GEMINI_API_KEY`, as rotas devolvem conteúdo gerado localmente e indicam origem simulada ou fallback em parte das respostas. A resposta de fallback não deve ser contabilizada como chamada bem-sucedida ao modelo.

**Classificação:** fallback de conteúdo; inferência externa não garantida.  
**Correção necessária:** padronizar metadados `provider`, `mode`, `model`, `fallback` e `requestId`; manter status HTTP e logs coerentes com o resultado.

## Ordem de correção proposta

1. Corrigir o contrato de execução: nenhuma tarefa pode ser marcada concluída sem execução e verificação.
2. Corrigir configuração de runtime: `PORT`, encerramento gracioso e endpoint de saúde que reporte dependências reais.
3. Isolar o simulador WorldBox da camada ASTRO; não tratar estado do jogo como núcleo de agentes.
4. Implementar persistência explícita e testável para tarefas, memória e eventos.
5. Colocar pagamentos em modo seguro até existir integração real validada por webhook do provedor.
6. Criar contratos de ferramentas e provedores com timeout, autorização, limites, logs e evidências.
7. Adicionar testes automatizados para cada capacidade e pipeline de build/deploy.
8. Implantar primeiro em ambiente de staging; comparar health checks, logs e comportamento antes de qualquer troca de tráfego.

## Requisitos específicos de Cloud Run

- Escutar em `0.0.0.0:$PORT`.
- Não depender do filesystem gravável do container para dados duráveis: ele é efêmero e consome memória.
- Persistir dados em serviço externo (por exemplo, banco gerenciado ou object storage).
- Implementar encerramento gracioso e reconexão de conexões externas.
- Separar API HTTP de workers assíncronos quando tarefas excederem o ciclo de uma requisição.

Referência oficial: https://docs.cloud.google.com/run/docs/container-contract  
Referência oficial: https://docs.cloud.google.com/run/docs/migrate/a-web-service

## Estado desta branch

- [x] Auditoria estática inicial documentada.
- [ ] Correções de código revisadas e testadas.
- [ ] Build e testes executados.
- [ ] Staging implantado e validado.
- [ ] Produção migrada.

**Nenhuma alteração foi feita na branch `main` e nenhum deploy foi realizado.**
