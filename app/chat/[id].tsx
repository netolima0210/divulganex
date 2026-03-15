import { useState, useEffect, useRef, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  read: boolean
  created_at: string
}

export default function ChatScreen() {
  const router = useRouter()
  const { id: conversationId } = useLocalSearchParams<{ id: string }>()
  const { profile, session } = useAuth()

  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const flatListRef = useRef<FlatList>(null)

  const markAsRead = useCallback(async () => {
    if (!session?.user) return
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', session.user.id)
      .eq('read', false)
  }, [conversationId, session])

  const loadMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setMessages(data)
    }
    setLoading(false)
  }, [conversationId])

  useEffect(() => {
    loadMessages().then(() => markAsRead())

    // Subscribe to realtime new messages
    const channel = supabase
      .channel(`messages:conversation_id=eq.${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          // Mark incoming messages as read immediately
          if (session?.user && newMsg.sender_id !== session.user.id) {
            supabase
              .from('messages')
              .update({ read: true })
              .eq('id', newMsg.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, loadMessages, markAsRead, session])

  async function handleSend() {
    if (!inputText.trim() || !session?.user) return

    const content = inputText.trim()
    setInputText('')
    setSending(true)

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: session.user.id,
      content,
      read: false,
    })

    setSending(false)

    if (error) {
      setInputText(content)
    }
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#F97316" />
      </SafeAreaView>
    )
  }

  const myId = session?.user?.id

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Text className="text-orange-500 text-base">← Voltar</Text>
        </TouchableOpacity>
        <Text className="text-gray-800 font-semibold text-base">Conversa</Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Messages list */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-16">
              <Text className="text-gray-400 text-center">
                Nenhuma mensagem ainda. Diga olá!
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMine = item.sender_id === myId
            return (
              <View
                className={`mb-2 max-w-[75%] ${isMine ? 'self-end items-end' : 'self-start items-start'}`}
              >
                <View
                  className={`rounded-2xl px-4 py-2.5 ${
                    isMine
                      ? 'bg-orange-500 rounded-br-sm'
                      : 'bg-gray-200 rounded-bl-sm'
                  }`}
                >
                  <Text className={`text-sm leading-5 ${isMine ? 'text-white' : 'text-gray-800'}`}>
                    {item.content}
                  </Text>
                </View>
                <Text className="text-gray-400 text-xs mt-0.5 px-1">
                  {formatTime(item.created_at)}
                </Text>
              </View>
            )
          }}
        />

        {/* Input bar */}
        <View className="flex-row items-end px-4 py-3 border-t border-gray-100 gap-2">
          <TextInput
            className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-800 max-h-24"
            placeholder="Digite uma mensagem..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            multiline
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            className={`rounded-full w-11 h-11 items-center justify-center ${
              inputText.trim() && !sending ? 'bg-orange-500' : 'bg-gray-300'
            }`}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white font-bold text-base">➤</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
