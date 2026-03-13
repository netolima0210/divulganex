# Divulganex — Constituição do Projeto

**Última atualização:** 2026-03-13

---

## Visão

O Divulganex é um marketplace de serviços focado no **Nordeste do Brasil**. Conecta clientes que precisam de ajuda a profissionais verificados que querem trabalhar — seja para uma micro-tarefa rápida ou um serviço especializado.

**Diferencial principal:** Dois modos coexistindo no mesmo app:
- **Modo Tarefa**: micro-tarefas rápidas (ficar na fila, buscar encomenda, levar carro à revisão)
- **Modo Profissional**: serviços especializados (eletricista, professor, psicólogo, pintor)

---

## Problema Resolvido

O GetNinjas e similares atendem o Nordeste de forma genérica e incompleta. Cidades do interior ficam desassistidas. Além disso, nenhuma plataforma brasileira cobre "micro-tarefas" do dia a dia — tarefas simples que qualquer pessoa pode fazer mas que ninguém organiza digitalmente.

---

## Público-Alvo

**Clientes:** Qualquer pessoa no Nordeste que precise de ajuda com tarefas do dia a dia ou serviços especializados. De classe C/D (serviços domésticos, reparos) a B (consultoria, aulas).

**Profissionais:** Autônomos e freelancers nordestinos que querem encontrar clientes sem pagar mensalidade. CPF ou CNPJ. Desde faxineiras e pedreiros até advogados e desenvolvedores.

---

## Estados Cobertos (lançamento)

Alagoas, Bahia, Ceará, Maranhão, Paraíba, Pernambuco, Piauí, Rio Grande do Norte, Sergipe.

---

## Estrutura de Telas

### Onboarding
- Splash screen
- Escolha de papel: "Quero contratar" | "Quero trabalhar"
- Cadastro/Login (telefone + OTP via SMS)
- Se profissional: upload de documentos para verificação

### Área do Cliente
- Home (busca + 10 categorias)
- Publicar pedido — Modo Tarefa
- Publicar pedido — Modo Profissional
- Meus pedidos (lista + status)
- Detalhe do pedido (propostas recebidas)
- Perfil público do profissional
- Deixar avaliação (estrelas + comentário)

### Área do Profissional
- Home/Feed (pedidos disponíveis na minha categoria e região)
- Filtros (categoria + estado/cidade)
- Detalhe do pedido
- Revelar contato do cliente (gratuito na v1)
- Meu perfil (editar, categorias de atuação)
- Histórico de serviços
- Notificações

### Telas Compartilhadas
- Configurações de conta
- Logout

---

## Categorias de Serviço (10 grupos)

| Categoria | Modo |
|-----------|------|
| Assistência Técnica | Profissional |
| Aulas | Profissional |
| Automóveis | Ambos |
| Consultoria | Profissional |
| Design e Tecnologia | Profissional |
| Eventos | Profissional |
| Moda e Beleza | Profissional |
| Reformas e Reparos | Ambos |
| Saúde | Profissional |
| Serviços Domésticos | Ambos |
| **Tarefas Rápidas** | Tarefa |

---

## Entidades de Dados

- **users** — conta de autenticação (Supabase Auth)
- **profiles** — dados pessoais + papel (cliente/profissional) + verificação
- **categories** — categorias de serviço
- **professional_categories** — categorias que cada profissional atende
- **service_requests** — pedidos publicados (modo: task | professional)
- **proposals** — interesse do profissional em um pedido
- **reviews** — avaliações após serviço
- **notifications** — fila de notificações push

---

## Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Mobile | React Native + Expo (iOS + Android) |
| Linguagem | TypeScript |
| Navegação | Expo Router |
| Estilização | NativeWind (Tailwind para RN) |
| Backend | Supabase (Auth + PostgreSQL + Storage + Realtime) |
| Push Notifications | Expo Notifications + FCM/APNs |
| Versionamento | GitHub |
| Deploy web (futuro) | Vercel |

---

## Monetização

- **v1 (lançamento):** 100% gratuito para todos. Objetivo: aquisição de usuários.
- **v2:** Comissão sobre serviços fechados. Pagamento processado dentro do app.
- O botão "Revelar Contato" será o ponto de monetização na v2.

---

## GitFlow

```
dev   → desenvolvimento ativo (Atlas trabalha aqui)
hml   → homologação (Ravena testa aqui)
main  → produção (Kerberos audita antes de cada merge)
```
