import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'

export default function EmailScreen() {
  const router = useRouter()
  const { role } = useLocalSearchParams<{ role: 'client' | 'professional' | 'login' }>()
  const isLogin = role === 'login'
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSendOTP() {
    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('E-mail inválido', 'Informe um endereço de e-mail válido.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    })
    setLoading(false)

    if (error) {
      Alert.alert('Erro', error.message)
      return
    }

    router.push({
      pathname: '/(auth)/otp',
      params: { email: email.trim().toLowerCase(), role },
    })
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-6 pt-8 pb-8 justify-between">

          <View>
            <TouchableOpacity onPress={() => router.back()} className="mb-8">
              <Text className="text-orange-500 text-base">← Voltar</Text>
            </TouchableOpacity>

            <Text className="text-2xl font-bold text-gray-800">
              {isLogin ? 'Bem-vindo de volta!' : 'Qual é o seu e-mail?'}
            </Text>
            <Text className="text-gray-500 mt-2 text-sm">
              {isLogin
                ? 'Informe seu e-mail para entrar na sua conta.'
                : 'Vamos enviar um código de verificação por e-mail.'}
            </Text>

            <View className="mt-8">
              <TextInput
                className="border-2 border-gray-200 rounded-2xl px-4 h-14 text-gray-800 text-base"
                placeholder="seu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <TouchableOpacity
            className={`rounded-2xl py-4 items-center ${loading ? 'bg-orange-300' : 'bg-orange-500'}`}
            onPress={handleSendOTP}
            disabled={loading}
          >
            <Text className="text-white font-bold text-base">
              {loading ? 'Enviando...' : 'Enviar código'}
            </Text>
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
