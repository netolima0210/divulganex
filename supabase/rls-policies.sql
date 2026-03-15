-- =============================================================================
-- DIVULGANEX — Políticas de Row Level Security (RLS)
-- Gerado por KERBEROS (auditoria de segurança) em 2026-03-15
-- Aplicar via: Supabase Dashboard → SQL Editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ATENÇÃO: Execute este script completo em uma única transação.
-- Todas as tabelas já devem existir antes de rodar este script.
-- -----------------------------------------------------------------------------

-- =============================================================================
-- TABELA: profiles
-- =============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode ler perfis públicos
-- (nome, cidade, estado, bio, verificação — sem CPF/CNPJ, sem push_token, sem phone)
CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Usuário só pode inserir o próprio perfil
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Usuário só pode atualizar o próprio perfil
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Usuário não pode deletar perfis (apenas admin via service_role)
-- (nenhuma policy DELETE = bloqueado para todos os roles authenticated)


-- =============================================================================
-- TABELA: categories
-- =============================================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Categorias são públicas (somente leitura para todos autenticados)
CREATE POLICY "categories_select_all"
  ON categories FOR SELECT
  USING (auth.role() = 'authenticated');

-- Apenas service_role (admin) pode inserir/atualizar/deletar categorias


-- =============================================================================
-- TABELA: service_requests
-- =============================================================================
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- Cliente vê apenas os próprios pedidos
CREATE POLICY "service_requests_select_own_client"
  ON service_requests FOR SELECT
  USING (
    auth.uid() = client_id
  );

-- Profissional vê pedidos abertos no seu estado (para o feed de oportunidades)
-- Requer que o profissional tenha role = 'professional' no perfil
CREATE POLICY "service_requests_select_professional_feed"
  ON service_requests FOR SELECT
  USING (
    status = 'open'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'professional'
        AND profiles.state = service_requests.state
    )
  );

-- Apenas clientes autenticados podem criar pedidos para si mesmos
CREATE POLICY "service_requests_insert_own_client"
  ON service_requests FOR INSERT
  WITH CHECK (
    auth.uid() = client_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'client'
    )
  );

-- Cliente pode atualizar/fechar apenas os próprios pedidos
CREATE POLICY "service_requests_update_own_client"
  ON service_requests FOR UPDATE
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

-- Nenhum DELETE para service_requests (soft-delete via status = 'closed')


-- =============================================================================
-- TABELA: proposals
-- =============================================================================
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- Profissional vê apenas as próprias propostas
CREATE POLICY "proposals_select_own_professional"
  ON proposals FOR SELECT
  USING (auth.uid() = professional_id);

-- Cliente vê propostas dos próprios pedidos (para controle de quem demonstrou interesse)
CREATE POLICY "proposals_select_client_own_requests"
  ON proposals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM service_requests
      WHERE service_requests.id = proposals.request_id
        AND service_requests.client_id = auth.uid()
    )
  );

-- Profissional pode inserir proposta para pedidos abertos
CREATE POLICY "proposals_insert_professional"
  ON proposals FOR INSERT
  WITH CHECK (
    auth.uid() = professional_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'professional'
        AND profiles.verified = true
    )
    AND EXISTS (
      SELECT 1 FROM service_requests
      WHERE service_requests.id = proposals.request_id
        AND service_requests.status = 'open'
    )
  );

-- Profissional pode atualizar apenas suas próprias propostas
-- (ex: revelar contato, atualizar status)
CREATE POLICY "proposals_update_own_professional"
  ON proposals FOR UPDATE
  USING (auth.uid() = professional_id)
  WITH CHECK (auth.uid() = professional_id);

-- Nenhum DELETE para proposals


-- =============================================================================
-- TABELA: reviews
-- =============================================================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Avaliações são públicas para leitura (exibidas no perfil público do profissional)
CREATE POLICY "reviews_select_public"
  ON reviews FOR SELECT
  USING (auth.role() = 'authenticated');

-- Apenas quem criou a avaliação pode inserir
CREATE POLICY "reviews_insert_own"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    -- Garante que o reviewer é cliente e o reviewed é profissional
    AND EXISTS (
      SELECT 1 FROM profiles AS reviewer_profile
      WHERE reviewer_profile.id = auth.uid()
        AND reviewer_profile.role = 'client'
    )
    AND EXISTS (
      SELECT 1 FROM profiles AS reviewed_profile
      WHERE reviewed_profile.id = reviews.reviewed_id
        AND reviewed_profile.role = 'professional'
    )
    -- Rating deve ser entre 1 e 5
    AND reviews.rating BETWEEN 1 AND 5
  );

-- Avaliações são imutáveis (sem UPDATE, sem DELETE) após criação


-- =============================================================================
-- TABELA: notifications
-- =============================================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Usuário vê apenas as próprias notificações
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Usuário pode marcar como lida apenas as próprias notificações
CREATE POLICY "notifications_update_own_read"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    -- Apenas o campo `read` pode ser alterado pelo próprio usuário.
    -- Outros campos são gerenciados pelo service_role (Edge Functions).
  );

-- INSERT e DELETE de notifications: apenas service_role (Edge Functions)
-- Nenhuma policy de INSERT/DELETE = bloqueado para role authenticated


-- =============================================================================
-- TABELA: professional_categories
-- =============================================================================
ALTER TABLE professional_categories ENABLE ROW LEVEL SECURITY;

-- Leitura pública para todos autenticados (necessário para filtros de busca)
CREATE POLICY "professional_categories_select_all"
  ON professional_categories FOR SELECT
  USING (auth.role() = 'authenticated');

-- Profissional gerencia apenas as próprias categorias
CREATE POLICY "professional_categories_insert_own"
  ON professional_categories FOR INSERT
  WITH CHECK (
    auth.uid() = professional_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'professional'
    )
  );

CREATE POLICY "professional_categories_delete_own"
  ON professional_categories FOR DELETE
  USING (auth.uid() = professional_id);


-- =============================================================================
-- COLUNAS SENSÍVEIS — Recomendações adicionais
-- =============================================================================
-- As colunas abaixo contêm dados sensíveis e NÃO devem ser retornadas em
-- queries públicas. Configure isso via Supabase Table Editor ou views:
--
--   profiles.cpf_cnpj   → visível apenas via service_role (admin)
--   profiles.push_token → visível apenas via service_role (Edge Functions)
--   profiles.phone      → visível apenas quando contact_revealed = true
--                         (controlado pela lógica de proposals)
--
-- Opção recomendada: criar uma VIEW `public_profiles` sem essas colunas e
-- usar somente ela nas queries do app cliente.
-- =============================================================================
