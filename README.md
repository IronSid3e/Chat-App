# Chat-App

React Native (Expo) sohbet uygulaması.

## Kurulum

```bash
npm install
cp .env.example .env   # değerleri kendi ortamınıza göre doldurun
npx expo start
```

## Ortam Değişkenleri

`.env` dosyasında aşağıdaki değişkenler bulunur:

- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk API anahtarı
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase proje URL'si
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon (public) anahtarı
- `EXPO_PUBLIC_SENTRY_DSN` — Sentry DSN'si (boş bırakılırsa Sentry devre dışı kalır)

## Komutlar

- `npm start` — Metro sunucusunu başlatır
- `npm run android` — Android build alıp çalıştırır
- `npm run ios` — iOS build alıp çalıştırır
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript kontrolü
- `npm test` — Jest testleri
- `npm run format` — Prettier formatlar
- `npm run format:check` — Prettier kontrolü
