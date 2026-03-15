import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { ServiceRequest } from '@/lib/types'

type Filter = 'all' | 'task' | 'professional'

export default function ProfessionalHome() {
  const { profile, signOut } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const isPending = profile?.verification_status === 'pending'

  const loadRequests = useCallback(async () => {
    let query = supabase
      .from('service_requests')
      .select('*, category:categories(*)')
      .eq('status', 'open')
      .eq('state', profile?.state ?? '')
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('mode', filter)
    }

    const { data, error } = await query
    if (error) {
      Alert.alert('Erro', 'Não foi possível carregar os pedidos. Tente novamente.')
      return
    }
    if (data) setRequests(data)
  }, [filter, profile?.state])

  useEffect(() => {
    setLoading(true)
    loadRequests().finally(() => setLoading(false))
  }, [loadRequests])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadRequests()
    setRefreshing(false)
  }

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'task', label: '⚡ Tarefas' },
    { key: 'professional', label: '🛠️ Serviços' },
  ]

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return 'agora'
    if (hours < 24) return `${hours}h atrás`
    return `${Math.floor(hours / 24)}d atrás`
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-gray-500 text-sm">Olá profissional,</Text>
            <Text className="text-xl font-bold text-gray-800">{profile?.name?.split(' ')[0] ?? ''} 👋</Text>
          </View>
          <TouchableOpacity onPress={signOut}>
            <Text className="text-gray-400 text-sm">Sair</Text>
          </TouchableOpacity>
        </View>

        {isPending && (
          <View className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-3 mb-4">
            <Text className="font-bold text-yellow-700 text-sm">⏳ Verificação pendente</Text>
            <Text className="text-yellow-600 text-xs mt-0.5">Seu cadastro está em análise. Você já pode ver os pedidos!</Text>
          </View>
        )}

        {/* Filtros */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 pb-2">
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-xl border-2 ${
                  filter === f.key ? 'bg-orange-500 border-orange-500' : 'border-gray-200 bg-white'
                }`}
              >
                <Text className={`text-sm font-medium ${filter === f.key ? 'text-white' : 'text-gray-600'}`}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}
        >
          {requests.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-4xl mb-4">🔍</Text>
              <Text className="text-gray-500 text-center">Nenhum pedido disponível em {profile?.city}, {profile?.state} agora.</Text>
              <Text className="text-gray-400 text-sm text-center mt-2">Puxe para baixo para atualizar.</Text>
            </View>
          ) : (
            <View className="gap-3 pb-6">
              {requests.map((req) => (
                <TouchableOpacity
                  key={req.id}
                  className="bg-white border-2 border-gray-100 rounded-2xl p-4 shadow-sm"
                  onPress={() => router.push({ pathname: '/(professional)/request-detail', params: { id: req.id } })}
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className={`px-2 py-0.5 rounded-lg ${req.mode === 'task' ? 'bg-yellow-100' : 'bg-orange-100'}`}>
                      <Text className={`text-xs font-semibold ${req.mode === 'task' ? 'text-yellow-700' : 'text-orange-700'}`}>
                        {req.mode === 'task' ? '⚡ Tarefa' : '🛠️ Serviço'}
                      </Text>
                    </View>
                    <Text className="text-gray-400 text-xs">{timeAgo(req.created_at)}</Text>
                  </View>
                  <Text className="text-gray-800 font-bold text-base mb-1">{req.title}</Text>
                  <Text className="text-gray-500 text-sm mb-3" numberOfLines={2}>{req.description}</Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-xs">{req.category?.icon}</Text>
                    <Text className="text-gray-400 text-xs">{req.category?.name}</Text>
                    <Text className="text-gray-300 text-xs">•</Text>
                    <Text className="text-gray-400 text-xs">📍 {req.city}, {req.state}</Text>
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
