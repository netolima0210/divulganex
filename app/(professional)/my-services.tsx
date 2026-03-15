import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

type ProposalWithRequest = {
  id: string
  status: string
  contact_revealed: boolean
  created_at: string
  request: {
    id: string
    title: string
    mode: string
    city: string
    state: string
    status: string
    category: { name: string; icon: string } | null
  } | null
}

export default function MyServicesScreen() {
  const { profile } = useAuth()
  const router = useRouter()
  const [proposals, setProposals] = useState<ProposalWithRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadProposals = useCallback(async () => {
    const { data } = await supabase
      .from('proposals')
      .select('id, status, contact_revealed, created_at, request:service_requests(id, title, mode, city, state, status, category:categories(name, icon))')
      .eq('professional_id', profile!.id)
      .order('created_at', { ascending: false })
    if (data) setProposals(data as ProposalWithRequest[])
  }, [profile])

  useEffect(() => {
    loadProposals().finally(() => setLoading(false))
  }, [loadProposals])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadProposals()
    setRefreshing(false)
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return 'agora'
    if (hours < 24) return `${hours}h atrás`
    return `${Math.floor(hours / 24)}d atrás`
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-6 pb-2">
        <Text className="text-2xl font-bold text-gray-800">Meus serviços</Text>
        <Text className="text-gray-500 text-sm mt-1">Pedidos em que você demonstrou interesse</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-6 pt-4"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}
        >
          {proposals.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Text className="text-4xl mb-4">📋</Text>
              <Text className="text-gray-500 text-center">Você ainda não demonstrou interesse em nenhum pedido.</Text>
              <TouchableOpacity
                className="bg-orange-500 rounded-2xl px-6 py-3 mt-6"
                onPress={() => router.push('/(professional)/home')}
              >
                <Text className="text-white font-bold">Ver pedidos disponíveis</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-3 pb-6">
              {proposals.map((prop) => (
                <TouchableOpacity
                  key={prop.id}
                  className="bg-white border-2 border-gray-100 rounded-2xl p-4"
                  onPress={() => router.push({ pathname: '/(professional)/request-detail', params: { id: prop.request?.id ?? '' } })}
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className={`px-2 py-0.5 rounded-lg ${prop.contact_revealed ? 'bg-green-100' : 'bg-blue-100'}`}>
                      <Text className={`text-xs font-semibold ${prop.contact_revealed ? 'text-green-700' : 'text-blue-700'}`}>
                        {prop.contact_revealed ? '✅ Contato revelado' : '👍 Interesse enviado'}
                      </Text>
                    </View>
                    <Text className="text-gray-400 text-xs">{timeAgo(prop.created_at)}</Text>
                  </View>
                  <Text className="text-gray-800 font-bold text-base mb-1">{prop.request?.title ?? '—'}</Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-xs">{prop.request?.category?.icon}</Text>
                    <Text className="text-gray-400 text-xs">{prop.request?.category?.name}</Text>
                    <Text className="text-gray-300 text-xs">•</Text>
                    <Text className="text-gray-400 text-xs">📍 {prop.request?.city}, {prop.request?.state}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
