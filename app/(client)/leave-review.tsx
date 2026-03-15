import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export default function LeaveReviewScreen() {
  const router = useRouter()
  const { professionalId, requestId, professionalName } = useLocalSearchParams<{
    professionalId: string
    requestId: string
    professionalName: string
  }>()
  const { profile } = useAuth()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (rating === 0) {
      Alert.alert('Selecione uma nota', 'Toque nas estrelas para avaliar.')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('reviews').insert({
      reviewer_id: profile!.id,
      reviewed_id: professionalId,
      request_id: requestId,
      rating,
      comment: comment.trim() || null,
    })
    setLoading(false)
    if (error) {
      Alert.alert('Erro', error.message)
      return
    }
    Alert.alert('Avaliação enviada!', 'Obrigado pelo seu feedback.', [
      { text: 'OK', onPress: () => router.back() }
    ])
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => router.back()} className="mb-6">
            <Text className="text-orange-500 text-base">← Voltar</Text>
          </TouchableOpacity>

          <Text className="text-2xl font-bold text-gray-800 mb-1">Avaliar profissional</Text>
          <Text className="text-gray-500 text-sm mb-8">Como foi sua experiência com {professionalName}?</Text>

          {/* Stars */}
          <View className="items-center mb-8">
            <View className="flex-row gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Text className="text-5xl">{star <= rating ? '⭐' : '☆'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text className="text-gray-500 text-sm mt-3">
              {rating === 0 ? 'Toque para avaliar' :
               rating === 1 ? 'Muito ruim' :
               rating === 2 ? 'Ruim' :
               rating === 3 ? 'Regular' :
               rating === 4 ? 'Bom' : 'Excelente!'}
            </Text>
          </View>

          {/* Comment */}
          <View className="mb-8">
            <Text className="text-gray-600 text-sm font-medium mb-1">Comentário (opcional)</Text>
            <TextInput
              className="border-2 border-gray-200 rounded-2xl px-4 py-3 text-gray-800"
              placeholder="Conte como foi o serviço..."
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ minHeight: 100 }}
              maxLength={300}
            />
          </View>

          <TouchableOpacity
            className={`rounded-2xl py-4 items-center mb-8 ${loading ? 'bg-orange-300' : 'bg-orange-500'}`}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text className="text-white font-bold text-base">
              {loading ? 'Enviando...' : 'Enviar avaliação'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
