# Relatório de QA — Auditoria Ravena
**Data:** 2026-03-15
**Branch:** fase4/qa
**Agente:** RAVENA

---

## Resumo Executivo

Auditoria completa de UI/UX, fluxos de navegação, estados de loading/erro e consistência visual do app Divulganex (React Native + Expo SDK 54 + NativeWind v4 + Supabase).

**Total de problemas encontrados:** 10
**Problemas corrigidos:** 10
**Pendências futuras:** 4

---

## Problemas Encontrados e Correções Aplicadas

### 1. [CRÍTICO] Botão "Reenviar código" sem handler — `app/(auth)/otp.tsx`
**Problema:** O `TouchableOpacity` do reenvio de código tinha `onPress` vazio. O usuário clicava e nada acontecia.
**Correção:** Implementado handler inline que chama `supabase.auth.signInWithOtp({ phone })` e exibe Alert de sucesso ou erro.

---

### 2. [CRÍTICO] Login com número não cadastrado redirecionava para registro errado — `app/(auth)/otp.tsx`
**Problema:** O botão "Já tenho conta" na welcome passava `role: 'client'` forçado. Se o usuário digitasse um número não cadastrado, era mandado para o cadastro como cliente sem escolher.
**Correção:**
- `welcome.tsx`: botão "Já tenho conta" agora passa `role: 'login'` em vez de `role: 'client'`
- `phone.tsx`: tipo de role atualizado para aceitar `'login'`; título e subtítulo adaptados para contexto de login
- `otp.tsx`: tipo de role atualizado; guard adicionado — se `role === 'login'` e não existe perfil, exibe Alert explicando que o número não possui cadastro, sem navegar para register

---

### 3. [ALTO] Tela de perfil do cliente minimalista — `app/(client)/profile.tsx`
**Problema:** A tela tinha apenas nome, cidade/estado e botão de sair. Faltava avatar visual, telefone, data de cadastro e identidade de papel.
**Correção:** Implementada tela completa com:
- Avatar circular com inicial do nome (cor `orange-100`)
- Badge de papel "Cliente"
- Card com localização, telefone (quando disponível) e data de cadastro formatada em pt-BR
- ScrollView para comportamento correto em telas pequenas
- Botão de sair mantido ao final

---

### 4. [ALTO] Sem SearchBar no home do cliente — `app/(client)/home.tsx`
**Problema:** Não havia campo de busca para filtrar os modos de serviço, conforme especificado na auditoria.
**Correção:** Adicionada SearchBar no topo com:
- Filtro local por título e descrição dos modos (sem chamada de rede)
- Ícone de busca e botão de limpar (✕) quando há texto
- Estado vazio com mensagem amigável quando nenhum resultado é encontrado
- Import de `useState` e `TextInput` adicionados

---

### 5. [ALTO] `loadCategories` sem tratamento de erro — `app/(client)/new-request.tsx`
**Problema:** Se a query ao Supabase falhasse, a lista de categorias ficava vazia silenciosamente. O usuário não conseguiria publicar um pedido sem feedback.
**Correção:** Adicionado tratamento de `error` com `Alert.alert` informando o usuário para tentar novamente.

---

### 6. [ALTO] `loadRequests` sem tratamento de erro — `app/(client)/my-requests.tsx`
**Problema:** Falha na query retornava array vazio sem informar o usuário.
**Correção:** Adicionado tratamento de `error` com `Alert.alert`. Import de `Alert` já estava presente.

---

### 7. [ALTO] `loadRequests` sem tratamento de erro — `app/(professional)/home.tsx`
**Problema:** Falha na query retornava lista vazia silenciosamente.
**Correção:** Adicionados tratamento de `error` e import de `Alert` ao arquivo.

---

### 8. [ALTO] `loadProposals` sem tratamento de erro — `app/(professional)/my-services.tsx`
**Problema:** Falha na query retornava lista vazia silenciosamente.
**Correção:** Adicionados tratamento de `error` e import de `Alert` ao arquivo.

