import { View, Text, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'

export default function ProfessionalHome() {
  const { profile, signOut } = useAuth()
  const isPending = profile?.verification_status === 'pending'

  return (
    <SafeAreaView className="flex-1 bg-white px-6 pt-8">
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-gray-500 text-sm">Olá profissional,</Text>
          <Text className="text-xl font-bold text-gray-800">{profile?.name?.split(' ')[0] ?? ''} 👋</Text>
        </View>
        <TouchableOpacity onPress={signOut}>
          <Text className="text-gray-400 text-sm">Sair</Text>
        </TouchableOpacity>
      </View>

      {isPending && (
        <View className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 mb-6">
          <Text className="font-bold text-yellow-700">⏳ Verificação pendente</Text>
          <Text className="text-yellow-600 text-sm mt-1">
            Seu cadastro está em análise. Em breve você receberá pedidos disponíveis na sua região.
          </Text>
        </View>
      )}

      <View className="flex-1 items-center justify-center">
        <Text className="text-4xl mb-4">🔔</Text>
        <Text className="text-gray-500 text-center">
          Pedidos disponíveis aparecerão aqui assim que seu perfil for verificado.
        </Text>
      </View>
    </SafeAreaView>
  )
}
