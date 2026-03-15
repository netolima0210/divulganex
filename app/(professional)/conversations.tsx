import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

interface ConversationItem {
  id: string
  client_id: string
  client_name: string
  client_avatar: string | null
  last_message: string | null
  last_message_at: string | null
  unread_count: number
}

export default function ProfessionalConversationsScreen() {
  const router = useRouter()
  const { profile } = useAuth()
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadConversations = useCallback(async () => {
    if (!profile) return

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        id,
        client_id,
        client:profiles!client_id(name, avatar_url)
      `)
      .eq('professional_id', profile.id)
      .order('created_at', { ascending: false })

    if (error || !data) {
      setLoading(false)
      return
    }

    const enriched = await Promise.all(
      data.map(async (conv) => {
        const client = conv.client as any

        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        const { count: unreadCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('read', false)
          .neq('sender_id', profile.id)

        return {
          id: conv.id,
          client_id: conv.client_id,
          client_name: client?.name ?? 'Cliente',
          client_avatar: client?.avatar_url ?? null,
          last_message: lastMsg?.content ?? null,
          last_message_at: lastMsg?.created_at ?? null,
          unread_count: unreadCount ?? 0,
        } as ConversationItem
      })
    )

    setConversations(enriched)
    setLoading(false)
  }, [profile])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  function formatTime(dateStr: string | null) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffH = Math.floor(diffMs / 3600000)
    if (diffH < 1) return 'agora'
    if (diffH < 24) return `${diffH}h`
    return `${Math.floor(diffH / 24)}d`
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#F97316" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-4 pb-2">
        <Text className="text-2xl font-bold text-gray-800">Conversas</Text>
      </View>

      {conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-5xl mb-4">💬</Text>
          <Text className="text-gray-500 text-center text-base leading-6">
            Você ainda não tem conversas. Os clientes entrarão em contato em breve.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          ItemSeparatorComponent={() => <View className="h-px bg-gray-100" />}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="flex-row items-center py-4 gap-3"
              onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id } })}
              activeOpacity={0.7}
            >
              {item.client_avatar ? (
                <Image
                  source={{ uri: item.client_avatar }}
                  className="w-12 h-12 rounded-full bg-gray-200"
                />
              ) : (
                <View className="w-12 h-12 rounded-full bg-orange-100 items-center justify-center">
                  <Text className="text-orange-500 font-bold text-lg">
                    {item.client_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-0.5">
                  <Text className="text-gray-800 font-semibold text-base" numberOfLines={1}>
                    {item.client_name}
                  </Text>
                  <Text className="text-gray-400 text-xs">{formatTime(item.last_message_at)}</Text>
                </View>
                <Text className="text-gray-500 text-sm" numberOfLines={1}>
                  {item.last_message ?? 'Nenhuma mensagem ainda'}
                </Text>
              </View>

              {item.unread_count > 0 && (
                <View className="bg-orange-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1">
                  <Text className="text-white text-xs font-bold">{item.unread_count}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  )
}
