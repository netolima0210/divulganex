-- Wallet de moedas por usuário
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de transações
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'bonus')),
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  reference_id UUID, -- pedido ou proposta relacionada
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User views own wallet" ON public.wallets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "User views own transactions" ON public.transactions
  FOR SELECT USING (user_id = auth.uid());

-- Trigger: cria wallet automaticamente ao criar perfil
CREATE OR REPLACE FUNCTION public.create_wallet_for_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance) VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_create_wallet ON public.profiles;
CREATE TRIGGER on_profile_created_create_wallet
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_wallet_for_profile();

-- Configuração de preços (tabela simples)
CREATE TABLE IF NOT EXISTS public.coin_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  coins INTEGER NOT NULL,
  price_brl NUMERIC(10,2) NOT NULL,
  is_popular BOOLEAN DEFAULT FALSE
);

INSERT INTO public.coin_packages (name, coins, price_brl, is_popular) VALUES
  ('Starter', 5, 4.90, false),
  ('Popular', 10, 8.90, true),
  ('Pro', 25, 19.90, false),
  ('Max', 50, 34.90, false)
ON CONFLICT DO NOTHING;

ALTER TABLE public.coin_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view packages" ON public.coin_packages FOR SELECT USING (true);
