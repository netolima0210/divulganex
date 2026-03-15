import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useRef } from 'react'
import 'react-native-reanimated'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import * as Notifications from 'expo-notifications'
import { registerForPushNotifications, savePushToken } from '@/lib/notifications'
import '../global.css'

SplashScreen.preventAutoHideAsync()

function NotificationSetup() {
  const { session } = useAuth()
  const notificationListener = useRef<Notifications.EventSubscription>()
  const responseListener = useRef<Notifications.EventSubscription>()

  useEffect(() => {
    if (!session?.user) return

    // Register for push notifications
    registerForPushNotifications().then((token) => {
      if (token) savePushToken(session.user.id, token)
    })

    // Listen for notifications received while app is open
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification)
    })

    // Listen for user tapping a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response)
    })

    return () => {
      notificationListener.current?.remove()
      responseListener.current?.remove()
    }
  }, [session])

  return null
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync()
  }, [])

  return (
    <AuthProvider>
      <NotificationSetup />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(client)" />
        <Stack.Screen name="(professional)" />
        <Stack.Screen name="chat" />
      </Stack>
    </AuthProvider>
  )
}
