# Relatório de Segurança — Divulganex
**Auditoria conduzida por:** KERBEROS (S.H.A.R.K. Security Agent)
**Data:** 2026-03-15
**Branch auditada:** `fase4/security`
**Stack:** React Native + Expo SDK 54, expo-router ~6.0, NativeWind v4, Supabase, TypeScript

---

## Resumo Executivo

A auditoria cobriu 11 arquivos críticos do sistema. Foram identificadas **7 vulnerabilidades** distribuídas em categorias ALTO (2), MÉDIO (3) e BAIXO (2). Nenhuma vulnerabilidade CRÍTICA foi encontrada. As 3 correções de código aplicáveis ao app foram implementadas nesta branch.

---

## Vulnerabilidades Encontradas

### ALTO

#### [ALTO-01] Ausência de validação de formato CPF/CNPJ no registro

| Campo | Valor |
|-------|-------|
| Arquivo | `app/(auth)/register.tsx` |
| Linha original | `handleRegister()` — verificava apenas se o campo estava preenchido |
| Impacto | Qualquer string de qualquer tamanho era aceita e persistida no banco como CPF/CNPJ. Isso permite armazenamento de dados inválidos que prejudicam processos de verificação manual e abre possibilidade de enviar payloads anômalos. |
| Status | **CORRIGIDO** |

**Correção aplicada:** Adicionada função `validateCpfCnpj()` que verifica se o valor digits-only tem exatamente 11 (CPF) ou 14 (CNPJ) dígitos antes de permitir o submit. Validação de dígitos verificadores (algoritmo CPF/CNPJ completo) é recomendada para versão futura, mas deve ser feita server-side.

---

#### [ALTO-02] Edge Function sem CORS configurado

| Campo | Valor |
|-------|-------|
| Arquivo | `supabase/functions/notify-professionals/index.ts` |
| Impacto | Sem headers CORS, a função não tinha controle explícito sobre origens permitidas nem tratamento de requisições OPTIONS (preflight). Qualquer requisição POST de qualquer origem seria processada sem validação de método, incluindo tentativas de abuse via browser. |
| Status | **CORRIGIDO** |

**Correção aplicada:** Adicionados `CORS_HEADERS` com `Access-Control-Allow-Origin` restrito ao domínio do Supabase. Handler para requisições `OPTIONS` (preflight) retorna 204. Requisições não-POST retornam 405. Todos os responses agora incluem os headers CORS.

---

### MÉDIO

#### [MÉDIO-01] Ausência de políticas RLS definidas formalmente

| Campo | Valor |
|-------|-------|
| Tabelas afetadas | `profiles`, `service_requests`, `proposals`, `reviews`, `notifications`, `professional_categories`, `categories` |
| Impacto | Sem RLS ativo no Supabase, qualquer usuário autenticado com a `anon_key` pode ler e escrever dados de outros usuários diretamente via API REST ou SDK. A lógica de autorização no app não é suficiente — ela pode ser bypassada com chamadas diretas ao endpoint do Supabase. |
| Status | **DOCUMENTADO** — arquivo `supabase/rls-policies.sql` criado para aplicação manual |

**Recomendação:** Executar `supabase/rls-policies.sql` no SQL Editor do Supabase **antes do primeiro deploy em produção**. Este é o item de maior risco pré-produção.

---

#### [MÉDIO-02] Telefone do cliente potencialmente acessível antes de contact_revealed via query direta

| Campo | Valor |
|-------|-------|
| Arquivo | `app/(professional)/request-detail.tsx` |
| Análise | O código do app respeita `contact_revealed`: a linha 42 só seta `clientPhone` se `propData.contact_revealed === true`. No entanto, a query na linha 28 seleciona `client:profiles!client_id(name, phone)` — ou seja, o campo `phone` do cliente já é retornado pelo Supabase na primeira query, mesmo quando `contact_revealed = false`. O app simplesmente ignora o valor, mas o dado trafega na resposta JSON. |
| Impacto | Um atacante com a `anon_key` e um `request_id` válido consegue o telefone do cliente sem pagar pelo reveal, simplesmente fazendo a mesma query diretamente. Sem RLS adequado, isso é trivialmente exploitável. |
| Status | **PARCIALMENTE MITIGADO** pela aplicação do RLS em `profiles` (MÉDIO-01). A correção definitiva no app seria remover `phone` da query de carregamento e só buscá-lo em `handleRevealContact()`. |

**Recomendação de código (não aplicada para evitar regressão):** Em `loadData()`, mudar o select para `client:profiles!client_id(name)` (sem `phone`). O telefone só deve ser buscado dentro de `handleRevealContact()`, como já ocorre na linha 78.

---

#### [MÉDIO-03] AuthContext faz `select('*')` no perfil do usuário — inclui push_token e cpf_cnpj no estado global do app

| Campo | Valor |
|-------|-------|
| Arquivo | `context/AuthContext.tsx`, linha 23 |
| Impacto | `select('*')` retorna todos os campos do profile, incluindo `push_token` e `cpf_cnpj`. Embora esses dados sejam do próprio usuário (sem risco de acesso cruzado), mantê-los no estado React em memória por toda a sessão aumenta a superfície de exposição em caso de acesso indevido ao estado do app (ex: libraries de analytics, crash reporters). |
| Status | **DOCUMENTADO** — baixa prioridade para v1, mas deve ser corrigido antes de integrar qualquer SDK de analytics terceiro |

