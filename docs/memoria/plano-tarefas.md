# Plano de Tarefas — Divulganex
**Guardião:** Hades | **Executor:** Atlas | **Última atualização:** 2026-03-13

---

## FASE 01: FUNDAÇÃO

### Contexto
Construir a base sobre a qual tudo será erguido: projeto Expo inicializado, banco estruturado, autenticação por telefone funcionando e GitFlow configurado. Sem essa fase sólida, tudo que vem depois desmorona.

---

### TASK 01.1 — Inicializar Projeto Expo + Configurar GitFlow

**Pré-condições:**
- Node.js instalado (v18+)
- npm instalado
- Git instalado
- Conta GitHub criada

**Passos:**

```bash
# No diretório do projeto
cd "c:/Users/netol/OneDrive/Desktop/Projetos/Divulganex"

# Criar projeto Expo com template tabs (já inclui Expo Router)
npx create-expo-app@latest . -t tabs

# Instalar dependências base
npm install @supabase/supabase-js @react-native-async-storage/async-storage

# NativeWind v4
npm install nativewind
npm install --save-dev tailwindcss@3.3.2

# Expo extras
npx expo install expo-secure-store expo-image-picker expo-notifications expo-device expo-constants
```

**GitFlow:**
```bash
git init
git add .
git commit -m "feat: initialize Expo project with Expo Router + NativeWind"
git branch -M dev
# Criar repo no GitHub chamado "divulganex" e conectar:
git remote add origin https://github.com/SEU_USUARIO/divulganex.git
git push -u origin dev

# Criar branches hml e main
git checkout -b hml
git push -u origin hml
git checkout -b main
git push -u origin main
git checkout dev
```

**Critério de aceitação:** `npm run start` sem erros. Três branches no GitHub (dev, hml, main).

---

### TASK 01.2 — Configurar NativeWind + Fontes + Design Tokens

**tailwind.config.js:**
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#E85D04',
        'primary-dark': '#C44B02',
        'primary-light': '#FF8534',
        accent: '#1A1A2E',
        'accent-light': '#2D2D4E',
        surface: '#F2F0EB',
        border: '#E0DDD6',
      },
      fontFamily: {
        'display': ['BricolageGrotesque-Bold'],
        'body': ['PlusJakartaSans-Regular'],
        'body-medium': ['PlusJakartaSans-Medium'],
        'body-bold': ['PlusJakartaSans-Bold'],
      },
    },
  },
  plugins: [],
}
```

**Fontes a instalar:**
```bash
npx expo install expo-font @expo-google-fonts/bricolage-grotesque @expo-google-fonts/plus-jakarta-sans
```

**Critério de aceitação:** Classes Tailwind funcionando em um componente de teste.

---

### TASK 01.3 — Schema do Banco (Supabase)

**Migration SQL a aplicar via Supabase MCP:**

```sql
-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum de papéis
CREATE TYPE user_role AS ENUM ('client', 'professional');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE request_mode AS ENUM ('task', 'professional');
CREATE TYPE request_status AS ENUM ('open', 'in_progress', 'closed', 'expired');
CREATE TYPE proposal_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE service_type AS ENUM ('task', 'professional', 'both');

-- Perfis (extende o auth.users do Supabase)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  city TEXT,
  state TEXT,
  role user_role NOT NULL DEFAULT 'client',
  cpf_cnpj TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verification_status verification_status DEFAULT 'pending',
  verification_doc_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categorias de serviço
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  slug TEXT UNIQUE NOT NULL,
  type service_type NOT NULL DEFAULT 'professional',
  active BOOLEAN DEFAULT TRUE
);

-- Categorias do profissional
CREATE TABLE professional_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  professional_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE(professional_id, category_id)
);

-- Pedidos
CREATE TABLE service_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) NOT NULL,
  mode request_mode NOT NULL DEFAULT 'professional',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  deadline TEXT,
  status request_status DEFAULT 'open',
  proposals_count INTEGER DEFAULT 0,
  max_proposals INTEGER DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '48 hours')
);

-- Propostas
CREATE TABLE proposals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  request_id UUID REFERENCES service_requests(id) ON DELETE CASCADE NOT NULL,
  professional_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status proposal_status DEFAULT 'pending',
  contact_revealed BOOLEAN DEFAULT FALSE,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(request_id, professional_id)
);

