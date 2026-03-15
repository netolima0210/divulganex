import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

const SCREEN_WIDTH = Dimensions.get('window').width
const ITEM_SIZE = (SCREEN_WIDTH - 48 - 8) / 2

interface PortfolioItem {
  id: string
  professional_id: string
  image_url: string
  caption: string | null
  created_at: string
}

export default function PortfolioScreen() {
  const { profile, session } = useAuth()
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const loadItems = useCallback(async () => {
    const { data, error } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('professional_id', profile!.id)
      .order('created_at', { ascending: false })

    if (error) {
      Alert.alert('Erro', 'Não foi possível carregar o portfólio.')
      return
    }
    if (data) setItems(data)
  }, [profile])

  useEffect(() => {
    loadItems().finally(() => setLoading(false))
  }, [loadItems])

  async function handleAddPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à sua galeria para adicionar fotos.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    })

    if (result.canceled || !result.assets[0]) return

    const asset = result.assets[0]
    setUploading(true)

    try {
      const response = await fetch(asset.uri)
      const blob = await response.blob()
      const ext = asset.uri.split('.').pop() ?? 'jpg'
      const fileName = `${profile!.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('portfolio')
        .upload(fileName, blob, { contentType: `image/${ext}` })

      if (uploadError) {
        Alert.alert('Erro', 'Não foi possível fazer o upload da foto. Tente novamente.')
        setUploading(false)
        return
      }

      const { data: urlData } = supabase.storage.from('portfolio').getPublicUrl(fileName)

      const { error: insertError } = await supabase.from('portfolio_items').insert({
        professional_id: profile!.id,
        image_url: urlData.publicUrl,
      })

      if (insertError) {
        Alert.alert('Erro', 'Foto enviada, mas não foi possível salvar o registro. Tente novamente.')
        setUploading(false)
        return
      }

      await loadItems()
    } catch {
      Alert.alert('Erro', 'Algo deu errado. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  async function handleRemove(item: PortfolioItem) {
    Alert.alert('Remover foto?', 'Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('portfolio_items')
            .delete()
            .eq('id', item.id)

          if (error) {
            Alert.alert('Erro', 'Não foi possível remover a foto. Tente novamente.')
            return
          }

          setItems((prev) => prev.filter((i) => i.id !== item.id))
        },
      },
    ])
  }

  function renderItem({ item }: { item: PortfolioItem }) {
    return (
      <View
        className="rounded-2xl overflow-hidden bg-gray-100"
        style={{ width: ITEM_SIZE, height: ITEM_SIZE, margin: 4 }}
      >
        <Image
          source={{ uri: item.image_url }}
          style={{ width: ITEM_SIZE, height: ITEM_SIZE }}
          resizeMode="cover"
        />
        <TouchableOpacity
          className="absolute top-2 right-2 bg-black/50 rounded-full w-7 h-7 items-center justify-center"
          onPress={() => handleRemove(item)}
        >
          <Text className="text-white text-xs font-bold">✕</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-6 pb-4 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-gray-800">Portfólio</Text>
        <TouchableOpacity
          className={`flex-row items-center gap-2 px-4 py-2 rounded-2xl ${
            uploading ? 'bg-orange-300' : 'bg-orange-500'
          }`}
          onPress={handleAddPhoto}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-bold text-sm">+ Adicionar foto</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-5xl mb-4">🖼️</Text>
          <Text className="text-gray-500 text-center text-base">
            Seu portfólio está vazio. Adicione fotos dos seus trabalhos para atrair mais clientes!
          </Text>
          <TouchableOpacity
            className={`mt-6 px-6 py-3 rounded-2xl ${uploading ? 'bg-orange-300' : 'bg-orange-500'}`}
            onPress={handleAddPhoto}
            disabled={uploading}
          >
            <Text className="text-white font-bold">Adicionar primeira foto</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  )
}
