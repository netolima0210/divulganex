import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function ClientLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#F97316',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingBottom: 4 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="my-requests"
        options={{
          title: 'Meus Pedidos',
          tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="new-request"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="leave-review"
        options={{ href: null }}
      />
    </Tabs>
  )
}