-- Avaliações
CREATE TABLE reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reviewed_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  request_id UUID REFERENCES service_requests(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reviewer_id, request_id)
);

-- Notificações
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed das categorias
INSERT INTO categories (name, icon, slug, type) VALUES
  ('Assistência Técnica', '🔧', 'assistencia-tecnica', 'professional'),
  ('Aulas', '📚', 'aulas', 'professional'),
  ('Automóveis', '🚗', 'automoveis', 'both'),
  ('Consultoria', '💼', 'consultoria', 'professional'),
  ('Design e Tecnologia', '💻', 'design-tecnologia', 'professional'),
  ('Eventos', '🎉', 'eventos', 'professional'),
  ('Moda e Beleza', '💄', 'moda-beleza', 'professional'),
  ('Reformas e Reparos', '🏠', 'reformas-reparos', 'both'),
  ('Saúde', '❤️', 'saude', 'professional'),
  ('Serviços Domésticos', '🧹', 'servicos-domesticos', 'both'),
  ('Tarefas Rápidas', '⚡', 'tarefas-rapidas', 'task');
```

---

### TASK 01.4 — Row Level Security (RLS)

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_categories ENABLE ROW LEVEL SECURITY;

-- PROFILES: ver perfil próprio + perfis públicos de profissionais
CREATE POLICY "Perfil próprio completo" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Perfis de profissionais visíveis" ON profiles
  FOR SELECT USING (role = 'professional' AND verified = TRUE);

-- SERVICE_REQUESTS: cliente cria e gerencia os próprios; profissional vê pedidos abertos
CREATE POLICY "Cliente gerencia pedidos próprios" ON service_requests
  FOR ALL USING (auth.uid() = client_id);

CREATE POLICY "Profissional vê pedidos abertos" ON service_requests
  FOR SELECT USING (status = 'open' AND proposals_count < max_proposals);

-- PROPOSALS: profissional gerencia propostas próprias; cliente vê propostas dos seus pedidos
CREATE POLICY "Profissional gerencia propostas próprias" ON proposals
  FOR ALL USING (auth.uid() = professional_id);

CREATE POLICY "Cliente vê propostas dos seus pedidos" ON proposals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM service_requests sr
      WHERE sr.id = request_id AND sr.client_id = auth.uid()
    )
  );

-- REVIEWS: qualquer usuário autenticado pode ler; só o reviewer pode criar
CREATE POLICY "Reviews públicas para leitura" ON reviews
  FOR SELECT USING (TRUE);

CREATE POLICY "Reviewer cria avaliação" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- NOTIFICATIONS: só o dono vê e gerencia
CREATE POLICY "Notificações próprias" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- PROFESSIONAL_CATEGORIES: profissional gerencia as próprias; público lê
CREATE POLICY "Leitura pública de categorias do profissional" ON professional_categories
  FOR SELECT USING (TRUE);

CREATE POLICY "Profissional gerencia suas categorias" ON professional_categories
  FOR ALL USING (auth.uid() = professional_id);
```

---

### TASK 01.5 — Autenticação por Telefone

**lib/supabase.ts:**
```typescript
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

**.env.local (NUNCA commitar):**
```
EXPO_PUBLIC_SUPABASE_URL=https://SEU_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=SUA_ANON_KEY
```

**.gitignore (adicionar):**
```
.env.local
.env
*.vault
```

---

### TASK 01.6 — Telas de Onboarding

Telas a criar em `app/(auth)/`:
- `splash.tsx` — Logo Divulganex + animação simples
- `welcome.tsx` — "Quero contratar" | "Quero trabalhar"
- `login.tsx` — Input de telefone + botão enviar OTP
- `otp.tsx` — 6 dígitos + verificar
- `register-client.tsx` — Nome + confirmar
- `register-professional.tsx` — Nome + CPF/CNPJ + upload documento + categorias + estado

---

## FASE 02: CORE — CLIENTE
*(Detalhamento após conclusão da Fase 01)*

## FASE 03: CORE — PROFISSIONAL
*(Detalhamento após conclusão da Fase 02)*

## FASE 04: ENGAJAMENTO
*(Detalhamento após conclusão da Fase 03)*

## FASE 05: QUALIDADE E PRODUÇÃO
*(Ravena + Kerberos — detalhamento próximo ao fim)*
