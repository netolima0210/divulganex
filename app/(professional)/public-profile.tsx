import { useState, useEffect } from 'react'
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'

type PublicProfile = {
  id: string
  name: string
  bio: string | null
  city: string | null
  state: string | null
  verified: boolean
  verification_status: string
  categories: { name: string; icon: string }[]
  reviews: { rating: number; comment: string | null; created_at: string; reviewer: { name: string } | null }[]
}

export default function PublicProfileScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [data, setData] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [id])

  async function loadProfile() {
    const [{ data: prof }, { data: cats }, { data: revs }] = await Promise.all([
      supabase.from('profiles').select('id, name, bio, city, state, verified, verification_status').eq('id', id).single(),
      supabase.from('professional_categories').select('category:categories(name, icon)').eq('professional_id', id),
      supabase.from('reviews').select('rating, comment, created_at, reviewer:profiles!reviewer_id(name)').eq('reviewed_id', id).order('created_at', { ascending: false }),
    ])

    if (prof) {
      setData({
        ...prof,
        categories: cats?.map((c: any) => c.category).filter(Boolean) ?? [],
        reviews: revs ?? [],
      })
    }
    setLoading(false)
  }

  function avgRating(reviews: { rating: number }[]) {
    if (reviews.length === 0) return null
    return (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#F97316" />
      </SafeAreaView>
    )
  }

  if (!data) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-gray-500">Perfil não encontrado.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-orange-500">← Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  const avg = avgRating(data.reviews)

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} className="mb-6">
          <Text className="text-orange-500 text-base">← Voltar</Text>
        </TouchableOpacity>

        {/* Header */}
        <View className="items-center mb-6">
          <View className="w-20 h-20 rounded-full bg-orange-100 items-center justify-center mb-3">
            <Text className="text-3xl">{data.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-800">{data.name}</Text>
          <Text className="text-gray-500 text-sm mt-1">📍 {data.city}, {data.state}</Text>

          <View className="flex-row items-center gap-3 mt-3">
            <View className={`px-3 py-1 rounded-xl ${data.verified ? 'bg-green-100' : 'bg-yellow-100'}`}>
              <Text className={`text-xs font-semibold ${data.verified ? 'text-green-700' : 'text-yellow-700'}`}>
                {data.verified ? '✅ Verificado' : '⏳ Em verificação'}
              </Text>
            </View>
            {avg && (
              <View className="flex-row items-center gap-1 bg-orange-50 px-3 py-1 rounded-xl">
                <Text className="text-sm">⭐</Text>
                <Text className="text-orange-700 text-sm font-semibold">{avg}</Text>
                <Text className="text-orange-500 text-xs">({data.reviews.length})</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bio */}
        {data.bio && (
          <View className="bg-gray-50 rounded-2xl p-4 mb-5">
            <Text className="text-gray-600 text-sm leading-5">{data.bio}</Text>
          </View>
        )}

        {/* Categories */}
        {data.categories.length > 0 && (
          <View className="mb-5">
            <Text className="text-gray-700 font-semibold text-sm mb-2">Especialidades</Text>
            <View className="flex-row flex-wrap gap-2">
              {data.categories.map((cat, i) => (
                <View key={i} className="flex-row items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-xl">
                  <Text>{cat.icon}</Text>
                  <Text className="text-orange-700 text-sm font-medium">{cat.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Reviews */}
        <View className="mb-8">
          <Text className="text-gray-700 font-semibold text-sm mb-3">
            Avaliações {data.reviews.length > 0 ? `(${data.reviews.length})` : ''}
          </Text>
          {data.reviews.length === 0 ? (
            <View className="bg-gray-50 rounded-2xl p-4 items-center">
              <Text className="text-gray-400 text-sm">Nenhuma avaliação ainda.</Text>
            </View>
          ) : (
            <View className="gap-3">
              {data.reviews.map((rev, i) => (
                <View key={i} className="bg-gray-50 rounded-2xl p-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-gray-700 font-medium text-sm">{(rev.reviewer as any)?.name ?? 'Cliente'}</Text>
                    <Text>{'⭐'.repeat(rev.rating)}</Text>
                  </View>
                  {rev.comment && <Text className="text-gray-500 text-sm">{rev.comment}</Text>}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
