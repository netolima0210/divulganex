# Divulganex — Checklist de Lançamento (Fase 10)

## 1. EAS Build — Configuração Inicial

### Pré-requisitos
- [ ] Conta Expo criada em https://expo.dev (gratuita)
- [ ] Instalar EAS CLI: `npm install -g eas-cli`
- [ ] Login: `eas login`

### Configurar projeto
```bash
# Na raiz do projeto Divulganex:
eas init          # Vincula ao projeto Expo e gera projectId real
eas build:configure  # Configura plataformas automaticamente
```

Após `eas init`, atualizar o `app.json`:
```json
"extra": {
  "eas": {
    "projectId": "SEU_PROJECT_ID_AQUI"  // gerado pelo eas init
  }
}
```

### Build de preview (APK Android para teste)
```bash
eas build --platform android --profile preview
```
Gera um link para download do APK. Duração: ~15 minutos.

### Build de produção
```bash
eas build --platform android --profile production  # AAB para Google Play
eas build --platform ios --profile production       # IPA para App Store
```

---

## 2. Firebase Cloud Messaging (FCM) — Push Android Produção

1. Acessar https://console.firebase.google.com
2. Criar projeto "Divulganex"
3. Adicionar app Android (package: `com.divulganex.app`)
4. Baixar `google-services.json` → colocar na raiz do projeto
5. Copiar **Server Key** do FCM
6. Configurar no EAS:
   ```bash
   eas credentials
   # Selecionar Android → Push Notifications → FCM Key
   ```

---

## 3. Apple Developer (iOS) — APNs

1. Criar conta em https://developer.apple.com (USD 99/ano)
2. Registrar Bundle ID: `com.divulganex.app`
3. Criar certificado APNs (.p8)
4. Configurar no EAS:
   ```bash
   eas credentials
   # Selecionar iOS → Push Notifications → APNs Key
   ```

---

## 4. Google Play Store

1. Criar conta Google Play Developer (USD 25 taxa única)
2. Criar aplicativo "Divulganex" em https://play.google.com/console
3. Preencher:
   - [ ] Título: "Divulganex — Serviços no Nordeste"
   - [ ] Descrição curta (80 chars)
   - [ ] Descrição completa (4000 chars)
   - [ ] Screenshots (mínimo 2, recomendado 8)
   - [ ] Ícone 512x512px (fundo laranja #F97316)
   - [ ] Feature graphic 1024x500px
4. Upload do AAB: `eas submit --platform android`

**Service Account para upload automático:**
```bash
# Criar service account no Google Cloud Console
# Baixar JSON e salvar como google-service-account.json
# Registrado no eas.json como serviceAccountKeyPath
```

---

## 5. Apple App Store

1. Conta Apple Developer ativa
2. Criar app em https://appstoreconnect.apple.com
3. Preencher:
   - [ ] Nome: "Divulganex"
   - [ ] Subtítulo: "Serviços no Nordeste"
   - [ ] Screenshots (6.7", 6.1", iPad se supportsTablet=true)
   - [ ] Palavras-chave (100 chars)
4. TestFlight primeiro: `eas submit --platform ios` → revisar internamente
5. Submeter para review da Apple (~24-48h)

---

## 6. Sentry — Monitoramento de Erros

### Instalar
```bash
npx expo install @sentry/react-native
```

### Configurar
```bash
npx @sentry/wizard@latest -i reactNative
```

Adicionar ao `app/_layout.tsx`:
```typescript
import * as Sentry from '@sentry/react-native'

Sentry.init({
  dsn: 'SEU_DSN_SENTRY_AQUI',  // https://sentry.io → projeto → Settings → DSN
  enableInExpoDevelopment: false,
  debug: false,
})
```

Adicionar ao `eas.json` (production):
```json
"env": {
  "SENTRY_DSN": "seu_dsn"
}
```

---

## 7. Analytics — PostHog

### Instalar
```bash
npx expo install posthog-react-native
```

### Usar
```typescript
import PostHog from 'posthog-react-native'
const posthog = new PostHog('SEU_API_KEY')
posthog.capture('request_created', { mode: 'task', state: 'CE' })
```

---

## 8. ASO — App Store Optimization

### Palavras-chave sugeridas (PT-BR):
- serviços nordeste, pedreiro, eletricista, diarista
- tarefas, faz tudo, empregos informais
- GetNinjas Nordeste, marketplace serviços

### Descrição curta (Google Play):
> "Encontre ou ofereça serviços no Nordeste. Conectamos clientes e profissionais verificados."

### Descrição completa:
> Divulganex é o marketplace de serviços focado no Nordeste do Brasil. [...]
> - Para clientes: publique pedidos de serviços e receba propostas de profissionais verificados
> - Para profissionais: encontre clientes na sua cidade e aumente sua renda
> - Modo Tarefa: micro-tarefas rápidas do dia a dia
> - Modo Profissional: serviços especializados (eletricista, professor, psicólogo e mais)
> - 100% gratuito no lançamento

---

## 9. Landing Page (Vercel)

URL pretendida: divulganex.com.br

Criar em `c:\Users\netol\OneDrive\Desktop\Projetos\divulganex-landing`:
- Next.js simples, 1 página
- Hero: logo + tagline + botões App Store / Google Play
- Features: 3 cards (Modo Tarefa, Modo Profissional, Seguro e Verificado)
- CTA: formulário de pré-cadastro (e-mail)
- Deploy via MCP Vercel

---

## 10. Checklist Final Pré-Lançamento

- [ ] Todos os fluxos testados no dispositivo real (iPhone + Android)
- [ ] Notificações push funcionando (FCM + APNs)
- [ ] Auth por telefone funcionando (Twilio/Supabase)
- [ ] RLS ativo (38 políticas)
- [ ] Edge Functions deployadas (notify-professionals + expire-requests)
- [ ] Webhook configurado (novo pedido → notifica profissionais)
- [ ] Cron configurado (expire-requests a cada hora)
- [ ] Sentry configurado
- [ ] Analytics configurado
- [ ] Privacy Policy e Terms of Service publicados
- [ ] App Store screenshots em todos os tamanhos
- [ ] Google Play screenshots preenchidas
- [ ] ASO completo (título, descrição, palavras-chave)
