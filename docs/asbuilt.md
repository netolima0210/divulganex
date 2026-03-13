# Divulganex — As Built (Fonte de Verdade)

**Descrição:** Marketplace de serviços para o Nordeste do Brasil. Dois modos: Tarefas Rápidas + Serviços Profissionais. App mobile iOS + Android.
**Stack:** GitHub + Supabase + React Native + Expo + NativeWind
**Última atualização:** 2026-03-13 — Hades: Documentação estratégica criada. Atlas aguardando instrução de Fase 01.

---

## Roadmap de Implementação

---

### 🔵 FASE 01: FUNDAÇÃO
**Status:** `⏳ Aguardando`
**Progresso:** 0/7 tarefas (0%)

#### Tarefas:
- [ ] Inicializar projeto Expo com TypeScript
- [ ] Configurar Expo Router + NativeWind
- [ ] Criar repositório GitHub + configurar GitFlow (dev, hml, main)
- [ ] Criar projeto no Supabase + aplicar schema do banco
- [ ] Configurar RLS (Row Level Security) nas tabelas
- [ ] Implementar Auth por telefone + OTP (Supabase Auth)
- [ ] Telas de Onboarding (Splash + Escolha de papel + Login/Cadastro)

**Entrega testável:** Login com telefone funcionando. Escolha entre "cliente" e "profissional".
**Notas:** Windows 11. Bash disponível. Expo EAS para builds.
**Último trabalho:** —

---

### 🔵 FASE 02: CORE — CLIENTE
**Status:** `⏳ Aguardando`
**Progresso:** 0/6 tarefas (0%)

#### Tarefas:
- [ ] Home do cliente (busca + 10 categorias + banner Modo Tarefa)
- [ ] Formulário: Publicar pedido Modo Tarefa
- [ ] Formulário: Publicar pedido Modo Profissional
- [ ] Tela: Meus pedidos (lista + status)
- [ ] Tela: Detalhe do pedido (propostas recebidas)
- [ ] Fluxo de verificação do profissional (upload CPF/CNPJ + foto)

**Entrega testável:** Cliente consegue publicar pedido (Tarefa e Profissional) e visualizar as propostas recebidas.
**Notas:** —
**Último trabalho:** —

---

### 🔵 FASE 03: CORE — PROFISSIONAL
**Status:** `⏳ Aguardando`
**Progresso:** 0/5 tarefas (0%)

#### Tarefas:
- [ ] Feed de pedidos disponíveis (por categoria + região)
- [ ] Filtros: categoria + estado do Nordeste
- [ ] Tela: Detalhe do pedido (profissional)
- [ ] Ação: Revelar contato do cliente (gratuito na v1)
- [ ] Tela: Editar perfil profissional (categorias, bio, cidade, foto)

**Entrega testável:** Profissional vê pedidos compatíveis e consegue revelar o contato do cliente.
**Notas:** —
**Último trabalho:** —

---

### 🔵 FASE 04: ENGAJAMENTO
**Status:** `⏳ Aguardando`
**Progresso:** 0/4 tarefas (0%)

#### Tarefas:
- [ ] Push notifications (Expo + FCM/APNs) — novo pedido na categoria
- [ ] Sistema de avaliações (estrelas 1-5 + comentário)
- [ ] Perfil público do profissional (avaliações visíveis para clientes)
- [ ] Expiração automática de pedidos após 48h (Supabase Edge Function)

**Entrega testável:** Profissional recebe push quando cai pedido. Cliente consegue avaliar após serviço.
**Notas:** —
**Último trabalho:** —

---

### 🔴 FASE 05: QUALIDADE E PRODUÇÃO
**Status:** `⏳ Aguardando`
**Progresso:** 0/5 tarefas (0%)

#### Tarefas:
- [ ] QA completo por Ravena (todos os fluxos principais)
- [ ] Auditoria de segurança por Kerberos (RLS, exposição de dados, IDOR)
- [ ] Preparação para lojas (ícone, splash, screenshots, metadata)
- [ ] Build de produção via Expo EAS
- [ ] Publicação nas lojas (App Store + Google Play)

**Entrega testável:** App publicado nas lojas. Fluxo completo funcionando em dispositivo real.
**Notas:** —
**Último trabalho:** —

---

## Backups e Segurança

| Data | Tag | Tipo | Status |
|------|-----|------|--------|
| — | — | — | — |

---

## Histórico de Sessões

| Data | O que foi feito |
|------|----------------|
| 2026-03-13 | Shiva: descoberta + MoSCoW + design system. Hades: documentação estratégica criada. |
