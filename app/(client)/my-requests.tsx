import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function MyRequests() {
  return (
    <SafeAreaView className="flex-1 bg-white items-center justify-center">
      <Text className="text-gray-400">Meus pedidos — em breve</Text>
    </SafeAreaView>
  )
}
