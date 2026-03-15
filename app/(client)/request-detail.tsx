import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { ServiceRequest, Proposal, Profile } from '@/lib/types'

interface ProposalWithProfessional extends Proposal {
  professional: Profile
  averageRating: number | null
}

export default function ClientRequestDetailScreen() {
  const router = useRouter()
  const { requestId } = useLocalSearchParams<{ requestId: string }>()
  const { profile } = useAuth()

  const [request, setRequest] = useState<ServiceRequest | null>(null)
  const [proposals, setProposals] = useState<ProposalWithProfessional[]>([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const [{ data: reqData }, { data: proposalsData }] = await Promise.all([
      supabase
        .from('service_requests')
        .select('*, category:categories(*)')
        .eq('id', requestId)
        .single(),
      supabase
        .from('proposals')
        .select('*, professional:profiles!professional_id(id, name, avatar_url, bio)')
        .eq('request_id', requestId)
        .eq('status', 'pending'),
    ])

    if (reqData) setRequest(reqData)

    if (proposalsData && proposalsData.length > 0) {
      const withRatings = await Promise.all(
        proposalsData.map(async (proposal: any) => {
          const { data: reviews } = await supabase
            .from('reviews')
            .select('rating')
            .eq('reviewed_id', proposal.professional.id)

          const avgRating =
            reviews && reviews.length > 0
              ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
              : null

          return { ...proposal, averageRating: avgRating }
        })
      )
      setProposals(withRatings)
    } else {
      setProposals([])
    }
  }, [requestId])

  useEffect(() => {
    loadData().finally(() => setLoading(false))
  }, [loadData])

  async function handleAccept(proposalId: string) {
    Alert.alert(
      'Aceitar profissional?',
      'O pedido passará para "Em andamento" e as outras propostas serão recusadas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceitar',
          style: 'default',
          onPress: async () => {
            setAccepting(proposalId)

            const { error: acceptError } = await supabase
              .from('proposals')
              .update({ status: 'accepted' })
              .eq('id', proposalId)

            if (acceptError) {
              setAccepting(null)
              Alert.alert('Erro', 'Não foi possível aceitar a proposta. Tente novamente.')
              return
            }

            const { error: rejectError } = await supabase
              .from('proposals')
              .update({ status: 'rejected' })
              .eq('request_id', requestId)
              .neq('id', proposalId)

            if (rejectError) {
              setAccepting(null)
              Alert.alert('Aviso', 'Proposta aceita, mas houve um erro ao recusar as outras.')
              return
            }

            const { error: requestError } = await supabase
              .from('service_requests')
              .update({ status: 'in_progress' })
              .eq('id', requestId)

            setAccepting(null)

            if (requestError) {
              Alert.alert('Aviso', 'Profissional aceito, mas houve um erro ao atualizar o pedido.')
              return
            }

            Alert.alert('Sucesso!', 'Profissional aceito. O pedido está em andamento.', [
              {
                text: 'OK',
                onPress: () => router.back(),
              },
            ])
          },
        },
      ]
    )
  }

  function renderStars(rating: number | null) {
    if (rating === null) return <Text className="text-gray-400 text-xs">Sem avaliações</Text>
    const stars = Math.round(rating)
    return (
      <View className="flex-row items-center gap-1">
        <Text className="text-yellow-500 text-xs">{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</Text>
        <Text className="text-gray-500 text-xs">({rating.toFixed(1)})</Text>
      </View>
    )
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
      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} className="mb-6">
          <Text className="text-orange-500 text-base">← Voltar</Text>
        </TouchableOpacity>

        {/* Request header */}
        {request && (
          <View className="bg-gray-50 rounded-2xl p-4 mb-6">
            <Text className="text-xl font-bold text-gray-800 mb-1">{request.title}</Text>
            <Text className="text-gray-500 text-sm leading-5">{request.description}</Text>
          </View>
        )}

        <Text className="text-lg font-bold text-gray-800 mb-4">
          Profissionais interessados
        </Text>

        {proposals.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Text className="text-4xl mb-4">🔍</Text>
            <Text className="text-gray-500 text-center">
              Nenhum profissional demonstrou interesse ainda.
            </Text>
          </View>
        ) : (
          <View className="gap-4 pb-8">
            {proposals.map((proposal) => (
              <View
                key={proposal.id}
                className="bg-white border-2 border-gray-100 rounded-2xl p-4"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <View className="flex-row items-center gap-3 mb-3">
                  {proposal.professional.avatar_url ? (
                    <Image
                      source={{ uri: proposal.professional.avatar_url }}
                      className="w-12 h-12 rounded-full bg-gray-200"
                    />
                  ) : (
                    <View className="w-12 h-12 rounded-full bg-orange-100 items-center justify-center">
                      <Text className="text-orange-500 font-bold text-lg">
                        {proposal.professional.name?.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="text-gray-800 font-bold text-base">
                      {proposal.professional.name}
                    </Text>
                    {renderStars(proposal.averageRating)}
                  </View>
                </View>

                {proposal.professional.bio ? (
                  <Text className="text-gray-500 text-sm mb-4" numberOfLines={3}>
                    {proposal.professional.bio}
                  </Text>
                ) : (
                  <Text className="text-gray-400 text-sm mb-4 italic">
                    Sem apresentação cadastrada.
                  </Text>
                )}

                <TouchableOpacity
                  className={`rounded-2xl py-3 items-center ${
                    accepting === proposal.id ? 'bg-orange-300' : 'bg-orange-500'
                  }`}
                  onPress={() => handleAccept(proposal.id)}
                  disabled={accepting !== null}
                >
                  <Text className="text-white font-bold text-sm">
                    {accepting === proposal.id ? 'Aceitando...' : '✅ Aceitar profissional'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
