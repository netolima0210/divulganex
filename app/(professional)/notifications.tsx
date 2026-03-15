import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Notification } from '@/lib/types'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `há ${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  return `há ${days}d`
}

export default function NotificationsScreen() {
  const { session } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadNotifications = useCallback(async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session!.user.id)
      .order('created_at', { ascending: false })

    if (error) return
    if (data) setNotifications(data)
  }, [session])

  const markAllRead = useCallback(async () => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', session!.user.id)
      .eq('read', false)
  }, [session])

  useEffect(() => {
    const init = async () => {
      await loadNotifications()
      await markAllRead()
      setLoading(false)
    }
    init()
  }, [loadNotifications, markAllRead])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadNotifications()
    setRefreshing(false)
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-6 pb-2">
        <Text className="text-2xl font-bold text-gray-800">Notificações</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />
          }
        >
          {notifications.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20 px-6">
              <Ionicons name="notifications-off-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 text-center mt-4">
                Nenhuma notificação por enquanto.
              </Text>
            </View>
          ) : (
            <View className="px-6 pt-4 gap-3 pb-8">
              {notifications.map((notif) => (
                <View
                  key={notif.id}
                  className={`flex-row items-start gap-3 rounded-2xl p-4 border-2 ${
                    notif.read ? 'bg-white border-gray-100' : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <View
                    className={`w-9 h-9 rounded-full items-center justify-center flex-shrink-0 ${
                      notif.read ? 'bg-gray-100' : 'bg-orange-100'
                    }`}
                  >
                    <Ionicons
                      name="notifications-outline"
                      size={18}
                      color={notif.read ? '#9CA3AF' : '#F97316'}
                    />
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-0.5">
                      <Text
                        className={`font-bold text-sm flex-1 mr-2 ${
                          notif.read ? 'text-gray-700' : 'text-gray-900'
                        }`}
                        numberOfLines={1}
                      >
                        {notif.title}
                      </Text>
                      <Text className="text-gray-400 text-xs flex-shrink-0">
                        {timeAgo(notif.created_at)}
                      </Text>
                    </View>
                    <Text
                      className={`text-sm leading-5 ${
                        notif.read ? 'text-gray-500' : 'text-gray-700'
                      }`}
                    >
                      {notif.body}
                    </Text>
                  </View>

                  {!notif.read && (
                    <View className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