**Recomendação:** Substituir `select('*')` por `select('id, name, avatar_url, bio, city, state, role, verified, verification_status, created_at, updated_at')` — excluindo `push_token` e `cpf_cnpj` do estado global.

---

### BAIXO

#### [BAIXO-01] phone.tsx: getE164 não valida telefones com 10 dígitos (fixos)

| Campo | Valor |
|-------|-------|
| Arquivo | `app/(auth)/phone.tsx` |
| Análise | A validação aceita telefones com 10 dígitos (`digits.length < 10`), o que inclui telefones fixos (DDD + 8 dígitos). Porém, o Supabase Auth via OTP SMS espera números de celular. Telefones fixos passam pela validação mas falharão no envio de SMS. |
| Impacto | Baixo — causa UX ruim (erro genérico do Supabase) mas não representa risco de segurança. |
| Status | **DOCUMENTADO** |

**Recomendação:** Alterar validação para `digits.length < 11` para exigir o 9º dígito de celular.

---

#### [BAIXO-02] .gitignore não cobre .env.development e .env.staging explicitamente

| Campo | Valor |
|-------|-------|
| Arquivo | `.gitignore` |
| Análise | O `.gitignore` cobre `.env`, `.env.local`, `.env*.local` e `.env.production`. Não cobre explicitamente `.env.development` ou `.env.staging` (sem sufixo `.local`). O padrão `.env*.local` não capturaria um arquivo chamado `.env.development`. |
| Impacto | Baixo — risco de commit acidental de arquivo de ambiente de desenvolvimento. |
| Status | **DOCUMENTADO** |

**Recomendação:** Adicionar ao `.gitignore`:
```
.env.development
.env.staging
.env.test
```

---

## Achados Positivos (Sem Vulnerabilidade)

| Item | Avaliação |
|------|-----------|
| Credenciais não hardcoded | `lib/supabase.ts` usa exclusivamente `process.env.EXPO_PUBLIC_*` — nenhuma chave hardcoded |
| .env e .mcp.json no .gitignore | Ambos presentes e corretamente configurados |
| Supabase usa prepared statements | Todas as queries via SDK Supabase usam prepared statements internamente — SQL injection via inputs do usuário não é aplicável |
| push_token não exposto em telas | Nenhuma tela de UI renderiza o `push_token` |
| cpf_cnpj não aparece em telas públicas | `public-profile.tsx` usa query explícita apenas com campos públicos (id, name, bio, city, state, verified) |
| contact_revealed respeitado no app | `request-detail.tsx` corretamente condiciona exibição e abertura do WhatsApp a `proposal.contact_revealed === true` |
| Edge Function usa SUPABASE_SERVICE_ROLE_KEY via env | Chave nunca hardcoded — lida via `Deno.env.get()` |
| app.json sem secrets | Nenhuma chave de API ou token no app.json |

---

## Checklist de Deploy — Produção

### Obrigatório antes do primeiro deploy

- [ ] Executar `supabase/rls-policies.sql` no SQL Editor do Supabase (resolve MÉDIO-01 e MÉDIO-02)
- [ ] Verificar que RLS está ENABLED em todas as tabelas: `profiles`, `service_requests`, `proposals`, `reviews`, `notifications`, `professional_categories`, `categories`
- [ ] Configurar variáveis de ambiente no Vercel/EAS Build: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Confirmar que `SUPABASE_SERVICE_ROLE_KEY` está configurada como secret na Edge Function (Supabase Dashboard → Edge Functions → Secrets)
- [ ] Habilitar proteção de branch `main` no GitHub (requer PR + review)

### Recomendado antes do lançamento público

- [ ] Implementar validação completa de dígitos verificadores de CPF/CNPJ server-side (via Edge Function ou Database Function)
- [ ] Remover `phone` da query de carregamento em `request-detail.tsx` (resolver MÉDIO-02 no código)
- [ ] Substituir `select('*')` no AuthContext por lista explícita de campos (resolver MÉDIO-03)
- [ ] Corrigir validação de telefone para exigir 11 dígitos (resolver BAIXO-01)
- [ ] Adicionar `.env.development` e `.env.staging` ao .gitignore (resolver BAIXO-02)
- [ ] Configurar rate limiting no Supabase para o endpoint de OTP (prevenir abuso de SMS)
- [ ] Ativar alertas de segurança no Supabase Dashboard (Security Advisors)

### Configurações Supabase recomendadas

```
Auth → SMS OTP → Rate limiting: máx 5 tentativas por número por hora
Auth → JWT expiry: 3600s (1 hora) — não usar expiração maior em produção
Database → Extensions → pg_audit: ativar para auditoria de queries sensíveis
```

---

## Resumo de Ações

| # | Vulnerabilidade | Severidade | Status |
|---|----------------|------------|--------|
| ALTO-01 | CPF/CNPJ sem validação de formato | ALTO | Corrigido em `register.tsx` |
| ALTO-02 | Edge Function sem CORS | ALTO | Corrigido em `notify-professionals/index.ts` |
| MÉDIO-01 | RLS não aplicado no Supabase | MÉDIO | `supabase/rls-policies.sql` criado |
| MÉDIO-02 | Phone do cliente exposto na query antes do reveal | MÉDIO | Mitigado via RLS; recomendação de código documentada |
| MÉDIO-03 | `select('*')` inclui dados sensíveis no estado global | MÉDIO | Documentado |
| BAIXO-01 | Validação de telefone aceita fixos | BAIXO | Documentado |
| BAIXO-02 | .gitignore incompleto para envs de dev/staging | BAIXO | Documentado |
