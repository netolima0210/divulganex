import { Redirect } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { View, ActivityIndicator } from 'react-native'

export default function Index() {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    )
  }

  if (!session) {
    return <Redirect href="/(auth)/welcome" />
  }

  if (profile?.role === 'professional') {
    return <Redirect href="/(professional)/home" />
  }

  return <Redirect href="/(client)/home" />
}
