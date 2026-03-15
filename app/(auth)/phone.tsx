import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'

export default function PhoneScreen() {
  const router = useRouter()
  const { role } = useLocalSearchParams<{ role: 'client' | 'professional' | 'login' }>()
  const isLogin = role === 'login'
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  function formatPhone(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  function getE164(phone: string) {
    const digits = phone.replace(/\D/g, '')
    return `+55${digits}`
  }

  async function handleSendOTP() {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) {
      Alert.alert('Telefone inválido', 'Informe um número com DDD e 9 dígitos.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      phone: getE164(phone),
    })
    setLoading(false)

    if (error) {
      Alert.alert('Erro', error.message)
      return
    }

    router.push({
      pathname: '/(auth)/otp',
      params: { phone: getE164(phone), role },
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
              {isLogin ? 'Bem-vindo de volta!' : 'Qual é o seu número?'}
            </Text>
            <Text className="text-gray-500 mt-2 text-sm">
              {isLogin
                ? 'Informe seu número para entrar na sua conta.'
                : 'Vamos enviar um código de verificação por SMS.'}
            </Text>

            <View className="mt-8">
              <View className="flex-row items-center border-2 border-gray-200 rounded-2xl px-4 h-14 focus-within:border-orange-500">
                <Text className="text-gray-500 mr-2">🇧🇷 +55</Text>
                <TextInput
                  className="flex-1 text-gray-800 text-base"
                  placeholder="(85) 99999-9999"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={(t) => setPhone(formatPhone(t))}
                  maxLength={15}
                />
              </View>
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
