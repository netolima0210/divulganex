import { View, Text, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'

export default function ProfessionalProfile() {
  const { profile, signOut } = useAuth()

  return (
    <SafeAreaView className="flex-1 bg-white px-6 pt-8">
      <Text className="text-2xl font-bold text-gray-800 mb-6">Meu Perfil</Text>

      <View className="bg-gray-50 rounded-2xl p-5 mb-4">
        <Text className="text-lg font-bold text-gray-800">{profile?.name}</Text>
        <Text className="text-gray-500 text-sm mt-1">{profile?.city}, {profile?.state}</Text>
        <View className="mt-3 flex-row items-center">
          <View className={`px-2 py-1 rounded-lg ${profile?.verified ? 'bg-green-100' : 'bg-yellow-100'}`}>
            <Text className={`text-xs font-semibold ${profile?.verified ? 'text-green-700' : 'text-yellow-700'}`}>
              {profile?.verified ? '✅ Verificado' : '⏳ Aguardando verificação'}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        className="border-2 border-red-100 rounded-2xl py-4 items-center mt-auto mb-4"
        onPress={signOut}
      >
        <Text className="text-red-400 font-semibold">Sair da conta</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}