---

### 9. [MÉDIO] `handleSave` sem tratamento granular de erros — `app/(professional)/profile.tsx`
**Problema:** As 3 operações Supabase (update bio, delete categorias, insert categorias) eram executadas com `await` simples sem verificar erros individuais. Uma falha silenciosa poderia corromper dados parcialmente.
**Correção:** Cada operação agora verifica `error` individualmente, interrompe o fluxo e exibe Alert específico por operação.

---

### 10. [MÉDIO] `handleRevealContact` sem tratamento de erro — `app/(professional)/request-detail.tsx`
**Problema:** Se a operação de `update` ou o `select` do telefone falhassem, a UI não refletia o erro. O estado `actionLoading` ficava `true` ou o contato não aparecia sem explicação.
**Correção:**
- Erro no `update` da proposta: interrompe com Alert
- Erro no `select` do telefone: mostra Alert de aviso (contato revelado no banco mas telefone não carregado), atualiza estado da proposta mesmo assim

---

## Verificações que Passaram (sem alteração necessária)

| Arquivo | Verificação | Status |
|---------|-------------|--------|
| `welcome.tsx` | SafeAreaView presente | OK |
| `phone.tsx` | SafeAreaView + loading state + Alert de erro | OK |
| `otp.tsx` | SafeAreaView + loading state + botão disabled | OK |
| `register.tsx` | SafeAreaView + loading state + Alert de erro | OK |
| `(client)/_layout.tsx` | Tabs configuradas, new-request e leave-review com `href: null` | OK |
| `(client)/home.tsx` | Parâmetro `mode` passado corretamente para new-request | OK |
| `(client)/new-request.tsx` | SafeAreaView + Voltar + loading state | OK |
| `(client)/my-requests.tsx` | SafeAreaView + loading state + pull-to-refresh | OK |
| `(client)/leave-review.tsx` | SafeAreaView + Voltar + loading state + Alert de erro | OK |
| `(professional)/_layout.tsx` | Tabs configuradas, request-detail e public-profile com `href: null` | OK |
| `(professional)/home.tsx` | SafeAreaView + loading state + pull-to-refresh + filtros | OK |
| `(professional)/request-detail.tsx` | SafeAreaView + Voltar + loading + not-found state | OK |
| `(professional)/my-services.tsx` | SafeAreaView + loading + pull-to-refresh | OK |
| `(professional)/profile.tsx` | SafeAreaView + loading state + Voltar implícito (tabs) | OK |
| `(professional)/public-profile.tsx` | SafeAreaView + Voltar + loading + not-found state | OK |
| `app/_layout.tsx` | AuthProvider wrapping correto | OK |
| `app/index.tsx` | Redirecionamento por role correto com loading state | OK |
| `context/AuthContext.tsx` | signOut limpa profile, refreshProfile disponível | OK |
| Padrão de cores | orange-500 como cor primária consistente em todo o app | OK |

---

## Itens para Atenção Futura

### F1. Edição de dados do perfil do cliente
A tela `(client)/profile.tsx` exibe os dados mas não permite editá-los (nome, cidade, estado). Considerar adicionar um botão de edição ou tela dedicada em fase futura.

### F2. Confirmação antes de sair da conta
O botão "Sair da conta" em ambos os perfis (cliente e profissional) dispara `signOut` imediatamente sem pedir confirmação. Recomenda-se adicionar um `Alert.alert` com botão de cancelar.

### F3. Expiração de pedidos na UI do cliente
O status `expired` existe no `STATUS_CONFIG` de `my-requests.tsx`, mas não há mecanismo client-side que atualize pedidos expirados. Isso deve ser tratado por um Edge Function no Supabase (via cron), o que está fora do escopo desta fase.

### F4. Acessibilidade (a11y)
Nenhuma tela utiliza props de acessibilidade (`accessibilityLabel`, `accessibilityRole`, `accessibilityHint`). Recomendado para fase de polimento antes do lançamento.
