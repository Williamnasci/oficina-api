# Análise de Vulnerabilidades

## Objetivo

Este documento registra a análise de segurança realizada na Fase 2 do Tech Challenge, com foco em dependências, imagem Docker, pipeline de CI/CD, observabilidade e práticas de hardening aplicadas ao backend da Oficina Mecânica. Reexecutado e atualizado na Fase 3 (ver seção "Reexecução — 2026-08-20" abaixo); a análise original de julho/2026 permanece preservada como registro histórico.

## Escopo e Premissas Acadêmicas

Este é um projeto acadêmico executado em ambiente controlado e acessado somente pelo autor e pelos avaliadores. As credenciais presentes no Docker Compose, nos manifests Kubernetes e nos exemplos Terraform são exclusivamente demonstrativas e não devem ser reutilizadas em ambientes reais.

O login administrativo simplificado, a exposição local de métricas e os scans não bloqueantes foram adotados para demonstrar os conceitos da fase sem introduzir complexidade operacional incompatível com o escopo. As recomendações de produção deste documento registram as adaptações necessárias para um ambiente público ou corporativo.

## Ferramentas Utilizadas

* Trivy Scanner
* npm audit
* GitHub Actions

## Contexto Atual

A aplicação utiliza Node.js 22 e o Dockerfile atual é baseado em:

```dockerfile
FROM node:22-alpine
```

O build da imagem Docker e os scans Trivy são executados no workflow `.github/workflows/ci-cd.yml`.

## Resultado Geral

Os scans podem registrar vulnerabilidades transitivas relacionadas a dependências indiretas do ecossistema Node.js. Esses achados devem ser reconhecidos e acompanhados, pois podem representar risco dependendo do contexto de exposição da aplicação.

### Resultado da execução local (Julho/2026)

Execução completa com Docker ativo: `npm audit`, `npm run scan:vuln:report` (Trivy filesystem) e `npm run scan:image` (Trivy na imagem `app-local`).

| Ferramenta | HIGH | CRITICAL | MODERATE/MEDIUM | LOW |
|------------|------|----------|------------------|-----|
| `npm audit` | 0 | 0 | 3 | 0 |
| Trivy filesystem (`package-lock.json`) | 0 | 0 | 1 | 0 |
| Trivy imagem (`app-local`) | 0 | 0 | 1 | 0 |

Todas as ferramentas convergem para o mesmo achado remanescente: a dependência transitiva `@hono/node-server` (via ecossistema Prisma), classificada como MODERATE/MEDIUM.

### Correções aplicadas nesta revisão

Antes da correção, o cenário era: `npm audit` com 4 HIGH / 5 MODERATE / 1 LOW; Trivy filesystem com 2 HIGH / 7 MEDIUM; Trivy imagem com 4 HIGH / 12 MEDIUM. As duas ações abaixo eliminaram todos os achados HIGH sem quebrar build ou testes (63 suítes / 216 testes revalidados após cada mudança):

