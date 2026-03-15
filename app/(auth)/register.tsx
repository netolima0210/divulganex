import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { NORDESTE_STATES } from '@/lib/types'

export default function RegisterScreen() {
  const router = useRouter()
  const { role } = useLocalSearchParams<{ role: 'client' | 'professional' }>()
  const isProfessional = role === 'professional'

  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister() {
    if (!name.trim() || !city.trim() || !state) {
      Alert.alert('Campos obrigatórios', 'Preencha nome, cidade e estado.')
      return
    }
    if (isProfessional && !cpfCnpj.trim()) {
      Alert.alert('CPF/CNPJ obrigatório', 'Profissionais precisam informar CPF ou CNPJ.')
      return
    }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('profiles').upsert({
      id: user!.id,
      name: name.trim(),
      city: city.trim(),
      state,
      role,
      cpf_cnpj: isProfessional ? cpfCnpj.replace(/\D/g, '') : null,
      phone: user!.phone,
      verification_status: isProfessional ? 'pending' : 'approved',
      verified: !isProfessional,
    })
    setLoading(false)

    if (error) {
      Alert.alert('Erro ao salvar', error.message)
      return
    }

    router.replace(isProfessional ? '/(professional)/home' : '/(client)/home')
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6 pt-8" showsVerticalScrollIndicator={false}>
          <Text className="text-2xl font-bold text-gray-800 mb-1">Quase lá!</Text>
          <Text className="text-gray-500 text-sm mb-8">
            {isProfessional
              ? 'Complete seu perfil profissional para começar a receber pedidos.'
              : 'Diga seu nome e onde você está para encontrar serviços perto de você.'}
          </Text>

          <View className="gap-4">
            <View>
              <Text className="text-gray-600 text-sm font-medium mb-1">Nome completo *</Text>
              <TextInput
                className="border-2 border-gray-200 rounded-2xl px-4 h-14 text-gray-800"
                placeholder="Seu nome"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View>
              <Text className="text-gray-600 text-sm font-medium mb-1">Estado *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
                <View className="flex-row gap-2">
                  {NORDESTE_STATES.map((s) => (
                    <TouchableOpacity
                      key={s.value}
                      onPress={() => setState(s.value)}
                      className={`px-3 py-2 rounded-xl border-2 ${state === s.value ? 'bg-orange-500 border-orange-500' : 'border-gray-200'}`}
                    >
                      <Text className={`text-sm font-medium ${state === s.value ? 'text-white' : 'text-gray-600'}`}>
                        {s.value}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View>
              <Text className="text-gray-600 text-sm font-medium mb-1">Cidade *</Text>
              <TextInput
                className="border-2 border-gray-200 rounded-2xl px-4 h-14 text-gray-800"
                placeholder="Sua cidade"
                value={city}
                onChangeText={setCity}
              />
            </View>

            {isProfessional && (
              <View>
                <Text className="text-gray-600 text-sm font-medium mb-1">CPF ou CNPJ *</Text>
                <TextInput
                  className="border-2 border-gray-200 rounded-2xl px-4 h-14 text-gray-800"
                  placeholder="000.000.000-00"
                  keyboardType="number-pad"
                  value={cpfCnpj}
                  onChangeText={setCpfCnpj}
                  maxLength={18}
                />
                <Text className="text-gray-400 text-xs mt-1">
                  Seus dados são protegidos pela LGPD e usados apenas para verificação.
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            className={`rounded-2xl py-4 items-center mt-8 mb-8 ${loading ? 'bg-orange-300' : 'bg-orange-500'}`}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text className="text-white font-bold text-base">
              {loading ? 'Salvando...' : 'Começar'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
