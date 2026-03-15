import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

// SSR-safe storage: no-op on server, localStorage on browser, AsyncStorage on native
const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined'

const storage = Platform.OS !== 'web'
  ? AsyncStorage
  : {
      getItem: (key: string) => Promise.resolve(isBrowser ? localStorage.getItem(key) : null),
      setItem: (key: string, value: string) => { if (isBrowser) localStorage.setItem(key, value); return Promise.resolve() },
      removeItem: (key: string) => { if (isBrowser) localStorage.removeItem(key); return Promise.resolve() },
    }

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
})
