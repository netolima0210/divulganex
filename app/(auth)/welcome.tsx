import { View, Text, TouchableOpacity, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function WelcomeScreen() {
  const router = useRouter()

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-12 pb-8 justify-between">

        {/* Logo e Hero */}
        <View className="items-center mt-8">
          <Text className="text-4xl font-bold text-orange-500">Divulganex</Text>
          <Text className="text-base text-gray-500 mt-2 text-center">
            Conectando quem precisa com quem sabe fazer — no Nordeste.
          </Text>
        </View>

        {/* Ilustração central */}
        <View className="items-center">
          <View className="w-64 h-64 bg-orange-50 rounded-full items-center justify-center">
            <Text className="text-8xl">🤝</Text>
          </View>
        </View>

        {/* Botões de ação */}
        <View className="gap-4">
          <TouchableOpacity
            className="bg-orange-500 rounded-2xl py-4 items-center"
            onPress={() => router.push({ pathname: '/(auth)/phone', params: { role: 'client' } })}
          >
            <Text className="text-white font-bold text-base">Quero contratar</Text>
            <Text className="text-orange-100 text-sm">Encontre profissionais perto de você</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="border-2 border-orange-500 rounded-2xl py-4 items-center"
            onPress={() => router.push({ pathname: '/(auth)/phone', params: { role: 'professional' } })}
          >
            <Text className="text-orange-500 font-bold text-base">Quero trabalhar</Text>
            <Text className="text-gray-400 text-sm">Ofereça seus serviços e ganhe mais</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center py-2"
            onPress={() => router.push({ pathname: '/(auth)/phone', params: { role: 'client' } })}
          >
            <Text className="text-gray-400 text-sm">Já tenho conta — <Text className="text-orange-500 font-semibold">Entrar</Text></Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  )
}
