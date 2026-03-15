-- Tabela de conversas (1 por par cliente+profissional+pedido)
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.service_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, professional_id, request_id)
);

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view conversation" ON public.conversations
  FOR SELECT USING (client_id = auth.uid() OR professional_id = auth.uid());

CREATE POLICY "Participants can create conversation" ON public.conversations
  FOR INSERT WITH CHECK (client_id = auth.uid() OR professional_id = auth.uid());

CREATE POLICY "Participants can view messages" ON public.messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE client_id = auth.uid() OR professional_id = auth.uid()
    )
  );

CREATE POLICY "Participants can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE client_id = auth.uid() OR professional_id = auth.uid()
    )
  );

CREATE POLICY "Participants can mark messages read" ON public.messages
  FOR UPDATE USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE client_id = auth.uid() OR professional_id = auth.uid()
    )
  );

-- Habilitar Realtime na tabela messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
