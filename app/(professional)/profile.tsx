import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Category } from '@/lib/types'

export default function ProfessionalProfile() {
  const { profile, signOut } = useAuth()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [{ data: cats }, { data: myCats }] = await Promise.all([
      supabase.from('categories').select('*').eq('active', true).order('name'),
      supabase.from('professional_categories').select('category_id').eq('professional_id', profile!.id),
    ])
    if (cats) setCategories(cats)
    if (myCats) setSelectedCats(myCats.map((c: any) => c.category_id))
    setLoading(false)
  }

  function toggleCategory(catId: string) {
    setSelectedCats(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    )
  }

  async function handleSave() {
    setSaving(true)

    const { error: bioError } = await supabase
      .from('profiles')
      .update({ bio: bio.trim() || null })
      .eq('id', profile!.id)

    if (bioError) {
      setSaving(false)
      Alert.alert('Erro', 'Não foi possível salvar sua apresentação. Tente novamente.')
      return
    }

    const { error: deleteError } = await supabase
      .from('professional_categories')
      .delete()
      .eq('professional_id', profile!.id)

    if (deleteError) {
      setSaving(false)
      Alert.alert('Erro', 'Não foi possível atualizar suas categorias. Tente novamente.')
      return
    }

    if (selectedCats.length > 0) {
      const { error: insertError } = await supabase
        .from('professional_categories')
        .insert(selectedCats.map(catId => ({ professional_id: profile!.id, category_id: catId })))

      if (insertError) {
        setSaving(false)
        Alert.alert('Erro', 'Não foi possível salvar suas categorias. Tente novamente.')
        return
      }
    }

    setSaving(false)
    Alert.alert('Salvo!', 'Seu perfil foi atualizado.')
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
        <Text className="text-2xl font-bold text-gray-800 mb-6">Meu Perfil</Text>

        {/* Info card */}
        <View className="bg-gray-50 rounded-2xl p-4 mb-6">
          <Text className="text-lg font-bold text-gray-800">{profile?.name}</Text>
          <Text className="text-gray-500 text-sm mt-0.5">📍 {profile?.city}, {profile?.state}</Text>
          <View className="mt-2 self-start">
            <View className={`px-2 py-1 rounded-lg ${profile?.verified ? 'bg-green-100' : 'bg-yellow-100'}`}>
              <Text className={`text-xs font-semibold ${profile?.verified ? 'text-green-700' : 'text-yellow-700'}`}>
                {profile?.verified ? '✅ Verificado' : '⏳ Aguardando verificação'}
              </Text>
            </View>
          </View>
        </View>

        {/* Bio */}
        <View className="mb-6">
          <Text className="text-gray-600 text-sm font-medium mb-1">Apresentação</Text>
          <TextInput
            className="border-2 border-gray-200 rounded-2xl px-4 py-3 text-gray-800"
            placeholder="Conte sobre sua experiência e como você pode ajudar..."
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={{ minHeight: 80 }}
            maxLength={300}
          />
        </View>

        {/* Categories */}
        <View className="mb-8">
          <Text className="text-gray-600 text-sm font-medium mb-3">
            Minhas categorias ({selectedCats.length} selecionadas)
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {categories.map((cat) => {
              const selected = selectedCats.includes(cat.id)
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => toggleCategory(cat.id)}
                  className={`flex-row items-center gap-1 px-3 py-2 rounded-xl border-2 ${
                    selected ? 'bg-orange-500 border-orange-500' : 'border-gray-200 bg-white'
                  }`}
                >
                  <Text>{cat.icon}</Text>
                  <Text className={`text-sm font-medium ${selected ? 'text-white' : 'text-gray-600'}`}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <TouchableOpacity
          className={`rounded-2xl py-4 items-center mb-4 ${saving ? 'bg-orange-300' : 'bg-orange-500'}`}
          onPress={handleSave}
          disabled={saving}
        >
          <Text className="text-white font-bold text-base">
            {saving ? 'Salvando...' : 'Salvar perfil'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="border-2 border-orange-200 rounded-2xl py-4 items-center mb-4"
          onPress={() => router.push('/(professional)/portfolio')}
        >
          <Text className="text-orange-500 font-semibold">🖼️ Ver Portfólio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="border-2 border-red-100 rounded-2xl py-4 items-center mb-8"
          onPress={signOut}
        >
          <Text className="text-red-400 font-semibold">Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}
