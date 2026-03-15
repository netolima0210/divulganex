import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { getWalletBalance, debitWallet } from '@/lib/wallet'
import { ServiceRequest, Proposal } from '@/lib/types'

const REVEAL_COST = 3

export default function RequestDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { profile } = useAuth()

  const [request, setRequest] = useState<ServiceRequest | null>(null)
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [clientPhone, setClientPhone] = useState<string | null>(null)
  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    const [{ data: reqData }, { data: propData }] = await Promise.all([
      supabase
        .from('service_requests')
        .select('*, category:categories(*), client:profiles!client_id(name, phone)')
        .eq('id', id)
        .single(),
      supabase
        .from('proposals')
        .select('*')
        .eq('request_id', id)
        .eq('professional_id', profile!.id)
        .maybeSingle(),
    ])

    if (reqData) setRequest(reqData)
    if (propData) {
      setProposal(propData)
      if (propData.contact_revealed && reqData?.client) {
        setClientPhone((reqData.client as any).phone)
      }
    }
    setLoading(false)
  }

  async function handleInterest() {
    setActionLoading(true)
    const { data, error } = await supabase
      .from('proposals')
      .insert({
        request_id: id,
        professional_id: profile!.id,
        status: 'pending',
        contact_revealed: false,
      })
      .select()
      .single()
    setActionLoading(false)

    if (error) {
      Alert.alert('Erro', error.message)
      return
    }
    setProposal(data)
  }

  async function handleRevealContact() {
    setActionLoading(true)
    const { error } = await supabase
      .from('proposals')
      .update({ contact_revealed: true })
      .eq('id', proposal!.id)

    if (error) {
      setActionLoading(false)
      Alert.alert('Erro', 'Não foi possível revelar o contato. Tente novamente.')
      return
    }

    const { data: clientData, error: phoneError } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', request!.client_id)
      .single()

    if (phoneError || !clientData?.phone) {
      setActionLoading(false)
      Alert.alert('Aviso', 'Contato revelado, mas não foi possível carregar o número do cliente.')
      setProposal(prev => prev ? { ...prev, contact_revealed: true } : prev)
      return
    }

    setClientPhone(clientData.phone)
    setProposal(prev => prev ? { ...prev, contact_revealed: true } : prev)
    setActionLoading(false)
  }

  async function handleStartChat() {
    if (!profile || !request) return
    setChatLoading(true)

    const { data, error } = await supabase
      .from('conversations')
      .upsert(
        {
          client_id: request.client_id,
          professional_id: profile.id,
          request_id: request.id,
        },
        { onConflict: 'client_id,professional_id,request_id' }
      )
      .select('id')
      .single()

    setChatLoading(false)

    if (error || !data) {
      Alert.alert('Erro', 'Não foi possível iniciar a conversa. Tente novamente.')
      return
    }

    router.push({ pathname: '/chat/[id]', params: { id: data.id } })
  }

  function openWhatsApp(phone: string) {
    const clean = phone.replace(/\D/g, '')
    Linking.openURL(`https://wa.me/${clean}`)
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return 'Publicado agora'
    if (hours < 24) return `Publicado há ${hours}h`
    return `Publicado há ${Math.floor(hours / 24)} dias`
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#F97316" />
      </SafeAreaView>
    )
  }

  if (!request) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-gray-500 text-center">Pedido não encontrado.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-orange-500">← Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>

        <TouchableOpacity onPress={() => router.back()} className="mb-6">
          <Text className="text-orange-500 text-base">← Voltar</Text>
        </TouchableOpacity>

        {/* Mode badge */}
        <View className={`px-3 py-1 rounded-xl self-start mb-3 ${request.mode === 'task' ? 'bg-yellow-100' : 'bg-orange-100'}`}>
          <Text className={`text-sm font-semibold ${request.mode === 'task' ? 'text-yellow-700' : 'text-orange-700'}`}>
            {request.mode === 'task' ? '⚡ Tarefa rápida' : '🛠️ Serviço profissional'}
          </Text>
        </View>

        <Text className="text-2xl font-bold text-gray-800 mb-2">{request.title}</Text>
        <Text className="text-gray-400 text-xs mb-4">{timeAgo(request.created_at)}</Text>

        <View className="bg-gray-50 rounded-2xl p-4 mb-4">
          <Text className="text-gray-600 text-sm leading-5">{request.description}</Text>
        </View>

        <View className="flex-row flex-wrap gap-3 mb-6">
          <View className="flex-row items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-xl">
            <Text>{request.category?.icon}</Text>
            <Text className="text-orange-700 text-sm font-medium">{request.category?.name}</Text>
          </View>
          <View className="flex-row items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-xl">
            <Text className="text-gray-600 text-sm">📍 {request.city}, {request.state}</Text>
          </View>
        </View>

        {/* Contact revealed */}
        {proposal?.contact_revealed && clientPhone ? (
          <View className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 mb-4">
            <Text className="text-green-700 font-bold mb-1">✅ Contato revelado</Text>
            <Text className="text-green-600 text-sm mb-3">Telefone: {clientPhone}</Text>
            <TouchableOpacity
              className="bg-green-500 rounded-xl py-3 items-center mb-3"
              onPress={() => openWhatsApp(clientPhone)}
            >
              <Text className="text-white font-bold">📱 Abrir WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`rounded-xl py-3 items-center ${chatLoading ? 'bg-orange-300' : 'bg-orange-500'}`}
              onPress={handleStartChat}
              disabled={chatLoading}
            >
              <Text className="text-white font-bold">
                {chatLoading ? 'Abrindo...' : '💬 Conversar no chat'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : proposal && !proposal.contact_revealed ? (
          <View className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-4">
            <Text className="text-blue-700 font-bold mb-1">👍 Interesse demonstrado</Text>
            <Text className="text-blue-600 text-sm mb-3">Toque abaixo para ver o contato do cliente e fechar o serviço.</Text>
            <TouchableOpacity
              className={`rounded-xl py-3 items-center ${actionLoading ? 'bg-blue-300' : 'bg-blue-500'}`}
              onPress={handleRevealContact}
              disabled={actionLoading}
            >
              <Text className="text-white font-bold">
                {actionLoading ? 'Revelando...' : '📞 Revelar contato'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View className="h-6" />
      </ScrollView>

      {/* Bottom CTA */}
      {!proposal && (
        <View className="px-6 pb-6">
          <TouchableOpacity
            className={`rounded-2xl py-4 items-center ${actionLoading ? 'bg-orange-300' : 'bg-orange-500'}`}
            onPress={handleInterest}
            disabled={actionLoading}
          >
            <Text className="text-white font-bold text-base">
              {actionLoading ? 'Enviando...' : '⚡ Tenho interesse'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}
