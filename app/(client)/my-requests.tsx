import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { ServiceRequest } from '@/lib/types'

const STATUS_CONFIG = {
  open: { label: 'Aberto', color: 'bg-green-100', textColor: 'text-green-700' },
  in_progress: { label: 'Em andamento', color: 'bg-blue-100', textColor: 'text-blue-700' },
  closed: { label: 'Encerrado', color: 'bg-gray-100', textColor: 'text-gray-600' },
  expired: { label: 'Expirado', color: 'bg-red-100', textColor: 'text-red-600' },
}

export default function MyRequestsScreen() {
  const { profile } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadRequests = useCallback(async () => {
    const { data, error } = await supabase
      .from('service_requests')
      .select('*, category:categories(*)')
      .eq('client_id', profile!.id)
      .order('created_at', { ascending: false })
    if (error) {
      Alert.alert('Erro', 'Não foi possível carregar seus pedidos. Tente novamente.')
      return
    }
    if (data) setRequests(data)
  }, [profile])

  useEffect(() => {
    loadRequests().finally(() => setLoading(false))
  }, [loadRequests])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadRequests()
    setRefreshing(false)
  }

  async function handleRate(requestId: string, requestTitle: string) {
    const { data } = await supabase
      .from('proposals')
      .select('professional_id, professional:profiles!professional_id(name)')
      .eq('request_id', requestId)
      .eq('contact_revealed', true)
      .maybeSingle()

    if (!data) {
      Alert.alert('Nenhum profissional encontrado', 'Não há profissional vinculado a este pedido para avaliar.')
      return
    }

    router.push({
      pathname: '/(client)/leave-review',
      params: {
        professionalId: data.professional_id,
        requestId,
        professionalName: (data.professional as any)?.name ?? 'Profissional',
      }
    })
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
        <Text className="text-2xl font-bold text-gray-800">Meus pedidos</Text>
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
          {requests.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Text className="text-4xl mb-4">📋</Text>
              <Text className="text-gray-500 text-center">Você ainda não publicou nenhum pedido.</Text>
              <TouchableOpacity
                className="bg-orange-500 rounded-2xl px-6 py-3 mt-6"
                onPress={() => router.push('/(client)/home')}
              >
                <Text className="text-white font-bold">Publicar agora</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-3 pb-6">
              {requests.map((req) => {
                const statusCfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.open
                return (
                  <TouchableOpacity
                    key={req.id}
                    className="bg-white border-2 border-gray-100 rounded-2xl p-4"
                    onPress={() => router.push({ pathname: '/(client)/request-detail', params: { requestId: req.id } })}
                    activeOpacity={0.85}
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <View className={`px-2 py-0.5 rounded-lg ${statusCfg.color}`}>
                        <Text className={`text-xs font-semibold ${statusCfg.textColor}`}>{statusCfg.label}</Text>
                      </View>
                      <Text className="text-gray-400 text-xs">{timeAgo(req.created_at)}</Text>
                    </View>
                    <Text className="text-gray-800 font-bold text-base mb-1">{req.title}</Text>
                    <Text className="text-gray-500 text-sm mb-3" numberOfLines={2}>{req.description}</Text>
                    <View className="flex-row items-center gap-2 mb-3">
                      <Text className="text-xs">{req.category?.icon}</Text>
                      <Text className="text-gray-400 text-xs">{req.category?.name}</Text>
                      <Text className="text-gray-300">•</Text>
                      <Text className={`text-xs font-medium ${req.mode === 'task' ? 'text-yellow-600' : 'text-orange-600'}`}>
                        {req.mode === 'task' ? '⚡ Tarefa' : '🛠️ Serviço'}
                      </Text>
                    </View>
                    {req.status === 'closed' && (
                      <TouchableOpacity
                        className="bg-orange-50 border border-orange-200 rounded-xl py-2 items-center"
                        onPress={(e) => { e.stopPropagation?.(); handleRate(req.id, req.title) }}
                      >
                        <Text className="text-orange-600 text-sm font-semibold">⭐ Avaliar profissional</Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                )
              })}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
