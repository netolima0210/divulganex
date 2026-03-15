import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Category } from '@/lib/types'

export default function NewRequestScreen() {
  const router = useRouter()
  const { mode } = useLocalSearchParams<{ mode: 'task' | 'professional' }>()
  const { profile } = useAuth()

  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState(profile?.city ?? '')
  const [state, setState] = useState(profile?.state ?? '')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .in('type', [mode, 'both'])
      .eq('active', true)
      .order('name')
    if (error) {
      Alert.alert('Erro', 'Não foi possível carregar as categorias. Tente novamente.')
      return
    }
    if (data) setCategories(data)
  }

  async function handleSubmit() {
    if (!categoryId || !title.trim() || !description.trim()) {
      Alert.alert('Campos obrigatórios', 'Selecione uma categoria e preencha título e descrição.')
      return
    }
    setLoading(true)
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    const { error } = await supabase.from('service_requests').insert({
      client_id: profile!.id,
      category_id: categoryId,
      mode,
      title: title.trim(),
      description: description.trim(),
      city: city || profile?.city,
      state: state || profile?.state,
      status: 'open',
      expires_at: expiresAt,
    })
    setLoading(false)
    if (error) {
      Alert.alert('Erro', error.message)
      return
    }
    Alert.alert('Pedido publicado!', 'Profissionais da sua região serão notificados.', [
      { text: 'OK', onPress: () => router.replace('/(client)/my-requests') }
    ])
  }

  const modeTitle = mode === 'task' ? '⚡ Tarefa rápida' : '🛠️ Serviço profissional'
  const modeBg = mode === 'task' ? 'bg-yellow-500' : 'bg-orange-500'

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>

          <TouchableOpacity onPress={() => router.back()} className="mb-6">
            <Text className="text-orange-500 text-base">← Voltar</Text>
          </TouchableOpacity>

          <View className={`${modeBg} rounded-2xl px-4 py-2 self-start mb-4`}>
            <Text className="text-white text-sm font-semibold">{modeTitle}</Text>
          </View>

          <Text className="text-2xl font-bold text-gray-800 mb-6">Descreva o que precisa</Text>

          {/* Categoria */}
          <View className="mb-5">
            <Text className="text-gray-600 text-sm font-medium mb-2">Categoria *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setCategoryId(cat.id)}
                    className={`flex-row items-center gap-1 px-3 py-2 rounded-xl border-2 ${
                      categoryId === cat.id ? 'bg-orange-500 border-orange-500' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <Text>{cat.icon}</Text>
                    <Text className={`text-sm font-medium ${categoryId === cat.id ? 'text-white' : 'text-gray-600'}`}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Título */}
          <View className="mb-4">
            <Text className="text-gray-600 text-sm font-medium mb-1">Título do pedido *</Text>
            <TextInput
              className="border-2 border-gray-200 rounded-2xl px-4 h-14 text-gray-800"
              placeholder={mode === 'task' ? 'Ex: Preciso buscar encomenda nos Correios' : 'Ex: Instalar tomadas na sala'}
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />
          </View>

          {/* Descrição */}
          <View className="mb-4">
            <Text className="text-gray-600 text-sm font-medium mb-1">Detalhes *</Text>
            <TextInput
              className="border-2 border-gray-200 rounded-2xl px-4 py-3 text-gray-800"
              placeholder="Descreva com mais detalhes o que você precisa, horário, local..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ minHeight: 100 }}
              maxLength={500}
            />
          </View>

          {/* Local */}
          <View className="mb-8">
            <Text className="text-gray-600 text-sm font-medium mb-1">Local</Text>
            <View className="flex-row items-center border-2 border-gray-200 rounded-2xl px-4 h-14 bg-gray-50">
              <Text className="text-gray-500">📍 {city}, {state}</Text>
            </View>
            <Text className="text-gray-400 text-xs mt-1">Usando sua cidade cadastrada.</Text>
          </View>

          <TouchableOpacity
            className={`rounded-2xl py-4 items-center mb-8 ${loading ? 'bg-orange-300' : 'bg-orange-500'}`}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text className="text-white font-bold text-base">
              {loading ? 'Publicando...' : 'Publicar pedido'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
