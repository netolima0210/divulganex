import { useState, useRef } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'

export default function OtpScreen() {
  const router = useRouter()
  const { email, role } = useLocalSearchParams<{ email: string; role: 'client' | 'professional' | 'login' }>()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const inputs = useRef<(TextInput | null)[]>([])

  function handleChange(text: string, index: number) {
    const newOtp = [...otp]
    newOtp[index] = text.replace(/\D/g, '')
    setOtp(newOtp)
    if (text && index < 5) {
      inputs.current[index + 1]?.focus()
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  async function handleVerify() {
    const code = otp.join('')
    if (code.length < 6) {
      Alert.alert('Código incompleto', 'Digite os 6 dígitos do código.')
      return
    }

    setLoading(true)
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    })
    setLoading(false)

    if (error) {
      Alert.alert('Código inválido', 'Verifique o código e tente novamente.')
      return
    }

    // Verificar se perfil já existe
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', data.user?.id)
      .single()

    if (!profile) {
      if (role === 'login') {
        // Tentativa de login com número não cadastrado
        Alert.alert('Conta não encontrada', 'Este e-mail não possui cadastro. Volte e escolha "Quero contratar" ou "Quero trabalhar" para criar sua conta.')
        return
      }
      // Primeiro acesso → ir para registro
      router.replace({ pathname: '/(auth)/register', params: { role } })
    } else {
      // Já cadastrado → ir para home correta
      router.replace(profile.role === 'professional' ? '/(professional)/home' : '/(client)/home')
    }
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

            <Text className="text-2xl font-bold text-gray-800">Código de verificação</Text>
            <Text className="text-gray-500 mt-2 text-sm">
              Enviamos um código para <Text className="font-semibold text-gray-700">{email}</Text>
            </Text>

            <View className="flex-row justify-between mt-10">
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { inputs.current[index] = ref }}
                  className="w-12 h-14 border-2 border-gray-200 rounded-xl text-center text-xl font-bold text-gray-800 focus:border-orange-500"
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(t) => handleChange(t, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                />
              ))}
            </View>

            <TouchableOpacity
              className="mt-6 items-center"
              onPress={async () => {
                const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
                if (error) {
                  Alert.alert('Erro ao reenviar', error.message)
                } else {
                  Alert.alert('Código reenviado', 'Verifique seu e-mail.')
                }
              }}
            >
              <Text className="text-gray-400 text-sm">
                Não recebeu? <Text className="text-orange-500 font-semibold">Reenviar código</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className={`rounded-2xl py-4 items-center ${loading ? 'bg-orange-300' : 'bg-orange-500'}`}
            onPress={handleVerify}
            disabled={loading}
          >
            <Text className="text-white font-bold text-base">
              {loading ? 'Verificando...' : 'Verificar'}
            </Text>
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
