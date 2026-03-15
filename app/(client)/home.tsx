import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'expo-router'

const MODES = [
  {
    id: 'task',
    title: 'Preciso de um favor',
    description: 'Tarefas rápidas: fila, entrega, levar carro...',
    emoji: '⚡',
    color: 'bg-yellow-50 border-yellow-200',
  },
  {
    id: 'professional',
    title: 'Preciso de um profissional',
    description: 'Eletricista, diarista, professor e muito mais',
    emoji: '🛠️',
    color: 'bg-orange-50 border-orange-200',
  },
]

export default function ClientHome() {
  const { profile, signOut } = useAuth()
  const router = useRouter()

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>

        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-gray-500 text-sm">Olá,</Text>
            <Text className="text-xl font-bold text-gray-800">{profile?.name?.split(' ')[0] ?? 'bem-vindo'} 👋</Text>
          </View>
          <TouchableOpacity onPress={signOut}>
            <Text className="text-gray-400 text-sm">Sair</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-base text-gray-600 mb-4">O que você precisa hoje?</Text>

        <View className="gap-4 mb-8">
          {MODES.map((mode) => (
            <TouchableOpacity
              key={mode.id}
              className={`border-2 rounded-2xl p-5 ${mode.color}`}
              onPress={() => router.push({ pathname: '/(client)/new-request', params: { mode: mode.id } })}
            >
              <Text className="text-3xl mb-2">{mode.emoji}</Text>
              <Text className="text-base font-bold text-gray-800">{mode.title}</Text>
              <Text className="text-gray-500 text-sm mt-1">{mode.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-sm text-center text-gray-400 mb-6">
          📍 {profile?.city}, {profile?.state}
        </Text>

      </ScrollView>
    </SafeAreaView>
  )
}
