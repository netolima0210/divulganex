CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professional manages own portfolio" ON public.portfolio_items
  FOR ALL USING (professional_id = auth.uid());

CREATE POLICY "Public can view portfolio" ON public.portfolio_items
  FOR SELECT USING (true);