1. **`npm audit fix`** (sem `--force`, sem mudança breaking): atualizou `multer`, `hono`, `form-data` e `js-yaml` para versões corrigidas. Resolveu os avisos HIGH de `multer` (negação de serviço via nomes de campo aninhados e limpeza incompleta de uploads — [GHSA-72gw-mp4g-v24j](https://github.com/advisories/GHSA-72gw-mp4g-v24j), [GHSA-3p4h-7m6x-2hcm](https://github.com/advisories/GHSA-3p4h-7m6x-2hcm)), `hono` e `form-data`, e o MODERATE de `js-yaml` ([GHSA-h67p-54hq-rp68](https://github.com/advisories/GHSA-h67p-54hq-rp68)).
2. **Atualização do `npm` global na imagem Docker** (`Dockerfile`, estágio final: `npm install -g npm@latest` antes do `npm ci --omit=dev`): o Trivy identificou `picomatch@4.0.3` ([CVE-2026-33671](https://avd.aquasec.com/nvd/cve-2026-33671), HIGH) e `sigstore@3.1.0` ([CVE-2026-48815](https://avd.aquasec.com/nvd/cve-2026-48815), HIGH) na imagem — investigação mostrou que essas versões não são dependências do projeto (não aparecem em `npm ls` nem no `package-lock.json`), e sim pacotes vendorizados dentro do próprio npm CLI (`/usr/local/lib/node_modules/npm`) que já vem embutido na imagem base `node:22-alpine`. Atualizar o npm global para a versão mais recente (`10.9.8` → `12.0.1`) já traz esses pacotes internos corrigidos, sem qualquer alteração nas dependências da aplicação.

### Achado remanescente (risco aceito)

* Dependência transitiva `@hono/node-server` (via `@prisma/dev`), introduzida pelo ecossistema Prisma: vulnerabilidade MODERATE/MEDIUM de bypass de middleware por barras repetidas em `serveStatic` ([CVE-2026-39406](https://avd.aquasec.com/nvd/cve-2026-39406)).
  * A correção exigiria `npm audit fix --force`, que instalaria `prisma@6.19.3` — downgrade incompatível com a versão de Prisma (`7.8.0`) utilizada pelo projeto.
  * Risco aceito para o contexto acadêmico do Tech Challenge; item de acompanhamento para quando o Prisma publicar uma versão estável compatível com o `@hono/node-server` corrigido.

## Reexecução — 2026-08-20 (Fase 3)

A análise foi reexecutada do zero nesta data, como parte de uma auditoria de documentação da Fase 3 (não uma rotina agendada) — a base de vulnerabilidades do Trivy estava desatualizada desde junho/2026 e foi atualizada antes do scan.

### Resultado antes da correção

| Ferramenta | HIGH | CRITICAL | MODERATE/MEDIUM | LOW |
|------------|------|----------|------------------|-----|
| `npm audit` (produção) | 6 | 0 | 4 | 1 |
| Trivy filesystem (`package-lock.json`) | 5 | 0 | 6 | 0 |
| Trivy imagem (`oficina-tech-challenge`) | 8 | 0 | 12 | 0 |

Bem acima do que a execução de julho havia registrado (0 HIGH em todas as ferramentas) — a divergência é esperada: 6 semanas sem reauditoria, mais dependências novas da Fase 3 (`dd-trace`, `nestjs-pino`, `@nestjs/swagger` mais recente).

### Correção aplicada

**`npm audit fix`** (sem `--force`, sem mudança breaking): atualizou 47 pacotes, removeu 6, alterou 38 (`package-lock.json`; `package.json` não mudou — todos os bumps couberam nos ranges semver já declarados). Revalidado com sucesso após `npx prisma generate`: `npm run build`, `npx tsc --noEmit` e a suíte completa (**65 suítes / 232 testes**, entre unitários e integração).

### Resultado após a correção

| Ferramenta | HIGH | CRITICAL | MODERATE/MEDIUM | LOW |
|------------|------|----------|------------------|-----|
| `npm audit` (produção) | 3 | 0 | 0 | 0 |
| Trivy filesystem (`package-lock.json`) | 1 | 0 | 0 | 0 |
| Trivy imagem (`oficina-tech-challenge`) | 4 | 0 | 6 | 0 |

### Achado remanescente (risco aceito)

* **Cadeia `prisma` / `@prisma/config` / `deepmerge-ts`**: `deepmerge-ts` tem uma vulnerabilidade HIGH de esgotamento de pilha (stack exhaustion) ao mesclar grafos de objeto recursivos — [GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx). `@prisma/config` depende de uma versão vulnerável, e `prisma` depende de `@prisma/config`.
  * A correção exigiria `npm audit fix --force`, que instalaria `prisma@6.12.0` — downgrade de versão major incompatível com a versão em uso (`^7.8.0`), com risco real de quebrar geração de client, migrations ou o schema atual.
  * Risco aceito para o contexto acadêmico do Tech Challenge; item de acompanhamento para quando o ecossistema Prisma publicar uma versão 7.x estável que não dependa mais da versão vulnerável de `deepmerge-ts`.
* Os achados adicionais reportados pelo Trivy na imagem (`brace-expansion`, `ip-address`, e possíveis outros não detalhados aqui) têm correção disponível via `npm audit fix` já aplicada nesta rodada, exceto os listados acima — reexecutar `trivy image` após qualquer atualização futura de dependências para confirmar.

## Mitigações Implementadas

* Dockerfile baseado na imagem oficial `node:22-alpine`.
* Execução da aplicação como usuário não root (`USER node`).
* Exposição apenas das portas necessárias nos containers.
* JWT obrigatório via variável de ambiente.
* Helmet aplicado na aplicação.
* Validação de entrada com `ValidationPipe`.
* Endpoint `/metrics` sem exposição de dados sensíveis, disponibilizando apenas métricas técnicas agregadas.
* Separação arquitetural entre domínio, aplicação, interfaces e infraestrutura.
* Scan Trivy automatizado no GitHub Actions para imagem Docker e filesystem.
* Health checks para API e banco de dados.
* Monitoramento via Prometheus e Grafana para métricas operacionais da aplicação.

## GitHub Actions

O workflow de CI/CD executa:

* Build da aplicação.
* Testes automatizados.
* Docker build.
* Docker push apenas na branch `main` e fora de Pull Requests.
* Scan Trivy da imagem Docker.
* Scan Trivy do filesystem.
* Renderização dos manifests Kubernetes com Kustomize, como verificação sintática básica.

O Trivy está configurado com `exit-code: '0'`. Portanto, os scans têm finalidade informativa e educacional: registram os achados no log, mas não atuam como gate de publicação ou deploy nesta fase acadêmica.

## Recomendações para Produção

Antes de utilização em ambiente produtivo, recomenda-se executar nova auditoria de dependências:

```bash
npm audit
```

Também é recomendado reexecutar os scans locais:

```bash
npm run scan:vuln
npm run scan:image
```

Para validação direta do filesystem com Trivy:

```bash
trivy fs .
```

Adicionalmente, recomenda-se:

* Revisão periódica das dependências e atualização controlada de versões.
* Acompanhamento dos avisos de segurança do ecossistema Node.js e Prisma.
* Revisão periódica dos relatórios Trivy.
* Definição de política formal para tratamento de vulnerabilidades.
* Integração futura com ferramentas de gestão de segredos para ambientes produtivos.

## Conclusão

A postura de segurança implementada está adequada ao contexto acadêmico do Tech Challenge e alinhada aos objetivos da Fase 2.

As validações executadas demonstraram:

* Nenhuma vulnerabilidade HIGH ou CRITICAL foi detectada por `npm audit`, Trivy filesystem ou Trivy imagem na execução local de julho de 2026, após as correções aplicadas (`npm audit fix` e atualização do `npm` global na imagem Docker).
* Pipeline automatizada com verificação de segurança.
* Hardening básico da aplicação e dos containers.
* Monitoramento operacional da aplicação através de Prometheus e Grafana.
* Processo de validação contínua suportado por testes automatizados e análise de vulnerabilidades: build, suíte completa (63 suítes / 216 testes) e health check via Docker Compose foram revalidados após cada correção de dependência.

A única vulnerabilidade remanescente (`@hono/node-server`, MODERATE/MEDIUM) é transitiva, conhecida e sem correção não destrutiva disponível no momento — depende de uma versão do Prisma incompatível com a utilizada pelo projeto. Ela foi registrada como risco aceito para esta entrega e permanece como item de acompanhamento. Essa aceitação não deve ser transportada automaticamente para um ambiente produtivo, e a dependência deve ser reauditada periodicamente à medida que novas versões estáveis do Prisma forem publicadas.

**Nota (2026-08-20):** a conclusão acima descreve o estado de julho/2026, preservado como registro histórico. A reauditoria da Fase 3 (ver "Reexecução — 2026-08-20" acima) encontrou um cenário bem pior antes da correção (até 8 HIGH), a maior parte resolvida sem breaking change via `npm audit fix`. O achado remanescente hoje não é mais o `@hono/node-server` de julho (esse foi resolvido nesta rodada) — é a cadeia `prisma`/`@prisma/config`/`deepmerge-ts` (HIGH), pelo mesmo motivo estrutural: só corrige com downgrade incompatível do Prisma. A recomendação prática é a mesma de julho — reauditar periodicamente, não perpetuar a aceitação em produção.
