import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'

export default function ClientProfile() {
  const { profile, signOut } = useAuth()

  function formatDate(dateStr: string | undefined) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 pt-8" showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-bold text-gray-800 mb-6">Meu Perfil</Text>

        {/* Avatar + nome */}
        <View className="items-center mb-6">
          <View className="w-20 h-20 rounded-full bg-orange-100 items-center justify-center mb-3">
            <Text className="text-3xl font-bold text-orange-500">
              {profile?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text className="text-xl font-bold text-gray-800">{profile?.name ?? '—'}</Text>
          <View className="mt-2 px-3 py-1 bg-orange-50 rounded-xl">
            <Text className="text-orange-600 text-xs font-semibold">Cliente</Text>
          </View>
        </View>

        {/* Dados do perfil */}
        <View className="bg-gray-50 rounded-2xl p-5 mb-4 gap-3">
          <View className="flex-row items-center gap-3">
            <Text className="text-lg">📍</Text>
            <View>
              <Text className="text-gray-400 text-xs">Localização</Text>
              <Text className="text-gray-800 font-medium text-sm">
                {profile?.city && profile?.state ? `${profile.city}, ${profile.state}` : '—'}
              </Text>
            </View>
          </View>

          {profile?.phone && (
            <View className="flex-row items-center gap-3">
              <Text className="text-lg">📱</Text>
              <View>
                <Text className="text-gray-400 text-xs">Telefone</Text>
                <Text className="text-gray-800 font-medium text-sm">{profile.phone}</Text>
              </View>
            </View>
          )}

          <View className="flex-row items-center gap-3">
            <Text className="text-lg">📅</Text>
            <View>
              <Text className="text-gray-400 text-xs">Membro desde</Text>
              <Text className="text-gray-800 font-medium text-sm">{formatDate(profile?.created_at)}</Text>
            </View>
          </View>
        </View>

        {/* Botão sair */}
        <TouchableOpacity
          className="border-2 border-red-100 rounded-2xl py-4 items-center mb-8"
          onPress={signOut}
        >
          <Text className="text-red-400 font-semibold">Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}
